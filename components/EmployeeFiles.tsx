/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { Employee, EmployeeContract, EmployeeProfession, EmployeeDeduction } from '../types';
import { AssetsTab } from './AssetsTab';
import { exportToCSV } from '../utils/exportUtils';
import { processAttachedFile } from '../utils/fileUtils';
import {
  Search,
  User,
  FileText,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Briefcase,
  GraduationCap,
  Percent,
  TrendingDown,
  Download,
  Upload,
  Calendar,
  Layers,
  ChevronLeft,
  Save,
  X,
  CreditCard,
  Building,
  Plus,
  Trash2,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Globe,
  File
} from 'lucide-react';

export const EmployeeFiles: React.FC = () => {
  const {
    employees,
    contracts,
    professions,
    deductions,
    health,
    selectedEmployeeId,
    setSelectedEmployeeId,
    employeeFileTab,
    setEmployeeFileTab,
    updateContract,
    updateProfession,
    updateEmployeeDeductions,
    updateEmployee,
    hasPermission
  } = useHR();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [nationalityFilter, setNationalityFilter] = useState('الكل'); // الكل، سعودي، مقيم
  const [contractStatusFilter, setContractStatusFilter] = useState('الكل'); // الكل، نشط، منتهي، ينتهي قريباً

  // Dialog State for Contract modification
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeContract, setActiveContract] = useState<EmployeeContract | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Editable Form states
  const [fType, setFType] = useState('دوام كامل');
  const [fStart, setFStart] = useState('');
  const [fEnd, setFEnd] = useState('');
  const [fRenewed, setFRenewed] = useState('');
  const [fNextRenew, setFNextRenew] = useState('');
  const [fIqama, setFIqama] = useState('');
  const [fPermit, setFPermit] = useState('');
  const [fFile, setFFile] = useState('');
  const [fStatus, setFStatus] = useState('نشط');

  // Inline forms state in profile view
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoName, setInfoName] = useState('');
  const [infoJob, setInfoJob] = useState('');
  const [infoDept, setInfoDept] = useState('');
  const [infoSalary, setInfoSalary] = useState(0);
  const [infoAllow, setInfoAllow] = useState(0);
  const [infoStatus, setInfoStatus] = useState<'نشط' | 'إجازة' | 'موقوف'>('نشط');
  const [infoLeaveBalance, setInfoLeaveBalance] = useState(21);

  const [isEditingProfession, setIsEditingProfession] = useState(false);
  const [profSpecialty, setProfSpecialty] = useState('');
  const [profCert, setProfCert] = useState('');
  const [profUni, setProfUni] = useState('');
  const [profGrad, setProfGrad] = useState('');
  const [profLicenseNo, setProfLicenseNo] = useState('');
  const [profSkills, setProfSkills] = useState('');

  const [isEditingDeductions, setIsEditingDeductions] = useState(false);
  const [dedGosi, setDedGosi] = useState(9.75);
  const [dedMed, setDedMed] = useState(1.5);
  const [dedTax, setDedTax] = useState(0);
  const [dedOther, setDedOther] = useState(0);
  const [dedOtherNote, setDedOtherNote] = useState('');
  const [dedFixedAmount, setDedFixedAmount] = useState(0);

  // Digital Vault Simulated Custom Docs lists (initialized with defaults or loaded state)
  const [empFileBase64, setEmpFileBase64] = useState('');
  const [uploadedEmpFileName, setUploadedEmpFileName] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocNo, setNewDocNo] = useState('');
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [newDocType, setNewDocType] = useState('PDF');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modal and Confirmation Dialog States
  const [editingDoc, setEditingDoc] = useState<{
    idx: number;
    name: string;
    number: string;
    expiry: string;
    type: string;
    description: string;
    fileData?: string;
  } | null>(null);

  const [docToDelete, setDocToDelete] = useState<{
    empId: string;
    idx: number;
    name: string;
  } | null>(null);

  // In-app Toast Feedbacks
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Safe file uploader with micro-animation upload progress simulation
  const handleUploadFile = (file: File, isReplacement: boolean = false) => {
    if (!hasPermission('edit_employee')) {
      triggerToast('عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.', 'error');
      return;
    }

    setUploadProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
        processAttachedFile(
          file,
          (base64) => {
            setUploadProgress(100);
            setTimeout(() => {
              if (isReplacement && editingDoc) {
                setEditingDoc(prev => prev ? { ...prev, fileData: base64 } : null);
                triggerToast('تم تحميل ملف الاستبدال بنجاح، يرجى حفظ التعديلات.', 'success');
              } else {
                setUploadedEmpFileName(file.name);
                if (!newDocName) {
                  setNewDocName(file.name.split('.').slice(0, -1).join('.'));
                }

                let docType = 'PDF';
                if (file.name.toLowerCase().endsWith('.docx')) docType = 'DOCX';
                else if (file.name.toLowerCase().endsWith('.xlsx')) docType = 'XLSX';
                else if (file.name.toLowerCase().endsWith('.png') || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) docType = 'PNG';
                setNewDocType(docType);

                setEmpFileBase64(base64);
                triggerToast('تم تحميل وتجهيز الملف المرفق.', 'success');
              }
              setUploadProgress(null);
            }, 300);
          },
          (error) => {
            setUploadProgress(null);
            triggerToast(error, 'error');
          }
        );
      } else {
        setUploadProgress(progress);
      }
    }, 80);
  };

  const handleEmpFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file, false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const getDaysLeft = (dateStr: string | undefined) => {
    if (!dateStr || dateStr === '—' || dateStr === '-' || dateStr === '') return null;
    try {
      const diffTime = new Date(dateStr).getTime() - new Date(today).getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  const getExpiryBadge = (dateStr: string | undefined) => {
    if (!dateStr || dateStr === '—' || dateStr === '-' || dateStr === '') {
      return <span className="text-slate-400 text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg inline-block">مواطن سعودي ⭐</span>;
    }
    const days = getDaysLeft(dateStr);
    if (days === null) {
      return <span className="text-slate-400 text-xs font-medium">—</span>;
    }

    let colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let label = `متبقي ${days} يوماً`;
    let icon = <CheckCircle className="w-3 h-3 text-emerald-600 inline shrink-0" />;

    if (days < 0) {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      label = `منتهي منذ ${Math.abs(days)} يوماً`;
      icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600 inline shrink-0" />;
    } else if (days <= 30) {
      colorClass = 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse font-bold';
      label = `عاجل: ينتهي خلال ${days} يوماً`;
      icon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600 inline shrink-0" />;
    } else if (days <= 90) {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      label = `ينتهي خلال ${days} يوماً`;
      icon = <Clock className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />;
    }

    return (
      <div className="flex flex-col text-right space-y-0.5">
        <span className="text-xs font-mono font-medium text-slate-700">{dateStr}</span>
        <span className={`text-[10px] px-1.5 py-0.5 border rounded-md font-medium w-fit ml-0 mr-auto flex items-center gap-1 ${colorClass}`}>
          {icon}
          {label}
        </span>
      </div>
    );
  };

  // Expiry alerts across all documents
  const nearExpiryAlerts: { id: string; empId: string; name: string; type: string; date: string; daysLeft: number }[] = [];
  contracts.forEach((c) => {
    const emp = employees.find(e => e.id === c.empId);
    if (!emp) return;

    const contractDays = getDaysLeft(c.end);
    if (contractDays !== null && contractDays <= 90) {
      nearExpiryAlerts.push({ id: `c_${c.id}`, empId: emp.id, name: emp.name, type: 'عقد العمل', date: c.end, daysLeft: contractDays });
    }
    const iqamaDays = getDaysLeft(c.iqamaExp);
    if (iqamaDays !== null && iqamaDays <= 90) {
      nearExpiryAlerts.push({ id: `i_${c.id}`, empId: emp.id, name: emp.name, type: 'بطاقة الإقامة', date: c.iqamaExp, daysLeft: iqamaDays });
    }
    const permitDays = getDaysLeft(c.workPermitExp);
    if (permitDays !== null && permitDays <= 90) {
      nearExpiryAlerts.push({ id: `p_${c.id}`, empId: emp.id, name: emp.name, type: 'رخصة العمل بالبلدية', date: c.workPermitExp, daysLeft: permitDays });
    }
  });

  // Calculate high-fidelity metrics
  const activeContractsCount = contracts.filter(c => c.status === 'نشط' || c.status === 'سار').length;
  const expiredDocsCount = nearExpiryAlerts.filter(a => a.daysLeft < 0).length;
  const expiringSoonDocsCount = nearExpiryAlerts.filter(a => a.daysLeft >= 0 && a.daysLeft <= 60).length;

  const saudiEmployeesCount = employees.filter(e => {
    const c = contracts.find(x => x.empId === e.id);
    return !c?.iqamaExp; // Native Saudis do not have Expat Residence (Iqama Expiry) seeded
  }).length;
  const saudizationPct = employees.length > 0 ? Math.round((saudiEmployeesCount / employees.length) * 100) : 0;

  // Evaluate Saudization Nitaqat Program Status
  let nitaqatLabel = 'الأحمر (حرج)';
  let nitaqatBg = 'bg-rose-100 text-rose-800 border-rose-300';
  let nitaqatBadgeColor = 'bg-rose-500';

  if (saudizationPct >= 50) {
    nitaqatLabel = 'البلاتيني (ممتاز)';
    nitaqatBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    nitaqatBadgeColor = 'bg-emerald-500';
  } else if (saudizationPct >= 30) {
    nitaqatLabel = 'الأخضر المرتفع (مستقر)';
    nitaqatBg = 'bg-green-100 text-green-800 border-green-300';
    nitaqatBadgeColor = 'bg-green-600';
  } else if (saudizationPct >= 15) {
    nitaqatLabel = 'الأخضر المتوسط (متوسط)';
    nitaqatBg = 'bg-amber-100 text-amber-800 border-amber-300';
    nitaqatBadgeColor = 'bg-amber-500';
  }

  // Open Edit Modals
  const openEditContract = (empId: string) => {
    const c = contracts.find(x => x.empId === empId) || {
      id: '', empId, type: 'دوام كامل', start: '', end: '', renewed: '', nextRenew: '', iqamaExp: '', workPermitExp: '', status: 'نشط', file: ''
    };
    setActiveContract(c as EmployeeContract);
    setFType(c.type || 'دوام كامل');
    setFStart(c.start || '');
    setFEnd(c.end || '');
    setFRenewed(c.renewed || '');
    setFNextRenew(c.nextRenew || '');
    setFIqama(c.iqamaExp || '');
    setFPermit(c.workPermitExp || '');
    setFFile(c.file || '');
    setFStatus(c.status || 'نشط');
    setErrorMsg('');
    setShowEditModal(true);
  };

  const saveContractChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContract) return;

    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateContract(activeContract.empId, {
        type: fType,
        start: fStart,
        end: fEnd,
        renewed: fRenewed,
        nextRenew: fNextRenew,
        iqamaExp: fIqama,
        workPermitExp: fPermit,
        file: fFile,
        status: fStatus
      });
      setShowEditModal(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشلت عملية حفظ التحديث بقاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper function to render contract edit modal in both views (list and detail)
  const renderEditContractModal = () => {
    if (!showEditModal || !activeContract) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto animate-slideup text-right relative">

          {/* Close trigger button */}
          <button
            onClick={() => setShowEditModal(false)}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-base text-gold mt-1 mb-4 pb-2 border-b border-slate-100 font-extrabold flex items-center gap-1.5">
            📝 تحديث تواريخ العقد ورخص العمل والبلدية لـ {employees.find(e => e.id === activeContract.empId)?.name}
          </h3>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-1.5 font-bold mb-4">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              {errorMsg}
            </div>
          )}

          <form onSubmit={saveContractChanges} className="space-y-4 font-sans text-right">

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 label-spacing">
                <label className="text-xs font-bold text-slate-450">نوع عقد العمل</label>
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50"
                  value={fType}
                  onChange={(e) => setFType(e.target.value)}
                >
                  <option value="دوام كامل">دوام كامل (كامل الأوقات)</option>
                  <option value="دوام جزئي">دوام جزئي (أوقات مقتطعة)</option>
                  <option value="عقد موسمي">عقد عمل موسمي</option>
                  <option value="عقد مؤقت">عقد عمل مرن مؤقت</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450">حالة العقد وثائقياً</label>
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50"
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value)}
                >
                  <option value="نشط">نشط (سارٍ وموثق)</option>
                  <option value="منتهي">غير تجديدي (موقوف)</option>
                  <option value="مجمد">تحت المراجعة والتجميد</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450">تاريخ بداية العقد</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50 font-mono"
                  value={fStart}
                  onChange={(e) => setFStart(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450">تاريخ انتهاء العقد</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50 font-mono"
                  value={fEnd}
                  onChange={(e) => setFEnd(e.target.value)}
                />
              </div>
            </div>

            {/* Iqama residence only for wafeedeen */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450">تاريخ انتهاء الإقامة (للوافدين فقط)</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50 font-mono"
                  value={fIqama}
                  onChange={(e) => setFIqama(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450">تاريخ انتهاء رخصة العمل البلدية</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50 font-mono"
                  value={fPermit}
                  onChange={(e) => setFPermit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450">تاريخ آخر تجديد عقد</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50 font-mono"
                  value={fRenewed}
                  onChange={(e) => setFRenewed(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-450">تاريخ موعد التجديد القادم</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50 font-mono"
                  value={fNextRenew}
                  onChange={(e) => setFNextRenew(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-450">اسم ملف العقد الموحد (PDF)</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl pl-3 pr-9 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-right font-mono"
                  value={fFile}
                  onChange={(e) => setFFile(e.target.value)}
                  placeholder="unified_contract_e12.pdf"
                />
                <FileSpreadsheet className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
              </div>
            </div>

            {/* Action Triggers */}
            <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-gold text-slate-950 border-none px-6 py-2.5 rounded-xl cursor-pointer text-xs font-black hover:bg-gold-light flex items-center justify-center gap-1.5 min-w-[130px] disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ التغييرات</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowEditModal(false)}
                className="bg-transparent text-slate-400 border border-slate-200 px-5 py-2.5 rounded-xl cursor-pointer text-xs font-bold hover:text-slate-600 hover:bg-slate-50 disabled:opacity-55"
              >
                إلغاء التعديل
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  };

  // Deletion Confirmation Modal
  const renderDeleteConfirmationModal = () => {
    if (!docToDelete) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[130] p-4 transition-all duration-300">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleup text-right relative">
          <div className="flex items-center gap-3 text-rose-600 mb-4">
            <AlertTriangle className="w-8 h-8 shrink-0 text-rose-500" />
            <h3 className="text-lg font-black font-sans">تأكيد حذف المستند</h3>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            هل أنت متأكد من رغبتك في حذف مستند <span className="font-bold text-slate-800">"{docToDelete.name}"</span> بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح الملف وبياناته من الخزانة الرقمية للموظف.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleDeleteCustomDoc}
              disabled={isSaving}
              className="bg-rose-600 text-white border-none px-5 py-2.5 rounded-xl cursor-pointer text-xs font-black hover:bg-rose-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>جاري الحذف...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>نعم، حذف نهائي</span>
                </>
              )}
            </button>
            <button
              onClick={() => setDocToDelete(null)}
              disabled={isSaving}
              className="bg-transparent text-slate-400 border border-slate-200 px-5 py-2.5 rounded-xl cursor-pointer text-xs font-bold hover:text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Document Metadata & Replace File Modal
  const renderEditDocModal = (empId: string) => {
    if (!editingDoc) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[130] p-4 transition-all duration-300">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto animate-slideup text-right relative">

          {/* Close button */}
          <button
            onClick={() => setEditingDoc(null)}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-base text-gold mt-1 mb-4 pb-2 border-b border-slate-100 font-extrabold flex items-center gap-1.5">
            📝 تعديل بيانات المستند: {editingDoc.name}
          </h3>

          <div className="space-y-4 font-sans text-right">

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">اسم الوثيقة <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50"
                  value={editingDoc.name}
                  onChange={(e) => setEditingDoc(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="اسم الوثيقة..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">رقم المرجع / الرقم القومي</label>
                <input
                  type="text"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 font-mono"
                  value={editingDoc.number}
                  onChange={(e) => setEditingDoc(prev => prev ? { ...prev, number: e.target.value } : null)}
                  placeholder="مثال: WP-1049..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">تاريخ الانتهاء</label>
                <input
                  type="date"
                  className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-gold bg-slate-50 font-mono"
                  value={editingDoc.expiry === '—' ? '' : editingDoc.expiry}
                  onChange={(e) => setEditingDoc(prev => prev ? { ...prev, expiry: e.target.value } : null)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">نوع الملف / الامتداد <span className="text-rose-500">*</span></label>
                <select
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50"
                  value={editingDoc.type}
                  onChange={(e) => setEditingDoc(prev => prev ? { ...prev, type: e.target.value } : null)}
                >
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                  <option value="PNG">PNG Image</option>
                  <option value="XLSX">XLSX Excel</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">وصف المستند</label>
              <textarea
                rows={2}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 w-full"
                value={editingDoc.description === '—' ? '' : editingDoc.description}
                onChange={(e) => setEditingDoc(prev => prev ? { ...prev, description: e.target.value } : null)}
                placeholder="أضف وصفاً موجزاً للوثيقة..."
              />
            </div>

            {/* Replace File Dropzone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">استبدال أو إعادة رفع الملف</label>
              <div className="border border-dashed border-slate-350 hover:border-gold rounded-xl p-4 bg-slate-50 flex flex-col items-center justify-center relative cursor-pointer min-h-[80px]">
                <input
                  type="file"
                  accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file, true);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="text-center pointer-events-none space-y-1">
                  <span className="text-base block">🔄</span>
                  <p className="text-[11px] font-bold text-slate-700">اسحب ملفاً جديداً أو انقر لاستبدال الملف الحالي</p>
                  <p className="text-[9px] text-slate-400">تحميل ملف جديد يحافظ على بيانات السجل ويستبدل المرفق القديم</p>
                  {editingDoc.fileData && (
                    <div className="mt-2 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                      <span>✓ يحتوي على ملف مرفق</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
              <button
                type="button"
                onClick={() => handleUpdateCustomDoc(empId)}
                disabled={isSaving}
                className="bg-gold text-slate-950 border-none px-6 py-2.5 rounded-xl cursor-pointer text-xs font-black hover:bg-gold-light flex items-center justify-center gap-1.5 min-w-[130px] disabled:opacity-55"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    <span>جاري التحديث...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ التعديلات</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setEditingDoc(null)}
                className="bg-transparent text-slate-400 border border-slate-200 px-5 py-2.5 rounded-xl cursor-pointer text-xs font-bold hover:text-slate-600 hover:bg-slate-50 disabled:opacity-55"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // Switch to inline editing for Info Tab
  const enableInfoEditing = (emp: Employee) => {
    setInfoName(emp.name);
    setInfoJob(emp.job);
    setInfoDept(emp.dept);
    setInfoSalary(emp.salary);
    setInfoAllow(emp.allow);
    setInfoStatus(emp.status);
    setInfoLeaveBalance(emp.leaveBalance || 21);
    setIsEditingInfo(true);
  };

  const saveInfoChanges = async (empId: string) => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateEmployee(empId, {
        name: infoName,
        job: infoJob,
        dept: infoDept,
        salary: Number(infoSalary),
        allow: Number(infoAllow),
        status: infoStatus,
        leaveBalance: Number(infoLeaveBalance)
      });
      setIsEditingInfo(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('خطأ أثناء حفظ البيانات العامة لشريك العمل.');
    } finally {
      setIsSaving(false);
    }
  };

  // Switch to inline editing for Profession
  const enableProfessionEditing = (empId: string) => {
    const prof = professions.find(p => p.empId === empId) || {
      specialty: '', cert: '', uni: '', grad: '', licenseNo: '', skills: ''
    };
    setProfSpecialty(prof.specialty || '');
    setProfCert(prof.cert || '');
    setProfUni(prof.uni || '');
    setProfGrad(prof.grad || '');
    setProfLicenseNo(prof.licenseNo || '');
    setProfSkills(prof.skills || '');
    setIsEditingProfession(true);
  };

  const saveProfessionChanges = async (empId: string) => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateProfession(empId, {
        specialty: profSpecialty,
        cert: profCert,
        uni: profUni,
        grad: profGrad,
        licenseNo: profLicenseNo,
        skills: profSkills
      });
      setIsEditingProfession(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('خطأ أثناء حفظ تفاصيل المؤهلات العلمية المهنية.');
    } finally {
      setIsSaving(false);
    }
  };

  // Switch to inline editing for Deductions
  const enableDeductionsEditing = (empId: string, empSalary: number) => {
    const ded = deductions.find(d => d.empId === empId) || {
      gosiPct: 9.75, medPct: 1.5, taxPct: 0, otherPct: 0, otherNote: ''
    };
    const emp = employees.find(e => e.id === empId);
    setDedGosi(ded.gosiPct || 9.75);
    setDedMed(ded.medPct || 1.5);
    setDedTax(ded.taxPct || 0);
    setDedOther(ded.otherPct || 0);
    setDedOtherNote(ded.otherNote || '');
    setDedFixedAmount(emp?.deduct || 0);
    setIsEditingDeductions(true);
  };

  const saveDeductionsChanges = async (empId: string) => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      await updateEmployeeDeductions(empId, {
        gosiPct: Number(dedGosi),
        medPct: Number(dedMed),
        taxPct: Number(dedTax),
        otherPct: Number(dedOther),
        otherNote: dedOtherNote
      }, Number(dedFixedAmount));
      setIsEditingDeductions(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('حدث خطأ أثناء حفظ التحديثات المالية والاستقطاعات.');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Document metadata record to custom docs list directly in Firestore
  const handleAddCustomDoc = async (empId: string) => {
    if (!hasPermission('edit_employee')) {
      triggerToast('عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.', 'error');
      return;
    }

    if (!newDocName.trim()) {
      triggerToast('الرجاء إدخال اسم الوثيقة كحقل إلزامي.', 'error');
      return;
    }

    if (!empFileBase64) {
      triggerToast('الرجاء تحميل ملف الوثيقة.', 'error');
      return;
    }

    const empItem = employees.find(x => x.id === empId);
    if (!empItem) {
      triggerToast('شريك العمل / الموظف غير موجود.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const newDoc = {
        name: newDocName.trim(),
        number: newDocNo.trim() || Math.floor(100000 + Math.random() * 900000).toString(),
        expiry: newDocExpiry || '—',
        type: newDocType,
        description: newDocDescription.trim() || '—',
        fileData: empFileBase64
      };

      const updatedDocs = [...(empItem.customDocs || []), newDoc];
      await updateEmployee(empId, { customDocs: updatedDocs });

      // Reset inputs
      setNewDocName('');
      setNewDocNo('');
      setNewDocExpiry('');
      setNewDocType('PDF');
      setNewDocDescription('');
      setEmpFileBase64('');
      setUploadedEmpFileName('');
      setShowAddDocForm(false);
      triggerToast(`تمت إضافة المستند "${newDoc.name}" بنجاح في الخزانة.`, 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast('خطأ أثناء رفع وتشفير المستند بقاعدة البيانات الفورية.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Update existing Document metadata and replace file
  const handleUpdateCustomDoc = async (empId: string) => {
    if (!hasPermission('edit_employee')) {
      triggerToast('عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.', 'error');
      return;
    }

    if (!editingDoc) return;

    if (!editingDoc.name.trim()) {
      triggerToast('الرجاء إدخال اسم الوثيقة.', 'error');
      return;
    }

    const empItem = employees.find(x => x.id === empId);
    if (!empItem) {
      triggerToast('الموظف غير موجود.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedDocs = [...(empItem.customDocs || [])];
      updatedDocs[editingDoc.idx] = {
        ...updatedDocs[editingDoc.idx],
        name: editingDoc.name.trim(),
        number: editingDoc.number.trim() || Math.floor(100000 + Math.random() * 900000).toString(),
        expiry: editingDoc.expiry || '—',
        type: editingDoc.type,
        description: editingDoc.description.trim() || '—',
        fileData: editingDoc.fileData
      };

      await updateEmployee(empId, { customDocs: updatedDocs });
      triggerToast(`تم تحديث بيانات المستند "${editingDoc.name}" بنجاح.`, 'success');
      setEditingDoc(null);
    } catch (err: any) {
      console.error(err);
      triggerToast('فشل في تحديث المستند بقاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete document handler (confirmed)
  const handleDeleteCustomDoc = async () => {
    if (!hasPermission('edit_employee')) {
      triggerToast('عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.', 'error');
      setDocToDelete(null);
      return;
    }

    if (!docToDelete) return;

    const { empId, idx, name } = docToDelete;
    const empItem = employees.find(x => x.id === empId);
    if (!empItem) {
      setDocToDelete(null);
      return;
    }

    setIsSaving(true);
    try {
      const updated = [...(empItem.customDocs || [])];
      updated.splice(idx, 1);
      await updateEmployee(empId, { customDocs: updated });
      triggerToast(`تم مسح المستند "${name}" بنجاح من الخزانة.`, 'success');
    } catch (err: any) {
      console.error(err);
      triggerToast('فشل حذف المستند من خادم البيانات.', 'error');
    } finally {
      setIsSaving(false);
      setDocToDelete(null);
    }
  };

  // Download official Saudi-compliant text/plain document using real parameters
  const handleDownloadNativeDoc = (docItem: any, emp: Employee) => {
    let content = '';
    const todayStr = new Date().toISOString().slice(0, 10);

    if (docItem.name.includes('عقد')) {
      content = `
=========================================
المملكة العربية السعودية - عقد العمل الموحد
=========================================
رقم توثيق العقد الرقمي: ${docItem.no}
تاريخ التوثيق (التعيين): ${emp.hire}
تاريخ انتهاء المدة: ${docItem.expiry || '—'}

طرف أول (صاحب العمل): منشأة سحابة الأعمال لتكنولوجيا المعلومات
طرف ثانٍ (الموظف): ${emp.name}
المسمى الوظيفي: ${emp.job}
القسم الإداري: ${emp.dept}

البنود المالية والشروط والأحكام:
-----------------------------------------
1. الراتب الأساسي الشهري: ${emp.salary} ريال سعودي
2. البدلات والمزايا السنوية: ${emp.allow} ريال سعودي
3. الإجازة السنوية المدفوعة: 30 يوماً متوافقة مع المادة (109) من نظام العمل السعودي.
4. فترة التجربة: خاضع لأحكام المادة (53) بحد أقصى (90) يوماً تبدأ من تاريخ التعيين الفعلي ${emp.hire}.
5. يسري هذا العقد ويلتزم الطرفان به مع خضوعه لكامل أحكام نظام العمل ولائحة تنظيم العمل بالمنشأة.

مستند رسمي إلكتروني موثق عبر بوابة قوى (Qiwa).
صادر بتاريخ: ${todayStr}
=========================================
      `;
    } else if (docItem.name.includes('الإقامة')) {
      content = `
=========================================
المملكة العربية السعودية - تفاصيل بطاقة الإقامة المعتمدة
=========================================
رقم المرجع الرقمي للإقامة: ${docItem.no}
اسم المقيم المستفيد: ${emp.name}
المهنة المصنفة: ${emp.job}
تاريخ انتهاء الإقامة: ${docItem.expiry || '—'}
جهة العمل الكافلة: منشأة سحابة الأعمال لتكنولوجيا المعلومات

حالة الامتثال لدى وزارة الداخلية والجوازات:
-----------------------------------------
- وثيقة الإقامة سارية وموثقة بمكتب العمل ومربوطة بالتأمين الطبي التعاوني المعتمد.
- نظام نطاقات: المنطقة الخضراء
- تم الربط والتحقق الرقمي بنجاح 100%.

مستند استعلام أوتوماتيكي صادر بتاريخ: ${todayStr}
=========================================
      `;
    } else {
      content = `
=========================================
المملكة العربية السعودية - مستند رسمي معتمد
=========================================
نوع الوثيقة: ${docItem.name}
اسم المالك المستفيد: ${emp.name}
رقم المرجع: ${docItem.no}
تاريخ الانتهاء أو التحديث: ${docItem.expiry || '—'}

معتمد وصادر آلياً عن قواعد بيانات سحابة الأعمال في المنطقة الخضراء.
تاريخ التصدير والاستخراج الإلكتروني: ${todayStr}
=========================================
      `;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${docItem.file || 'document'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters application
  const filteredEmployees = employees.filter((e) => {
    const contract = contracts.find(c => c.empId === e.id);
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.job.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.dept.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = deptFilter === 'الكل' || e.dept === deptFilter;

    // Nationality filter helper (Saudis typically don't have contract.iqamaExp seeded in default_contracts)
    const isSaudi = contract ? !contract.iqamaExp : true;
    const matchesNationality = nationalityFilter === 'الكل' ||
      (nationalityFilter === 'سعودي' && isSaudi) ||
      (nationalityFilter === 'مقيم' && !isSaudi);

    // Contract Status filter helper
    let contractStatus = 'نشط';
    if (contract) {
      const days = getDaysLeft(contract.end);
      if (days !== null) {
        if (days < 0) contractStatus = 'منتهي';
        else if (days <= 90) contractStatus = 'ينتهي قريباً';// within 3 months is expiring
      }
    }
    const matchesContractStatus = contractStatusFilter === 'الكل' ||
      (contractStatusFilter === 'نشط' && contractStatus === 'نشط') ||
      (contractStatusFilter === 'منتهي' && contractStatus === 'منتهي') ||
      (contractStatusFilter === 'ينتهي قريباً' && contractStatus === 'ينتهي قريباً');

    return matchesSearch && matchesDept && matchesNationality && matchesContractStatus;
  });

  // Unique departments for filter
  const departments = ['الكل', ...new Set(employees.map(e => e.dept))];

  const handleExportToExcel = () => {
    const headers = [
      'الاسم الكامل',
      'المسمى الوظيفي',
      'القسم الإداري',
      'الراتب الأساسي (ر.س)',
      'البدلات شهرياً (ر.س)',
      'نوع العقد',
      'تاريخ المباشرة',
      'انتهاء العقد',
      'تاريخ التجديد',
      'انتهاء الإقامة (للوافدين)',
      'انتهاء رخصة العمل',
      'رصيد الإجازات السنوية',
      'الحالة الوظيفية'
    ];

    const rows = filteredEmployees.map((e) => {
      const c = contracts.find(x => x.empId === e.id);
      return [
        e.name,
        e.job,
        e.dept,
        e.salary,
        e.allow,
        c?.type || 'دوام كامل',
        e.hire,
        c?.end || '—',
        c?.renewed || '—',
        c?.iqamaExp || 'مواطن سعودي 🇸🇦',
        c?.workPermitExp || '—',
        e.leaveBalance || 21,
        e.status
      ];
    });

    exportToCSV(`ملفات_وعقود_الموظفين_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Specific selected employee data
  if (selectedEmployeeId) {
    const e = employees.find(x => x.id === selectedEmployeeId);
    if (!e) return null;

    const contract = contracts.find(c => c.empId === e.id) || { type: '—', start: '—', end: '—', nextRenew: '—', status: '—', file: '—', iqamaExp: '', workPermitExp: '' };
    const prof = professions.find(p => p.empId === e.id) || { specialty: '—', cert: '—', uni: '—', grad: '—', licenseNo: '—', skills: '—' };
    const ded = deductions.find(d => d.empId === e.id) || { gosiPct: 9.75, medPct: 1.5, taxPct: 0, otherPct: 0, otherNote: '' };

    // Real-time calculation of Salary Packaging and GOSI share
    const housingAllowance = Math.round(e.salary * 0.25); // Standard housing allowance is 25% of basic salary
    const transportAllowance = Math.round(e.salary * 0.10); // Standard transport allowance is 10%
    const totalAllowances = e.allow; // Using the db total allowance
    const subTotalForGosiAndSocial = e.salary + housingAllowance; // Under Saudi law, GOSI is calculated against Basic + Housing allowances

    // Check GOSI deductions
    const totalDeductionsAmount = Math.round(e.salary * (ded.gosiPct + ded.medPct + (ded.otherPct || 0)) / 100) + e.deduct;
    const netSalary = e.salary + e.allow - totalDeductionsAmount;

    // Check if probation period is active (90 days from hire)
    const hireDateObj = new Date(e.hire);
    const probationEndDate = new Date(hireDateObj.getTime() + (90 * 24 * 60 * 60 * 1000));
    const isProbationActive = new Date() < probationEndDate;
    const daysLeftProbation = Math.ceil((probationEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    // Compile dynamic vault document lists
    const nativeUploadedDocs = [
      { name: 'عقد العمل الموحد الموثق', icon: <FileText className="w-5 h-5 text-gold" />, file: contract.file || 'contract_unified.pdf', expiry: contract.end, no: 'CN-889410' },
      ...(contract.iqamaExp ? [{ name: 'صورة بطاقة الإقامة المعتمدة', icon: <User className="w-5 h-5 text-gold" />, file: `Iqama_${e.name.replace(/\s+/g, '_')}.pdf`, expiry: contract.iqamaExp, no: 'IQ-1049281' }] : []),
      ...(contract.workPermitExp ? [{ name: 'رخصة القيادة أو تصنيف العمل البلدي', icon: <Layers className="w-5 h-5 text-gold" />, file: `Permit_${e.name.replace(/\s+/g, '_')}.pdf`, expiry: contract.workPermitExp, no: 'WP-33041' }] : []),
      { name: 'شهادة المؤهل الأكاديمي والشهادات الفنية', icon: <GraduationCap className="w-5 h-5 text-gold" />, file: `Academic_Degree_${prof.cert}.pdf`, expiry: '—', no: prof.licenseNo || '—' }
    ];

    const currentEmpCustomDocs = e.customDocs || [];

    return (
      <div className="space-y-6 animate-slideup font-sans text-right" dir="rtl">
        {/* Back and Breadcrumb Links */}
        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
          <button
            onClick={() => {
              setSelectedEmployeeId(null);
              setIsEditingInfo(false);
              setIsEditingProfession(false);
              setIsEditingDeductions(false);
            }}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors border-none bg-transparent cursor-pointer text-xs"
          >
            <ChevronLeft className="w-4 h-4 shrink-0 rotate-180" />
            العودة لملفات وعقود الموظفين
          </button>
          <div className="text-xs text-slate-400 font-medium">
            سجل الموظف: <span className="font-semibold text-slate-700">{e.name}</span>
          </div>
        </div>

        {/* Big Profile Hero Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle design accents */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold-dim/10 to-transparent rounded-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-right relative z-10 w-full md:w-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-3xl font-bold font-mono shadow-md shrink-0 border-2 border-white">
              {e.name[0]}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">{e.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${e.status === 'نشط' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  e.status === 'إجازة' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                  ● {e.status}
                </span>
                {contract.iqamaExp ? (
                  <span className="bg-sky-50 text-sky-700 border border-sky-100 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    🌏 موظف مقيم (وافد)
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    🇸🇦 مواطن سعودي
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="w-4 h-4 text-gold shrink-0" />
                {e.job} · {e.dept}
              </p>
              <div className="flex gap-2 pt-1 flex-wrap justify-center sm:justify-start">
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg">
                  رقم الموظف: {e.id}
                </span>
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg">
                  تاريخ التعيين: {e.hire}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right sm:text-left bg-gradient-to-r from-slate-50 to-white border border-slate-100 rounded-xl px-5 py-4 w-full md:w-auto shrink-0 md:text-left">
            <span className="text-[10px] font-bold text-slate-400 tracking-wide block mb-1 uppercase">صافي الراتب المستحق في المسير حالياً</span>
            <div className="text-3xl font-black text-gold tracking-tight font-mono">{netSalary.toLocaleString()} ر.س</div>
            <div className="text-[10px] text-slate-400 mt-1">
              الراتب شامل البدلات والمكافآت مطروحاً منه الاستقطاعات والتأمين
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full max-w-full overflow-x-auto select-none border border-slate-200">
          {[
            { key: 'info', label: '📋 تفاصيل السلم والبيانات الوظيفية' },
            { key: 'contract', label: '📝 عقد العمل وفترة التجربة' },
            { key: 'deductions', label: '💸 التأمينات والاستقطاع والـ GOSI' },
            { key: 'profession', label: '🎓 المؤهلات ورخصة الهيئة المهنية' },
            { key: 'docs', label: '🗂️ الخزانة الفنية والوثائق الموثقة' },
            { key: 'assets', label: '📦 العهد والأصول العينية' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setEmployeeFileTab(tab.key);
                setErrorMsg('');
              }}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all border-none cursor-pointer whitespace-nowrap ${employeeFileTab === tab.key
                ? 'bg-white text-gold shadow-md border-b-2 border-gold font-extrabold'
                : 'bg-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Tab Area Container */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 relative">

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-bold mb-4">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              {errorMsg}
            </div>
          )}

          {/* TAB 1: General Info & Salary Package */}
          {employeeFileTab === 'info' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">تفاصيل السلم المالي وشريك العمل</h3>
                  <p className="text-xs text-slate-400 mt-0.5">مراجعة وتعديل الرواتب الأساسية والبدلات المستحرة للتأثير المباشر على الحساب ومسير الرواتب</p>
                </div>
                {!isEditingInfo ? (
                  <button
                    onClick={() => enableInfoEditing(e)}
                    className="bg-gold-bg text-gold hover:bg-gold-light hover:text-slate-900 border border-gold-border px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    ✏️ تعديل السلم والبيانات الوظيفية
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveInfoChanges(e.id)}
                      disabled={isSaving}
                      className="bg-gold hover:bg-gold-light text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 border-none disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      حفظ السجل
                    </button>
                    <button
                      onClick={() => setIsEditingInfo(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border-none"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {isEditingInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 border border-slate-150 p-5 rounded-2xl">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">اسم الموظف كاملاً</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={infoName}
                      onChange={(e) => setInfoName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">المسمى الوظيفي</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={infoJob}
                      onChange={(e) => setInfoJob(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">القسم الإداري</label>
                    <select
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={infoDept}
                      onChange={(e) => setInfoDept(e.target.value)}
                    >
                      <option value="تقنية المعلومات">تقنية المعلومات</option>
                      <option value="الموارد البشرية">الموارد البشرية</option>
                      <option value="المالية">المالية</option>
                      <option value="التسويق">التسويق</option>
                      <option value="المبيعات">المبيعات</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">حالة الموظف</label>
                    <select
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={infoStatus}
                      onChange={(e) => setInfoStatus(e.target.value as any)}
                    >
                      <option value="نشط">نشط</option>
                      <option value="إجازة">إجازة</option>
                      <option value="موقوف">موقوف</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-right">
                      <label className="text-xs font-bold text-slate-500">الراتب الأساسي (ر.س)</label>
                      <input
                        type="number"
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                        value={infoSalary}
                        onChange={(e) => setInfoSalary(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-right">
                      <label className="text-xs font-bold text-slate-500">مجموع البدلات الثابتة (ر.س)</label>
                      <input
                        type="number"
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                        value={infoAllow}
                        onChange={(e) => setInfoAllow(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">رصيد الإجازات السنوية المتبقي (يوم)</label>
                    <input
                      type="number"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                      value={infoLeaveBalance}
                      onChange={(e) => setInfoLeaveBalance(Number(e.target.value))}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">الراتب الأساسي المعتمد</span>
                      <p className="text-lg font-black text-slate-800 font-mono">{e.salary.toLocaleString()} ر.س</p>
                    </div>
                    <DollarSignComponent />
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">إجمالي البدلات الممنوحة شهرياً</span>
                      <p className="text-lg font-black text-slate-800 font-mono">+{e.allow.toLocaleString()} ر.س</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      🎁
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">رصيد الإجازات النشط</span>
                      <p className="text-lg font-black text-slate-800 font-mono">{e.leaveBalance} يوماً</p>
                    </div>
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      🌴
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">تاريخ التعيين والمباشرة</span>
                      <p className="text-lg font-black text-slate-800 font-mono">{e.hire}</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      📅
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">بدل السكن المتوقع (25%)</span>
                      <p className="text-lg font-black text-slate-800 font-mono">{housingAllowance.toLocaleString()} ر.س</p>
                    </div>
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      🏠
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">بدل النقل المعتاد (10%)</span>
                      <p className="text-lg font-black text-slate-800 font-mono">{transportAllowance.toLocaleString()} ر.س</p>
                    </div>
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold text-sm">
                      🚗
                    </div>
                  </div>
                </div>
              )}

              {/* Saudi Probation Period Insight (Labor Law Compliance) */}
              <div className="p-5 border rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-l from-slate-50 to-white border-slate-200">
                <div className="text-right space-y-1.5 w-full md:w-2/3">
                  <div className="flex items-center gap-2">
                    <strong className="text-xs font-bold text-slate-700">🔍 مراقب مرحلة فترة التجربة (المادة 53 من فصول نظام العمل السعودي)</strong>
                    {isProbationActive ? (
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold">نشطة حالياً</span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold">مكتملة ومثبتة</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    يلزم نظام العمل بألا تحتسب فترات الإجازة المرضية أو الأعياد ضمن فترة التجربة (أقصاها 90 يوم عمل وتمدد كتابة بحد أقصى للاتفاق 180 يوم عمل).
                  </p>
                  {isProbationActive && (
                    <div className="text-xs font-semibold text-amber-600">
                      متبقي للموظف <span className="font-mono font-bold text-sm">{daysLeftProbation}</span> يوماً في فترة التجربة.
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 w-full md:w-auto shrink-0 justify-end">
                  <div className="p-2.5 bg-blue-50 text-blue-700 font-bold text-sm font-sans rounded-xl border border-blue-100">
                    تاريخ النهاية التقريبي: {new Date(hireDateObj.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Contracts and Trial Period */}
          {employeeFileTab === 'contract' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">بيانات عقد العمل والواجبات التعاقدية</h3>
                  <p className="text-xs text-slate-400 mt-0.5">توثيق أنواع العقود والتواريخ متوافقة مع متطلبات التوثيق بالمنصة الموحدة (قوى)</p>
                </div>
                <button
                  onClick={() => openEditContract(e.id)}
                  className="bg-gold text-slate-900 border-none px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gold-light cursor-pointer"
                >
                  ⚙️ تعديل التواريخ والوثائق التعاقدية
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-400">تفاصيل فترات عقد العمل</h4>
                  <div className="space-y-2.5 divide-y divide-slate-100">
                    <div className="flex justify-between items-center pt-1.5">
                      <span className="text-xs text-slate-500 font-medium">نوع العقد</span>
                      <span className="text-xs font-bold text-slate-800">{contract.type || 'دوام كامل'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-xs text-slate-500 font-medium">حالة العقد</span>
                      <span className="badge b-green text-xs font-bold px-2 py-0.5 rounded-full">{contract.status || 'نشط'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-xs text-slate-500 font-medium">بداية العقد في</span>
                      <span className="text-xs font-mono font-bold text-slate-800">{contract.start || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-xs text-slate-500 font-medium">تاريخ انتهاء العقد</span>
                      <span>{getExpiryBadge(contract.end)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-400">الرخص الوطنية والوافدة</h4>
                  <div className="space-y-2.5 divide-y divide-slate-100">
                    <div className="flex justify-between items-center pt-1.5">
                      <span className="text-xs text-slate-500 font-medium">تاريخ انتهاء بطاقة الإقامة</span>
                      <span>{getExpiryBadge(contract.iqamaExp)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-xs text-slate-500 font-medium">رخصة العمل بالبلدية (للوافدين)</span>
                      <span>{getExpiryBadge(contract.workPermitExp)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-xs text-slate-500 font-medium">تاريخ آخر تجديد عقد</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">{contract.renewed || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-xs text-slate-500 font-medium">تاريخ موعد التجديد القادم</span>
                      <span className="text-xs font-mono font-semibold text-slate-700">{contract.nextRenew || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saudi Compliance Box on Contract Termination */}
              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 text-xs text-orange-850 text-right space-y-1.5">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  اشتراطات وتنبيهات الإشعارات (المادة 75 من نظام العمل السعودي):
                </p>
                <div className="space-y-1 mt-1 font-medium text-slate-600">
                  <li>إذا كان العقد غير محدد المدة (للسعوديين فقط)، جاز لأي من الطرفين إنهاؤه بناءً على سبب مشروع بموجب إشعار يوجه للطرف الآخر بحد أدنى <strong className="text-slate-800">60 يوماً</strong> قبل تاريخ الإنهاء.</li>
                  <li>بالنسبة للعمال وافدي الإقامة، فإن العقود مؤقتة المدة بطبيعتها ومربوطة بفترات تصاريح رخص العمل والإقامات السارية.</li>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Deductions Analysis */}
          {employeeFileTab === 'deductions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">حسابات التأمينات الاجتماعية GOSI والاستقطاعات المالية</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تفويض النسب المئوية للخصومات والحدود القانونية وحصص رب العمل ومكافحة الأخطار</p>
                </div>
                {!isEditingDeductions ? (
                  <button
                    onClick={() => enableDeductionsEditing(e.id, e.salary)}
                    className="bg-gold-bg text-gold border border-gold-border hover:bg-gold-light hover:text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    ✏️ تعديل ومراجعة الخصومات
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveDeductionsChanges(e.id)}
                      disabled={isSaving}
                      className="bg-gold hover:bg-gold-light text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 border-none disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      حفظ التغييرات المالية
                    </button>
                    <button
                      onClick={() => setIsEditingDeductions(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border-none"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {isEditingDeductions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 border border-slate-150 p-5 rounded-2xl">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">معدل خصم التأمينات الاجتماعية GOSI (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                      value={dedGosi}
                      onChange={(e) => setDedGosi(Number(e.target.value))}
                    />
                    <span className="text-[10px] text-slate-400">النسبة السعودية الموصى بها للمواطنين هي 9.75%</span>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">خصم قسط التأمين الطبي الوطني (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                      value={dedMed}
                      onChange={(e) => setDedMed(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">ضريبة الدخل الإضافية لغير المواطنين إن وجدت (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                      value={dedTax}
                      onChange={(e) => setDedTax(Number(e.target.value))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 text-right">
                      <label className="text-xs font-bold text-slate-500">الخصم بموجب السلف أو العقوبات (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                        value={dedOther}
                        onChange={(e) => setDedOther(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 text-right">
                      <label className="text-xs font-bold text-slate-500">ملاحظة الاستقطاع</label>
                      <input
                        type="text"
                        className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                        value={dedOtherNote}
                        onChange={(e) => setDedOtherNote(e.target.value)}
                        placeholder="مثال: خصم السلفة"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">الاستقطاعات الإدارية الثابتة الأخرى (بالريال السعودي ر.س)</label>
                    <input
                      type="number"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white font-mono"
                      value={dedFixedAmount}
                      onChange={(e) => setDedFixedAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visually stunning horizontal bar mapping */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">الهيكل الإجمالي لكليّة خصومات الموظف حالياً:</span>
                    <div className="flex h-5 border border-slate-200 rounded-full overflow-hidden bg-slate-100 p-0.5 select-none font-mono">
                      <div
                        style={{ width: `${Math.max(5, ded.gosiPct || 9.75)}%` }}
                        className="bg-gold hover:opacity-90 flex items-center justify-center text-[10px] text-slate-900 font-black transition-all"
                        title="Taminat GOSI"
                      >
                        {ded.gosiPct}%
                      </div>
                      <div
                        style={{ width: `${Math.max(5, ded.medPct || 1.5)}%` }}
                        className="bg-blue-600 hover:opacity-90 flex items-center justify-center text-[10px] text-white font-black transition-all"
                        title="Med Health"
                      >
                        {ded.medPct}%
                      </div>
                      {ded.otherPct !== undefined && ded.otherPct > 0 && (
                        <div
                          style={{ width: `${Math.max(5, ded.otherPct)}%` }}
                          className="bg-rose-500 hover:opacity-90 flex items-center justify-center text-[10px] text-white font-black transition-all"
                          title="Other"
                        >
                          {ded.otherPct}%
                        </div>
                      )}
                      <div className="flex-1 bg-slate-200 transition-all text-[9.5px] text-slate-500 text-center flex items-center justify-center">
                        الراتب الصافي المتبقي ({(100 - (ded.gosiPct + ded.medPct + (ded.otherPct || 0))).toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">خصم المؤسسة العامة للتأمينات الاجتماعية (GOSI)</span>
                      <strong className="text-base text-slate-800 font-mono">
                        {ded.gosiPct}% <span className="text-xs text-slate-400">({Math.round(subTotalForGosiAndSocial * ded.gosiPct / 100)} ر.س)</span>
                      </strong>
                    </div>

                    <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">حصة التأمين الصحي المخصومة شهرياً</span>
                      <strong className="text-base text-slate-800 font-mono">
                        {ded.medPct}% <span className="text-xs text-slate-400">({Math.round(e.salary * ded.medPct / 100)} ر.س)</span>
                      </strong>
                    </div>

                    <div className="p-4 border border-slate-100 bg-slate-50 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">إجمالي استقطاع السلف والعقوبات الثابتة بالريال</span>
                      <strong className="text-base text-slate-800 font-mono">
                        {e.deduct.toLocaleString()} ر.س
                      </strong>
                    </div>
                  </div>

                  {/* High level Saudi Labor Law Compliance and WPS Info card */}
                  <div className="p-4 border border-blue-100 bg-sky-50 rounded-2xl flex gap-3 text-right">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-extrabold text-blue-800">بيان حماية الأجور السعودي (WPS) ومطابقة المسير</h4>
                      <p className="text-xs text-slate-600/90 leading-relaxed">
                        يلزم نظام حماية الأجور (WPS) في المملكة بصرف الرواتب بالريال السعودي عبر المصارف المحلية متضمنة مسيرات مدد المعتمدة بدقة. لا يجوز خصم أكثر من <span className="font-bold underline">10%</span> من راتب العامل للمستحقات أو القروض عدا التأمينات الاجتماعية والنفقة القضائية إلا بموجب موافقة خطية مكتوبة من العامل نفسه.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Educational and Career Specialty Data */}
          {employeeFileTab === 'profession' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">المؤهلات العلمية المهنية ورخص الهيئات</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تسجيل الدبلومات، المؤهلات والشهادات الأكاديمية وصلاحيتها لمطابقة العقود المسجلة</p>
                </div>
                {!isEditingProfession ? (
                  <button
                    onClick={() => enableProfessionEditing(e.id)}
                    className="bg-gold-bg text-gold border border-gold-border hover:bg-gold-light hover:text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    ✏️ تعديل كفاءات المؤهل الأكاديمي
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveProfessionChanges(e.id)}
                      disabled={isSaving}
                      className="bg-gold hover:bg-gold-light text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 border-none disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      حفظ المؤهل بقاعدة البيانات
                    </button>
                    <button
                      onClick={() => setIsEditingProfession(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border-none"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {isEditingProfession ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 border border-slate-150 p-5 rounded-2xl">
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">التخصص الأساسي الدقيق</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={profSpecialty}
                      onChange={(e) => setProfSpecialty(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">الدرجة والمؤهل العلمي</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={profCert}
                      onChange={(e) => setProfCert(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">الجامعة أو المعهد المانح</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={profUni}
                      onChange={(e) => setProfUni(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-500">سنة التخرج والاعتماد</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={profGrad}
                      onChange={(e) => setProfGrad(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-505">رقم ترخيص وتصريح الهيئة السعودية (الهندسة/المحاسبة/الصحية)</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={profLicenseNo}
                      onChange={(e) => setProfLicenseNo(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-right">
                    <label className="text-xs font-bold text-slate-555">المهارات التقنية والمعرفية الأساسية</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-gold bg-white"
                      value={profSkills}
                      onChange={(e) => setProfSkills(e.target.value)}
                      placeholder="كلمات مفصولة بفواصل"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-404 block">الشهادة وتخصص التخرج المعتمد</span>
                      <strong className="text-sm text-slate-800">{prof.cert || 'غير محدد'} ({prof.specialty || 'لا تخصص'})</strong>
                      <p className="text-[10px] text-slate-404">{prof.uni || 'غير مدرج'} · {prof.grad || '—'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-404 block">رقم التصنيف المهني المصدق (الهيئة السعودية)</span>
                      <strong className="text-sm text-slate-800 font-mono tracking-wider">{prof.licenseNo || 'لا يوجد ترخيص معتمد'}</strong>
                      <p className="text-[10px] text-slate-444">هام للمطابقة القانونية والتوظيف الفني بمقاولات المشتريات والبلدية</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl col-span-1 md:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-404">المهارات والقدرات المعرفية الفنية:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-150 rounded-xl">
                      {prof.skills && prof.skills !== '—' ? (
                        prof.skills.split(',').map((skill, si) => (
                          <span key={si} className="bg-slate-50 text-slate-700 text-[11px] px-2.5 py-1 rounded-md border border-slate-205 font-bold">
                            ✨ {skill.trim()}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-450 p-2 italic">لم يتم إدراج الكفاءات الفنية في الخزانة بعد.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Live Digital Document Vault */}
          {employeeFileTab === 'docs' && (
            <div className="space-y-6 animate-slideup font-sans text-right" dir="rtl">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">الخزانة الرقمية وملفات شريك العمل</h3>
                  <p className="text-xs text-slate-400 mt-0.5">عرض المستندات الثبوتية والمصدقة وملفات الرخص والتحميل الآمن</p>
                </div>
                <button
                  onClick={() => {
                    if (!hasPermission('edit_employee')) {
                      triggerToast('عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.', 'error');
                      return;
                    }
                    setShowAddDocForm(!showAddDocForm);
                  }}
                  className={`bg-gold text-slate-900 border-none px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gold-light cursor-pointer flex items-center gap-1 ${!hasPermission('edit_employee') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  إدراج وثيقة جديدة للخزانة
                </button>
              </div>

              {showAddDocForm && (
                <div className="p-5 border border-slate-200 bg-slate-50 rounded-2xl space-y-4 font-sans animate-slideup">
                  <h4 className="text-xs font-bold text-gold">إدراج وثائق معتمدة يدوياً (مخزن السيرة والمستندات)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500">اسم الوثيقة <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="وثيقة السيرة الذاتية..."
                        className="bg-white border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500">رقم أو مرجع الوثيقة</label>
                      <input
                        type="text"
                        placeholder="مثال: WP-23421..."
                        className="bg-white border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold font-mono"
                        value={newDocNo}
                        onChange={(e) => setNewDocNo(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500">تاريخ الانتهاء</label>
                      <input
                        type="date"
                        className="bg-white border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-gold font-mono"
                        value={newDocExpiry}
                        onChange={(e) => setNewDocExpiry(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500">نوع الملف <span className="text-rose-500">*</span></label>
                      <select
                        className="bg-white border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold"
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                      >
                        <option value="PDF">PDF</option>
                        <option value="DOCX">DOCX</option>
                        <option value="PNG">PNG Image</option>
                        <option value="XLSX">XLSX Excel</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500">وصف المستند</label>
                    <textarea
                      rows={2}
                      placeholder="أضف وصفاً موجزاً للوثيقة المرفوعة..."
                      className="bg-white border rounded-lg px-3 py-2 text-xs outline-none focus:border-gold w-full resize-none"
                      value={newDocDescription}
                      onChange={(e) => setNewDocDescription(e.target.value)}
                    />
                  </div>

                  {/* Attachment Uploader */}
                  <div className="border border-dashed border-slate-300 hover:border-gold rounded-xl p-4 bg-white flex flex-col items-center justify-center relative cursor-pointer min-h-[80px]">
                    <input
                      type="file"
                      accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/png,image/jpeg"
                      onChange={handleEmpFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="text-center pointer-events-none space-y-1">
                      <span className="text-base block">📎</span>
                      <p className="text-[11px] font-bold text-slate-700">اسحب الملف أو انقر هنا لتحميل وثيقة الموظف الفعلي</p>
                      <p className="text-[9px] text-slate-404">PDF, DOCX, XLSX, PNG (الحد الأقصى 700 كيلوبايت)</p>
                      {uploadedEmpFileName && (
                        <div className="mt-2 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                          <span>✓ {uploadedEmpFileName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddCustomDoc(e.id)}
                      className="bg-gold text-slate-900 border-none px-4 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-gold-light"
                    >
                      💾 إدراج وحفظ بالخزانة
                    </button>
                    <button
                      onClick={() => {
                        setShowAddDocForm(false);
                        setNewDocName('');
                        setNewDocNo('');
                        setNewDocExpiry('');
                        setNewDocDescription('');
                        setEmpFileBase64('');
                        setUploadedEmpFileName('');
                      }}
                      className="bg-slate-200 text-slate-500 border-none px-4 py-2 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-300"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* Section: Custom Uploaded Documents Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400">🗂️ المستندات والملفات المرفوعة الإضافية</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-right border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black tracking-wider text-[11px] select-none">
                        <th className="p-4">اسم المستند</th>
                        <th className="p-4">نوع الملف</th>
                        <th className="p-4">رقم المرجع</th>
                        <th className="p-4">تاريخ الانتهاء</th>
                        <th className="p-4">الوصف</th>
                        <th className="p-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentEmpCustomDocs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">
                            لا توجد وثائق إضافية مرفوعة في الخزانة الرقمية لهذا الموظف.
                          </td>
                        </tr>
                      ) : (
                        currentEmpCustomDocs.map((docItem, idx) => (
                          <tr key={`custom_${idx}`} className="hover:bg-slate-50/50 group transition duration-150">

                            {/* Name with icon */}
                            <td className="p-4 font-bold text-slate-850">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                  <File className="w-4 h-4 text-amber-600" />
                                </div>
                                <span className="text-xs font-black text-slate-800">{docItem.name}</span>
                              </div>
                            </td>

                            {/* Type */}
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold">
                                {docItem.type}
                              </span>
                            </td>

                            {/* Ref number */}
                            <td className="p-4 font-semibold text-slate-500 font-mono text-xs">
                              {docItem.number || '—'}
                            </td>

                            {/* Expiration date */}
                            <td className="p-4">
                              {getExpiryBadge(docItem.expiry)}
                            </td>

                            {/* Description */}
                            <td className="p-4 text-slate-550 text-xs font-medium max-w-[200px] truncate" title={docItem.description}>
                              {docItem.description || '—'}
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center">
                                {docItem.fileData && (
                                  <button
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = docItem.fileData!;
                                      const ext = docItem.type.toLowerCase();
                                      const filename = `${docItem.name.replace(/\s+/g, '_')}.${ext}`;
                                      link.download = filename;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      triggerToast(`تم تحميل الملف "${docItem.name}" بنجاح.`, 'success');
                                    }}
                                    className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:scale-105 border-none flex items-center justify-center cursor-pointer transition text-xs"
                                    title="تحميل وثيقة حية"
                                  >
                                    📥
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    if (!hasPermission('edit_employee')) {
                                      triggerToast('عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.', 'error');
                                      return;
                                    }
                                    setEditingDoc({
                                      idx,
                                      name: docItem.name,
                                      number: docItem.number,
                                      expiry: docItem.expiry,
                                      type: docItem.type,
                                      description: docItem.description || '',
                                      fileData: docItem.fileData
                                    });
                                  }}
                                  className={`w-8 h-8 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105 border-none flex items-center justify-center cursor-pointer transition text-xs ${!hasPermission('edit_employee') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="تعديل بيانات المستند واستبدال الملف"
                                >
                                  ✏️
                                </button>

                                <button
                                  onClick={() => {
                                    if (!hasPermission('edit_employee')) {
                                      triggerToast('عذراً، لا تمتلك الصلاحية الأمنية لتعديل بيانات الموظف.', 'error');
                                      return;
                                    }
                                    setDocToDelete({
                                      empId: e.id,
                                      idx,
                                      name: docItem.name
                                    });
                                  }}
                                  className={`w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-105 border-none flex items-center justify-center cursor-pointer transition text-xs ${!hasPermission('edit_employee') ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  title="حذف الوثيقة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* TAB 6: Assets & Custody Management */}
          {employeeFileTab === 'assets' && (
            <AssetsTab employeeId={e.id} />
          )}
        </div>
        {renderEditContractModal()}
        {renderEditDocModal(e.id)}
        {renderDeleteConfirmationModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slideup text-right block" dir="rtl">

      {/* Title / Hero Summary Block */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Aesthetic touches */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,151,58,0.15),transparent_45%)]" />
        <div className="space-y-2 relative z-10">
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            📂 ملفات وعقود شركاء العمل والموظفين
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl font-medium leading-relaxed">
            متابعة لآجال تجديد الإقامات ورخص العمل والبلدية لضمان الامتثال لوزارة الموارد البشرية السعودية والتأمينات الإجتماعية (GOSI)، ومراجعة السلالم الماليّة.
          </p>
        </div>
        <div className="shrink-0 relative z-10">
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#c9973a]/80 block">حالة منظومة نطاقات</span>
          <div className={`px-4 py-1.5 rounded-full text-xs font-black border flex items-center gap-1.5 mt-1 animate-pulse ${nitaqatBg}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${nitaqatBadgeColor}`} />
            🇸🇦 {nitaqatLabel}
          </div>
        </div>
      </div>

      {/* KPI Overviews bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold text-[10px] tracking-wide uppercase">إجمالي عقود العمل النشطة</span>
            <div className="text-3xl font-black text-slate-800 font-mono tracking-tight">{activeContractsCount} / {employees.length}</div>
            <p className="text-[10px] font-semibold text-slate-400/95">كل الموظفين موقّعون بموجب عقود موحدة</p>
          </div>
          <div className="w-12 h-12 bg-gold-bg text-gold rounded-2xl flex items-center justify-center font-bold text-lg border border-gold-border/20">
            📜
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold text-[10px] tracking-wide uppercase">تنبيهات انتهاء المستندات (60 يوم)</span>
            <div className="text-3xl font-black text-rose-600 font-mono tracking-tight">{expiringSoonDocsCount + expiredDocsCount}</div>
            <p className="text-[10px] font-semibold text-rose-500">منها {expiredDocsCount} مواعيد منتهية تحتاج لتجديد عاجل</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-rose-100">
            ⚠️
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold text-[10px] tracking-wide uppercase">معدل التوطين والسعودة</span>
            <div className="text-3xl font-black text-slate-800 font-mono tracking-tight">{saudizationPct}%</div>
            <p className="text-[10px] font-semibold text-emerald-600 font-sans">
              {saudiEmployeesCount} موظفون سعوديون مقابل {employees.length - saudiEmployeesCount} مقيمون
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-emerald-100">
            🇸🇦
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1.5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold text-[10px] tracking-wide uppercase">المشاركة بالتأمينات والإشتراكات</span>
            <div className="text-3xl font-black text-indigo-700 font-mono tracking-tight">
              {employees.reduce((acc, curr) => {
                const ded = deductions.find(d => d.empId === curr.id) || { gosiPct: 9.75 };
                return acc + Math.round(curr.salary * (ded.gosiPct / 100));
              }, 0).toLocaleString()} ر.س
            </div>
            <p className="text-[10px] font-semibold text-indigo-500">حصة خصم التأمينات الإجمالية شهرياً</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg border border-indigo-100">
            🛡️
          </div>
        </div>
      </div>

      {/* Critical expirations notifications alert block */}
      {nearExpiryAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 font-sans space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0" />
            <strong className="text-xs font-bold text-orange-700 block">⚠️ تنبيهات المواعيد والوثائق الحرجة (منتهية أو تنتهي خلال 60-90 يوماً):</strong>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearExpiryAlerts.map((alt) => {
              const overdue = alt.daysLeft < 0;
              const colorBg = overdue ? 'border-rose-200 bg-rose-50/50 text-rose-750' : 'border-orange-200 bg-white text-orange-750';
              return (
                <div
                  key={alt.id}
                  onClick={() => {
                    setSelectedEmployeeId(alt.empId);
                    setEmployeeFileTab('contract');
                  }}
                  className={`border text-[11px] rounded-xl px-4 py-2.5 flex flex-col gap-1 cursor-pointer hover:scale-[1.01] transition-transform ${colorBg}`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-extrabold">{alt.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">فتح العقد</span>
                  </div>
                  <p className="text-[10px] opacity-90 leading-relaxed font-semibold">
                    ملف ({alt.type}) ينتهي بالموعد: {alt.date} <br />
                    <span className={overdue ? 'text-rose-600 font-bold' : 'text-orange-600 font-bold'}>
                      {overdue ? `❌ منتهي منذ ${Math.abs(alt.daysLeft)} يوماً` : `⏰ ينتهي بعد ${alt.daysLeft} يوماً`}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Filter and Control Desk panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">

        {/* Title and stats bar */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800">تفاصيل وسجلات عقود شركاء العمل</h2>
            <p className="text-xs text-slate-400 mt-1">تتبع الوظائف، الإقامات، عقود العمل الموحدة ونطاقات بالتعلم النشط</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportToExcel}
              className="bg-emerald-600 border-none hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl cursor-pointer text-xs font-extrabold flex items-center justify-center gap-1 shadow-md transition"
              title="تصدير السجلات المصفاة إلى ملف Excel"
            >
              📊 تصدير Excel (CSV)
            </button>
            <div className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              السجلات المتطابرة مع الفلتر: <span className="text-slate-850 font-black">{filteredEmployees.length}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Text search */}
          <div className="relative">
            <input
              type="text"
              placeholder="البحث باسم الموظف أو وظيفته..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 border border-slate-200 text-slate-700 font-semibold focus:border-gold outline-none rounded-xl text-xs bg-slate-50/50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3" />
          </div>

          {/* Department Filter */}
          <div className="flex flex-col gap-1">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 text-slate-700 font-semibold focus:border-gold outline-none rounded-xl text-xs bg-slate-50"
            >
              <option value="الكل">جميع الأقسام</option>
              {departments.filter(d => d !== 'الكل').map((dept, di) => (
                <option key={di} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Nationality filter */}
          <div className="flex flex-col gap-1">
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 text-slate-700 font-semibold focus:border-gold outline-none rounded-xl text-xs bg-slate-50"
            >
              <option value="الكل">جميع الجنسيات (الكل)</option>
              <option value="سعودي">المواطنون السعوديون 🇸🇦</option>
              <option value="مقيم">المقيمون والوافدون 🌏</option>
            </select>
          </div>

          {/* Expiration and status filter */}
          <div className="flex flex-col gap-1">
            <select
              value={contractStatusFilter}
              onChange={(e) => setContractStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 text-slate-700 font-semibold focus:border-gold outline-none rounded-xl text-xs bg-slate-50"
            >
              <option value="الكل">حالة العقود (الكل)</option>
              <option value="نشط">سارٍ ونشط</option>
              <option value="ينتهي قريباً">يقارب النهاية (90 يوم)</option>
              <option value="منتهي">تجاوز النهاية (منتهي)</option>
            </select>
          </div>

        </div>

        {/* Index Table Grid with beautiful desktop precision and mobile fluidity */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-white">
          <table className="w-full text-right border-collapse text-xs md:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-120 text-slate-500 font-black tracking-wider text-[11px] select-none">
                <th className="p-4">شريك العمل الموظف</th>
                <th className="p-4">المسمى الوظيفي والدائرة</th>
                <th className="p-4 text-center">أهليّة الجنسية</th>
                <th className="p-4">بداية العقد</th>
                <th className="p-4">انتهاء العقد</th>
                <th className="p-4">بطاقة الإقامة (Expat)</th>
                <th className="p-4">رخصة العمل</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center font-bold text-slate-400 italic">
                    لا تتوفر أي وثائق أو عقود موظفين مطابقة للفلاتر النشطة حالياً.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((e) => {
                  const contract = contracts.find(c => c.empId === e.id);
                  const isSaudi = contract ? !contract.iqamaExp : true;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 group transition duration-150">

                      {/* Name Card */}
                      <td className="p-4 font-bold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-xs font-black shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                            {e.name[0]}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-850 truncate max-w-[150px]">{e.name}</span>
                            <span className="text-[9.5px] text-slate-400 font-medium font-mono">ID: {e.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Job / dept */}
                      <td className="p-4 text-slate-600 font-semibold">
                        <span className="block text-xs font-bold">{e.job}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{e.dept}</span>
                      </td>

                      {/* Nationality Badge */}
                      <td className="p-4 text-center">
                        {isSaudi ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[10px] font-bold">🇸🇦 مواطن</span>
                        ) : (
                          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-md text-[10px] font-bold">🌏 مقيم</span>
                        )}
                      </td>

                      {/* Contract start */}
                      <td className="p-4 text-slate-500 font-semibold font-mono text-xs">
                        {contract?.start || '—'}
                      </td>

                      {/* Contract Expire */}
                      <td className="p-4">
                        {getExpiryBadge(contract?.end)}
                      </td>

                      {/* Residence Expire */}
                      <td className="p-4">
                        {getExpiryBadge(contract?.iqamaExp)}
                      </td>

                      {/* Municipality permit expire */}
                      <td className="p-4">
                        {getExpiryBadge(contract?.workPermitExp)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => openEditContract(e.id)}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                            title="تعديل تواريخ وبطاقات"
                          >
                            ✏️ تعديل
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmployeeId(e.id);
                              setEmployeeFileTab('info');
                            }}
                            className="px-2.5 py-1.5 text-xs font-black text-gold bg-gold-bg border border-gold-border hover:bg-gold hover:text-slate-950 transition-colors rounded-lg cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            📋 فتح الملف
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {renderEditContractModal()}
      {selectedEmployeeId && renderEditDocModal(selectedEmployeeId)}
      {renderDeleteConfirmationModal()}

      {/* Floating simulated upload progress overlay */}
      {uploadProgress !== null && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[140] transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-xs shadow-2xl text-center space-y-4 animate-scaleup">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-gold animate-spin" />
              <span className="text-xs font-mono font-black text-slate-800 relative z-10">{uploadProgress}%</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">جاري معالجة وتشفير الملف...</h4>
              <p className="text-[10px] text-slate-404 mt-1">تطبيق ضغط متناسق لمنع تجاوز القيود لحجم التخزين</p>
            </div>
            <div className="w-full bg-slate-105 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gold h-full transition-all duration-150"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Dynamic feed-back Toast notification block */}
      {toastMessage && (
        <div className={`fixed bottom-5 left-5 z-[140] flex items-center gap-2 border px-4 py-3 rounded-xl shadow-lg animate-slideup ${toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
            toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
              'bg-indigo-605 text-white border-indigo-700'
          }`}>
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 text-white" />}
          {toastMessage.type === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0 text-white" />}
          {toastMessage.type === 'info' && <Clock className="w-5 h-5 flex-shrink-0 text-white" />}
          <span className="text-xs font-bold leading-normal font-sans" dir="rtl">{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
};

// Help helper icon component
const DollarSignComponent: React.FC = () => {
  return (
    <div className="w-10 h-10 bg-gold-bg text-gold rounded-xl flex items-center justify-center font-bold text-sm">
      💰
    </div>
  );
};
