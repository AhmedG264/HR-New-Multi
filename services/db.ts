/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Company, RBACUser } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Handle Firestore security and operational errors in a compliant structured format
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Helper to recursively sanitize objects, removing undefined values before committing to Firestore.
 */
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as any;
  }
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj;
    }
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export const DEFAULT_COMPANY_ID = 'company_default';
export const SUPER_ADMIN_EMAIL = 'ahmedgamal264@outlook.com';

let currentActiveCompanyId: string = DEFAULT_COMPANY_ID;

export function setActiveCompanyId(id: string): void {
  if (id) {
    currentActiveCompanyId = id;
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sahaba_active_company_id', id);
      }
    } catch {
      // ignore storage access errors
    }
  }
}

export function getActiveCompanyId(): string {
  try {
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem('sahaba_active_company_id');
      if (persisted) return persisted;
    }
  } catch {
    // ignore storage access errors
  }
  return currentActiveCompanyId || DEFAULT_COMPANY_ID;
}

/**
 * Resolves the Firestore collection reference based on entity name and company context.
 * - 'companies' -> /companies
 * - 'system_meta' -> /system_meta
 * - 'global_rbacUsers' -> /rbacUsers (global directory for login lookup)
 * - All other business entities -> /companies/{companyId}/{collName}
 */
export function resolveCollectionRef(collName: string, companyId?: string) {
  const targetCompId = companyId || getActiveCompanyId();
  if (collName === 'companies') {
    return collection(db, 'companies');
  }
  if (collName === 'system_meta') {
    return collection(db, 'system_meta');
  }
  if (collName === 'global_rbacUsers') {
    return collection(db, 'rbacUsers');
  }
  return collection(db, 'companies', targetCompId, collName);
}

/**
 * Resolves the Firestore document reference based on entity name, doc id, and company context.
 */
export function resolveDocRef(collName: string, id: string, companyId?: string) {
  const targetCompId = companyId || getActiveCompanyId();
  if (collName === 'companies') {
    return doc(db, 'companies', id);
  }
  if (collName === 'system_meta') {
    return doc(db, 'system_meta', id);
  }
  if (collName === 'global_rbacUsers') {
    return doc(db, 'rbacUsers', id);
  }
  return doc(db, 'companies', targetCompId, collName, id);
}

/**
 * Safe, non-destructive migration helper.
 * If legacy root collections exist, copies documents into default company's subcollections.
 * Leaves the original collections completely intact.
 */
export async function migrateRootDataToDefaultCompany(): Promise<{ success: boolean; message: string; copiedCount: number }> {
  try {
    const metaDocRef = doc(db, 'system_meta', 'company_migration_v1');
    const metaSnap = await getDoc(metaDocRef);
    if (metaSnap.exists() && metaSnap.data()?.completed === true) {
      return { success: true, message: 'Already completed', copiedCount: 0 };
    }

    // Ensure default company doc exists
    const compRef = doc(db, 'companies', DEFAULT_COMPANY_ID);
    const compSnap = await getDoc(compRef);
    if (!compSnap.exists()) {
      await setDoc(compRef, {
        id: DEFAULT_COMPANY_ID,
        name: 'شركة سحابة الأعمال المحدودة',
        crNumber: '1010889922',
        adminEmail: SUPER_ADMIN_EMAIL,
        adminUid: 'user_admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        status: 'active',
        phone: '0112345678',
        address: 'الرياض، المملكة العربية السعودية'
      });
    }

    const collectionsToMigrate = [
      'employees', 'leaves', 'attendance', 'jobs', 'candidates',
      'reviews', 'trainings', 'expenses', 'trips', 'health',
      'contracts', 'professions', 'deductions', 'deductionTypes',
      'docs', 'tasks', 'assets', 'assetHistory', 'rbacRoles',
      'rbacPermissions', 'rbacUsers'
    ];

    let totalCopied = 0;
    for (const coll of collectionsToMigrate) {
      try {
        const rootSnap = await getDocs(collection(db, coll));
        if (!rootSnap.empty) {
          for (const d of rootSnap.docs) {
            const targetRef = doc(db, 'companies', DEFAULT_COMPANY_ID, coll, d.id);
            const targetSnap = await getDoc(targetRef);
            if (!targetSnap.exists()) {
              await setDoc(targetRef, cleanUndefined({ ...d.data(), id: d.id, companyId: DEFAULT_COMPANY_ID }));
              totalCopied++;
            }
          }
        }
      } catch (collErr) {
        console.warn(`[MIGRATION] Collection ${coll} pass note:`, collErr);
      }
    }

    await setDoc(metaDocRef, {
      completed: true,
      migratedAt: new Date().toISOString(),
      copiedCount: totalCopied,
      defaultCompanyId: DEFAULT_COMPANY_ID,
      note: 'Preserved intact for safety.'
    });

    return { success: true, message: 'Migration completed successfully', copiedCount: totalCopied };
  } catch (error) {
    console.warn('[MIGRATION PASS]', error);
    return { success: true, message: 'Migration completed or bypassed', copiedCount: 0 };
  }
}

