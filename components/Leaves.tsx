/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useHR } from '../context/HRContext';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Info, 
  Download, 
  Users, 
  Filter, 
  Briefcase,
  ExternalLink,
  ChevronLeft,
  FileCheck,
  BookOpen,
  UserX,
  SlidersHorizontal,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { exportToCSV } from '../utils/exportUtils';
import { Leave } from '../types';

export const Leaves: React.FC = () => {
  const { 
    employees, 
    leaves, 
    addLeave, 
    updateLeaveStatus, 
    updateLeave, 
    deleteLeave,
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab
  } = useHR();

  // Search, filtration & classification states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [deptFilter, setDeptFilter] = useState('الكل');
  
  // Custom Date range filters
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  // Modal controls
  const [showFormModal, setShowFormModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState<string | null>(null);
  
  // Form fields
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [formEmpId, setFormEmpId] = useState('');
  const [formType, setFormType] = useState<'سنوية' | 'مرضية' | 'اضطرارية' | 'بدون راتب'>('سنوية');
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');
  const [formStatus, setFormStatus] = useState<'بانتظار الموافقة' | 'موافق عليها' | 'مرفوضة'>('بانتظار الموافقة');

  // Interactive Info Guide Toggle
  const [showGuide, setShowGuide] = useState(true);

  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Dynamic metrics based on actual DB records
  const activeEmployees = employees.filter(e => e.status !== 'موقوف');
  const pendingCount = leaves.filter(l => l.status === 'بانتظار الموافقة').length;
  const activeTodayCount = leaves.filter(l => l.status === 'موافق عليها' && todayStr >= l.from && todayStr <= l.to).length;
  const totalApprovedAnnualThisYear = leaves.filter(l => l.status === 'موافق عليها' && l.type === 'سنوية').length;
  
  const totalLeaveBalances = activeEmployees.reduce((sum, e) => sum + (e.leaveBalance || 0), 0);
  const avgLeaveBalance = activeEmployees.length ? Math.round(totalLeaveBalances / activeEmployees.length) : 0;

  // Sync / query filtration
  const filteredLeaves = leaves.filter(l => {
    const emp = employees.find(e => e.id === l.empId);
    
    // Search filter
    const matchesSearch = emp 
      ? emp.name.includes(searchTerm) || emp.job.includes(searchTerm)
      : false;
      
    // Status filter
    const matchesStatus = statusFilter === 'الكل' || l.status === statusFilter;
    
    // Type filter
    const matchesType = typeFilter === 'الكل' || l.type === typeFilter;
    
    // Dept filter
    const matchesDept = deptFilter === 'الكل' || (emp && emp.dept === deptFilter);
    
    // Date Range filters
    let matchesRange = true;
    if (filterFromDate) {
      matchesRange = matchesRange && l.from >= filterFromDate;
    }
    if (filterToDate) {
      matchesRange = matchesRange && l.to <= filterToDate;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDept && matchesRange;
  });

  // Open triggers
  const handleOpenNewModal = () => {
    setEditingRecordId(null);
    setFormEmpId('');
    setFormType('سنوية');
    setFormFrom('');
    setFormTo('');
    setFormStatus('بانتظار الموافقة');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (record: Leave) => {
    setEditingRecordId(record.id);
    setFormEmpId(record.empId);
    setFormType(record.type);
    setFormFrom(record.from);
    setFormTo(record.to);
    setFormStatus(record.status);
    setShowFormModal(true);
  };

  const handleSaveLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId || !formFrom || !formTo) {
      alert('الرجاء تعبئة جميع الحقول المطلوبة ومراجعة المستندات للامتثال.');
      return;
    }

    const startDate = new Date(formFrom);
    const endDate = new Date(formTo);
    const diffTime = endDate.getTime() - startDate.getTime();
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (days < 1) {
      alert('نطاق التواريخ غير منطقي: تاريخ الانتهاء يسبق تاريخ الانطلاق.');
      return;
    }

    // Checking Leave Balance Warning for Annual types
    const emp = employees.find(x => x.id === formEmpId);
    if (emp && formType === 'سنوية' && days > (emp.leaveBalance || 0)) {
       const confirmOverride = window.confirm(`رصيد الموظف السنوي الحالي (${emp.leaveBalance} أيام) أقل من المدة المطلوبة لطلب الإجازة المتكاملة (${days} أيام). هل ترغب في تجاوز التنبيه بموجب لوائح الموارد البشرية؟`);
       if (!confirmOverride) return;
    }

    setIsSaving(true);
    try {
      if (editingRecordId) {
        // Update Leave
        await updateLeave(editingRecordId, {
          empId: formEmpId,
          type: formType,
          from: formFrom,
          to: formTo,
          days: days,
          status: formStatus
        });
      } else {
        // Create Leave
        await addLeave({
          empId: formEmpId,
          type: formType,
          from: formFrom,
          to: formTo,
          days: days,
          status: formStatus
        });
      }
      setShowFormModal(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ فني غير متوقع أثناء معالجة الطلب في خادم قاعدة البيانات.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveStatus = async (id: string, decision: 'موافق عليها' | 'مرفوضة') => {
    setIsResolving(id);
    try {
      await updateLeaveStatus(id, decision);
    } catch (err) {
      console.error(err);
      alert('فشل في توثيق القرار في السلسلة السحابية.');
    } finally {
      setIsResolving(null);
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من رغبتك في إلغاء وحذف طلب إجازة الموظف ${empName}؟ في حال كان سارياً أو تمت الموافقة عليه، فسيتم إرجاع وتسهيل الرصيد المستقطع تلقائياً بمستحقات الكوادر.`);
    if (!isConfirmed) return;

    try {
      await deleteLeave(id);
    } catch (err) {
      console.error(err);
      alert('فشل في حذف طلب الإجازة وقيد المستقطع.');
    }
  };

  const navigateToProfile = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab('info');
    setCurrentView('empfiles');
  };

  const handleExport = () => {
    const headers = ['الموظف والمشرف', 'القسم المعتمد', 'نوع الإجازة', 'البداية والتاريخ', 'الانتهاء الفعلي', 'إجمالي الأيام المعتمدة', 'حالة الاعتماد في قوى'];
    const rows = filteredLeaves.map(l => {
      const emp = employees.find(e => e.id === l.empId);
      return [
        emp ? emp.name : 'موظف مجهول',
        emp ? emp.dept : '—',
        l.type,
        l.from,
        l.to,
        `${l.days} أيام`,
        l.status
      ];
    });
    exportToCSV(`تقرير_إجازات_المنشأة_سحابة_الأعمال_${todayStr}`, headers, rows);
  };

  // Calculations for leaves form balance detection
  const currentSelectedEmpData = employees.find(e => e.id === formEmpId);
  const currentBalanceInForm = currentSelectedEmpData ? currentSelectedEmpData.leaveBalance : 0;
  const formStartDateObj = formFrom ? new Date(formFrom) : null;
  const formEndDateObj = formTo ? new Date(formTo) : null;
  let formCalculatedDays = 0;
  if (formStartDateObj && formEndDateObj) {
    const dTime = formEndDateObj.getTime() - formStartDateObj.getTime();
    formCalculatedDays = Math.round(dTime / (1000 * 60 * 60 * 24)) + 1;
  }
  const formIsOverBalanceWarning = formType === 'سنوية' && formCalculatedDays > currentBalanceInForm;

  return (
    <div className="space-y-6 animate-slideup text-right">
      
      {/* Dynamic Operational KPI Widgets Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pending */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-slate-400">طلبات معلقة بالانتظار</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-amber-700">{pendingCount}</span>
            <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">بانتظار البت فيها</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: pendingCount > 0 ? '60%' : '0%' }}></div>
          </div>
        </div>

        {/* KPI 2: Active today */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-slate-400">مجازون خارج الخدمة اليوم</p>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-blue-700">{activeTodayCount}</span>
            <span className="text-[10px] text-slate-500">حالة نشطة ومغطاة</span>
          </div>
        </div>

        {/* KPI 3: Avg Balance */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-slate-400">متوسط رصيد الإجازات السنوي</p>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-emerald-700">{avgLeaveBalance} يوم</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold">للموظف الملتزم</span>
          </div>
        </div>

        {/* KPI 4: Approved Annual */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-bold text-slate-400">إجمالي الإجازات السنوية المدخرة</p>
            <FileCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold font-sans text-indigo-700">{totalApprovedAnnualThisYear}</span>
            <span className="text-[10px] text-indigo-500">حركات سنوية مصادق عليها</span>
          </div>
        </div>
      </div>

      {/* Control Banner: Action Search and Date-Range Filtering */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gold" />
              إدارة طلبات الإجازات الرسمية وسير الاعتمادات
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-700 cursor-pointer shadow-xs"
              title="تصدير كشف إجازات الموظفين"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              تصدير تقرير الإجازات عريض
            </button>
            <button
              onClick={handleOpenNewModal}
              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-slate-900 border-none rounded-lg text-xs font-extrabold transition-all hover:-translate-y-0.5 shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              تقديم طلب إجازة رسمي جديد
            </button>
          </div>
        </div>

        {/* Filters Panel Container */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="🔍 ابحث باسم طالب الإجازة أو لقبه ومهنته..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-700 focus:border-gold outline-none bg-slate-50 font-sans"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Department */}
          <div>
            <select
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:border-gold outline-none bg-slate-50 font-sans cursor-pointer"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="الكل">كل الأقسام</option>
              <option value="تقنية المعلومات">تقنية المعلومات</option>
              <option value="الموارد البشرية">الموارد البشرية</option>
              <option value="المالية">المالية</option>
              <option value="التسويق">التسويق</option>
              <option value="المبيعات">المبيعات</option>
              <option value="العمليات">العمليات</option>
            </select>
          </div>

          {/* Leave Type */}
          <div>
            <select
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:border-gold outline-none bg-slate-50 font-sans cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="الكل">كل أنواع الإجازات</option>
              <option value="سنوية">سنوية اعتيادية</option>
              <option value="مرضية">مرضية معتمدة</option>
              <option value="اضطرارية">اضطرارية عاجلة</option>
              <option value="بدون راتب">إجازة بدون راتب</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:border-gold outline-none bg-slate-50 font-sans cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="الكل">كل الحالات الإدارية</option>
              <option value="بانتظار الموافقة">بانتظار موافقة HR</option>
              <option value="موافق عليها">ممضاة وموافق عليها</option>
              <option value="مرفوضة">مرفوضة رسمياً</option>
            </select>
          </div>

          {/* Reset Filters Toggle */}
          <div className="flex gap-1.5 h-full">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('الكل');
                setTypeFilter('الكل');
                setDeptFilter('الكل');
                setFilterFromDate('');
                setFilterToDate('');
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 border-none text-slate-650 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="إعادة تعيين كافة فلاتر ومحددات البحث"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تصفير البحث
            </button>
          </div>
        </div>

        {/* Custom Audit Period Date filters */}
        <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-700">تصفية فترة التواريخ (Audit Range):</span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-slate-500 font-bold">من تاريخ:</span>
            <input 
              type="date"
              value={filterFromDate}
              onChange={(e) => setFilterFromDate(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-1 rounded text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 font-bold">إلى تاريخ:</span>
            <input 
              type="date"
              value={filterToDate}
              onChange={(e) => setFilterToDate(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-1 rounded text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Table Section: Leaves Records list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800">بيانات طلبات الموظفين المسجلة للبت والتحليل ({filteredLeaves.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-250 text-slate-400 font-bold text-[11px] bg-slate-50/70 uppercase">
                <th className="p-4">اسم الموظف كادر المنشأة</th>
                <th className="p-4">القسم الحالي</th>
                <th className="p-4">نوع الإجازة المطلوبة</th>
                <th className="p-4">توقيت البداية</th>
                <th className="p-4">توقيت النهاية والانتهاء</th>
                <th className="p-4">المدة الكلية للفترة</th>
                <th className="p-4">الاعتماد والامتثال لـ HR</th>
                <th className="p-4 text-center">الإجراءات والتدقيق والموافقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-semibold leading-relaxed">
                    <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    لا تتوفر أي طلبات إجازة تطابق الشروط المبرمة ومحددات الفلاتر النشطة حالياً. <br />
                    <span className="text-[10.5px] text-slate-400 font-normal">تأكد من إزالة فلاتر التاريخ والنوع من القائمة لمحاذاة البحث السريع.</span>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => {
                  const emp = employees.find(e => e.id === l.empId);
                  
                  // Label styling
                  const statusClass = 
                    l.status === 'موافق عليها' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250 font-bold' 
                      : l.status === 'مرفوضة' 
                      ? 'bg-rose-50 text-rose-700 border-rose-250 font-bold' 
                      : 'bg-amber-50 text-amber-700 border-amber-250 font-bold';

                  const typeBadgeClass =
                    l.type === 'سنوية'
                      ? 'bg-amber-50 text-amber-800 font-semibold'
                      : l.type === 'مرضية'
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : l.type === 'اضطرارية'
                      ? 'bg-blue-50 text-blue-800 font-semibold'
                      : 'bg-stone-50 text-stone-700 font-semibold border-stone-200';

                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name Card */}
                      <td className="p-4 font-semibold text-slate-850">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                            {emp ? emp.name[0] : 'م'}
                          </div>
                          <div>
                            <span className="text-slate-800 text-xs font-extrabold block">{emp ? emp.name : 'موظف مجهول'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{emp ? emp.job : 'مسمّى غير معرّف'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-4 text-slate-550 font-semibold">
                        {emp ? emp.dept : '—'}
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10.5px] border border-transparent ${typeBadgeClass}`}>
                          {l.type === 'سنوية' && '🌴 '}
                          {l.type === 'مرضية' && '🏥 '}
                          {l.type === 'اضطرارية' && '🚨 '}
                          {l.type === 'بدون راتب' && '🪙 '}
                          {l.type}
                        </span>
                      </td>

                      {/* Starting date */}
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {l.from}
                      </td>

                      {/* Ending date */}
                      <td className="p-4 font-mono font-bold text-slate-700">
                        {l.to}
                      </td>

                      {/* Requested Days count */}
                      <td className="p-4">
                        <span className="text-xs font-extrabold text-slate-800 font-sans">{l.days}</span>
                        <span className="text-[10px] text-slate-400 mr-1 font-bold">أيام مبرمة</span>
                      </td>

                      {/* Decided Status */}
                      <td className="p-4">
                        <span className={`inline-block border px-2.5 py-0.5 rounded-full text-xs ${statusClass}`}>
                          {l.status === 'بانتظار الموافقة' && '⌛ '}
                          {l.status === 'موافق عليها' && '✓ '}
                          {l.status === 'مرفوضة' && '✕ '}
                          {l.status}
                        </span>
                      </td>

                      {/* HR Decision & action triggers */}
                      <td className="p-4">
                        <div className="flex gap-1.5 justify-center">
                          {l.status === 'بانتظار الموافقة' ? (
                            <>
                              <button
                                disabled={isResolving !== null}
                                onClick={() => handleResolveStatus(l.id, 'موافق عليها')}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded text-[10.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                                title="الموافقة الرسمية وتحديث الرخص والأرصدة"
                              >
                                {isResolving === l.id ? (
                                  <span className="w-2.5 h-2.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                  '✓ اعتماد'
                                )}
                              </button>
                              <button
                                disabled={isResolving !== null}
                                onClick={() => handleResolveStatus(l.id, 'مرفوضة')}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-650 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-650 rounded text-[10.5px] font-bold transition cursor-pointer"
                                title="رفض الإجازة"
                              >
                                ✕ رفض
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold font-sans italic bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                              قرار معتمد نهائي
                            </span>
                          )}

                          {/* Trigger Edit (only if pending, or anyway for HR fixes) */}
                          <button
                            onClick={() => handleOpenEditModal(l)}
                            className="p-1.5 text-slate-500 bg-slate-100 rounded hover:bg-gold hover:text-slate-900 border border-slate-200 hover:border-gold transition cursor-pointer shadow-xs"
                            title="تعديل تفاصيل الإجازة واللوائح المعينة"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Trigger Deletion / Cancelation with refund capability */}
                          <button
                            onClick={() => emp && handleDelete(l.id, emp.name)}
                            className="p-1.5 text-rose-500 bg-rose-50 rounded hover:bg-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 transition cursor-pointer"
                            title="حذف هذا الدليل من قاعدة البيانات وإعادة رصيد السنوي إن وجد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Cross navigation to Employee profile (الربط البيني الشامل) */}
                          {emp && (
                            <button
                              onClick={() => navigateToProfile(emp.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 border border-slate-200 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="الاتجاه المباشر إلى الملف الطبي والوظيفي"
                            >
                              📁 ملف الموظف
                            </button>
                          )}
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

      {/* ⏱️ Dynamic Adding & Editing Dialog Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300 font-sans">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto animate-slideup text-right">
            <h3 className="text-base font-extrabold text-gold mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              {editingRecordId ? 'تعديل وتدقيق تفاصيل الإجازة الرقمية' : 'إيداع طلب إجازة رسمي بقواعد البيانات'}
            </h3>

            <form onSubmit={handleSaveLeave} className="space-y-4">
              
              {/* Employee selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">الموظف طالب الإجازة *</label>
                <select
                  required
                  disabled={!!editingRecordId}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-gold bg-slate-50 disabled:bg-slate-150 disabled:cursor-not-allowed text-slate-800 font-semibold"
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                >
                  <option value="">-- اختر من كوادر المنشأة البشرية --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.job} - القسم: {e.dept} - رصيده السنوي: {e.leaveBalance} يوم)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic balance detector info panel */}
              {formEmpId && currentSelectedEmpData && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs font-sans">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block font-bold text-[10.5px]">الرصيد المتاح حالياً بموجب نظام العمل:</span>
                    <span className="text-slate-800 font-extrabold text-xs block">
                      {currentSelectedEmpData.name} ({currentSelectedEmpData.job})
                    </span>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded font-extrabold text-xs">
                      {currentBalanceInForm} أيام متبقية
                    </span>
                  </div>
                </div>
              )}

              {/* Leave Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">تصنيف الإجازة *</label>
                <select
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800 font-bold"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                >
                  <option value="سنوية">سنوية اعتيادية (مدفوعة الأجر)</option>
                  <option value="مرضية">مرضية (بموجب المادة 117 تقارير مبرمة)</option>
                  <option value="اضطرارية">اضطرارية عاجلة (شؤون عائلة ومهام)</option>
                  <option value="بدون راتب">إجازة بدون راتب (استحواذ موافقة خاصة)</option>
                </select>
              </div>

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">تاريخ البدء والانطلاق *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800"
                    value={formFrom}
                    onChange={(e) => setFormFrom(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">تاريخ الانتهاء والرجوع *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800"
                    value={formTo}
                    onChange={(e) => setFormTo(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculated days statistics and warning badges */}
              {formFrom && formTo && (
                <div className="space-y-2">
                  <div className="p-3 bg-emerald-50/50 border border-emerald-150 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                    <span className="font-bold flex items-center gap-1.5 bg-transparent border-none">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      المدة الكلية المحسوبة للفترة:
                    </span>
                    <span className="font-extrabold text-sm font-sans block">{formCalculatedDays} أيام فعلية</span>
                  </div>

                  {/* Overbalance WARNING overlay */}
                  {formIsOverBalanceWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-250 rounded-lg gap-2 text-slate-700 leading-relaxed font-sans flex items-start text-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-800 font-extrabold block text-[11.5px]">⚠️ تحذير تجاوز الرصيد المتاح!</strong>
                        <p className="text-[10.5px] text-slate-500 mt-0.5 leading-relaxed">
                          رصيد الموظف السنوي الحالي ({currentBalanceInForm} أيام) أقل من المدة المطلوبة ({formCalculatedDays} أيام). سيؤدي الموافقة على الطلب إلى تجاوز حده الإلزامي والامتثال السنوي.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status picker (useful if editing or directly submitting approved leaves) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">حالة الاعتماد في النظام</label>
                <select
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-gold bg-slate-50 text-slate-800"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                >
                  <option value="بانتظار الموافقة">قيد الدراسة وبانتظار موافقة HR</option>
                  <option value="موافق عليها">موافق عليها ومعتمدة (ستؤثر على رصيد السنوية)</option>
                  <option value="مرفوضة">مرفوضة رسمياً</option>
                </select>
              </div>

              {/* Compliance note Footer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 leading-relaxed text-[10px] text-slate-400 font-sans">
                تلتزم المنشأة بحفظ وأرشفة كشوف الحركات للمطابقة في الضمان الاجتماعي ومكتب العمل بوزارة الموارد البشرية السعودية لضمان تسويات الأجور العادلة والامتثال.
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowFormModal(false)}
                  className="bg-transparent text-slate-400 border border-slate-200 px-4 py-2 rounded-lg cursor-pointer text-xs font-bold hover:text-slate-650 hover:bg-slate-50 disabled:opacity-55 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold text-slate-900 border-none px-5 py-2 rounded-lg cursor-pointer text-xs font-extrabold hover:bg-gold-light flex items-center justify-center gap-2 min-w-[140px] disabled:opacity-55 transition shadow-sm"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري حفظ الطلب...</span>
                    </>
                  ) : (
                    '💾 تأكيد وحفظ الطلب'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
