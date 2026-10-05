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

/**
 * Helper to securely seed an individual collection only if it is currently empty
 */
async function seedIfEmpty<T extends { id: string }>(collName: string, defaults: T[]): Promise<void> {
  const qSnapshot = await getDocs(collection(db, collName));
  if (qSnapshot.empty) {
    console.log(`Seeding metadata for ${collName} collection (${defaults.length} items)...`);
    for (const item of defaults) {
      await setDoc(doc(db, collName, item.id), cleanUndefined(item));
    }
  } else {
    console.log(`Collection ${collName} already populated with ${qSnapshot.size} documents.`);
  }
}

/**
 * Sync / Seed database helper. Independently checks and seeds all 19 collections
 * into the secure Firestore database.
 */
export async function seedDatabase(): Promise<boolean> {
  try {

    const initDocRef = doc(db, 'system_meta', 'seed_status_v3');
    const initSnap = await getDoc(initDocRef);
    if (initSnap.exists() && initSnap.data()?.seeded === true) {
      console.log('[OPT SEED] Database has already been initialized previously with assets. Skipping queries.');
      return true;
    }

    console.log('Reviewing system database nodes for schema/operational seeding...');

    await seedIfEmpty('employees', []);
    await seedIfEmpty('leaves', []);
    await seedIfEmpty('attendance', []);
    await seedIfEmpty('jobs', []);
    await seedIfEmpty('candidates', []);
    await seedIfEmpty('reviews', []);
    await seedIfEmpty('trainings', []);
    await seedIfEmpty('expenses', []);
    await seedIfEmpty('trips', []);
    await seedIfEmpty('health', []);
    await seedIfEmpty('contracts', []);
    await seedIfEmpty('professions', []);
    await seedIfEmpty('deductions', []);
    await seedIfEmpty('deductionTypes', []);
    await seedIfEmpty('docs', []);
    await seedIfEmpty('tasks', []);
    await seedIfEmpty('assets', []);
    await seedIfEmpty('assetHistory', []);

    // Set initialization status flag to bypass heavy check in the future
    await setDoc(initDocRef, { seeded: true, timestamp: new Date().toISOString() });

    console.log('Seeding checks completed successfully.');
    return true;
  } catch (error) {
    console.error('Error seeding database: ', error);
    return false;
  }
}

/**
 * --- GENERIC CRUD UTILITY FUNCTIONS ---
 */

const isLocal = () => typeof window !== 'undefined' && localStorage.getItem('sahaba_session_type') === 'local';