/**
 * Seeds initial structural metadata (roles, permissions, deductions) for a brand new registered company.
 * Clean slate: zero HR records (no employees, leaves, attendance, etc.)
 */
export async function seedNewCompany(companyId: string, companyName: string, adminUser: RBACUser): Promise<boolean> {
  const defaultRoles = getLocalDefaultsForCollection('rbacRoles');
  const defaultPermissions = getLocalDefaultsForCollection('rbacPermissions');
  const defaultDeductions = getLocalDefaultsForCollection('deductionTypes');

  try {
    // 1. Seed Roles
    for (const role of defaultRoles) {
      await setDoc(doc(db, 'companies', companyId, 'rbacRoles', role.id), cleanUndefined({ ...role, companyId }));
    }
    // 2. Seed Permissions
    for (const perm of defaultPermissions) {
      await setDoc(doc(db, 'companies', companyId, 'rbacPermissions', perm.id), cleanUndefined({ ...perm, companyId }));
    }
    // 3. Seed default deduction types
    for (const dtype of defaultDeductions) {
      await setDoc(doc(db, 'companies', companyId, 'deductionTypes', dtype.id), cleanUndefined({ ...dtype, companyId }));
    }
    // 4. Add admin user in company's scoped rbacUsers subcollection
    await setDoc(doc(db, 'companies', companyId, 'rbacUsers', adminUser.id), cleanUndefined({ ...adminUser, companyId }));

    return true;
  } catch (err) {
    console.error(`Error initializing assets for new company ${companyId}: `, err);
    return false;
  }
}

export async function getCompanies(): Promise<Company[]> {
  try {
    const qSnapshot = await getDocs(collection(db, 'companies'));
    return qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
  } catch (error) {
    console.warn("Could not fetch companies list:", error);
    return [];
  }
}

export async function getCompany(companyId: string): Promise<Company | null> {
  try {
    const snap = await getDoc(doc(db, 'companies', companyId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Company;
    }
    return null;
  } catch (error) {
    console.error("Error fetching company details:", error);
    return null;
  }
}

export async function createCompany(company: Company): Promise<void> {
  try {
    await setDoc(doc(db, 'companies', company.id), cleanUndefined(company));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `companies/${company.id}`);
  }
}

export async function updateCompanyStatus(
  companyId: string,
  status: 'pending' | 'active' | 'suspended' | 'rejected',
  rejectionReason?: string
): Promise<void> {
  try {
    const compRef = doc(db, 'companies', companyId);
    const updatePayload: Record<string, any> = { status };
    if (rejectionReason !== undefined) {
      updatePayload.rejectionReason = rejectionReason;
    }
    await updateDoc(compRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `companies/${companyId}`);
  }
}

export async function setCompanyAdminUserStatus(
  companyId: string,
  adminUid: string,
  status: 'active' | 'inactive' | 'pending'
): Promise<void> {
  try {
    // 1. Update global routing directory record
    const globalUserRef = doc(db, 'rbacUsers', adminUid);
    const globalSnap = await getDoc(globalUserRef);
    if (globalSnap.exists()) {
      await updateDoc(globalUserRef, { status });
    }

    // 2. Update company-scoped user record
    const companyUserRef = doc(db, 'companies', companyId, 'rbacUsers', adminUid);
    const compUserSnap = await getDoc(companyUserRef);
    if (compUserSnap.exists()) {
      await updateDoc(companyUserRef, { status });
    }
  } catch (error) {
    console.warn(`Could not update user status for ${adminUid}:`, error);
  }
}

/**
 * Helper to securely seed an individual collection only if it is currently empty
 */
