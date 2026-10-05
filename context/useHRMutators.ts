/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Employee,
  Leave,
  Attendance,
  RecruitmentJob,
  Candidate,
  PerformanceReview,
  TrainingCourse,
  Expense,
  Trip,
  HealthInsurance,
  EmployeeContract,
  EmployeeProfession,
  EmployeeDeduction,
  CompanyDoc,
  Task,
  DeductionType,
  RBACUser,
  EmployeeAsset,
  AssetHistory
} from '../types';
import {
  createDocument,
  createDocumentWithoutId,
  updateDocument as dbUpdateDoc,
  deleteDocument as dbDeleteDoc,
  cleanUndefined,
  resolveCollectionRef,
  resolveDocRef,
  getActiveCompanyId
} from '../services/db';
import { db } from '../firebase';
import { doc, writeBatch } from 'firebase/firestore';

interface UseHRMutatorsArgs {
  hasPermission: (permId: string) => boolean;
  currentUser: RBACUser | null;
  loadAllData: () => Promise<void>;
  employees: Employee[];
  leaves: Leave[];
  attendance: Attendance[];
  assets: EmployeeAsset[];
}

/**
 * Owns every create/update/delete operation for business entities. Reads
 * are supplied by the caller (from the entity-data hook) purely for
 * in-memory lookups (e.g. finding a leave's prior status before updating).
 * All permission checks route through the injected `hasPermission`.
 */
