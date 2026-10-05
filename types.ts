/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  name: string;
  job: string;
  dept: string;
  salary: number;
  allow: number;
  deduct: number;
  status: "نشط" | "إجازة" | "موقوف";
  hire: string;
  leaveBalance: number;
  perf: number;
  currency?: string; // ISO 4217 code of the salary package, e.g. "SAR" | "EGP"
  workType?: string; // e.g. "من مقر الشركة" | "عن بعد" | "هجين"
  contractType?: string; // e.g. "دوام كامل" | "دوام جزئي" | "بالمهمة"
  nationality?: string;
  isSaudi?: boolean;
}

export interface Leave {
  id: string;
  empId: string;
  type: "سنوية" | "مرضية" | "اضطرارية" | "بدون راتب";
  from: string;
  to: string;
  days: number;
  status: "بانتظار الموافقة" | "موافق عليها" | "مرفوضة";
}

export interface Attendance {
  id: string;
  empId: string;
  date: string;
  in?: string;
  out?: string;
  status: "حاضر" | "متأخر" | "إجازة" | "غائب";
}

export interface RecruitmentJob {
  id: string;
  title: string;
  dept: string;
  applicants: number;
  stage?: string;
  status: "مفتوحة" | "مغلقة";
}

export interface Candidate {
  id: string;
  name: string;
  jobId: string;
  stage: string;
  rating: number;
}

export interface PerformanceReview {
  id: string;
  empId: string;
  period: string;
  score: number;
  goal?: string;
  status: "مكتمل" | "قيد التقييم";
}

export interface TrainingCourse {
  id: string;
  title: string;
  date: string;
  dur: string;
  enrolled: number;
  status: "قادمة" | "مكتملة";
  category?: string;
  trainer?: string;
  cost?: number;
  venue?: string;
  desc?: string;
  fileData?: string;
  fileName?: string;
}

export interface Expense {
  id: string;
  empId: string;
  item: string;
  amount: number;
  date: string;
  status: "بانتظار الموافقة" | "موافق عليها" | "مرفوضة";
  category?: string;
  desc?: string;
  vatNumber?: string;
  vatAmount?: number;
  receiptName?: string;
  fileData?: string;
  fileName?: string;
}

export interface Trip {
  id: string;
  empId: string;
  dest: string;
  purpose?: string;
  from?: string;
  to?: string;
  cost: number;
  status: "بانتظار الموافقة" | "موافق عليها" | "مرفوضة";
  type?: string;
  allowance?: number;
  ticketCost?: number;
  housingCost?: number;
  transportCost?: number;
  notes?: string;
  insuranceCompany?: string;
  fileData?: string;
  fileName?: string;
}

export interface HealthInsurance {
  id: string;
  empId: string;
  provider: string;
  class: "VIP" | "A" | "B" | "C";
  cardNo: string;
  start?: string;
  end?: string;
  premium?: number;
  dependents?: number;
  status: "نشط" | "موقوف";
  fileData?: string;
  fileName?: string;
}

export interface EmployeeContract {
  id: string;
  empId: string;
  type: string;
  start: string;
  end?: string;
  renewed?: string;
  nextRenew?: string;
  iqamaExp?: string;
  workPermitExp?: string;
  status: string;
  file?: string;
}

export interface EmployeeProfession {
  id: string;
  empId: string;
  specialty: string;
  cert?: string;
  uni?: string;
  grad?: string;
  licenseNo?: string;
  skills?: string;
}

export interface EmployeeDeduction {
  id: string;
  empId: string;
  gosiPct: number;
  medPct: number;
  taxPct?: number;
  otherPct?: number;
  otherNote?: string;
}

export interface CompanyDoc {
  id: string;
  name: string;
  cat: "policy" | "contract" | "hr" | "financial" | "legal" | "training";
  date?: string;
  size?: string;
  type: "PDF" | "DOCX" | "XLSX" | "ZIP";
  version?: string;
  status?: string;
  fileData?: string;
}

export interface Task {
  id: string;
  title: string;
  dept?: string;
  assignee: string;
  priority?: "high" | "med" | "low";
  status: "todo" | "inprogress" | "review" | "done";
  due?: string;
  progress?: number;
  tags?: string[];
  desc?: string;
  serviceType?: "internal" | "external";
  serviceName?: string;
}

export interface DeductionType {
  id: string;
  label: string;
  icon: string;
  color?: string;
  empPct: number;
  compPct: number;
  canEdit?: boolean;
  required?: boolean;
  note?: string;
}

export interface Company {
  id: string;
  name: string;
  crNumber?: string;
  adminUid: string;
  adminEmail: string;
  createdAt: string;
  phone?: string;
  address?: string;
  status: "pending" | "active" | "suspended" | "rejected";
  rejectionReason?: string;
}

export interface RBACUser {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  empCode: string;
  roleId: string;
  status: "active" | "inactive" | "pending";
  employeeId?: string;
  companyId?: string;
  isSuperAdmin?: boolean;
}

export interface RBACRole {
  id: string;
  name: string;
  description?: string;
  permissionIds: string[];
  companyId?: string;
}

export interface RBACPermission {
  id: string;
  name: string;
  category: string;
}

export interface EmployeeAsset {
  id: string;
  empId: string;
  name: string;
  category: string;
  description?: string;
  status: "Assigned" | "Returned" | "Lost" | "Damaged" | "Under Maintenance";
  assignDate: string;
  returnDate?: string;
  agreementName?: string;
  agreementData?: string;
  imageName?: string;
  imageData?: string;
  notes?: string;
  assignedBy: string;
  returnedTo?: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  empId: string;
  empName: string;
  action: "assign" | "return" | "status_change";
  oldStatus?: string;
  newStatus: string;
  changedBy: string;
  timestamp: string;
  notes?: string;
}