function getLocalDefaultsForCollection(collName: string): any[] {
  switch (collName) {
    case 'employees':
      return [
        {
          id: 'emp_1',
          name: 'عبدالله محمد الشمري',
          role: 'مطور برمجيات أول',
          dept: 'تقنية المعلومات',
          status: 'نشط',
          hire: '2024-01-15',
          salary: 12000,
          leaveBalance: 30,
          mobile: '0501234567',
          email: 'abdullah@sahaba.local'
        },
        {
          id: 'emp_2',
          name: 'سارة أحمد الحربي',
          role: 'أخصائي موارد بشرية',
          dept: 'الموارد البشرية',
          status: 'نشط',
          hire: '2023-06-10',
          salary: 9500,
          leaveBalance: 22,
          mobile: '0512345678',
          email: 'sara@sahaba.local'
        }
      ];
    case 'leaves':
      return [
        {
          id: 'leave_1',
          empId: 'emp_1',
          type: 'سنوية',
          days: 5,
          from: '2026-08-01',
          to: '2026-08-05',
          status: 'موافق عليها',
          reason: 'إجازة عائلية سنوية'
        },
        {
          id: 'leave_2',
          empId: 'emp_2',
          type: 'مرضية',
          days: 2,
          from: '2026-05-12',
          to: '2026-05-13',
          status: 'بانتظار الموافقة',
          reason: 'وعكة صحية طارئة'
        }
      ];
    case 'attendance':
      const todayStr = new Date().toISOString().slice(0, 10);
      return [
        {
          id: 'att_1',
          empId: 'emp_1',
          date: todayStr,
          checkIn: '08:00',
          checkOut: '17:00',
          status: 'حاضر',
          notes: 'حضور مبكر من المكتب الرئيس'
        },
        {
          id: 'att_2',
          empId: 'emp_2',
          date: todayStr,
          checkIn: '08:15',
          checkOut: '16:45',
          status: 'حاضر',
          notes: '—'
        }
      ];
    case 'contracts':
      return [
        {
          id: 'cont_emp_1',
          empId: 'emp_1',
          type: 'دوام كامل',
          start: '2024-01-15',
          end: '2027-01-14',
          renewed: 'لا',
          nextRenew: '2027-01-14',
          iqamaExp: '1448-05-15',
          workPermitExp: '1448-05-15',
          status: 'نشط',
          file: 'عقد_عبدالله.pdf'
        },
        {
          id: 'cont_emp_2',
          empId: 'emp_2',
          type: 'دوام كامل',
          start: '2023-06-10',
          end: '2026-06-09',
          renewed: 'نعم',
          nextRenew: '2027-06-09',
          iqamaExp: '1448-01-10',
          workPermitExp: '1448-01-10',
          status: 'نشط',
          file: 'عقد_سارة.pdf'
        }
      ];
    case 'professions':
      return [
        {
          id: 'prof_emp_1',
          empId: 'emp_1',
          specialty: 'هندسة البرمجيات والتطوير',
          cert: 'بكالوريوس',
          uni: 'جامعة الملك سعود',
          grad: '2023',
          licenseNo: 'ENG-98765',
          skills: 'React, Node.js, Firebase, Cloud Security, TypeScript'
        },
        {
          id: 'prof_emp_2',
          empId: 'emp_2',
          specialty: 'إدارة الموارد البشرية والكوادر',
          cert: 'بكالوريوس',
          uni: 'جامعة الملك عبدالعزيز',
          grad: '2022',
          licenseNo: 'HR-54321',
          skills: 'Personnel Management, Talent Acquisition, Labor Law, GOSI Portal'
        }
      ];
    case 'deductions':
      return [
        {
          id: 'ded_emp_1',
          empId: 'emp_1',
          gosiPct: 9.75,
          medPct: 1.5,
          taxPct: 0,
          otherPct: 0,
          otherNote: ''
        },
        {
          id: 'ded_emp_2',
          empId: 'emp_2',
          gosiPct: 9.75,
          medPct: 1.5,
          taxPct: 0,
          otherPct: 0,
          otherNote: ''
        }
      ];
    case 'deductionTypes':
      return [
        {
          id: 'dtype_1',
          name: 'تأمين المؤسسة العامة للتأمينات الاجتماعية (GOSI)',
          code: 'GOSI',
          percentage: 9.75,
          status: 'نشط'
        }
      ];
    case 'jobs':
      return [
        {
          id: 'job_1',
          title: 'محلل بيانات أول',
          dept: 'تقنية المعلومات',
          type: 'دوام كامل',
          salary: '11,000 - 14,000',
          status: 'مفتوح',
          description: 'مطلوب محلل بيانات ذو خبرة لا تقل عن سنتين في لغات Python, SQL وبناء لوحات التحكم التفاعلية لخدمة صناع القرار.'
        }
      ];
    case 'candidates':
      return [
        {
          id: 'cand_1',
          jobId: 'job_1',
          name: 'خالد فهد السبيعي',
          email: 'khaled@example.local',
          mobile: '0555555555',
          status: 'المقابلة الشخصية',
          score: 85,
          notes: 'مهارات تواصل رائعة وخبرة عملية جيدة جداً في Power BI.'
        }
      ];
    case 'reviews':
      return [
        {
          id: 'rev_1',
          empId: 'emp_1',
          reviewer: 'سارة أحمد الحربي',
          period: 'الربع الأول 2026',
          score: 4.8,
          notes: 'أداء استثنائي وإنجاز لكافة المهام التقنية المسندة قبل موعدها المحدد.',
          date: '2026-03-31'
        }
      ];
    case 'trainings':
      return [
        {
          id: 'train_1',
          title: 'الأمن السيبراني وحماية البيانات الحساسة',
          provider: 'الأكاديمية الوطنية لتقنية المعلومات',
          duration: '15 ساعة',
          start: '2026-06-01',
          end: '2026-06-05',
          status: 'قادم',
          cost: 1500
        }
      ];
    case 'expenses':
      return [
        {
          id: 'exp_1',
          empId: 'emp_1',
          amount: 450,
          category: 'مشتريات مكتبية',
          notes: 'شراء ملحقات تقنية لوحة مفاتيح وفأرة لاسلكية',
          date: '2026-05-10',
          status: 'بانتظار الموافقة'
        }
      ];
    case 'trips':
      return [
        {
          id: 'trip_1',
          empId: 'emp_1',
          destination: 'جدة - فرع الشركة الغربي',
          start: '2026-05-15',
          end: '2026-05-18',
          reason: 'تقديم الدعم الفني وتحديث شبكة الاتصالات والربط السحابي بالفرع',
          allowance: 1200,
          status: 'موافق عليها'
        }
      ];
    case 'health':
      return [
        {
          id: 'health_1',
          empId: 'emp_1',
          provider: 'بوبا العربية',
          class: 'A',
          cardNo: 'BU-98765432',
          start: '2026-01-01',
          end: '2026-12-31',
          premium: 6800,
          dependents: 0,
          status: 'نشط'
        }
      ];
    case 'docs':
      return [
        {
          id: 'doc_1',
          title: 'لائحة العمل والعمال والسياسات الداخلية',
          category: 'السياسات العامة',
          addedBy: 'سارة أحمد الحربي',
          date: '2025-12-01',
          size: '2.4 MB',
          file: 'لائحة_سحابة_الأعمال.pdf'
        }
      ];
    case 'tasks':
      return [
        {
          id: 'task_1',
          title: 'تحديث وثائق الحماية والتشفير بقاعدة البيانات',
          assignee: 'emp_1',
          dept: 'تقنية المعلومات',
          priority: 'high',
          status: 'todo',
          due: '2026-07-20',
          progress: 0,
          tags: ['الأمان_السيبراني', 'قواعد_البيانات'],
          desc: 'تنفيذ وتطبيق معايير الأمن والمجلد السحابي الآمن.'
        }
      ];
    case 'assets':
      return [
        {
          id: 'asset_1',
          empId: 'emp_1',
          name: 'جهاز حاسب محمول MacBook Pro 16',
          serial: 'C02F8XYZQ05D',
          category: 'أجهزة إلكترونية',
          assignedDate: '2024-01-15',
          status: 'Assigned',
          assignedBy: 'مدير النظام',
          notes: 'بحالة ممتازة وبكامل ملحقاته الشاحن والعلبة الأصلية'
        }
      ];
    case 'assetHistory':
      return [
        {
          id: 'hist_1',
          assetId: 'asset_1',
          empId: 'emp_1',
          empName: 'عبدالله محمد الشمري',
          action: 'assign',
          newStatus: 'Assigned',
          changedBy: 'مدير النظام',
          timestamp: '2024-01-15T09:00:00Z',
          notes: 'تم تسليم العهدة رسمياً وتوقيع نموذج الاستلام'
        }
      ];
    case 'rbacUsers':
      return [
        {
          id: 'user_admin',
          fullName: 'محمود فهمي (المدير العام)',
          username: 'mahmoudfahmyaly695@gmail.com',
          empCode: 'EMP-0001',
          roleId: 'role_admin',
          status: 'active'
        }
      ];
    case 'rbacRoles':
      return [
        {
          id: 'role_admin',
          name: 'مدير النظام (Admin)',
          description: 'يمتلك كامل الصلاحيات الإدارية والفنية لتشغيل النظام وإدارة الحماية والربط السحابي.',
          permissionIds: [
            'view_dashboard', 'view_ess', 'view_employees', 'view_attendance', 'view_leaves',
            'view_payroll', 'view_compliance', 'view_recruit', 'view_perf', 'view_training',
            'view_expenses', 'view_trips', 'view_empfiles', 'view_docs', 'view_deductions',
            'view_tasks', 'view_assets', 'view_rbac', 'view_health', 'view_reports',
            'create_employee', 'edit_employee', 'delete_employee', 'create_leave', 'decide_leave',
            'record_attendance', 'delete_attendance', 'approve_operations', 'create_asset',
            'edit_asset', 'return_asset', 'manage_asset_history'
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

export async function getCollectionData<T>(collName: string): Promise<T[]> {
  if (isLocal()) {
    const key = `sahaba_db_${collName}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      const defaults = getLocalDefaultsForCollection(collName);
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults as unknown as T[];
    }
    return JSON.parse(raw) as T[];
  }
  try {
    const qSnapshot = await getDocs(collection(db, collName));
    return qSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collName);
  }
}

export async function createDocument<T extends { id?: string }>(collName: string, id: string, data: T): Promise<void> {
  const path = `${collName}/${id}`;
  if (isLocal()) {
    const key = `sahaba_db_${collName}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const index = list.findIndex((x: any) => x.id === id);
    const cleaned = cleanUndefined({ ...data, id });
    if (index >= 0) {
      list[index] = cleaned;
    } else {
      list.push(cleaned);
    }
    localStorage.setItem(key, JSON.stringify(list));
    return;
  }
  try {
    await setDoc(doc(db, collName, id), cleanUndefined({ ...data, id }));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createDocumentWithoutId<T>(collName: string, data: T): Promise<string> {
  if (isLocal()) {
    const randomId = 'local_' + Math.floor(Math.random() * 1000000000);
    const key = `sahaba_db_${collName}`;
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    const cleaned = cleanUndefined({ ...data, id: randomId });
    list.push(cleaned);
    localStorage.setItem(key, JSON.stringify(list));
    return randomId;
  }
  const randomId = doc(collection(db, collName)).id;
  const path = `${collName}/${randomId}`;
  try {
    await setDoc(doc(db, collName, randomId), cleanUndefined({ ...data, id: randomId }));
    return randomId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateDocument<T>(collName: string, id: string, data: Partial<T>): Promise<void> {
  const path = `${collName}/${id}`;
  if (isLocal()) {
    const key = `sahaba_db_${collName}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      const index = list.findIndex((x: any) => x.id === id);
      if (index >= 0) {
        list[index] = cleanUndefined({ ...list[index], ...data });
        localStorage.setItem(key, JSON.stringify(list));
      }
    }
    return;
  }
  try {
    await updateDoc(doc(db, collName, id), cleanUndefined(data) as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDocument(collName: string, id: string): Promise<void> {
  const path = `${collName}/${id}`;
  if (isLocal()) {
    const key = `sahaba_db_${collName}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw);
      const filtered = list.filter((x: any) => x.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    return;
  }
  try {
    await deleteDoc(doc(db, collName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}