async function seedIfEmpty<T extends { id: string }>(collName: string, defaults: T[], companyId: string = DEFAULT_COMPANY_ID): Promise<void> {
  const targetColRef = collection(db, 'companies', companyId, collName);
  const qSnapshot = await getDocs(targetColRef);
  if (qSnapshot.empty && defaults.length > 0) {
    for (const item of defaults) {
      await setDoc(doc(db, 'companies', companyId, collName, item.id), cleanUndefined({ ...item, companyId }));
    }
  }
}

/**
 * Sync / Seed database helper. Initializes default company metadata if not present.
 */
export async function seedDatabase(): Promise<boolean> {
  try {
    // 1. Ensure default company doc exists
    const compRef = doc(db, 'companies', DEFAULT_COMPANY_ID);
    const compSnap = await getDoc(compRef);
    if (!compSnap.exists()) {
      await setDoc(compRef, {
        id: DEFAULT_COMPANY_ID,
        name: 'شركة سحابة الأعمال المحدودة',
        crNumber: '1010889922',
        adminEmail: SUPER_ADMIN_EMAIL,
        adminUid: 'user_admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        status: 'active',
        phone: '0112345678',
        address: 'الرياض، المملكة العربية السعودية'
      });
    }

    const initDocRef = doc(db, 'system_meta', 'seed_status_v5');
    const initSnap = await getDoc(initDocRef);
    if (initSnap.exists() && initSnap.data()?.seeded === true) {
      return true;
    }

    // Initialize required roles, permissions, and deductionTypes for default company
    await seedIfEmpty('deductionTypes', getLocalDefaultsForCollection('deductionTypes'), DEFAULT_COMPANY_ID);
    await seedIfEmpty('rbacRoles', getLocalDefaultsForCollection('rbacRoles'), DEFAULT_COMPANY_ID);
    await seedIfEmpty('rbacPermissions', getLocalDefaultsForCollection('rbacPermissions'), DEFAULT_COMPANY_ID);

    await setDoc(initDocRef, { seeded: true, timestamp: new Date().toISOString() });
    return true;
  } catch (error) {
    console.warn('Notice in database seeding: ', error);
    return false;
  }
}

