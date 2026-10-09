/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { RBACUser, RBACRole, RBACPermission, Company } from '../types';
import {
  createDocument,
  updateDocument as dbUpdateDoc,
  deleteDocument as dbDeleteDoc,
  seedDatabase,
  getCollectionData,
  DEFAULT_COMPANY_ID,
  SUPER_ADMIN_EMAIL,
  setActiveCompanyId,
  getActiveCompanyId,
  getCompany,
  getCompanies,
  createCompany,
  updateCompanyStatus,
  setCompanyAdminUserStatus,
  seedNewCompany,
  resolveCollectionRef
} from '../services/db';
import { auth, db } from '../firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  getAuth,
  deleteUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
 * Owns authentication (Firebase Auth exclusively) and RBAC data:
 * users, roles, permissions, the active session, and company context.
 */
export function useHRAuth({ loadAllData, setSeedStatus, resetLoadedViews, goToDashboard }: UseHRAuthArgs) {
  const [rbacUsers, setRbacUsers] = useState<RBACUser[]>([]);
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

  // Multi-tenant company states
  const [currentCompanyId, setCurrentCompanyId] = useState<string>(() => getActiveCompanyId());
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);

  const currentRole = currentUser ? rbacRoles.find(r => r.id === currentUser.roleId) || null : null;

  const hasPermission = (permId: string) => {
    if (!currentUser) return false;
    if (currentUser.status === 'inactive' || currentUser.status === 'pending') return false;
    if (currentUser.isSuperAdmin) return true;
    const compStatus = currentCompany?.status || 'active';
    if (compStatus !== 'active') return false;
    if (!currentRole) return false;
    return currentRole.permissionIds.includes(permId);
  };

  const loadCompanyRoles = async (companyId: string) => {
    if (!companyId || !auth.currentUser) return;
    try {
      const roles = await getCollectionData<RBACRole>('rbacRoles', companyId);
      if (roles && roles.length > 0) {
        setRbacRoles(roles);
      }
    } catch (err) {
      console.warn(`Could not load RBAC roles for company ${companyId}:`, err);
    }
  };

  useEffect(() => {
    const targetCompId = currentCompanyId || currentUser?.companyId;
    const isAllowed = currentUser?.isSuperAdmin || currentCompany?.status === 'active';
    if (targetCompId && auth.currentUser && isAllowed && rbacRoles.length === 0) {
      loadCompanyRoles(targetCompId);
    }
  }, [currentCompanyId, currentUser?.companyId, currentUser?.isSuperAdmin, currentCompany?.status, auth.currentUser, rbacRoles.length]);

  // Real-time synchronization of current user's company status (Requirement #3)
  useEffect(() => {
    // If not logged in, or if current user is Super Admin, no listener needed
    if (!currentUser || currentUser.isSuperAdmin || !auth.currentUser) {
      return;
    }

    const compId = currentCompanyId || currentUser.companyId;
    if (!compId) return;

    const compRef = doc(db, 'companies', compId);

    const unsubscribe = onSnapshot(
      compRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const updatedComp = { id: snapshot.id, ...snapshot.data() } as Company;
          setCurrentCompany(updatedComp);

          // If company is not active, clear RBAC roles to immediately revoke HR permissions
          if (updatedComp.status !== 'active') {
            setRbacRoles([]);
            if (currentUser.id === updatedComp.adminUid) {
              const targetStatus = updatedComp.status === 'suspended' ? 'inactive' : 'pending';
              setCurrentUser(prev => prev ? { ...prev, status: targetStatus } : null);
            }
          } else {
            // If reactivated, ensure user is marked active and load company roles
            if (currentUser.id === updatedComp.adminUid) {
              setCurrentUser(prev => prev ? { ...prev, status: 'active' } : null);
            }
            loadCompanyRoles(compId);
          }
        }
      },
      (error) => {
        console.warn(`[REALTIME SYNC] Listener error for company ${compId}:`, error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.id, currentUser?.isSuperAdmin, currentUser?.companyId, currentCompanyId]);

  const setCurrentUserById = (userId: string) => {
    const found = rbacUsers.find(u => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

  const safeLoadRbac = async <T,>(collName: string, setter: (data: T[]) => void, companyId?: string) => {
    if (!auth.currentUser) {
      setter([]);
      return;
    }
    const targetComp = companyId || currentCompanyId || getActiveCompanyId();
    try {
      const data = await getCollectionData<T>(collName, targetComp);
      if (data && data.length > 0) {
        setter(data);
      } else {
        setter([]);
      }
    } catch (error: any) {
      console.error(`Error loading database collection ${collName}: `, error);
      setter([]);
    }
  };

  /**
   * Lazily (re)loads the RBAC-related collections for the 'rbac-users' and
   * 'rbac-roles' views. Invoked by the entity-data hook's loadViewData.
   */
  const loadRbacViewData = async (viewName: string) => {
    const targetComp = currentCompanyId || getActiveCompanyId();
    if (viewName === 'rbac-users') {
      await safeLoadRbac<RBACUser>('rbacUsers', setRbacUsers, targetComp);
    } else if (viewName === 'rbac-roles') {
      await Promise.all([
        safeLoadRbac<RBACRole>('rbacRoles', setRbacRoles, targetComp),
        safeLoadRbac<RBACPermission>('rbacPermissions', setRbacPermissions, targetComp)
      ]);
    }
  };

  // Sync Firebase Auth change events & maintain authenticated session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseAuthReady(true);

      if (fbUser) {
        const uid = fbUser.uid;
        console.log(`[AUTH EVENT] User is securely authenticated via Firebase (${fbUser.email || uid}).`);

        // Initialize default company structural metadata if needed
        try {
          setSeedStatus('seeding');
          await seedDatabase();
          setSeedStatus('done');
        } catch (err) {
          console.warn("Notice during initial database alignment: ", err);
          setSeedStatus('idle');
        }

        try {
          const docRef = doc(db, 'rbacUsers', uid);
          const docSnap = await getDoc(docRef);
          let finalProfile: RBACUser;

          const isAdminEmail = fbUser.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();

          if (docSnap.exists()) {
            const profile = docSnap.data() as RBACUser;
            finalProfile = { ...profile };

            if (isAdminEmail) {
              finalProfile.roleId = 'role_admin';
              finalProfile.isSuperAdmin = true;
            }

            if (!finalProfile.companyId) {
              finalProfile.companyId = DEFAULT_COMPANY_ID;
            }

            await setDoc(docRef, finalProfile, { merge: true });
          } else {
            // New user created directly in Firebase Auth: create initial profile
            const newUserDoc: RBACUser = {
              id: uid,
              fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'المستخدم السحابي',
              username: fbUser.email || '',
              empCode: 'EMP-' + uid.substring(0, 5).toUpperCase(),
              roleId: isAdminEmail ? 'role_admin' : 'role_employee',
              status: 'active',
              companyId: DEFAULT_COMPANY_ID,
              isSuperAdmin: isAdminEmail
            };

            await setDoc(docRef, newUserDoc);
            finalProfile = newUserDoc;
          }

          // Check if user is administratively deactivated (inactive)
          if (finalProfile.status === 'inactive' && !isAdminEmail) {
            setCurrentUser(null);
            setCurrentCompany(null);
            localStorage.removeItem('sahaba_current_user');
            await signOut(auth);
            return;
          }

          const userCompId = finalProfile.companyId || DEFAULT_COMPANY_ID;
          setActiveCompanyId(userCompId);
          setCurrentCompanyId(userCompId);

          // Load company details
          let compDoc: Company | null = null;
          try {
            compDoc = await getCompany(userCompId);
            if (compDoc) {
              setCurrentCompany(compDoc);
            }
          } catch (compErr) {
            console.warn("Could not load company profile:", compErr);
          }

          // Check isSuperAdmin BEFORE checking company status
          if (finalProfile.isSuperAdmin || isAdminEmail) {
            finalProfile.isSuperAdmin = true;
            finalProfile.roleId = 'role_admin';
            await loadCompanyRoles(userCompId);
            try {
              const comps = await getCompanies();
              setAllCompanies(comps);
            } catch (compsErr) {
              console.warn("Could not load all companies for super admin:", compsErr);
            }
            setCurrentUser(finalProfile);
            localStorage.setItem('sahaba_current_user', JSON.stringify(finalProfile));
            return;
          }

          // For normal users:
          setCurrentUser(finalProfile);
          localStorage.setItem('sahaba_current_user', JSON.stringify(finalProfile));

          // Only if company is active AND user is active, continue normal RBAC initialization
          const compStatus = compDoc?.status || 'active';
          if (compStatus === 'active' && finalProfile.status === 'active') {
            await loadCompanyRoles(userCompId);
          } else {
            // Block HR access: do not populate RBAC roles
            setRbacRoles([]);
          }
        } catch (e) {
          console.error("Error keeping identity synced: ", e);
        }
      } else {
        // User logged out
        setCurrentUser(null);
        setCurrentCompany(null);
        setRbacRoles([]);
        setRbacPermissions([]);
        setCurrentCompanyId(DEFAULT_COMPANY_ID);
        setActiveCompanyId(DEFAULT_COMPANY_ID);
        localStorage.removeItem('sahaba_current_user');
        localStorage.removeItem('sahaba_active_company_id');
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (usr: string, pass: string): Promise<boolean> => {
    const email = usr.toLowerCase().trim();
    if (!email.includes('@')) {
      throw new Error('يرجى إدخال بريد إلكتروني صحيح للولوج سحابياً');
    }

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const uid = userCredential.user.uid;

      // 2. Fetch user profile from rbacUsers Firestore collection
      const docRef = doc(db, 'rbacUsers', uid);
      const docSnap = await getDoc(docRef);
      let foundUser: RBACUser | null = null;

      const isAdmin = email === SUPER_ADMIN_EMAIL.toLowerCase();

      if (docSnap.exists()) {
        foundUser = { id: uid, ...docSnap.data() } as RBACUser;
      } else {
        const newUserDoc: RBACUser = {
          id: uid,
          fullName: email.split('@')[0],
          username: email,
          empCode: 'EMP-' + uid.substring(0, 5).toUpperCase(),
          roleId: isAdmin ? 'role_admin' : 'role_employee',
          status: isAdmin ? 'active' : 'pending',
          companyId: DEFAULT_COMPANY_ID,
          isSuperAdmin: isAdmin
        };
        await createDocument('global_rbacUsers', uid, newUserDoc);
        foundUser = newUserDoc;
      }

      if (foundUser.status === 'inactive' && !isAdmin) {
        await signOut(auth);
        throw new Error('عذراً، هذا الحساب معطل إدارياً بالسيستم حالياً');
      }

      if (!foundUser.companyId) {
        foundUser.companyId = DEFAULT_COMPANY_ID;
      }
      if (isAdmin) {
        foundUser.isSuperAdmin = true;
        foundUser.roleId = 'role_admin';
      }

      const userCompId = foundUser.companyId || DEFAULT_COMPANY_ID;
      setActiveCompanyId(userCompId);
      setCurrentCompanyId(userCompId);

      let compDoc: Company | null = null;
      try {
        compDoc = await getCompany(userCompId);
        if (compDoc) {
          setCurrentCompany(compDoc);
        }
      } catch (compErr) {
        console.warn("Could not load company details on login:", compErr);
      }

      if (foundUser.isSuperAdmin) {
        await loadCompanyRoles(userCompId);
        try {
          const comps = await getCompanies();
          setAllCompanies(comps);
        } catch (compsErr) {
          console.warn("Could not load company list on login:", compsErr);
        }
        setCurrentUser(foundUser);
        localStorage.setItem('sahaba_current_user', JSON.stringify(foundUser));
        return true;
      }

      // Normal company user:
      setCurrentUser(foundUser);
      localStorage.setItem('sahaba_current_user', JSON.stringify(foundUser));

      const compStatus = compDoc?.status || 'active';
      if (compStatus === 'active' && foundUser.status === 'active') {
        await loadCompanyRoles(userCompId);
      } else {
        setRbacRoles([]);
      }
      return true;

    } catch (firebaseError: any) {
      console.error("Firebase sign-in error: ", firebaseError);
      let errMsg = 'فشل تسجيل الدخول. يرجى التحقق من البريد وكلمة المرور.';
      if (
        firebaseError.code === 'auth/wrong-password' ||
        firebaseError.code === 'auth/invalid-credential' ||
        firebaseError.code === 'auth/invalid-login-credentials'
      ) {
        errMsg = 'كلمة المرور أو البريد الإلكتروني المدخل غير صحيح';
      } else if (firebaseError.code === 'auth/user-not-found') {
        errMsg = 'حساب المستخدم هذا غير مسجل بالمنظومة';
      } else if (firebaseError.code === 'auth/invalid-email') {
        errMsg = 'البريد الإلكتروني المدخل غير صالح';
      } else if (firebaseError.code === 'auth/user-disabled') {
        errMsg = 'عذراً، هذا الحساب معطل إدارياً بالسيستم حالياً';
      } else if (firebaseError.code === 'auth/too-many-requests') {
        errMsg = 'تم حظر الدخول مؤقتاً لكثرة المحاولات الخاطئة. يرجى المحاولة لاحقاً';
      }
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Signout error: ", e);
    }
    setCurrentUser(null);
    setCurrentCompany(null);
    setRbacRoles([]);
    setRbacPermissions([]);
    setCurrentCompanyId(DEFAULT_COMPANY_ID);
    setActiveCompanyId(DEFAULT_COMPANY_ID);
    localStorage.removeItem('sahaba_current_user');
    localStorage.removeItem('sahaba_active_company_id');
    goToDashboard();
    resetLoadedViews();
  };

  const resetPassword = async (emailInput: string): Promise<void> => {
    const email = emailInput.trim();
    if (!email) {
      throw new Error('يرجى إدخال البريد الإلكتروني');
    }
    if (!email.includes('@') || !email.includes('.')) {
      throw new Error('يرجى إدخال بريد إلكتروني صحيح ومعتمد');
    }

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (firebaseError: any) {
      console.error("Firebase sendPasswordResetEmail error: ", firebaseError);
      // For email enumeration protection, user-not-found returns normally without revealing non-existence
      if (firebaseError.code === 'auth/user-not-found') {
        return;
      } else if (firebaseError.code === 'auth/invalid-email') {
        throw new Error('البريد الإلكتروني المدخل غير صالح');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        throw new Error('تم حظر الطلبات مؤقتاً لتكرار المحاولات. يرجى الانتظار والمحاولة لاحقاً');
      } else if (firebaseError.code === 'auth/network-request-failed') {
        throw new Error('تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت');
      } else {
        throw new Error('تعذر إرسال رابط إعادة التعيين حالياً. يرجى المحاولة لاحقاً');
      }
    }
  };

  const registerCompany = async (data: {
    companyName: string;
    crNumber?: string;
    adminName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<boolean> => {
    const email = data.email.toLowerCase().trim();
    if (!email.includes('@')) {
      throw new Error('يرجى إدخال بريد إلكتروني صالح لمدير المنشأة');
    }
    if (data.password.length < 6) {
      throw new Error('كلمة المرور يجب ألا تقل عن 6 خانات');
    }
    if (!data.companyName.trim()) {
      throw new Error('فضلاً أدخل اسم الشركة أو المنشأة');
    }
    if (!data.adminName.trim()) {
      throw new Error('فضلاً أدخل اسم المسؤول / مدير النظام');
    }

    // 1. Create real Firebase Authentication user first
    let userCred;
    try {
      userCred = await createUserWithEmailAndPassword(auth, email, data.password);
    } catch (err: any) {
      console.error("Firebase Auth user registration error: ", err);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('البريد الإلكتروني مسجل مسبقاً بنظام سحابة الأعمال');
      } else if (err.code === 'auth/weak-password') {
        throw new Error('كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 خانات على الأقل');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('البريد الإلكتروني المدخل غير صالح');
      } else {
        throw new Error(err.message || 'فشل إنشاء الحساب عبر خوادم التوثيق');
      }
    }

    const uid = userCred.user.uid;
    const newCompId = 'comp_' + Date.now();

    // 2. Create company record in Firestore (/companies/{newCompId}) with status 'pending'
    const companyDoc: Company = {
      id: newCompId,
      name: data.companyName.trim(),
      crNumber: data.crNumber?.trim() || '',
      adminUid: uid,
      adminEmail: email,
      createdAt: new Date().toISOString(),
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      status: 'pending'
    };
    await createCompany(companyDoc);

    // 3. Create Admin user record with this EXACT new companyId with status 'pending'
    const adminUser: RBACUser = {
      id: uid,
      fullName: data.adminName.trim(),
      username: email,
      empCode: 'ADM-001',
      roleId: 'role_admin',
      status: 'pending',
      companyId: newCompId,
      isSuperAdmin: false
    };

    // Store in global directory for auth discovery
    await createDocument('global_rbacUsers', uid, adminUser, newCompId);
    // Store in company's scoped rbacUsers subcollection
    await createDocument('rbacUsers', uid, adminUser, newCompId);

    // 4. Seed new company with required roles, permissions, deduction types
    // (starts completely clean: ZERO demo employees, leaves, attendance, etc.)
    await seedNewCompany(newCompId, data.companyName.trim(), adminUser);

    // 5. Set active company and user session
    setActiveCompanyId(newCompId);
    setCurrentCompanyId(newCompId);
    setCurrentCompany(companyDoc);
    setCurrentUser(adminUser);
    localStorage.setItem('sahaba_current_user', JSON.stringify(adminUser));

    // Do NOT load HR data since company is pending approval
    goToDashboard();
    return true;
  };

  const approveCompany = async (companyId: string) => {
    if (!currentUser?.isSuperAdmin) {
      throw new Error('صلاحية اعتماد وتفعيل المنشأة متاحة حصرياً للمشرف العام.');
    }
    const comp = allCompanies.find(c => c.id === companyId) || await getCompany(companyId);
    if (!comp) throw new Error('المنشأة غير موجودة.');
    await updateCompanyStatus(companyId, 'active');
    if (comp.adminUid) {
      await setCompanyAdminUserStatus(companyId, comp.adminUid, 'active');
    }
    const updated = await getCompanies();
    setAllCompanies(updated);
    if (currentCompanyId === companyId) {
      const refreshed = updated.find(c => c.id === companyId) || null;
      if (refreshed) setCurrentCompany(refreshed);
    }
  };

  const rejectCompany = async (companyId: string, reason?: string) => {
    if (!currentUser?.isSuperAdmin) {
      throw new Error('صلاحية رفض المنشأة متاحة حصرياً للمشرف العام.');
    }
    const comp = allCompanies.find(c => c.id === companyId) || await getCompany(companyId);
    if (!comp) throw new Error('المنشأة غير موجودة.');
    await updateCompanyStatus(companyId, 'rejected', reason || 'تم رفض طلب المنشأة من قِبل إدارة المنظومة');
    if (comp.adminUid) {
      await setCompanyAdminUserStatus(companyId, comp.adminUid, 'inactive');
    }
    const updated = await getCompanies();
    setAllCompanies(updated);
    if (currentCompanyId === companyId) {
      const refreshed = updated.find(c => c.id === companyId) || null;
      if (refreshed) setCurrentCompany(refreshed);
    }
  };

  const suspendCompany = async (companyId: string) => {
    if (!currentUser?.isSuperAdmin) {
      throw new Error('صلاحية تعليق المنشأة متاحة حصرياً للمشرف العام.');
    }
    const comp = allCompanies.find(c => c.id === companyId) || await getCompany(companyId);
    if (!comp) throw new Error('المنشأة غير موجودة.');

    // 1. Update company status to suspended
    await updateCompanyStatus(companyId, 'suspended');

    // 2. If company.adminUid exists, update company admin user status to inactive
    if (comp.adminUid) {
      try {
        await setCompanyAdminUserStatus(companyId, comp.adminUid, 'inactive');
      } catch (adminErr: any) {
        console.error(`Failed to deactivate admin user ${comp.adminUid} for company ${companyId}:`, adminErr);
        const updated = await getCompanies();
        setAllCompanies(updated);
        if (currentCompanyId === companyId) {
          const refreshed = updated.find(c => c.id === companyId) || null;
          if (refreshed) setCurrentCompany(refreshed);
        }
        throw new Error(`تم تعليق المنشأة ولكن تعذر تعطيل حساب المدير الإداري: ${adminErr.message || String(adminErr)}`);
      }
    }

    const updated = await getCompanies();
    setAllCompanies(updated);
    if (currentCompanyId === companyId) {
      const refreshed = updated.find(c => c.id === companyId) || null;
      if (refreshed) setCurrentCompany(refreshed);
    }
  };

  const reactivateCompany = async (companyId: string) => {
    if (!currentUser?.isSuperAdmin) {
      throw new Error('صلاحية إعادة تفعيل المنشأة متاحة حصرياً للمشرف العام.');
    }
    const comp = allCompanies.find(c => c.id === companyId) || await getCompany(companyId);
    if (!comp) throw new Error('المنشأة غير موجودة.');
    await updateCompanyStatus(companyId, 'active');
    if (comp.adminUid) {
      await setCompanyAdminUserStatus(companyId, comp.adminUid, 'active');
    }
    const updated = await getCompanies();
    setAllCompanies(updated);
    if (currentCompanyId === companyId) {
      const refreshed = updated.find(c => c.id === companyId) || null;
      if (refreshed) setCurrentCompany(refreshed);
    }
  };

  const refreshCompanies = async () => {
    if (currentUser?.isSuperAdmin) {
      const updated = await getCompanies();
      setAllCompanies(updated);
    }
  };

  const switchCompany = async (targetCompanyId: string) => {
    if (!currentUser?.isSuperAdmin) {
      throw new Error('صلاحية التبديل بين الشركات متاحة فقط للمشرف العام على المنظومة.');
    }
    const targetComp = await getCompany(targetCompanyId);
    if (!targetComp) {
      throw new Error('الشركة المحددة غير موجودة.');
    }
    setActiveCompanyId(targetCompanyId);
    setCurrentCompanyId(targetCompanyId);
    await loadCompanyRoles(targetCompanyId);
    setCurrentCompany(targetComp);
    resetLoadedViews();
    await loadAllData();
  };

  const addRBACUser = async (userObj: Omit<RBACUser, 'id'>) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية إدارة وإعداد مستخدمي النظام.');
    }

    const email = userObj.username.trim().toLowerCase();
    const password = userObj.password?.trim();

    if (!email) {
      throw new Error('فضلاً أدخل اسم المستخدم أو البريد الإلكتروني للموظف');
    }

    if (!password || password.length < 6) {
      throw new Error('كلمة المرور مطلوبة ويجب ألا تقل عن 6 خانات لتسجيل الحساب في خوادم التوثيق');
    }

    const targetCompId = currentCompanyId || getActiveCompanyId();

    // 1. Create real Firebase Authentication user using an isolated secondary App/Auth instance
    // to preserve the currently logged-in administrator's session
    const secondaryAppName = `secondary-auth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let secondaryApp = null;
    let newUid: string | null = null;
    let createdUser: any = null;

    try {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      createdUser = userCredential.user;
      newUid = createdUser.uid;
    } catch (authErr: any) {
      console.error("Firebase Auth secondary user creation error: ", authErr);
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch {
          // ignore cleanup error
        }
      }

      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error('البريد الإلكتروني / اسم المستخدم مسجل مسبقاً في خوادم التوثيق');
      } else if (authErr.code === 'auth/weak-password') {
        throw new Error('كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 خانات على الأقل');
      } else if (authErr.code === 'auth/invalid-email') {
        throw new Error('صيغة البريد الإلكتروني المدخل غير صالحة');
      } else {
        throw new Error(authErr.message || 'فشل إنشاء حساب التوثيق للمستخدم');
      }
    }

    if (!newUid) {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch {
          // ignore
        }
      }
      throw new Error('فشل الحصول على معرّف التوثيق (UID) للمستخدم الجديد.');
    }

    // 2. Prepare safe user object - password MUST NEVER be stored in Firestore
    const { password: _, ...safeUser } = userObj;
    const item: RBACUser = {
      ...safeUser,
      username: email,
      id: newUid,
      companyId: targetCompId
    };

    // 3. Create Firestore documents with rollback safety
    try {
      // Create inside company's subcollection: /companies/{companyId}/rbacUsers/{newUid}
      await createDocument('rbacUsers', newUid, item, targetCompId);
      // Also record in global_rbacUsers: /rbacUsers/{newUid}
      await createDocument('global_rbacUsers', newUid, item, targetCompId);
    } catch (fsErr: any) {
      console.error("Firestore RBAC creation failed. Initiating rollback of Auth user: ", fsErr);
      // Rollback: delete newly created Firebase Auth account
      if (createdUser) {
        try {
          await deleteUser(createdUser);
          console.warn(`[ROLLBACK SUCCESS] Deleted orphaned Firebase Auth user ${newUid}`);
        } catch (delErr) {
          console.error(`[ROLLBACK ERROR] Failed to delete orphaned Firebase Auth user ${newUid}: `, delErr);
        }
      }
      // Also cleanup any partial Firestore document that might have been written
      try {
        await dbDeleteDoc('rbacUsers', newUid, targetCompId);
      } catch {
        // ignore
      }
      try {
        await dbDeleteDoc('global_rbacUsers', newUid, targetCompId);
      } catch {
        // ignore
      }

      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch {
          // ignore
        }
      }

      throw new Error(`فشل حفظ بيانات الصلاحيات في قاعدة البيانات (${fsErr.message || 'خطأ غير معروف'}). تم التراجع عن إنشاء الحساب لضمان اتساق البيانات.`);
    }

    // Clean up secondary app safely
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch (appDelErr) {
        console.warn("Secondary app disposal warning: ", appDelErr);
      }
    }

    await loadAllData();
  };

  const updateRBACUser = async (id: string, userObj: Partial<RBACUser>) => {
    if (!hasPermission('view_rbac') && currentUser?.id !== id) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية إدارة وتعديل مستخدمي النظام.');
    }
    const { password: _, ...safeUser } = userObj;
    const targetCompId = currentCompanyId || getActiveCompanyId();
    await dbUpdateDoc('rbacUsers', id, safeUser, targetCompId);
    await dbUpdateDoc('global_rbacUsers', id, safeUser, targetCompId);

    await loadAllData();
    if (currentUser && currentUser.id === id) {
      setCurrentUser(prev => prev ? { ...prev, ...safeUser } : null);
    }
  };

  const deleteRBACUser = async (id: string) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية حذف مستخدمين من النظام.');
    }

    if (!id) {
      throw new Error('معرف المستخدم غير محدد.');
    }

    // Safety check: Prevent deleting currently logged-in user
    if (currentUser?.id === id || auth.currentUser?.uid === id) {
      throw new Error('لا يمكن حذف حساب المستخدم المسجل دخوله حالياً.');
    }

    const targetUser = rbacUsers.find(u => u.id === id);
    const targetCompId = targetUser?.companyId || currentCompanyId || getActiveCompanyId();

    // Check if current user is Super Admin
    // ONLY valid Super Admin checks: currentUser.isSuperAdmin or centralized SUPER_ADMIN_EMAIL
    // Never use roleId === 'role_admin' because Company Admin also has role_admin
    const isSuper = !!currentUser?.isSuperAdmin ||
      auth.currentUser?.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();

    // 1. Delete company-scoped RBAC membership: /companies/{companyId}/rbacUsers/{uid}
    await dbDeleteDoc('rbacUsers', id, targetCompId);

    // 2. Global RBAC handling:
    if (isSuper) {
      // Super Admin preserves ability to delete global RBAC record if permitted
      try {
        await dbDeleteDoc('global_rbacUsers', id, targetCompId);
      } catch (err) {
        console.warn('Super Admin global RBAC deletion notice:', err);
      }
    } else {
      // Company Admin: DO NOT delete global RBAC record (/rbacUsers/{uid}).
      // Instead, deactivate it so the user cannot log in, complying strictly with Firestore rules.
      try {
        await dbUpdateDoc('global_rbacUsers', id, { status: 'inactive' }, targetCompId);
      } catch (err) {
        console.warn('Company Admin deactivation update notice:', err);
      }
    }

    // 3. Immediately update local state so user is removed from UI without delay
    setRbacUsers(prev => prev.filter(u => u.id !== id));

    await loadAllData();
  };

  const addRBACRole = async (roleObj: Omit<RBACRole, 'id'>) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية إضافة أدوار جديدة بالنظام.');
    }
    const targetCompId = currentCompanyId || getActiveCompanyId();
    const newId = doc(resolveCollectionRef('rbacRoles', targetCompId)).id;
    const item: RBACRole = { ...roleObj, id: newId, companyId: targetCompId };
    await createDocument('rbacRoles', newId, item, targetCompId);
    await loadAllData();
  };

  const updateRBACRole = async (id: string, roleObj: Partial<RBACRole>) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية تعديل الأدوار والصلاحيات.');
    }
    const targetCompId = currentCompanyId || getActiveCompanyId();
    await dbUpdateDoc('rbacRoles', id, roleObj, targetCompId);
    await loadAllData();
  };

  const deleteRBACRole = async (id: string) => {
    if (!hasPermission('view_rbac')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية حذف الأدوار والصلاحيات.');
    }
    const targetCompId = currentCompanyId || getActiveCompanyId();
    await dbDeleteDoc('rbacRoles', id, targetCompId);
    await loadAllData();
  };

  return {
    rbacUsers,
    rbacRoles,
    rbacPermissions,
    currentUser,
    currentRole,
    firebaseAuthReady,
    currentCompany,
    currentCompanyId,
    allCompanies,
    registerCompany,
    switchCompany,
    setCurrentUserById,
    hasPermission,
    loadRbacViewData,
    login,
    logout,
    resetPassword,
    addRBACUser,
    updateRBACUser,
    deleteRBACUser,
    addRBACRole,
    updateRBACRole,
    deleteRBACRole,
    approveCompany,
    rejectCompany,
    suspendCompany,
    reactivateCompany,
    refreshCompanies
  };
}
