/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { RBACUser, RBACRole, RBACPermission } from '../types';
import {
  createDocument,
  updateDocument as dbUpdateDoc,
  deleteDocument as dbDeleteDoc,
  seedDatabase,
  getCollectionData,

} from '../services/db';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, collection, setDoc } from 'firebase/firestore';
import { SeedStatus } from './HRContext.types';

interface UseHRAuthArgs {
  /** Delegates to the entity-data hook's loadAllData, injected to avoid a circular hook dependency. */
  loadAllData: () => Promise<void>;
  /** Delegates to the entity-data hook's seed status setter. */
  setSeedStatus: (status: SeedStatus) => void;
  /** Clears the entity-data hook's per-view cache so the next session starts fresh. */
  resetLoadedViews: () => void;
  /** Returns the UI to the dashboard view on logout. */
  goToDashboard: () => void;
}

/**
 * Owns authentication (Firebase Auth + local-fallback login) and RBAC data:
 * users, roles, permissions, the active session, and permission checks.
 */
export function useHRAuth({ loadAllData, setSeedStatus, resetLoadedViews, goToDashboard }: UseHRAuthArgs) {
  const [rbacUsers, setRbacUsers] = useState<RBACUser[]>([]);
  // Ref mirror of rbacUsers so the auth listener can read fresh data
  // without needing to be re-subscribed every time rbacUsers changes.
  const rbacUsersRef = useRef(rbacUsers);
  useEffect(() => {
    rbacUsersRef.current = rbacUsers;
  }, [rbacUsers]);

  const [rbacRoles, setRbacRoles] = useState<RBACRole[]>([]);
  const [rbacPermissions, setRbacPermissions] = useState<RBACPermission[]>([]);
  const [currentUser, setCurrentUser] = useState<RBACUser | null>(() => {
    try {
      const persisted = localStorage.getItem('sahaba_current_user');
      return persisted ? JSON.parse(persisted) : null;
    } catch {
      return null;
    }
  });
  const [firebaseAuthReady, setFirebaseAuthReady] = useState(false);

  const currentRole = currentUser ? rbacRoles.find(r => r.id === currentUser.roleId) || null : null;

  const hasPermission = (permId: string) => {
    if (!currentUser) return false;
    if (currentUser.status === 'inactive') return false;
    if (!currentRole) return false;
    return currentRole.permissionIds.includes(permId);
  };

  const setCurrentUserById = (userId: string) => {
    const found = rbacUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const safeLoadRbac = async <T,>(collName: string, setter: (data: T[]) => void, fallback: T[]) => {
    const isLocal = localStorage.getItem('sahaba_session_type') === 'local';
    if (!auth.currentUser && !isLocal) {
      setter(fallback);
      return;
    }
    try {
      const data = await getCollectionData<T>(collName);
      if (data && data.length > 0) {
        setter(data);
      } else if (fallback && fallback.length > 0) {
        console.warn(`Collection ${collName} is empty in database, using system fallbacks.`);
        setter(fallback);
      }
    } catch (error: any) {
      console.error(`Error loading database collection ${collName}: `, error);
      if (fallback && fallback.length > 0) {
        setter(fallback);
      }
    }
  };

  /**
   * Lazily (re)loads the RBAC-related collections for the 'rbac-users' and
   * 'rbac-roles' views. Invoked by the entity-data hook's loadViewData
   * switch, since this hook is the sole owner of RBAC state.
   */
  const loadRbacViewData = async (viewName: string) => {
    if (viewName === 'rbac-users') {
      await safeLoadRbac<RBACUser>('rbacUsers', setRbacUsers, []);
    } else if (viewName === 'rbac-roles') {
      await Promise.all([
        safeLoadRbac<RBACRole>('rbacRoles', setRbacRoles, []),
        safeLoadRbac<RBACPermission>('rbacPermissions', setRbacPermissions, [])
      ]);
    }
  };

  useEffect(() => {
    // Initialize the secure client-side identity registry if missing
    try {
      const existingRegistry = localStorage.getItem('sahaba_identity_registry');
      if (!existingRegistry) {
        localStorage.setItem('sahaba_identity_registry', JSON.stringify([]));
      }
    } catch (e) {
      console.error("Failed to initialize security registry: ", e);
    }
  }, []);

  useEffect(() => {
    const initLocal = async () => {
      const isLocal = localStorage.getItem('sahaba_session_type') === 'local';
      if (isLocal) {
        console.log("[LOCAL INIT] Restoring local RBAC configuration and sessions...");
        await Promise.all([
          safeLoadRbac<RBACRole>('rbacRoles', setRbacRoles, []),
          safeLoadRbac<RBACPermission>('rbacPermissions', setRbacPermissions, [])
        ]);
        setFirebaseAuthReady(true);
      }
    };
    initLocal();
  }, []);

  // Sync Firebase Auth change events, run operational database sync & fetch core records on authenticated session
  // NOTE: this effect intentionally has an EMPTY dependency array so the listener
  // is only ever subscribed once. It reads rbacUsersRef.current instead of the
  // rbacUsers state directly to avoid needing rbacUsers as a dependency (which
  // would otherwise cause repeated re-subscriptions and duplicate seed/sync runs).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      // Fires the first time regardless of fbUser being null or not — this is our
      // signal that Firebase has finished restoring (or not finding) a session.
      setFirebaseAuthReady(true);

      if (fbUser) {
        const uid = fbUser.uid;
        console.log(`[AUTH EVENT] User is securely authenticated (${fbUser.email || uid}). Initiating database synchronization...`);

        // Any genuine Firebase auth event means this is NOT a local-fallback session
        localStorage.setItem('sahaba_session_type', 'firebase');

        // Trigger safe seeding only now that we are successfully authenticated (optimized via metadata checkpoint)
        try {
          setSeedStatus('seeding');
          await seedDatabase();
          setSeedStatus('done');
        } catch (err) {
          console.error("Fidelity alignment failed on auth-load: ", err);
          setSeedStatus('idle');
        }

        try {
          const docRef = doc(db, 'rbacUsers', uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profile = docSnap.data() as RBACUser;

            // Bootstrapped Admin: Verify and upgrade role if they are the admin email
            let finalProfile = profile;
            const isAdminEmail = fbUser.email?.toLowerCase().trim() === "mahmoudfahmyaly695@gmail.com";
            if (isAdminEmail && profile.roleId !== 'role_admin') {
              finalProfile = { ...profile, roleId: 'role_admin' };
              await setDoc(docRef, finalProfile, { merge: true });
            }

            if (finalProfile.status === 'active') {
              setCurrentUser(finalProfile);
              localStorage.setItem('sahaba_current_user', JSON.stringify(finalProfile));
            } else {
              setCurrentUser(null);
              localStorage.removeItem('sahaba_current_user');
              await signOut(auth);
            }
          } else {
            const localMatched = rbacUsersRef.current.find(
              u => u.id === uid || u.username.toLowerCase().trim() === fbUser.email?.toLowerCase().trim()
            );

            const isAdminEmail = fbUser.email?.toLowerCase().trim() === "mahmoudfahmyaly695@gmail.com";

            let newUserDoc: RBACUser;
            if (localMatched) {
              newUserDoc = {
                ...localMatched,
                id: uid,
                roleId: (localMatched.roleId === 'role_admin' || isAdminEmail) ? 'role_admin' : localMatched.roleId
              };
            } else {
              newUserDoc = {
                id: uid,
                fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'المستخدم السحابي',
                username: fbUser.email || '',
                empCode: 'EMP-' + uid.substring(0, 5).toUpperCase(),
                roleId: isAdminEmail ? 'role_admin' : 'role_employee',
                status: 'active'
              };
            }

            // Persist the user document to Firestore so security rules and lists identify them instantly
            await setDoc(docRef, newUserDoc);
            setCurrentUser(newUserDoc);
            localStorage.setItem('sahaba_current_user', JSON.stringify(newUserDoc));
          }
        } catch (e) {
          console.error("Error keeping identity synced: ", e);
        }
      } else {
        // User logged out – safe-erase of memory & local persistence elements,
        // but skip this if the active session is a local-fallback session
        // (those never touch Firebase auth, so fbUser is always null for them).
        if (localStorage.getItem('sahaba_session_type') !== 'local') {
          setCurrentUser(null);
          localStorage.removeItem('sahaba_current_user');
        }
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocalFallbackLogin = async (email: string, pass: string, reason: string): Promise<boolean> => {
    console.warn(`[LOCAL DEMO FALLBACK] ${reason}. Authenticating user locally.`);

    const registryRaw = localStorage.getItem('sahaba_identity_registry');
    if (registryRaw) {
      const registry = JSON.parse(registryRaw);
      const expectedPassword = registry[email];
      if (expectedPassword && expectedPassword !== pass) {
        throw new Error('كلمة المرور المدخلة غير صحيحة مَحلّيَّاً');
      }
    }

    let activeUsers = rbacUsers;
    if (activeUsers.length === 0) {
      activeUsers = await getCollectionData<RBACUser>('rbacUsers');
      setRbacUsers(activeUsers);
    }

    const matchedState = activeUsers.find(u => u.username.toLowerCase().trim() === email);

    if (!matchedState) {
      if (email === "mahmoudfahmyaly695@gmail.com") {
        const adminUser: RBACUser = {
          id: 'user_admin',
          fullName: 'محمود فهمي (المدير العام)',
          username: email,
          empCode: 'EMP-0001',
          roleId: 'role_admin',
          status: 'active'
        };
        const registry = registryRaw ? JSON.parse(registryRaw) : {};
        registry[email] = pass;
        localStorage.setItem('sahaba_identity_registry', JSON.stringify(registry));
        
        await createDocument('rbacUsers', 'user_admin', adminUser);
        
        setCurrentUser(adminUser);
        localStorage.setItem('sahaba_current_user', JSON.stringify(adminUser));
        localStorage.setItem('sahaba_session_type', 'local');
        
        await Promise.all([
          safeLoadRbac<RBACRole>('rbacRoles', setRbacRoles, []),
          safeLoadRbac<RBACPermission>('rbacPermissions', setRbacPermissions, [])
        ]);
        return true;
      }
      throw new Error('حساب المستخدم هذا غير مسجل بالمنظومة المحلية');
    }

    if (matchedState.status === 'inactive') {
      throw new Error('عذراً، هذا الحساب معطل إدارياً بالسيستم حالياً');
    }

    const newUserDoc: RBACUser = {
      id: matchedState.id,
      fullName: matchedState.fullName,
      username: matchedState.username,
      empCode: matchedState.empCode,
      roleId: matchedState.roleId,
      status: matchedState.status
    };

    setCurrentUser(newUserDoc);
    localStorage.setItem('sahaba_current_user', JSON.stringify(newUserDoc));
    localStorage.setItem('sahaba_session_type', 'local');

    await Promise.all([
      safeLoadRbac<RBACRole>('rbacRoles', setRbacRoles, []),
      safeLoadRbac<RBACPermission>('rbacPermissions', setRbacPermissions, [])
    ]);

    return true;
  };

  const login = async (usr: string, pass: string): Promise<boolean> => {
    const email = usr.toLowerCase().trim();
    if (!email.includes('@')) {
      throw new Error('يرجى إدخال بريد إلكتروني صحيح للولوج سحابياً');
    }

    const isLocal = localStorage.getItem('sahaba_session_type') === 'local';
    if (isLocal) {
      return handleLocalFallbackLogin(email, pass, 'الولوج في وضعية العمل المحلي المباشرة (تخطي الشبكة)');
    }

    try {
      // 1. Attempt secure Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;

      // 2. Fetch the matched secure profile from rbacUsers Firestore collection
      const docRef = doc(db, 'rbacUsers', uid);
      const docSnap = await getDoc(docRef);
      let foundUser: RBACUser | null = null;

      if (docSnap.exists()) {
        foundUser = { id: uid, ...docSnap.data() } as RBACUser;
      } else {
        // Fallback or automatic migration for pre-existing records:
        const matchedState = rbacUsers.find(u => u.username.toLowerCase().trim() === email);
        if (matchedState) {
          const newUserDoc: RBACUser = {
            id: uid,
            fullName: matchedState.fullName,
            username: matchedState.username,
            empCode: matchedState.empCode,
            roleId: matchedState.roleId,
            status: matchedState.status
          };
          await createDocument('rbacUsers', uid, newUserDoc);
          if (matchedState.id.startsWith('user_')) {
            try {
              await dbDeleteDoc('rbacUsers', matchedState.id);
            } catch (e) {
              console.warn("Could not sweep placeholder user document:", e);
            }
          }
          foundUser = newUserDoc;
        } else {
          // Standard placeholder fallback profile
          const newUserDoc: RBACUser = {
            id: uid,
            fullName: email.split('@')[0],
            username: email,
            empCode: 'EMP-' + uid.substring(0, 5).toUpperCase(),
            roleId: 'role_employee',
            status: 'active'
          };
          await createDocument('rbacUsers', uid, newUserDoc);
          foundUser = newUserDoc;
        }
      }

      if (foundUser.status === 'inactive') {
        await signOut(auth);
        throw new Error('عذراً، هذا الحساب معطل إدارياً بالسيستم حالياً');
      }

      setCurrentUser(foundUser);
      localStorage.setItem('sahaba_current_user', JSON.stringify(foundUser));
      // NOTE: no loadAllData() call here — see comment in handleLocalFallbackLogin.
      // The view-loading effect (which also waits on firebaseAuthReady) handles
      // the actual fetch once currentUser truly updates.
      return true;

    } catch (firebaseError: any) {
      console.warn("Firebase credential sign-in failed. Error code:", firebaseError.code);

      if (
        firebaseError.code === 'auth/operation-not-allowed' ||
        firebaseError.code === 'auth/network-request-failed' ||
        firebaseError.message?.includes('network')
      ) {
        return handleLocalFallbackLogin(email, pass, 'فشل الاتصال السحابي بالخوادم. الولوج في وضعية العمل المحلي المباشرة.');
      }

      // If user does not exist yet or we need auto-migration on first login:
      // Retrieve the stored password from the identity registry
      try {
        const registryRaw = localStorage.getItem('sahaba_identity_registry');
        if (registryRaw) {
          const registry = JSON.parse(registryRaw);
          const expectedPassword = registry[email];
          if (expectedPassword && expectedPassword === pass) {
            console.log(`Automatic dynamic identity promotion: registering Auth account for ${email}...`);
            // Dynamic secure signup in Firebase Authentication
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
              const uid = userCredential.user.uid;

              // Match structure
              const matchedState = rbacUsers.find(u => u.username.toLowerCase().trim() === email) || [].find(u => u.username.toLowerCase().trim() === email);
              const newUserDoc: RBACUser = {
                id: uid,
                fullName: matchedState ? matchedState.fullName : email.split('@')[0],
                username: email,
                empCode: matchedState ? matchedState.empCode : 'EMP-' + uid.substring(0, 5).toUpperCase(),
                roleId: matchedState ? matchedState.roleId : 'role_employee',
                status: 'active'
              };

              await createDocument('rbacUsers', uid, newUserDoc);

              if (matchedState && matchedState.id.startsWith('user_')) {
                try {
                  await dbDeleteDoc('rbacUsers', matchedState.id);
                } catch (e) {
                  console.warn("Could not sweep outdated placeholder:", e);
                }
              }

              setCurrentUser(newUserDoc);
              localStorage.setItem('sahaba_current_user', JSON.stringify(newUserDoc));
              // NOTE: no loadAllData() call here — same stale-closure reasoning as above.
              return true;
            } catch (signupError: any) {
              console.error("Dynamic registration error inside auth signup: ", signupError);
              if (signupError.code === 'auth/operation-not-allowed') {
                return handleLocalFallbackLogin(email, pass, 'مزود البريد الإلكتروني وكلمة المرور غير مفعّل عند محاولة إنشاء حساب.');
              }
              throw signupError;
            }
          }
        }
      } catch (signupError: any) {
        console.error("Dynamic registration error: ", signupError);
        throw new Error('فشل تسجيل الدخول أو الترقية الحركية لنظام الحماية: ' + signupError.message);
      }

      // Readable standard error translations matching NCA and custom UX rules:
      let errMsg = 'فشل تسجيل الدخول الآمن. يرجى مراجعة بيانات الهوية الرقمية.';
      if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        errMsg = 'كلمة المرور المدخلة غير صحيحة';
      } else if (firebaseError.code === 'auth/user-not-found') {
        errMsg = 'حساب المستخدم هذا غير متاح أو غير مسجل بالسيستم';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errMsg = 'البريد الإلكتروني المدخل غير صالح';
      }
      throw new Error(errMsg);
    }
  };

  const logout = () => {
    signOut(auth).catch(e => console.warn("Firebase Auth signout exception: ", e));
    setCurrentUser(null);
    localStorage.removeItem('sahaba_current_user');
    localStorage.removeItem('sahaba_session_type');
    goToDashboard();
    resetLoadedViews(); // prevent next user from seeing cached data from this session
  };

  const addRBACUser = async (userObj: Omit<RBACUser, 'id'>) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية إدارة وإعداد مستخدمي النظام.');
    }
    // Pull and strip password from user object before database commitment
    const { password, ...safeUser } = userObj;
    const newId = doc(collection(db, 'rbacUsers')).id;
    const item: RBACUser = { ...safeUser, id: newId };

    // Create the document securely in Firestore without the password field
    await createDocument('rbacUsers', newId, item);

    // Store password locally inside sahaba_identity_registry
    if (password) {
      try {
        const registryRaw = localStorage.getItem('sahaba_identity_registry') || '{}';
        const registry = JSON.parse(registryRaw);
        registry[safeUser.username.toLowerCase().trim()] = password;
        localStorage.setItem('sahaba_identity_registry', JSON.stringify(registry));
      } catch (e) {
        console.error("Failed to commit password to secondary registry: ", e);
      }
    }

    await loadAllData();
  };

  const updateRBACUser = async (id: string, userObj: Partial<RBACUser>) => {
    if (!hasPermission('view_rbac') && currentUser?.id !== id) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية إدارة وتعديل مستخدمي النظام.');
    }
    // Pull and strip password variable before database commit
    const { password, ...safeUser } = userObj;
    await dbUpdateDoc('rbacUsers', id, safeUser);

    // Update local registry if password or username changes
    if (password && userObj.username) {
      try {
        const registryRaw = localStorage.getItem('sahaba_identity_registry') || '{}';
        const registry = JSON.parse(registryRaw);
        registry[userObj.username.toLowerCase().trim()] = password;
        localStorage.setItem('sahaba_identity_registry', JSON.stringify(registry));
      } catch (e) {
        console.error("Failed to update registry password mapping: ", e);
      }
    }

    await loadAllData();
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...safeUser } : null);
    }
  };

  const deleteRBACUser = async (id: string) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية حذف مستخدمين من النظام.');
    }
    const isSelf = currentUser?.id === id;
    await dbDeleteDoc('rbacUsers', id);
    await loadAllData();
    if (isSelf) {
      // Fully tear down the session so Firestore/localStorage can't
      // silently resurrect a placeholder profile for this UID on next load.
      setCurrentUser(null);
      localStorage.removeItem('sahaba_current_user');
      localStorage.removeItem('sahaba_session_type');
      signOut(auth).catch(e => console.warn("Firebase Auth signout exception: ", e));
    }
  };

  const addRBACRole = async (roleObj: Omit<RBACRole, 'id'>) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية إضافة أدوار جديدة بالنظام.');
    }
    const newId = doc(collection(db, 'rbacRoles')).id;
    const item: RBACRole = { ...roleObj, id: newId };
    await createDocument('rbacRoles', newId, item);
    await loadAllData();
  };

  const updateRBACRole = async (id: string, roleObj: Partial<RBACRole>) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية تعديل الأدوار والصلاحيات.');
    }
    await dbUpdateDoc('rbacRoles', id, roleObj);
    await loadAllData();
  };

  const deleteRBACRole = async (id: string) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية حذف الأدوار والصلاحيات.');
    }
    await dbDeleteDoc('rbacRoles', id);
    await loadAllData();
  };

  return {
    rbacUsers,
    rbacRoles,
    rbacPermissions,
    currentUser,
    currentRole,
    firebaseAuthReady,
    setCurrentUserById,
    hasPermission,
    loadRbacViewData,
    login,
    logout,
    addRBACUser,
    updateRBACUser,
    deleteRBACUser,
    addRBACRole,
    updateRBACRole,
    deleteRBACRole
  };
}