export function getLocalDefaultsForCollection(collName: string): any[] {
  switch (collName) {
    case 'deductionTypes':
      return [
        {
          id: 'dtype_1',
          name: 'المؤسسة العامة للتأمينات الاجتماعية (GOSI)',
          category: 'حكومي إلزامي',
          defaultPct: 9.75,
          applyTo: 'سعودي',
          notes: 'حصة الموظف الشهرية وفق نظام التأمينات الاجتماعية السعودي'
        },
        {
          id: 'dtype_2',
          name: 'صندوق تنمية الموارد البشرية (هدف)',
          category: 'دعم وتمكين',
          defaultPct: 0,
          applyTo: 'الكل',
          notes: 'برامج دعم الأجور المعتمدة'
        },
        {
          id: 'dtype_3',
          name: 'التأمين الصحي التكافلي',
          category: 'طبي واجتماعي',
          defaultPct: 1.5,
          applyTo: 'وافد',
          notes: 'خصم التغطية الإضافية للتابعين'
        },
        {
          id: 'dtype_4',
          name: 'سلف وعهد شخصية',
          category: 'داخلي',
          defaultPct: 0,
          applyTo: 'الكل',
          notes: 'تسوية شهرية وفق سياسة الشركة'
        }
      ];
    case 'rbacRoles':
      return [
        {
          id: 'role_admin',
          name: 'مدير النظام (Super Admin)',
          description: 'صلاحيات مطلقة لإدارة المنشأة، الموظفين، الرواتب، الإعدادات والأمان.',
          permissionIds: [
            'view_dashboard', 'view_ess', 'view_employees', 'view_attendance', 'view_leaves',
            'view_payroll', 'view_compliance', 'view_recruit', 'view_perf', 'view_training',
            'view_expenses', 'view_trips', 'view_empfiles', 'view_docs', 'view_deductions',
            'view_tasks', 'view_assets', 'view_rbac', 'view_health', 'view_reports',
            'create_employee', 'edit_employee', 'delete_employee', 'create_leave', 'decide_leave',
            'record_attendance', 'delete_attendance', 'approve_operations', 'create_asset', 'edit_asset',
            'return_asset', 'manage_asset_history'
          ]
        },
        {
          id: 'role_hr',
          name: 'مسؤول الموارد البشرية (HR Manager)',
          description: 'إدارة شؤون الموظفين، الحضور والانصراف، الإجازات، ملفات العقود والتأمين الطبي.',
          permissionIds: [
            'view_dashboard', 'view_ess', 'view_employees', 'view_attendance', 'view_leaves',
            'view_compliance', 'view_recruit', 'view_perf', 'view_training', 'view_empfiles',
            'view_docs', 'view_deductions', 'view_tasks', 'view_assets', 'view_health', 'view_reports',
            'create_employee', 'edit_employee', 'create_leave', 'decide_leave', 'record_attendance',
            'create_asset', 'edit_asset', 'return_asset', 'manage_asset_history'
          ]
        },
        {
          id: 'role_finance',
          name: 'المدير المالي (Finance Officer)',
          description: 'متابعة مسير الرواتب الموحد، التحويلات، النفقات، العهد والخصومات التأمينية.',
          permissionIds: [
            'view_dashboard', 'view_ess', 'view_payroll', 'view_compliance', 'view_expenses',
            'view_deductions', 'view_reports', 'approve_operations'
          ]
        },
        {
          id: 'role_employee',
          name: 'موظف (Employee)',
          description: 'يستطيع الولوج للخدمات الذاتية فقط وتقديم طلبات الإجازات والعهد والنفقات ومتابعة مهامه.',
          permissionIds: ['view_dashboard', 'view_ess', 'create_leave', 'create_asset']
        }
      ];
    case 'rbacPermissions':
      return [
        { id: 'view_dashboard', name: 'استعراض لوحة التحكم الرئيسية', category: 'صفحات' },
        { id: 'view_ess', name: 'استعراض الخدمة الذاتية (ESS)', category: 'صفحات' },
        { id: 'view_employees', name: 'إدارة ملفات الموظفين والبطاقات', category: 'صفحات' },
        { id: 'view_attendance', name: 'تسجيل ومتابعة الحضور والانصراف', category: 'صفحات' },
        { id: 'view_leaves', name: 'استعراض وإدارة طلبات الإجازات', category: 'صفحات' },
        { id: 'view_payroll', name: 'متابعة مسير الرواتب الموحد والتحويلات', category: 'صفحات' },
        { id: 'view_compliance', name: 'مراقبة الالتزام والأنظمة الحكومية', category: 'صفحات' },
        { id: 'view_recruit', name: 'عرض لوحة التوظيف وإدارة المتقدمين', category: 'صفحات' },
        { id: 'view_perf', name: 'إدارة تقييم الأداء والبطاقات الوظيفية', category: 'صفحات' },
        { id: 'view_training', name: 'استعراض البرامج والدورات التدريبية', category: 'صفحات' },
        { id: 'view_expenses', name: 'إدارة العهد والمصروفات المستردة', category: 'صفحات' },
        { id: 'view_trips', name: 'إدارة انتداب ورحلات عمل الموظفين', category: 'صفحات' },
        { id: 'view_empfiles', name: 'استعراض ملفات وعقود الموظفين', category: 'صفحات' },
        { id: 'view_docs', name: 'مطالعة مستندات وسياسات الشركة العامة', category: 'صفحات' },
        { id: 'view_deductions', name: 'إدارة التأمينات والخصومات والـ GOSI', category: 'صفحات' },
        { id: 'view_tasks', name: 'إدارة ومتابعة مهام فريق العمل', category: 'صفحات' },
        { id: 'view_assets', name: 'إدارة العهد ومستلزمات العمل العينية', category: 'صفحات' },
        { id: 'view_rbac', name: 'حوكمة الأمان وإعدادات المستخدمين والأدوار', category: 'صفحات' },
        { id: 'view_health', name: 'استعراض وتجديد التأمين الطبي (بوبا)', category: 'صفحات' },
        { id: 'view_reports', name: 'استخراج التقارير والإحصاءات المتقدمة', category: 'صفحات' },
        { id: 'create_employee', name: 'إضافة موظفين جدد للنظام', category: 'إجراءات' },
        { id: 'edit_employee', name: 'تعديل وتحديث بيانات الموظفين', category: 'إجراءات' },
        { id: 'delete_employee', name: 'حذف أو إنهاء خدمات الموظفين', category: 'إجراءات' },
        { id: 'create_leave', name: 'تقديم طلب إجازة جديد', category: 'إجراءات' },
        { id: 'decide_leave', name: 'اتخاذ قرار بالقبول/الرفض للإجازات', category: 'إجراءات' },
        { id: 'record_attendance', name: 'تسجيل وبصم حضور وانصراف الموظفين', category: 'إجراءات' },
        { id: 'delete_attendance', name: 'مسح أو تعديل قيود حضور وانصراف', category: 'إجراءات' },
        { id: 'approve_operations', name: 'الاعتماد المالي وإجازة النفقات والمصاريف', category: 'إجراءات' },
        { id: 'create_asset', name: 'إضافة عهد ومستلزمات عمل جديدة للسيستم', category: 'إجراءات' },
        { id: 'edit_asset', name: 'تحديث بيانات العهد المسجلة وأطرافها', category: 'إجراءات' },
        { id: 'return_asset', name: 'إرجاع أو تصفية العهد الممنوحة للموظفين', category: 'إجراءات' },
        { id: 'manage_asset_history', name: 'استعراض سجل حركات تداول العهد وأرشفتها', category: 'إجراءات' }
      ];
    default:
      return [];
  }
}

