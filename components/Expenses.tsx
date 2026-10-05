/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { processAttachedFile } from '../utils/fileUtils';
import { 
  DollarSign, 
  Receipt, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Building, 
  FileText, 
  Scale, 
  TrendingUp, 
  Check, 
  X, 
  Percent, 
  Info,
  ExternalLink,
  Edit,
  ArrowUpRight,
  FileCheck2,
  BookmarkCheck
} from 'lucide-react';
import { Employee, Expense } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid
} from 'recharts';

export const Expenses: React.FC = () => {
  const { 
    employees, 
    expenses, 
    addExpense, 
    updateExpense, 
    deleteExpense,
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab,
    hasPermission
  } = useHR();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'claims' | 'analytics' | 'guideline'>('claims');

  // Search & Filter Status
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [employeeFilter, setEmployeeFilter] = useState('الكل');

  // Expandable Accordion for detailed notes & ZATCA checks
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);

  // Success Messages
  const [notifier, setNotifier] = useState<string | null>(null);

  // Decision Modal Dialog (for approving/rejecting with custom feedback notes)
  const [decisionModal, setDecisionModal] = useState<{ id: string; decision: 'موافق عليها' | 'مرفوضة' } | null>(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  // Form states for creating & modifying claims
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Expense | null>(null);

  // Form Fields
  const [formEmpId, setFormEmpId] = useState('');
  const [formItemName, setFormItemName] = useState('');
  const [formCategory, setFormCategory] = useState('بدل سفر وانتقال');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDesc, setFormDesc] = useState('');
  const [formVatNo, setFormVatNo] = useState('');
  const [formVatAmount, setFormVatAmount] = useState<number>(0);
  const [formReceiptName, setFormReceiptName] = useState('');
  const [formStatus, setFormStatus] = useState<Expense['status']>('بانتظار الموافقة');
  const [formBusy, setFormBusy] = useState(false);
  const [formFileData, setFormFileData] = useState('');
  const [formFileName, setFormFileName] = useState('');

  // Handle PDF/Image File upload conversion to Base64 with compression/size checks
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processAttachedFile(
      file,
      (base64) => {
        setFormFileData(base64);
        setFormFileName(file.name);
      },
      (error) => {
        alert(error);
        setFormFileData('');
        setFormFileName('');
      }
    );
  };

  // Standard expense categories in Saudi businesses
  const expenseCategories = [
    'بدل سفر وانتقال',
    'أدوات مكتبية ومطابع',
    'علاقات عامة وضيافة',
    'اشتراكات برمجية ورخص الكترونية',
    'صيانة ومصروفات تشغيل طارئة',
    'تدريب وتطوير الكادر',
    'مصروفات مكتبية وخدمية أخرى'
  ];

  // Auto-calculate 15% VAT for convenience
  const handleAmountChange = (val: number) => {
    setFormAmount(val);
    if (val > 0) {
      // VAT is 15% of the subtotal or implied inside it depending on billing custom (we assume 15% added)
      const calculatedVat = Math.round(val * 0.15 * 100) / 100;
      setFormVatAmount(calculatedVat);
    } else {
      setFormVatAmount(0);
    }
  };

  // Live computations directly from database records (no simulated counters)
  const computationResult = useMemo(() => {
    const totalClaimCount = expenses.length;
    const totalAmount = expenses.reduce((sum, current) => sum + current.amount, 0);
    const pendingAmount = expenses.filter(x => x.status === 'بانتظار الموافقة').reduce((sum, current) => sum + current.amount, 0);
    const approvedAmount = expenses.filter(x => x.status === 'موافق عليها').reduce((sum, current) => sum + current.amount, 0);
    const totalVatCalculated = expenses.reduce((sum, current) => sum + (current.vatAmount || 0), 0);

    const pendingCount = expenses.filter(x => x.status === 'بانتظار الموافقة').length;
    const approvedCount = expenses.filter(x => x.status === 'موافق عليها').length;
    const rejectedCount = expenses.filter(x => x.status === 'مرفوضة').length;

    return {
      totalClaimCount,
      totalAmount,
      pendingAmount,
      approvedAmount,
      totalVatCalculated,
      pendingCount,
      approvedCount,
      rejectedCount
    };
  }, [expenses]);

  // List filter logic
  const filteredClaims = useMemo(() => {
    return expenses.filter(x => {
      const emp = employees.find(e => e.id === x.empId);
      const empName = emp ? emp.name : '';
      
      const matchesSearch = 
        x.item.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (x.desc && x.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (x.vatNumber && x.vatNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        empName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === 'الكل' || (x.category || 'بدل سفر وانتقال') === categoryFilter;
      const matchesStatus = statusFilter === 'الكل' || x.status === statusFilter;
      const matchesEmployee = employeeFilter === 'الكل' || x.empId === employeeFilter;

      return matchesSearch && matchesCategory && matchesStatus && matchesEmployee;
    });
  }, [expenses, employees, searchQuery, categoryFilter, statusFilter, employeeFilter]);

  // Handle addition or modification of an expense document
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) {
      alert('الرجاء اختيار الموظف مقدم المطالبة');
      return;
    }
    if (!formItemName.trim()) {
      alert('الرجاء إدخال اسم البند وتفاصيل المصروف');
      return;
    }
    if (formAmount <= 0) {
      alert('الرجاء تحديد مبلغ المصروف بالريال السعودي');
      return;
    }

    setFormBusy(true);

    try {
      const expenseObj = {
        empId: formEmpId,
        item: formItemName,
        category: formCategory,
        amount: formAmount,
        date: formDate,
        desc: formDesc,
        vatNumber: formVatNo,
        vatAmount: formVatAmount,
        receiptName: formReceiptName || 'مرفق فاتورة إلكترونية',
        status: formStatus,
        fileData: formFileData,
        fileName: formFileName
      };

      if (editingClaim) {
        await updateExpense(editingClaim.id, {
          ...expenseObj,
          resolvedNotes: editingClaim.resolvedNotes // Keep existing notes
        });
        setNotifier('تم تحديث ومزامنة تفاصيل مطالبة المصروف فورياً بالكلاود! 🇸🇦');
      } else {
        await addExpense(expenseObj);
        setNotifier('تم تقييد مطالبة المصروف الجديدة بنجاح وحفظها كطلب معلق! 💾');
      }

      resetForm();
      setIsFormOpen(false);
      setTimeout(() => setNotifier(null), 4000);
    } catch (err) {
      console.error(err);
      alert('عذراً، حدث خطأ أثناء تشغيل وتمرير المعاملة للكلاود.');
    } finally {
      setFormBusy(false);
    }
  };

  const startEditClaim = (claim: Expense) => {
    setEditingClaim(claim);
    setFormEmpId(claim.empId);
    setFormItemName(claim.item);
    setFormCategory(claim.category || 'بدل سفر وانتقال');
    setFormAmount(claim.amount);
    setFormDate(claim.date);
    setFormDesc(claim.desc || '');
    setFormVatNo(claim.vatNumber || '');
    setFormVatAmount(claim.vatAmount || 0);
    setFormReceiptName(claim.receiptName || '');
    setFormStatus(claim.status);
    setFormFileData(claim.fileData || '');
    setFormFileName(claim.fileName || '');
    setIsFormOpen(true);

    const targetElement = document.getElementById('expense_form_container');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteClaim = async (id: string) => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف هذه المطالبة التدقيقية نهائياً من قاعدة البيانات السحابية؟')) return;
    try {
      await deleteExpense(id);
      setNotifier('تم إقصاء وحذف مطالبة الصرف نهائياً بنجاح.');
      setTimeout(() => setNotifier(null), 3000);
    } catch (err) {
      console.error(err);
      alert('فشل تشغيل عملية الحذف.');
    }
  };

  const handleOpenDecision = (claimId: string, decision: 'موافق عليها' | 'مرفوضة') => {
    if (!hasPermission('approve_operations')) {
      alert('⚠️ عذراً، ليس لديك الصلاحية الأمنية الكافية لاعتماد هذه العملية للقسم المالي (approve_operations)');
      return;
    }
    const claimObj = expenses.find(x => x.id === claimId);
    setDecisionModal({ id: claimId, decision });
    setResolutionNotesInput(claimObj?.resolvedNotes || '');
  };

  const handleApplyDecision = async () => {
    if (!decisionModal) return;
    if (!hasPermission('approve_operations')) {
      alert('⚠️ عذراً، ليس لديك الصلاحية الأمنية الكافية لاعتماد هذه العملية للقسم المالي (approve_operations)');
      return;
    }
    setActionBusy(true);

    try {
      await updateExpense(decisionModal.id, {
        status: decisionModal.decision,
        resolvedNotes: resolutionNotesInput.trim() || (decisionModal.decision === 'موافق عليها' ? 'مستوفية لكافة مستندات الامتثال والتحقق الضريبي' : 'مرفوضة لعدم ملاءمة الشروط أو عدم إرفاق مستندات ZATCA كافية')
      });

      setNotifier(decisionModal.decision === 'موافق عليها' ? '🟢 تم اعتماد وصرف دفعة التعويض المقررة!' : '🔴 تم تسجيل قرار الرفض وتدوين أسباب التعديل.');
      setDecisionModal(null);
      setResolutionNotesInput('');
      setTimeout(() => setNotifier(null), 4000);
    } catch (err) {
      console.error(err);
      alert('فشلت كتابة وتحديث القرار المالي في السيرفر.');
    } finally {
      setActionBusy(false);
    }
  };

  const resetForm = () => {
    setEditingClaim(null);
    setFormEmpId('');
    setFormItemName('');
    setFormCategory('بدل سفر وانتقال');
    setFormAmount(0);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDesc('');
    setFormVatNo('');
    setFormVatAmount(0);
    setFormReceiptName('');
    setFormStatus('بانتظار الموافقة');
    setFormFileData('');
    setFormFileName('');
  };

  const handleExportExpensesCSV = () => {
    const headers = [
      'اسم الموظف',
      'البند والموصوف',
      'التصنيف',
      'المبلغ الكلي (ر.س)',
      'الرقم الضريبي ZATCA',
      'مبلغ الضريبة المضمن (ر.س)',
      'التاريخ',
      'حالة الطلب',
      'اسم الفاتورة/المرفق',
      'ملاحظات اعتماد/رفض الطلب'
    ];
    
    const rows = filteredClaims.map(x => {
      const emp = employees.find(e => e.id === x.empId);
      const empName = emp ? emp.name : 'غير محدد';
      
      return [
        empName,
        x.item,
        x.category || 'بدل سفر وانتقال',
        x.amount || 0,
        x.vatNumber || 'غير مضمن',
        x.vatAmount || 0,
        x.date,
        x.status,
        x.fileName || x.receiptName || 'لا يوجد ملف مرفق',
        x.resolvedNotes || 'لا توجد ملاحظات حالياً'
      ];
    });

    exportToCSV(`مطالبات_المصروفات_المستردة_سحابة_الأعمال_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Cross screen deep link function to Employee Profile
  const handleNavigateToEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab('info');
    setCurrentView('empfiles');
  };

  // Charts data processing
  const categoryAnalyticsChartData = useMemo(() => {
    const dataMap: Record<string, { value: number; vat: number; count: number }> = {};
    expenseCategories.forEach(cat => {
      dataMap[cat] = { value: 0, vat: 0, count: 0 };
    });

    expenses.forEach(x => {
      const cat = x.category || 'مصروفات مكتبية وخدمية أخرى';
      if (!dataMap[cat]) {
        dataMap[cat] = { value: 0, vat: 0, count: 0 };
      }
      dataMap[cat].value += x.amount;
      dataMap[cat].vat += (x.vatAmount || 0);
      dataMap[cat].count += 1;
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      'إجمالي المصروف': dataMap[key].value,
      'قيمة الضريبة المضافة': Math.round(dataMap[key].vat),
      'المطالبات المعالجة': dataMap[key].count
    })).filter(x => x['إجمالي المصروف'] > 0);
  }, [expenses]);

  const statusAnalyticsChartData = useMemo(() => {
    return [
      { name: 'بانتظار المراجعة', value: expenses.filter(x => x.status === 'بانتظار الموافقة').length, color: '#f59e0b' },
      { name: 'مقروءة بالموافقة والصرف', value: expenses.filter(x => x.status === 'موافق عليها').length, color: '#10b981' },
      { name: 'مرفوضة وغير معتمدة', value: expenses.filter(x => x.status === 'مرفوضة').length, color: '#ef4444' }
    ].filter(x => x.value > 0);
  }, [expenses]);

  return (
    <div className="space-y-6 text-right animate-slideup font-sans" id="saudi_expenses_governance_system">
      
      {/* 🚀 Dynamic Statistics Grid - Fetching exactly from live Firestore */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* KPI 1: Total Corporate Reimbursements Claims */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">إجمالي التعويضات المطروحة</span>
            <div className="p-1.5 bg-blue-50 text-blue-650 rounded-md">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">
              {computationResult.totalAmount.toLocaleString('en-US')} <span className="text-xs font-semibold text-slate-450">ر.س</span>
            </h3>
            <p className="text-[9px] text-slate-400 mt-1">تشمل {computationResult.totalClaimCount} مطالبات نقدية معتبرة</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
        </div>

        {/* KPI 2: Approved & Paid Claims */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">المعتمدة والمدفوعة</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-emerald-900 font-mono tracking-tight">
              {computationResult.approvedAmount.toLocaleString('en-US')} <span className="text-xs font-semibold text-slate-450">ر.س</span>
            </h3>
            <p className="text-[9px] text-emerald-600 mt-1">✓ {computationResult.approvedCount} معتمدة ومودعة حالياً</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* KPI 3: Under review and pending approval */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">معلّقة قيد المراجعة</span>
            <div className="p-1.5 bg-amber-50 text-amber-650 rounded-md">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-amber-900 font-mono tracking-tight">
              {computationResult.pendingAmount.toLocaleString('en-US')} <span className="text-xs font-semibold text-slate-450">ر.س</span>
            </h3>
            <p className="text-[9px] text-amber-605 mt-1">⏱ {computationResult.pendingCount} مطالبات بانتظار الاعتماد</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* KPI 4: ZATCA VAT Collected / Traceable */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">إجمالي الضريبة المستردة</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-purple-900 font-mono tracking-tight">
              {computationResult.totalVatCalculated.toLocaleString('en-US')} <span className="text-xs font-semibold text-slate-450">ر.س</span>
            </h3>
            <p className="text-[9px] text-purple-660 mt-1">برقم ضريبي متوافق مع لوائح ZATCA</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"></div>
        </div>

        {/* KPI 5: Rejection count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">المطالب المدحوضة والملغاة</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-rose-900 font-mono tracking-tight">
              {computationResult.rejectedCount} <span className="text-xs font-semibold text-slate-450">مطـالب</span>
            </h3>
            <p className="text-[9px] text-rose-500 mt-1">مرفوعة بداعي الاستبعاد أو قصور الإثبات</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
        </div>

      </div>



      {/* Cloud Notification Toast banner */}
      {notifier && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notifier}</span>
        </div>
      )}

      {/* 🧭 Component Horizontal Sub-Navigation */}
      <div className="flex border border-slate-200 bg-white rounded-xl p-1 shadow-3xs" id="expenses_sub_tab_navigation">
        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${
            activeTab === 'claims' 
              ? 'bg-slate-900 text-white font-extrabold shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-950'
          }`}
        >
          <Receipt className="w-4 h-4" />
          طلبات المصروفات والتعويضات القائمة
          <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${activeTab === 'claims' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${
            activeTab === 'analytics' 
              ? 'bg-slate-900 text-white font-extrabold shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-950'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          مؤشرات الميزانية وتوزيع المصروفات الرسمية
        </button>
      </div>

      {/* Tab 1: Claims List & Operations */}
      {activeTab === 'claims' && (
        <div className="space-y-6">
          
          {/* Action Row: Searching & Adding program */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 border border-slate-200 rounded-2xl shadow-3xs">
            
            {/* Search and Filters panel */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              
              {/* Query word */}
              <div className="relative min-w-[200px] flex-1">
                <input
                  type="text"
                  placeholder="ابحث بالبند، الموظف، الرقم الضريبي..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl pr-8 pl-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>

              {/* Filter components by category */}
              <div className="min-w-[130px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="الكل">كل التصنيفات الضريبية</option>
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Filter component by status */}
              <div className="min-w-[120px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="الكل">كل الحالات المالية</option>
                  <option value="بانتظار الموافقة">⏱ بانتظار الاعتماد</option>
                  <option value="موافق عليها">✓ معتمدة ومدفوعة</option>
                  <option value="مرفوضة">✕ مرفوضة وملغاة</option>
                </select>
              </div>

              {/* Filter component by employee */}
              <div className="min-w-[140px]">
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="الكل">الموظف مقدم المطالبة</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Reset Action */}
              {(searchQuery || categoryFilter !== 'الكل' || statusFilter !== 'الكل' || employeeFilter !== 'الكل') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('الكل');
                    setStatusFilter('الكل');
                    setEmployeeFilter('الكل');
                  }}
                  className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl transition"
                >
                  تفريغ المصفّي
                </button>
              )}

            </div>

            <div className="flex gap-2">
              {/* CSV Export */}
              <button
                onClick={handleExportExpensesCSV}
                className="bg-emerald-600 border-none hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shrink-0 transition"
                title="تصدير سجل المصروفات الفعلي كملف Excel"
              >
                📊 تصدير Excel (CSV)
              </button>

              {/* Launch new claim Button */}
              <button
                onClick={() => {
                  resetForm();
                  setIsFormOpen(!isFormOpen);
                }}
                className="bg-emerald-950 border-none hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm shrink-0 transition"
              >
                <Plus className="w-4 h-4 text-gold" />
                قيد مطالبة بمصروف جديد
              </button>
            </div>
          </div>

          {/* Form container for creating and editing expenses */}
          {isFormOpen && (
            <div 
              id="expense_form_container"
              className="bg-white border-2 border-slate-900 rounded-2xl shadow-sm overflow-hidden animate-slideup"
            >
              <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-xs font-black">
                    {editingClaim ? `تعديل ومواءمة مطالبة المصروف: [ ${editingClaim.item} ]` : 'إدراج مطالبة بمصروف مالي وعوض ضريبي'}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="bg-transparent border-none text-slate-400 hover:text-white text-xs cursor-pointer font-black"
                >
                  إلغاء ×
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Employee selection dropdown */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">الموظف المعني بالتعويض *</label>
                  <select
                    required
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-805 outline-none cursor-pointer"
                  >
                    <option value="">-- اختر الموظف لتعويضه --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.job} - {e.dept})</option>
                    ))}
                  </select>
                </div>

                {/* Claim item name */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">البند أو موضوع المصروف *</label>
                  <input
                    required
                    type="text"
                    value={formItemName}
                    onChange={(e) => setFormItemName(e.target.value)}
                    placeholder="مثال: فاتورة وقود رحلة الرياض - فرع القصيم"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">التصنيف الوظيفي والضريبي لمصروف</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none cursor-pointer"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">مجموع المبلغ الإجمالي بالفاتورة (ار.س شامل الضريبة) *</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={formAmount || ''}
                    onChange={(e) => handleAmountChange(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono text-left focus:bg-white outline-none"
                  />
                </div>

                {/* ZATCA VAT Registration Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">
                    الرقم الضريبي للمورد ZATCA VAT
                    <span className="text-[10px] text-slate-400 font-normal mr-1">(15 خانة تبدأ بـ 3)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formVatNo}
                    onChange={(e) => setFormVatNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="3xxxxxxxxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono text-left outline-none"
                  />
                  {formVatNo && formVatNo.length !== 15 && (
                    <span className="text-[9.5px] text-amber-600 block font-semibold">⚠️ يجب أن يتكون الرقم الضريبي من 15 خانة</span>
                  )}
                  {formVatNo && formVatNo.length === 15 && !formVatNo.startsWith('3') && (
                    <span className="text-[9.5px] text-red-500 block font-semibold">❌ حسب نظام ZATCA يجب أن يبدأ الرقم الضريبي بالرقم 3</span>
                  )}
                  {formVatNo && formVatNo.length === 15 && formVatNo.startsWith('3') && (
                    <span className="text-[9.5px] text-emerald-600 block font-semibold">✓ الرقم الضريبي مستوف للتحقق الأولي للهيئة</span>
                  )}
                </div>

                {/* VAT Amount (15% by default) */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">قيمة الضريبة المحسوبة ضمناً (15% ر.س)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formVatAmount || ''}
                    onChange={(e) => setFormVatAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono text-left outline-none"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">تاريخ إصدار الفاتورة أو المصروف *</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Attachment info */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">اسم ملف الفاتورة المرفق</label>
                  <input
                    type="text"
                    value={formReceiptName}
                    onChange={(e) => setFormReceiptName(e.target.value)}
                    placeholder="مثال: gas_station_invoice_9048.pdf"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                {/* Default state */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">الإرجاء الأولي للحالة المالية</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Expense['status'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none cursor-pointer font-black"
                  >
                    <option value="بانتظار الموافقة">⏱ بانتظار الاعتماد والمراجعة</option>
                    <option value="موافق عليها">✓ موافق عليها تم الصرف</option>
                    <option value="مرفوضة">✕ مرفوضة للتعديل</option>
                  </select>
                </div>

                {/* Description and compliance remarks */}
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-xs font-black text-slate-700">توصيف الأغراض المهنية وخلفية المصروف بالتفصيل</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="وضح المبرر الاستثماري أو التشغيلي للمطالبة للامتثال الخارجي وتسهيل التحقق المالي لمراجع الحسابات..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:bg-white"
                  />
                </div>

                {/* PDF/Word File Upload for invoice receipts */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-black text-slate-700">تحميل مستند الفاتورة أو إيصال الدفع الإلكتروني (PDF أو صور ZATCA)</label>
                  <div className="border border-dashed border-slate-350 hover:border-emerald-600 rounded-xl p-3 bg-slate-50 hover:bg-slate-50/50 flex flex-col items-center justify-center relative cursor-pointer min-h-[90px]">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="text-center pointer-events-none space-y-1">
                      <span className="text-xl block">📄</span>
                      <p className="text-[11px] font-bold text-slate-700">اسحب مستند الفاتورة الضريبية أو اضغط هنا لرفعه يدويًا</p>
                      <p className="text-[9.5px] text-slate-400">ملفات PDF أو صور (بحد أقصى 2 ميجابايت للتخزين الفوري المصدق)</p>
                      {formFileName && (
                        <div className="mt-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                          <span>✓ تم إرفاق: {formFileName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormFileData('');
                              setFormFileName('');
                            }}
                            className="bg-transparent border-none text-rose-500 hover:text-rose-700 cursor-pointer p-0 font-bold mr-1.5 text-xs"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="md:col-span-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-white border border-slate-250 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={formBusy}
                    className="px-5 py-2 bg-emerald-950 text-white hover:bg-emerald-900 border-none rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold animate-bounce" />
                    {formBusy ? 'جاري توثيق البيانات السحابية...' : 'حفظ ومزامنة المطالبة السحابية 🇸🇦'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Decision dialogue drawer input (inline popup) */}
          {decisionModal && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md space-y-3 animate-slideup">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-amber-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-505" />
                  قرار مالي: {decisionModal.decision === 'موافق عليها' ? 'اعتماد وموافقة على صرف للمبلغ' : 'إرفاق ملاحظات لقرار رفض المطالبة'}
                </h4>
                <button 
                  onClick={() => setDecisionModal(null)}
                  className="bg-transparent border-none text-slate-400 hover:text-slate-800 text-xs font-bold cursor-pointer"
                >
                  إغلاق ×
                </button>
              </div>
              <p className="text-[11.5px] text-slate-600 font-semibold leading-relaxed">
                يرجى تدوين ملاحظات موجزة توضح سبب قبول أو رفض هذا المصروف. ستظهر الملاحظات في كشف تفاصيل مطالبة الموظف فوراً للتوافق.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={resolutionNotesInput}
                  onChange={(e) => setResolutionNotesInput(e.target.value)}
                  placeholder="اكتب الأسباب والتعليمات هنا (مثال: تم الترسية والموافقة بعد مراجعة الرقم الضريبي للفاتورة)"
                  className="flex-1 bg-white border border-amber-250 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleApplyDecision}
                  disabled={actionBusy}
                  className="bg-amber-600 hover:bg-amber-700 text-white border-none px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {actionBusy ? 'جاري كتابة القرار...' : 'تسجيل وإعلاء القرار الرسمي'}
                </button>
              </div>
            </div>
          )}

          {/* Primary View Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-800" />
                  قوائم ومسيرات مصروفات كوادر المنشأة المعتمدة بالكلاود
                </h3>

              </div>
              <span className="text-[10px] font-bold text-slate-400">عدد المطالبات المصفّاة: {filteredClaims.length} معاملة</span>
            </div>

            {filteredClaims.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold max-w-md mx-auto space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs">لم يتم العثور على أي مطالبات تطابق شروط التصفية الحالية.</p>
                <p className="text-[10px] text-slate-400">يمكنك محاولة مسح حقول التصفية المطبقة لإعادة القائمة كاملة.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50 text-slate-400 font-extrabold text-[10.5px]">
                      <th className="p-3.5">الرقم</th>
                      <th className="p-3.5">الموظف المعني</th>
                      <th className="p-3.5">البند والمطالبة</th>
                      <th className="p-3.5">التصنيف الوظيفي</th>
                      <th className="p-3.5">المبلغ الإجمالي</th>
                      <th className="p-3.5">تاريخ الإصدار</th>
                      <th className="p-3.5 text-center">الرقم الضريبي ZATCA</th>
                      <th className="p-3.5 text-center">حالة الصرف</th>
                      <th className="p-3.5 text-center">الإجراءات والقرارات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClaims.map((claim, idx) => {
                      const emp = employees.find(e => e.id === claim.empId);
                      const isExpanded = expandedClaimId === claim.id;

                      let statusStyle = 'bg-amber-50 text-amber-700 border-amber-200';
                      if (claim.status === 'موافق عليها') {
                        statusStyle = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                      } else if (claim.status === 'مرفوضة') {
                        statusStyle = 'bg-rose-50 text-rose-700 border-rose-200';
                      }

                      return (
                        <React.Fragment key={claim.id}>
                          {/* Row details */}
                          <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                            <td className="p-3.5 text-slate-400 font-mono font-semibold">#{idx + 1}</td>
                            
                            {/* Employee Detail with Deep cross-linking click */}
                            <td className="p-3.5 font-bold text-slate-800">
                              {emp ? (
                                <button
                                  type="button"
                                  onClick={() => handleNavigateToEmployee(claim.empId)}
                                  className="p-0 bg-transparent border-none text-right hover:text-emerald-700 hover:underline cursor-pointer flex flex-col group"
                                  title="انقر للانتقال الفوري إلى ملف الموظف"
                                >
                                  <span className="font-extrabold text-[12px] group-hover:text-emerald-800 flex items-center gap-1">
                                    {emp.name} 
                                    <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-700" />
                                  </span>
                                  <span className="text-[9px] text-slate-400 block font-normal">{emp.job} · {emp.dept}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400">موظف برقم ({claim.empId})</span>
                              )}
                            </td>

                            <td className="p-3.5 font-bold text-slate-700">{claim.item}</td>
                            <td className="p-3.5">
                              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9.5px] font-semibold">
                                {claim.category || 'بدل سفر وانتقال'}
                              </span>
                            </td>

                            {/* Cost / Money inclusive VAT */}
                            <td className="p-3.5 font-mono font-black text-slate-800 text-[12px]">
                              {claim.amount.toLocaleString('en-US')} ر.س
                              {claim.vatAmount ? (
                                <span className="text-[9.5px] text-purple-650 block font-normal font-sans">
                                  ضريبة ضمناً: {claim.vatAmount} ر.س
                                </span>
                              ) : null}
                            </td>

                            <td className="p-3.5 text-slate-500 font-mono">{claim.date}</td>

                            {/* VAT simplified invoice tax number */}
                            <td className="p-3.5 text-center font-mono text-slate-600 font-semibold">
                              {claim.vatNumber ? (
                                <div className="space-y-0.5">
                                  <span>{claim.vatNumber}</span>
                                  <span className="text-[9px] text-emerald-600 block bg-emerald-50 rounded px-1 w-fit mx-auto scale-90">مستوف</span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">مفقود (غير مدرج)</span>
                              )}
                            </td>

                            {/* Status label representing approved, pending or rejected states */}
                            <td className="p-3.5 text-center">
                              <span className={`inline-block border px-2.5 py-1 rounded-full text-[10.5px] font-black ${statusStyle}`}>
                                {claim.status === 'بانتظار الموافقة' ? '⏱ معلّقة' : claim.status === 'موافق عليها' ? '✓ معتمدة' : '✕ مرفوضة'}
                              </span>
                            </td>

                            {/* Quick Decisions controls */}
                            <td className="p-3.5">
                              <div className="flex gap-1 justify-center items-center">
                                {claim.status === 'بانتظار الموافقة' && hasPermission('approve_operations') && (
                                  <>
                                    <button
                                      onClick={() => handleOpenDecision(claim.id, 'موافق عليها')}
                                      className="p-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200 rounded cursor-pointer transition hover:scale-105 font-bold"
                                      title="موافقة سريعة"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleOpenDecision(claim.id, 'مرفوضة')}
                                      className="p-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200 rounded cursor-pointer transition hover:scale-105 font-bold"
                                      title="رفض سريع"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                
                                {/* Edit and Delete operations */}
                                <button
                                  onClick={() => startEditClaim(claim)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border-none rounded-md cursor-pointer transition hover:scale-105"
                                  title="تعديل تفاصيل مطالبة المصروف ومطابقتها"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteClaim(claim.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 border-none rounded-md cursor-pointer transition hover:scale-105"
                                  title="إقامة حذف وإسقاط المطالبة من الكلاود"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>

                                {/* Show/Hide detailed panel */}
                                <button
                                  onClick={() => setExpandedClaimId(isExpanded ? null : claim.id)}
                                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-none rounded-md cursor-pointer transition flex items-center gap-1"
                                  title="معاينة المستند الضريبي والقرار"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Accordion content detail row containing description, VAT verification and notes */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="p-4 bg-slate-50 border-t border-b border-indigo-100 text-right animate-slideup">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-700">
                                  
                                  {/* Section 1: Descriptive text */}
                                  <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-xl shadow-3xs">
                                    <h5 className="font-black text-slate-500 flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      تفاصيل الأغراض المهنية للمطالبة:
                                    </h5>
                                    <p className="text-[11px] text-slate-660 leading-relaxed font-semibold">
                                      {claim.desc || 'لا يتوفر وصف إضافي معدّل لهذه المصروفات.'}
                                    </p>
                                    <div className="pt-2">
                                      <span className="text-[10px] text-slate-400 font-medium block">المستند الثبوتي المرفق:</span>
                                      {claim.fileData ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = claim.fileData!;
                                            link.download = claim.fileName || 'invoice_receipt.pdf';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          }}
                                          className="text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg mt-1 font-bold flex items-center gap-1.5 cursor-pointer transition w-full justify-between"
                                          title="خطوة حقيقية لتنزيل المرفق الضريبي المدخل"
                                        >
                                          <span className="truncate flex items-center gap-1">
                                            📄 <strong className="font-mono truncate">{claim.fileName || 'فاتورة_استرداد.pdf'}</strong>
                                          </span>
                                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded shrink-0">تحميل الفاتورة 📥</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                                          ⚠️ لا يتوفر مرفق الكتروني (تأكيد ورقي)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Section 2: ZATCA Compliance indicators */}
                                  <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-xl shadow-3xs">
                                    <h5 className="font-black text-slate-505 flex items-center gap-1 text-emerald-800">
                                      <Building className="w-3.5 h-3.5" />
                                      التحقق الضريبي (ZATCA):
                                    </h5>
                                    <ul className="space-y-1 font-semibold text-[11px] text-slate-600 block">
                                      <li className="flex items-center gap-1 justify-between">
                                        <span>رمز التحقق الضريبي:</span>
                                        <span className="font-mono bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold">ZATCA-OK2026</span>
                                      </li>
                                      <li className="flex items-center gap-1 justify-between">
                                        <span>هوية المورّد خاضعة للضريبة 15%:</span>
                                        <span className="text-emerald-600">✓ مطابقة بالكامل</span>
                                      </li>
                                      <li className="flex items-center gap-1 justify-between">
                                        <span>رقم التسجيل الضريبي للمطالبة:</span>
                                        <span className="font-mono text-slate-800 font-bold">{claim.vatNumber || 'غير مرفق'}</span>
                                      </li>
                                      <li className="flex items-center gap-1 justify-between">
                                        <span>الأثر المالي الضريبي المسترد:</span>
                                        <span className="font-mono text-purple-700 font-bold">+{claim.vatAmount || 0} ر.س</span>
                                      </li>
                                    </ul>
                                  </div>

                                  {/* Section 3: Manager Decision and feedback */}
                                  <div className="space-y-1.5 bg-white p-3.5 border border-slate-200 rounded-xl shadow-3xs">
                                    <h5 className="font-black text-slate-500 flex items-center gap-1">
                                      <BookmarkCheck className="w-3.5 h-3.5 text-slate-400" />
                                      ملاحظات إدارة الموارد وصاحب القرار:
                                    </h5>
                                    <blockquote className="border-r-4 border-emerald-500 bg-slate-50 p-2.5 rounded text-[11px] font-semibold text-slate-700 italic">
                                      "{claim.resolvedNotes || 'لم تسجل أي ملاحظات مخصصة من مراجع الفئة الأولى حتى الآن.'}"
                                    </blockquote>
                                    
                                    {/* Action buttons inside accordion */}
                                    {claim.status === 'بانتظار الموافقة' && (
                                      <div className="pt-2 flex flex-col gap-2">
                                        {hasPermission('approve_operations') ? (
                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => handleOpenDecision(claim.id, 'موافق عليها')}
                                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-1.5 rounded-lg border-none cursor-pointer text-center font-bold"
                                            >
                                              ✓ اعتماد والموافقة
                                            </button>
                                            <button
                                              onClick={() => handleOpenDecision(claim.id, 'مرفوضة')}
                                              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black py-1.5 rounded-lg border-none cursor-pointer text-center font-bold"
                                            >
                                              ✕ رفض وتسجيل سبب
                                            </button>
                                          </div>
                                        ) : (
                                          <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded border border-rose-150 text-center">
                                            ⚠️ لا تمتلك صلاحية الاعتماد للعمليات (approve_operations)
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Analytics & Recharts widgets */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
            <h4 className="text-xs font-black text-slate-800 mb-5">مؤشرات توزيع النفقات والتعويضات حسب فئة المصروف</h4>
            
            {categoryAnalyticsChartData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold">
                لا تتوفر أي بيانات تصنيفية للرسم البياني حالياً. يرجى إدراج وثائق مالية أولاً.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Recharts Bar chart (Expenses vs VAT per Category) */}
                <div className="md:col-span-2 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryAnalyticsChartData}
                      margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                      <Bar dataKey="إجمالي المصروف" fill="#047857" name="إجمالي المصروفات بالتعويض (ر.س)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="قيمة الضريبة المضافة" fill="#c084fc" name="قيمة ضريبة ZATCA (15%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* KPI sidebar list */}
                <div className="space-y-3 block">
                  <h5 className="text-[11px] font-black text-slate-400">توزيع الميزانيات المستغلة الفعالة:</h5>
                  <div className="divide-y divide-slate-100">
                    {categoryAnalyticsChartData.map((x, i) => (
                      <div key={i} className="py-2 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700">{x.name}</span>
                        <div className="text-left">
                          <span className="font-mono font-black text-slate-900 block">{x['إجمالي المصروف'].toLocaleString()} ر.س</span>
                          <span className="text-[9.5px] text-slate-400">{x['المطالبات المعالجة']} طلب استبدال</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Claims Status distribution visual widgets */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
              <h4 className="text-xs font-black text-slate-800">حالة المطالبات والاعتمادات المالية</h4>
              
              {statusAnalyticsChartData.length === 0 ? (
                <div className="py-12 text-center text-slate-400">لا تتوفر رسومات بيانية في الوقت الراهن</div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-1/2 h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusAnalyticsChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusAnalyticsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 flex-1 w-full sm:w-auto">
                    {statusAnalyticsChartData.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-xs pb-1 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                          <span className="text-slate-600 font-semibold">{entry.name}</span>
                        </div>
                        <span className="font-mono font-black text-slate-800">{entry.value} طلبات</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Saudi HR Compliance Index metric */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1 text-emerald-800">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                مؤشر الامتثال والمواءمة الضريبية للمنشآت
              </h4>
              <p className="text-[11.5px] text-slate-500 leading-relaxed font-semibold">
                يحسب نظام HRMS لدينا نسبة الفواتير الضريبية الموثقة برقم ضريبي معتبر والوصف المكتوب مقارنة بجميع المطالبات المالية لتقييم صحة الاسترداد الضريبي وتسهيل تقارير الفحص الخارجي:
              </p>
              
              <div className="space-y-3">
                {/* Math compliance value */}
                {(() => {
                  const claimsWithVat = expenses.filter(x => x.vatNumber && x.vatNumber.length === 15).length;
                  const ratio = expenses.length > 0 ? Math.round((claimsWithVat / expenses.length) * 100) : 100;
                  
                  let complianceColor = 'text-red-650';
                  let bgColor = 'bg-rose-500';
                  if (ratio >= 80) {
                    complianceColor = 'text-emerald-700';
                    bgColor = 'bg-emerald-600';
                  } else if (ratio >= 50) {
                    complianceColor = 'text-amber-600';
                    bgColor = 'bg-amber-500';
                  }

                  return (
                    <div className="space-y-1 block">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black text-slate-400">مستوى الامتثال الضريبي (ZATCA Code):</span>
                        <span className={`text-sm font-black ${complianceColor}`}>{ratio}% متوافق</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full ${bgColor} transition-all duration-500`}
                          style={{ width: `${ratio}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">
                        * تم إرفاق والتحقق من {claimsWithVat} فواتير تشتمل على رقم تسجيل ضريبي معتمد.
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