export function useHRMutators({
  hasPermission,
  currentUser,
  loadAllData,
  employees,
  leaves,
  attendance,
  assets
}: UseHRMutatorsArgs) {
  // 1. Employees
  const addEmployee = async (emp: Omit<Employee, 'id'>) => {
    if (!hasPermission('create_employee')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لإضافة موظف بالسيستم.');
    }
    const newId = doc(resolveCollectionRef('employees')).id;
    const newEmp: Employee = { ...emp, id: newId };
    await createDocument('employees', newId, newEmp);

    // Seed default blank contract and deduction configuration for new employee
    const newContract: EmployeeContract = {
      id: 'cont_' + newId,
      empId: newId,
      type: emp.contractType || 'دوام كامل',
      start: emp.hire,
      end: '',
      renewed: '-',
      nextRenew: '',
      iqamaExp: '',
      workPermitExp: '',
      status: 'نشط',
      file: `عقد_${emp.name.replace(/\s+/g, '_')}.pdf`
    };
    await createDocument('contracts', newContract.id, newContract);

    const newProfession: EmployeeProfession = {
      id: 'prof_' + newId,
      empId: newId,
      specialty: 'غير محدد',
      cert: 'غير محدد',
      uni: '—',
      grad: '—',
      licenseNo: '—',
      skills: '—'
    };
    await createDocument('professions', newProfession.id, newProfession);

    const newDeduct: EmployeeDeduction = {
      id: 'ded_' + newId,
      empId: newId,
      gosiPct: 9.75,
      medPct: 1.5,
      taxPct: 0,
      otherPct: 0,
      otherNote: ''
    };
    await createDocument('deductions', newDeduct.id, newDeduct);

    await loadAllData();
  };

  const updateEmployee = async (id: string, emp: Partial<Employee>) => {
    if (!hasPermission('edit_employee')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.');
    }
    await dbUpdateDoc('employees', id, emp);
    await loadAllData();
  };

  const deleteEmployee = async (id: string) => {
    if (!hasPermission('delete_employee')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لحذف موظف من السيستم.');
    }
    await dbDeleteDoc('employees', id);
    // Delete associated items
    await dbDeleteDoc('contracts', 'cont_' + id);
    await dbDeleteDoc('professions', 'prof_' + id);
    await dbDeleteDoc('deductions', 'ded_' + id);
    await loadAllData();
  };

  // 2. Leaves
  const addLeave = async (l: Omit<Leave, 'id'>) => {
    if (!hasPermission('create_leave')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لإنشاء طلب إجازة.');
    }
    await createDocumentWithoutId('leaves', l);
    await loadAllData();
  };

  const updateLeaveStatus = async (id: string, status: Leave['status']) => {
    if (!hasPermission('decide_leave')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية البت في طلبات الإجازات.');
    }
    // Grab the OLD leave record BEFORE updating, so we know the prior status
    const leaveDoc = leaves.find(x => x.id === id);
    await dbUpdateDoc('leaves', id, { status });

    if (leaveDoc) {
      const emp = employees.find(e => e.id === leaveDoc.empId);
      const wasApproved = leaveDoc.status === 'موافق عليها';
      const isApproved = status === 'موافق عليها';

      if (emp && leaveDoc.type === 'سنوية') {
        if (isApproved && !wasApproved) {
          const newBal = Math.max(0, (emp.leaveBalance || 0) - leaveDoc.days);
          await dbUpdateDoc('employees', leaveDoc.empId, { leaveBalance: newBal });
        } else if (wasApproved && !isApproved) {
          const newBal = (emp.leaveBalance || 0) + leaveDoc.days;
          await dbUpdateDoc('employees', leaveDoc.empId, { leaveBalance: newBal });
        }
      }

      if (isApproved) {
        const today = new Date().toISOString().slice(0, 10);
        if (today >= leaveDoc.from && today <= leaveDoc.to) {
          await dbUpdateDoc('employees', leaveDoc.empId, { status: 'إجازة' });
        }
      }
    }
    await loadAllData();
  };

  const deleteLeave = async (id: string) => {
    const leaveDoc = leaves.find(x => x.id === id);
    if (leaveDoc && leaveDoc.status === 'موافق عليها' && leaveDoc.type === 'سنوية') {
      const emp = employees.find(e => e.id === leaveDoc.empId);
      if (emp) {
        const newBal = (emp.leaveBalance || 0) + leaveDoc.days;
        await dbUpdateDoc('employees', leaveDoc.empId, { leaveBalance: newBal });
      }
    }
    await dbDeleteDoc('leaves', id);
    await loadAllData();
  };

  const updateLeave = async (id: string, partialLeave: Partial<Leave>) => {
    await dbUpdateDoc('leaves', id, partialLeave);
    await loadAllData();
  };

  // 3. Attendance
  const recordAttendance = async (attendanceRecord: Omit<Attendance, 'id'>) => {
    if (!hasPermission('record_attendance')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لتسجيل حضور بالسيستم.');
    }
    const existing = attendance.find(
      a => a.empId === attendanceRecord.empId && a.date === attendanceRecord.date
    );
    if (existing) {
      await dbUpdateDoc('attendance', existing.id, attendanceRecord);
    } else {
      await createDocumentWithoutId('attendance', attendanceRecord);
    }
    await loadAllData();
  };

  const recordBulkAttendance = async (records: Omit<Attendance, 'id'>[]) => {
    if (!hasPermission('record_attendance')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لتسجيل حضور بالسيستم.');
    }
    const targetCompId = getActiveCompanyId();
    const batch = writeBatch(db);
    for (const rec of records) {
      const existing = attendance.find(
        a => a.empId === rec.empId && a.date === rec.date
      );
      if (existing) {
        const docRef = resolveDocRef('attendance', existing.id, targetCompId);
        batch.update(docRef, cleanUndefined({ ...rec, companyId: targetCompId }) as any);
      } else {
        const randomId = doc(resolveCollectionRef('attendance', targetCompId)).id;
        const docRef = resolveDocRef('attendance', randomId, targetCompId);
        batch.set(docRef, cleanUndefined({ ...rec, id: randomId, companyId: targetCompId }));
      }
    }
    await batch.commit();
    await loadAllData();
  };

  const deleteAttendance = async (id: string) => {
    if (!hasPermission('delete_attendance')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لحذف حضور بالسيستم.');
    }
    await dbDeleteDoc('attendance', id);
    await loadAllData();
  };

  // 4. Recruitment Jobs
  const addJob = async (job: Omit<RecruitmentJob, 'id'>) => {
    await createDocumentWithoutId('jobs', job);
    await loadAllData();
  };

  const updateJob = async (id: string, job: Partial<RecruitmentJob>) => {
    await dbUpdateDoc('jobs', id, job);
    await loadAllData();
  };

  const deleteJob = async (id: string) => {
    await dbDeleteDoc('jobs', id);
    await loadAllData();
  };

  // 5. Candidates
  const addCandidate = async (candidate: Omit<Candidate, 'id'>) => {
    await createDocumentWithoutId('candidates', candidate);
    await loadAllData();
  };

  const updateCandidate = async (id: string, candidate: Partial<Candidate>) => {
    await dbUpdateDoc('candidates', id, candidate);
    await loadAllData();
  };

  const deleteCandidate = async (id: string) => {
    await dbDeleteDoc('candidates', id);
    await loadAllData();
  };

  // 6. Quarterly Reviews
  const addReview = async (review: Omit<PerformanceReview, 'id'>) => {
    await createDocumentWithoutId('reviews', review);
    await loadAllData();
  };

  const updateReview = async (id: string, review: Partial<PerformanceReview>) => {
    await dbUpdateDoc('reviews', id, review);
    await loadAllData();
  };

  const deleteReview = async (id: string) => {
    await dbDeleteDoc('reviews', id);
    await loadAllData();
  };

  // 7. Training Courses
  const addTraining = async (course: Omit<TrainingCourse, 'id'>) => {
    await createDocumentWithoutId('trainings', course);
    await loadAllData();
  };

  const updateTraining = async (id: string, course: Partial<TrainingCourse>) => {
    await dbUpdateDoc('trainings', id, course);
    await loadAllData();
  };

  const deleteTraining = async (id: string) => {
    await dbDeleteDoc('trainings', id);
    await loadAllData();
  };

  // 8. Reimbursable Expenses
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    await createDocumentWithoutId('expenses', expense);
    await loadAllData();
  };

  const updateExpenseStatus = async (id: string, status: Expense['status']) => {
    await dbUpdateDoc('expenses', id, { status });
    await loadAllData();
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    await dbUpdateDoc('expenses', id, expense);
    await loadAllData();
  };

  const deleteExpense = async (id: string) => {
    await dbDeleteDoc('expenses', id);
    await loadAllData();
  };

  // 9. Work Trips
  const addTrip = async (trip: Omit<Trip, 'id'>) => {
    await createDocumentWithoutId('trips', trip);
    await loadAllData();
  };

  const updateTripStatus = async (id: string, status: Trip['status']) => {
    await dbUpdateDoc('trips', id, { status });
    await loadAllData();
  };

  const updateTrip = async (id: string, trip: Partial<Trip>) => {
    await dbUpdateDoc('trips', id, trip);
    await loadAllData();
  };

  const deleteTrip = async (id: string) => {
    await dbDeleteDoc('trips', id);
    await loadAllData();
  };

  // 10. Health Insurance Cards
  const addHealth = async (h: Omit<HealthInsurance, 'id'>) => {
    await createDocumentWithoutId('health', h);
    await loadAllData();
  };

  const updateHealth = async (id: string, h: Partial<HealthInsurance>) => {
    await dbUpdateDoc('health', id, h);
    await loadAllData();
  };

  const deleteHealth = async (id: string) => {
    await dbDeleteDoc('health', id);
    await loadAllData();
  };

  // 11. Profile Subcomponents (Contract, Profession, Deductions)
  const updateContract = async (empId: string, contract: Partial<EmployeeContract>) => {
    const cId = 'cont_' + empId;
    await dbUpdateDoc('contracts', cId, contract);
    await loadAllData();
  };

  const updateProfession = async (empId: string, profession: Partial<EmployeeProfession>) => {
    const pId = 'prof_' + empId;
    await dbUpdateDoc('professions', pId, profession);
    await loadAllData();
  };

  const updateEmployeeDeductions = async (empId: string, deductionsData: Partial<EmployeeDeduction>, fixedDeduct?: number) => {
    const dId = 'ded_' + empId;
    await dbUpdateDoc('deductions', dId, deductionsData);
    if (fixedDeduct !== undefined) {
      await dbUpdateDoc('employees', empId, { deduct: fixedDeduct });
    }
    await loadAllData();
  };

  // 12. Workspace Shared Documents
  const addDoc = async (docObj: Omit<CompanyDoc, 'id'>) => {
    await createDocumentWithoutId('docs', docObj);
    await loadAllData();
  };

  const deleteDoc = async (id: string) => {
    await dbDeleteDoc('docs', id);
    await loadAllData();
  };

  // 13. Kanban Collaborative Tasks
  const addTask = async (task: Omit<Task, 'id'>) => {
    await createDocumentWithoutId('tasks', task);
    await loadAllData();
  };

  const updateTask = async (id: string, task: Partial<Task>) => {
    await dbUpdateDoc('tasks', id, task);
    await loadAllData();
  };

  const deleteTask = async (id: string) => {
    await dbDeleteDoc('tasks', id);
    await loadAllData();
  };

  // 14. Global Deduction Settings
  const addDeductionType = async (type: Omit<DeductionType, 'id'>) => {
    await createDocumentWithoutId('deductionTypes', type);
    await loadAllData();
  };

  const updateDeductionType = async (id: string, type: Partial<DeductionType>) => {
    await dbUpdateDoc('deductionTypes', id, type);
    await loadAllData();
  };

  const deleteDeductionType = async (id: string) => {
    await dbDeleteDoc('deductionTypes', id);
    await loadAllData();
  };

  // --- Assets & Custody Mutators ---
  const addAsset = async (asset: Omit<EmployeeAsset, 'id'>) => {
    if (!hasPermission('create_asset')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لإضافة أصل/عهدة جديدة بالسيستم.');
    }
    const newId = doc(resolveCollectionRef('assets')).id;
    const newAsset: EmployeeAsset = { ...asset, id: newId };
    await createDocument('assets', newId, newAsset);

    // Create asset history entry
    const matchingEmp = employees.find(e => e.id === asset.empId);
    const empName = matchingEmp ? matchingEmp.name : 'موظف غير معروف';
    const historyEntry: AssetHistory = {
      id: doc(resolveCollectionRef('assetHistory')).id,
      assetId: newId,
      empId: asset.empId,
      empName,
      action: 'assign',
      oldStatus: undefined,
      newStatus: asset.status,
      changedBy: currentUser?.fullName || asset.assignedBy || 'الشرّاح',
      timestamp: new Date().toISOString(),
      notes: asset.notes || 'تم تسجيل العهدة وتسليمها للموظف'
    };
    await createDocument('assetHistory', historyEntry.id, historyEntry);

    await loadAllData();
  };

  const updateAsset = async (id: string, partialAsset: Partial<EmployeeAsset>) => {
    if (!hasPermission('edit_asset')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات مواصفات الأصل.');
    }
    const prevAsset = assets.find(a => a.id === id);
    await dbUpdateDoc('assets', id, partialAsset);

    // If status changed, let's also write a history log automatically!
    if (partialAsset.status && prevAsset && prevAsset.status !== partialAsset.status) {
      const historyEntry: AssetHistory = {
        id: doc(resolveCollectionRef('assetHistory')).id,
        assetId: id,
        empId: partialAsset.empId || prevAsset.empId,
        empName: employees.find(e => e.id === (partialAsset.empId || prevAsset.empId))?.name || 'موظف',
        action: 'status_change',
        oldStatus: prevAsset.status,
        newStatus: partialAsset.status,
        changedBy: currentUser?.fullName || partialAsset.assignedBy || 'النظام',
        timestamp: new Date().toISOString(),
        notes: partialAsset.notes || 'تم تحديث بيانات مواصفات وحالة العهدة'
      };
      await createDocument('assetHistory', historyEntry.id, historyEntry);
    }

    await loadAllData();
  };

  const updateAssetStatus = async (
    id: string,
    status: EmployeeAsset['status'],
    notes?: string,
    actionBy?: string
  ) => {
    // Check permission - either return or edit_asset is needed
    const isReturn = status === 'Returned';
    const permRequired = isReturn ? 'return_asset' : 'edit_asset';
    if (!hasPermission(permRequired)) {
      throw new Error(`HTTP 403 Forbidden: لا تمتلك الصلاحية الأمنية لإتمام هذه العملية (${permRequired}).`);
    }

    const prevAsset = assets.find(a => a.id === id);
    if (!prevAsset) throw new Error('العهدة غير موجودة بالنظام.');

    const timestamp = new Date().toISOString();
    const updaterName = actionBy || currentUser?.fullName || 'مسؤول النظام';

    const updates: Partial<EmployeeAsset> = { status };
    if (isReturn) {
      updates.returnDate = timestamp.slice(0, 10); // YYYY-MM-DD
      updates.returnedTo = updaterName;
    }
    if (notes) {
      updates.notes = notes;
    }

    await dbUpdateDoc('assets', id, updates);

    // Write a history record automatically
    const historyEntry: AssetHistory = {
      id: doc(resolveCollectionRef('assetHistory')).id,
      assetId: id,
      empId: prevAsset.empId,
      empName: employees.find(e => e.id === prevAsset.empId)?.name || 'موظف',
      action: isReturn ? 'return' : 'status_change',
      oldStatus: prevAsset.status,
      newStatus: status,
      changedBy: updaterName,
      timestamp,
      notes: notes || (isReturn ? 'تم استرجاع وإغلاق العهدة وتحقق الاستلام' : `تم تعديل حالة العهدة إلى ${status}`)
    };
    await createDocument('assetHistory', historyEntry.id, historyEntry);

    await loadAllData();
  };

  const deleteAsset = async (id: string) => {
    if (!hasPermission('edit_asset')) {
      throw new Error('HTTP 403 Forbidden: عذراً، لا تمتلك الصلاحية الأمنية لحذف سجل عهدة.');
    }
    await dbDeleteDoc('assets', id);
    await loadAllData();
  };

  const addAssetHistoryEntry = async (hist: Omit<AssetHistory, 'id' | 'timestamp'>) => {
    if (!hasPermission('manage_asset_history')) {
      throw new Error('HTTP 403 Forbidden: لا تمتلك صلاحية إدارة وتحديث سجل تتبع الأصول.');
    }
    const newId = doc(resolveCollectionRef('assetHistory')).id;
    const timestamp = new Date().toISOString();
    const entry: AssetHistory = { ...hist, id: newId, timestamp };
    await createDocument('assetHistory', newId, entry);
    await loadAllData();
  };

  return {
    addEmployee,
    updateEmployee,
    deleteEmployee,

    addLeave,
    updateLeaveStatus,
    updateLeave,
    deleteLeave,

    recordAttendance,
    recordBulkAttendance,
    deleteAttendance,

    addJob,
    updateJob,
    deleteJob,

    addCandidate,
    updateCandidate,
    deleteCandidate,

    addReview,
    updateReview,
    deleteReview,

    addTraining,
    updateTraining,
    deleteTraining,

    addExpense,
    updateExpenseStatus,
    updateExpense,
    deleteExpense,

    addTrip,
    updateTripStatus,
    updateTrip,
    deleteTrip,

    addHealth,
    updateHealth,
    deleteHealth,

    updateContract,
    updateProfession,
    updateEmployeeDeductions,

    addDoc,
    deleteDoc,

    addTask,
    updateTask,
    deleteTask,

    addDeductionType,
    updateDeductionType,
    deleteDeductionType,

    addAsset,
    updateAsset,
    updateAssetStatus,
    deleteAsset,
    addAssetHistoryEntry
  };
}