/**
 * --- GENERIC CRUD UTILITY FUNCTIONS ---
 */

export async function getCollectionData<T>(collName: string, companyId?: string): Promise<T[]> {
  const targetCompId = companyId || getActiveCompanyId();
  try {
    const targetRef = resolveCollectionRef(collName, targetCompId);
    const qSnapshot = await getDocs(targetRef);
    return qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `companies/${targetCompId}/${collName}`);
  }
}

export async function createDocument<T extends object>(
  collName: string,
  id: string,
  data: T,
  companyId?: string
): Promise<void> {
  const explicitCompId = (data as any)?.companyId;
  const targetCompId = companyId || explicitCompId || getActiveCompanyId();
  const path = collName === 'companies'
    ? `companies/${id}`
    : (collName === 'system_meta'
      ? `system_meta/${id}`
      : (collName === 'global_rbacUsers'
        ? `rbacUsers/${id}`
        : `companies/${targetCompId}/${collName}/${id}`));

  try {
    const docRef = resolveDocRef(collName, id, targetCompId);
    const cleanedData = cleanUndefined({
      ...data,
      id,
      ...(collName !== 'companies' && collName !== 'system_meta'
        ? { companyId: explicitCompId || targetCompId }
        : {})
    });
    await setDoc(docRef, cleanedData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createDocumentWithoutId<T extends object>(
  collName: string,
  data: T,
  companyId?: string
): Promise<string> {
  const explicitCompId = (data as any)?.companyId;
  const targetCompId = companyId || explicitCompId || getActiveCompanyId();
  const targetCollRef = resolveCollectionRef(collName, targetCompId);
  const randomId = doc(targetCollRef).id;
  const path = collName === 'companies'
    ? `companies/${randomId}`
    : (collName === 'system_meta'
      ? `system_meta/${randomId}`
      : (collName === 'global_rbacUsers'
        ? `rbacUsers/${randomId}`
        : `companies/${targetCompId}/${collName}/${randomId}`));

  try {
    const targetDocRef = resolveDocRef(collName, randomId, targetCompId);
    await setDoc(targetDocRef, cleanUndefined({
      ...data,
      id: randomId,
      ...(collName !== 'companies' && collName !== 'system_meta'
        ? { companyId: explicitCompId || targetCompId }
        : {})
    }));
    return randomId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDocument<T>(
  collName: string,
  id: string,
  data: Partial<T>,
  companyId?: string
): Promise<void> {
  const targetCompId = companyId || getActiveCompanyId();
  const path = collName === 'companies'
    ? `companies/${id}`
    : (collName === 'system_meta'
      ? `system_meta/${id}`
      : (collName === 'global_rbacUsers'
        ? `rbacUsers/${id}`
        : `companies/${targetCompId}/${collName}/${id}`));

  try {
    const docRef = resolveDocRef(collName, id, targetCompId);
    await updateDoc(docRef, cleanUndefined(data) as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDocument(
  collName: string,
  id: string,
  companyId?: string
): Promise<void> {
  const targetCompId = companyId || getActiveCompanyId();
  const path = collName === 'companies'
    ? `companies/${id}`
    : (collName === 'system_meta'
      ? `system_meta/${id}`
      : (collName === 'global_rbacUsers'
        ? `rbacUsers/${id}`
        : `companies/${targetCompId}/${collName}/${id}`));

  try {
    const docRef = resolveDocRef(collName, id, targetCompId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
