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
  RBACRole,
  RBACPermission,
  EmployeeAsset,
  AssetHistory,
  Company,
  InAppNotification
} from '../types';

/** Lifecycle status of the one-time database seeding operation. */
export type SeedStatus = 'idle' | 'seeding' | 'done';

/**
 * Public contract exposed by the HR context to the rest of the app.
 * Kept identical to the original HRContext interface so no consuming
 * component needs to change.
 */
export interface HRContextProps {
  loading: boolean;
  loadError: string | null;
  firebaseAuthReady: boolean;
  currentView: string;
  setCurrentView: (view: string) => void;
  employees: Employee[];
  leaves: Leave[];
  attendance: Attendance[];
  jobs: RecruitmentJob[];
  candidates: Candidate[];
  reviews: PerformanceReview[];
  trainings: TrainingCourse[];
  expenses: Expense[];
  trips: Trip[];
  health: HealthInsurance[];
  contracts: EmployeeContract[];
  professions: EmployeeProfession[];
  deductions: EmployeeDeduction[];
  docs: CompanyDoc[];
  tasks: Task[];
  deductionTypes: DeductionType[];

  // Selected fields for profile routing
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  employeeFileTab: string;
  setEmployeeFileTab: (tab: string) => void;

  // Selected task & Notifications (Phase 1)
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  notifications: InAppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Mutators
  addEmployee: (emp: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, emp: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  addLeave: (l: Omit<Leave, 'id'>) => Promise<void>;
  updateLeaveStatus: (id: string, status: Leave['status']) => Promise<void>;
  updateLeave: (id: string, leave: Partial<Leave>) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;

  recordAttendance: (attendanceRecord: Omit<Attendance, 'id'>) => Promise<void>;
  recordBulkAttendance: (records: Omit<Attendance, 'id'>[]) => Promise<void>;
  deleteAttendance: (id: string) => Promise<void>;

  addJob: (job: Omit<RecruitmentJob, 'id'>) => Promise<void>;
  updateJob: (id: string, job: Partial<RecruitmentJob>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;

  addCandidate: (candidate: Omit<Candidate, 'id'>) => Promise<void>;
  updateCandidate: (id: string, candidate: Partial<Candidate>) => Promise<void>;
  deleteCandidate: (id: string) => Promise<void>;

  addReview: (review: Omit<PerformanceReview, 'id'>) => Promise<void>;
  updateReview: (id: string, review: Partial<PerformanceReview>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;

  addTraining: (course: Omit<TrainingCourse, 'id'>) => Promise<void>;
  updateTraining: (id: string, course: Partial<TrainingCourse>) => Promise<void>;
  deleteTraining: (id: string) => Promise<void>;

  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpenseStatus: (id: string, status: Expense['status']) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addTrip: (trip: Omit<Trip, 'id'>) => Promise<void>;
  updateTripStatus: (id: string, status: Trip['status']) => Promise<void>;
  updateTrip: (id: string, trip: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;

  addHealth: (h: Omit<HealthInsurance, 'id'>) => Promise<void>;
  updateHealth: (id: string, h: Partial<HealthInsurance>) => Promise<void>;
  deleteHealth: (id: string) => Promise<void>;

  updateContract: (empId: string, contract: Partial<EmployeeContract>) => Promise<void>;
  updateProfession: (empId: string, profession: Partial<EmployeeProfession>) => Promise<void>;
  updateEmployeeDeductions: (empId: string, deductions: Partial<EmployeeDeduction>, fixedDeduct?: number) => Promise<void>;

  addDoc: (doc: Omit<CompanyDoc, 'id'>) => Promise<void>;
  deleteDoc: (id: string) => Promise<void>;

  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  addDeductionType: (type: Omit<DeductionType, 'id'>) => Promise<void>;
  updateDeductionType: (id: string, type: Partial<DeductionType>) => Promise<void>;
  deleteDeductionType: (id: string) => Promise<void>;

  // Assets & Custody State & Mutators
  assets: EmployeeAsset[];
  assetHistory: AssetHistory[];
  addAsset: (asset: Omit<EmployeeAsset, 'id'>) => Promise<void>;
  updateAsset: (id: string, asset: Partial<EmployeeAsset>) => Promise<void>;
  updateAssetStatus: (id: string, status: EmployeeAsset['status'], notes?: string, actionBy?: string) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addAssetHistoryEntry: (history: Omit<AssetHistory, 'id' | 'timestamp'>) => Promise<void>;

  seedStatus: SeedStatus;
  triggerSeeding: () => Promise<void>;

  // Dynamic RBAC variables and actions
  rbacUsers: RBACUser[];
  rbacRoles: RBACRole[];
  rbacPermissions: RBACPermission[];
  currentUser: RBACUser | null;
  currentRole: RBACRole | null;
  setCurrentUserById: (userId: string) => void;
  hasPermission: (permId: string) => boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;

  // RBAC User actions
  addRBACUser: (user: Omit<RBACUser, 'id'>) => Promise<void>;
  updateRBACUser: (id: string, user: Partial<RBACUser>) => Promise<void>;
  deleteRBACUser: (id: string) => Promise<void>;

  // RBAC Role actions
  addRBACRole: (role: Omit<RBACRole, 'id'>) => Promise<void>;
  updateRBACRole: (id: string, role: Partial<RBACRole>) => Promise<void>;
  deleteRBACRole: (id: string) => Promise<void>;

  // Company & Multi-tenant actions
  currentCompany: Company | null;
  currentCompanyId: string;
  allCompanies: Company[];
  registerCompany: (data: {
    companyName: string;
    crNumber?: string;
    adminName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => Promise<boolean>;
  switchCompany: (companyId: string) => Promise<void>;
  approveCompany: (companyId: string) => Promise<void>;
  rejectCompany: (companyId: string, reason?: string) => Promise<void>;
  suspendCompany: (companyId: string) => Promise<void>;
  reactivateCompany: (companyId: string) => Promise<void>;
  refreshCompanies: () => Promise<void>;

  loadViewData: (viewName: string, forceRefresh?: boolean) => Promise<void>;
}
