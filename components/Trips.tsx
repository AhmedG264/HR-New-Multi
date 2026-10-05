/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { processAttachedFile } from '../utils/fileUtils';
import { 
  Plane, Briefcase, Calendar, DollarSign, MapPin, Clock,
  CheckCircle2, XCircle, AlertCircle, Trash2, Plus, Search,
  Filter, ChevronDown, ChevronUp, Sparkles, Building, FileText,
  Scale, TrendingUp, Check, X, Info, ExternalLink, Edit,
  ArrowUpRight, ShieldCheck, User, Activity
} from 'lucide-react';
import { Employee, Trip } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';

export const Trips: React.FC = () => {
  const { 
    employees, trips, addTrip, updateTrip, deleteTrip,
    setCurrentView, setSelectedEmployeeId, setEmployeeFileTab, hasPermission
  } = useHR();

  const [activeTab, setActiveTab] = useState<'trips' | 'analytics' | 'guidelines'>('trips');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [employeeFilter, setEmployeeFilter] = useState('الكل');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);
  const [notifier, setNotifier] = useState<string | null>(null);
  const [decisionModal, setDecisionModal] = useState<{ id: string; decision: 'موافق عليها' | 'مرفوضة' } | null>(null);
  const [resolutionNotesInput, setResolutionNotesInput] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const [formEmpId, setFormEmpId] = useState('');
  const [formDest, setFormDest] = useState('');
  const [formPurpose, setFormPurpose] = useState('');
  const [formType, setFormType] = useState<'داخلي' | 'خارجي'>('داخلي');
  const [formFrom, setFormFrom] = useState(new Date().toISOString().slice(0, 10));
  const [formTo, setFormTo] = useState(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [formFileData, setFormFileData] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formAllowance, setFormAllowance] = useState<number>(150);
  const [formTicketCost, setFormTicketCost] = useState<number>(0);
  const [formHousingCost, setFormHousingCost] = useState<number>(0);
  const [formTransportCost, setFormTransportCost] = useState<number>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formInsurance, setFormInsurance] = useState('');
  const [formBusy, setFormBusy] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAttachedFile(
      file,
      (base64) => { setFormFileData(base64); setFormFileName(file.name); },
      (error) => { alert(error); setFormFileData(''); setFormFileName(''); }
    );
  };

  const calculatedDays = useMemo(() => {
    if (!formFrom || !formTo) return 1;
    const diffTime = new Date(formTo).getTime() - new Date(formFrom).getTime();
    if (diffTime < 0) return 1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [formFrom, formTo]);

  const computedTotalFormCost = useMemo(() => {
    return (formAllowance || 0) * calculatedDays + (formTicketCost || 0) + (formHousingCost || 0) + (formTransportCost || 0);
  }, [formAllowance, calculatedDays, formTicketCost, formHousingCost, formTransportCost]);

  const handleTypeChange = (val: 'داخلي' | 'خارجي') => {
    setFormType(val);
    if (val === 'خارجي') {
      setFormAllowance(400);
      setFormInsurance('التعاونية للتأمين - مسار السفر الدولي');
    } else {
      setFormAllowance(150);
      setFormInsurance('');
    }
  };

  const analyticsData = useMemo(() => {
    const totalCount = trips.length;
    const pendingCount = trips.filter(t => t.status === 'بانتظار الموافقة').length;
    const approvedCount = trips.filter(t => t.status === 'موافق عليها').length;
    const rejectedCount = trips.filter(t => t.status === 'مرفوضة').length;
    const totalBudgetDisbursed = trips.reduce((sum, t) => sum + (t.cost || 0), 0);
    const pendingBudget = trips.filter(t => t.status === 'بانتظار الموافقة').reduce((sum, t) => sum + (t.cost || 0), 0);
    const approvedBudget = trips.filter(t => t.status === 'موافق عليها').reduce((sum, t) => sum + (t.cost || 0), 0);
    const internalTripsCount = trips.filter(t => (t.type || 'داخلي') === 'داخلي').length;
    const externalTripsCount = trips.filter(t => (t.type || 'داخلي') === 'خارجي').length;
    const totalTicketEstimation = trips.reduce((sum, t) => sum + (t.ticketCost || 0), 0);
    const totalHousingEstimation = trips.reduce((sum, t) => sum + (t.housingCost || 0), 0);
    const totalAllowanceEstimation = trips.reduce((sum, t) => {
      if (t.allowance) {
        const days = Math.max(1, Math.ceil((new Date(t.to).getTime() - new Date(t.from).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return sum + (t.allowance * days);
      }
      return sum;
    }, 0);
    return { totalCount, pendingCount, approvedCount, rejectedCount, totalBudgetDisbursed, pendingBudget, approvedBudget, internalTripsCount, externalTripsCount, totalTicketEstimation, totalHousingEstimation, totalAllowanceEstimation };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const emp = employees.find(e => e.id === t.empId);
      const query = searchQuery.toLowerCase();
      const matchesSearch = t.dest.toLowerCase().includes(query) || t.purpose.toLowerCase().includes(query) || (t.notes || '').toLowerCase().includes(query) || (emp?.name.toLowerCase() || '').includes(query);
      const matchesType = typeFilter === 'الكل' || (t.type || 'داخلي') === typeFilter;
      const matchesStatus = statusFilter === 'الكل' || t.status === statusFilter;
      const matchesEmployee = employeeFilter === 'الكل' || t.empId === employeeFilter;
      return matchesSearch && matchesType && matchesStatus && matchesEmployee;
    });
  }, [trips, employees, searchQuery, typeFilter, statusFilter, employeeFilter]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) { alert('الرجاء اختيار الموظف'); return; }
    if (!formDest.trim()) { alert('الرجاء تحديد الوجهة'); return; }
    if (!formPurpose.trim()) { alert('الرجاء تحديد الغرض'); return; }
    setFormBusy(true);
    try {
      const tripObject = {
        empId: formEmpId, dest: formDest.trim(), purpose: formPurpose.trim(),
        from: formFrom, to: formTo, cost: computedTotalFormCost,
        status: editingTrip ? editingTrip.status : 'بانتظار الموافقة',
        type: formType, allowance: formAllowance, ticketCost: formTicketCost,
        housingCost: formHousingCost, transportCost: formTransportCost,
        notes: formNotes.trim(), insuranceCompany: formInsurance.trim(),
        fileData: formFileData, fileName: formFileName
      };
      if (editingTrip) {
        await updateTrip(editingTrip.id, { ...tripObject, resolvedNotes: editingTrip.resolvedNotes, decisionDate: editingTrip.decisionDate });
        setNotifier('تم تحديث بيانات الانتداب بنجاح ✅');
      } else {
        await addTrip(tripObject);
        setNotifier('تم إضافة طلب الانتداب بنجاح ✈️');
      }
      resetForm();
      setIsFormOpen(false);
      setTimeout(() => setNotifier(null), 4000);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ.');
    } finally {
      setFormBusy(false);
    }
  };

  const startEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setFormEmpId(trip.empId);
    setFormDest(trip.dest);
    setFormPurpose(trip.purpose);
    setFormType(trip.type || 'داخلي');
    setFormFrom(trip.from);
    setFormTo(trip.to);
    setFormAllowance(trip.allowance ?? (trip.type === 'خارجي' ? 400 : 150));
    setFormTicketCost(trip.ticketCost || 0);
    setFormHousingCost(trip.housingCost || 0);
    setFormTransportCost(trip.transportCost || 0);
    setFormNotes(trip.notes || '');
    setFormInsurance(trip.insuranceCompany || '');
    setFormFileData(trip.fileData || '');
    setFormFileName(trip.fileName || '');
    setIsFormOpen(true);
    document.getElementById('trip_form_section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الانتداب؟')) return;
    try {
      await deleteTrip(id);
      setNotifier('تم حذف الانتداب.');
      setTimeout(() => setNotifier(null), 3000);
    } catch (err) {
      console.error(err);
      alert('فشلت عملية الحذف.');
    }
  };

  const handleOpenDecision = (tripId: string, decision: 'موافق عليها' | 'مرفوضة') => {
    if (!hasPermission('approve_operations')) {
      alert('ليس لديك صلاحية اعتماد العمليات (approve_operations)');
      return;
    }
    const tripObj = trips.find(t => t.id === tripId);
    setDecisionModal({ id: tripId, decision });
    setResolutionNotesInput(tripObj?.resolvedNotes || '');
  };

  const handleApplyDecision = async () => {
    if (!decisionModal) return;
    if (!hasPermission('approve_operations')) {
      alert('ليس لديك صلاحية اعتماد العمليات (approve_operations)');
      return;
    }
    setActionBusy(true);
    try {
      const defaultNotes = decisionModal.decision === 'موافق عليها'
        ? 'تمت المطابقة مع اللائحة الداخلية واعتُمد للصرف.'
        : 'رُفض الطلب لعدم توافق المبررات أو تجاوز الميزانية.';
      await updateTrip(decisionModal.id, {
        status: decisionModal.decision,
        resolvedNotes: resolutionNotesInput.trim() || defaultNotes,
        decisionDate: new Date().toISOString().slice(0, 10)
      });
      setNotifier(decisionModal.decision === 'موافق عليها' ? '🟢 تم اعتماد الانتداب!' : '🔴 تم رفض الانتداب.');
      setDecisionModal(null);
      setResolutionNotesInput('');
      setTimeout(() => setNotifier(null), 4000);
    } catch (err) {
      console.error(err);
      alert('فشل تسجيل القرار.');
    } finally {
      setActionBusy(false);
    }
  };

  const resetForm = () => {
    setEditingTrip(null); setFormEmpId(''); setFormDest(''); setFormPurpose('');
    setFormType('داخلي'); setFormFrom(new Date().toISOString().slice(0, 10));
    setFormTo(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setFormAllowance(150); setFormTicketCost(0); setFormHousingCost(0);
    setFormTransportCost(0); setFormNotes(''); setFormInsurance('');
    setFormFileData(''); setFormFileName('');
  };

  const handleExportTripsCSV = () => {
    const headers = ['اسم الموظف', 'الوجهة', 'الغرض', 'نوع السفر', 'تاريخ المغادرة', 'تاريخ العودة', 'الميزانية (ر.س)', 'البدل اليومي (ر.س)', 'تكلفة التذاكر (ر.س)', 'تكلفة السكن (ر.س)', 'تكلفة المواصلات', 'الحالة', 'المرفق', 'ملاحظات القرار'];
    const rows = filteredTrips.map(x => {
      const emp = employees.find(e => e.id === x.empId);
      return [emp?.name || 'غير محدد', x.dest, x.purpose, x.type || 'داخلي', x.from, x.to, x.cost || 0, x.allowance || 0, x.ticketCost || 0, x.housingCost || 0, x.transportCost || 0, x.status, x.fileName || 'لا يوجد', x.resolvedNotes || 'قيد الانتظار'];
    });
    exportToCSV(`طلبات_الانتداب_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleNavigateToEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab('info');
    setCurrentView('empfiles');
  };

  const destinationBudgetData = useMemo(() => {
    const counts: Record<string, { value: number; count: number }> = {};
    trips.forEach(t => {
      const d = t.dest || 'أخرى';
      if (!counts[d]) counts[d] = { value: 0, count: 0 };
      counts[d].value += t.cost || 0;
      counts[d].count += 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      'إجمالي التكلفة': counts[key].value,
      'عدد الرحلات': counts[key].count
    })).sort((a, b) => b['إجمالي التكلفة'] - a['إجمالي التكلفة']).slice(0, 7);
  }, [trips]);

  const tripTypeComparison = useMemo(() => {
    const internalCost = trips.filter(t => (t.type || 'داخلي') === 'داخلي').reduce((sum, t) => sum + (t.cost || 0), 0);
    const externalCost = trips.filter(t => (t.type || 'داخلي') === 'خارجي').reduce((sum, t) => sum + (t.cost || 0), 0);
    return [
      { name: 'داخلي 🇸🇦', value: internalCost, color: '#047857' },
      { name: 'خارجي 🌐', value: externalCost, color: '#0369a1' }
    ];
  }, [trips]);

  return (
    <div className="space-y-6 text-right animate-slideup font-sans">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">إجمالي ميزانية الانتدابات</span>
            <div className="p-1.5 bg-sky-50 text-sky-700 rounded-md"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-slate-800 font-mono tracking-tight">
              {analyticsData.totalBudgetDisbursed.toLocaleString('en-US')} <span className="text-xs font-semibold text-slate-450">ر.س</span>
            </h3>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">رحلات معتمدة</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><Plane className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-emerald-900 font-mono tracking-tight">
              {analyticsData.approvedCount} <span className="text-xs font-semibold text-slate-450">رحلة</span>
            </h3>
            <p className="text-[9px] text-emerald-600 mt-1">✓ {analyticsData.approvedBudget.toLocaleString('en-US')} ر.س</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">بانتظار الموافقة</span>
            <div className="p-1.5 bg-amber-50 text-amber-655 rounded-md"><Clock className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-amber-900 font-mono tracking-tight">
              {analyticsData.pendingCount} <span className="text-xs font-semibold text-slate-450">طلب</span>
            </h3>
            <p className="text-[9px] text-amber-600 mt-1">⏳ {analyticsData.pendingBudget.toLocaleString('en-US')} ر.س</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative overflow-hidden select-none">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-black text-slate-400">توزيع الانتدابات</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md"><Briefcase className="w-4 h-4" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-indigo-950 font-mono tracking-tight">
              {analyticsData.internalTripsCount} <span className="text-xs font-normal text-slate-450">محلية</span> / {analyticsData.externalTripsCount} <span className="text-xs font-normal text-slate-450">دولية</span>
            </h3>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>
      </div>

      {/* Notification Toast */}
      {notifier && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
          <span>{notifier}</span>
        </div>
      )}

      {/* Sub Navigation */}
      <div className="flex border border-slate-200 bg-white rounded-xl p-1 shadow-3xs">
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${activeTab === 'trips' ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-950'}`}
        >
          <Briefcase className="w-4 h-4" />
          الانتدابات والرحلات
          <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${activeTab === 'trips' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>{trips.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-950'}`}
        >
          <TrendingUp className="w-4 h-4" />
          تحليل الميزانية
        </button>

      </div>

      {/* TAB 1: Trips */}
      {activeTab === 'trips' && (
        <div className="space-y-6">

          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-4 border border-slate-200 rounded-2xl shadow-3xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1">
                <input
                  type="text"
                  placeholder="ابحث بالوجهة، الموظف، الغرض..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl pr-8 pl-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="min-w-[120px] bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer font-bold">
                <option value="الكل">كل الأنواع</option>
                <option value="داخلي">داخلي 🇸🇦</option>
                <option value="خارجي">خارجي 🌐</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[120px] bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer font-bold">
                <option value="الكل">كل الحالات</option>
                <option value="بانتظار الموافقة">⏱ بانتظار الموافقة</option>
                <option value="موافق عليها">✓ موافق عليها</option>
                <option value="مرفوضة">✕ مرفوضة</option>
              </select>
              <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="min-w-[140px] bg-slate-50 border border-slate-150 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer">
                <option value="الكل">كل الموظفين</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              {(searchQuery || typeFilter !== 'الكل' || statusFilter !== 'الكل' || employeeFilter !== 'الكل') && (
                <button onClick={() => { setSearchQuery(''); setTypeFilter('الكل'); setStatusFilter('الكل'); setEmployeeFilter('الكل'); }} className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl transition">
                  مسح المصفّي
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportTripsCSV} className="bg-emerald-600 border-none hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold flex items-center gap-1.5 shadow-md shrink-0 transition">
                📊 تصدير CSV
              </button>
              <button onClick={() => { resetForm(); setIsFormOpen(!isFormOpen); }} className="bg-emerald-950 border-none hover:bg-emerald-900 text-white px-5 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold flex items-center gap-1.5 shadow-sm shrink-0 transition">
                <Plus className="w-4 h-4 text-gold animate-bounce" />
                انتداب جديد
              </button>
            </div>
          </div>

          {/* Form */}
          {isFormOpen && (
            <div id="trip_form_section" className="bg-white border-2 border-slate-900 rounded-2xl shadow-md overflow-hidden animate-slideup">
              <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-xs font-black">{editingTrip ? `تعديل: ${editingTrip.dest}` : 'إضافة انتداب جديد'}</span>
                </div>
                <button onClick={() => { setIsFormOpen(false); resetForm(); }} className="bg-transparent border-none text-slate-400 hover:text-white text-xs cursor-pointer font-black">إلغاء ×</button>
              </div>

              <form onSubmit={handleSubmitForm} className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">الموظف *</label>
                  <select required value={formEmpId} onChange={(e) => setFormEmpId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none cursor-pointer">
                    <option value="">-- اختر الموظف --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.job} - {e.dept})</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">الوجهة *</label>
                  <input required type="text" value={formDest} onChange={(e) => setFormDest(e.target.value)} placeholder="مثال: جدة، لندن" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">نوع الانتداب</label>
                  <select value={formType} onChange={(e) => handleTypeChange(e.target.value as 'داخلي' | 'خارجي')} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none cursor-pointer">
                    <option value="داخلي">داخلي 🇸🇦</option>
                    <option value="خارجي">خارجي 🌐</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">الغرض *</label>
                  <input required type="text" value={formPurpose} onChange={(e) => setFormPurpose(e.target.value)} placeholder="مثال: جرد المستودعات" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">تاريخ المغادرة *</label>
                  <input required type="date" value={formFrom} onChange={(e) => setFormFrom(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">تاريخ العودة *</label>
                  <input required type="date" value={formTo} onChange={(e) => setFormTo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-400">مدة الانتداب</label>
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-mono font-bold flex items-center justify-between">
                    <span>{calculatedDays} يوم</span>
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">
                    تأمين السفر <span className="text-[9.5px] text-slate-400 font-normal mr-1">(للخارج)</span>
                  </label>
                  <input type="text" value={formInsurance} onChange={(e) => setFormInsurance(e.target.value)} placeholder="غير مطلوب داخلياً" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none" disabled={formType === 'داخلي'} />
                </div>

                <div className="md:col-span-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-150 flex items-center gap-1.5 mt-2">
                  <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-[11px] font-black text-slate-800">المخصصات المالية (ريال سعودي)</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">البدل اليومي</label>
                  <input type="number" min="0" value={formAllowance || ''} onChange={(e) => setFormAllowance(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono text-left outline-none" />
                  <span className="text-[9.5px] text-slate-400 block mt-0.5">إجمالي: {((formAllowance || 0) * calculatedDays).toLocaleString()} ر.س</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">تذاكر الطيران</label>
                  <input type="number" min="0" value={formTicketCost || ''} onChange={(e) => setFormTicketCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono text-left outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">السكن والإقامة</label>
                  <input type="number" min="0" value={formHousingCost || ''} onChange={(e) => setFormHousingCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono text-left outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">الانتقالات المحلية</label>
                  <input type="number" min="0" value={formTransportCost || ''} onChange={(e) => setFormTransportCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono text-left outline-none" />
                </div>

                <div className="md:col-span-4 bg-emerald-50 rounded-xl p-4 border border-emerald-250 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <span className="text-xs font-black text-emerald-900">إجمالي التكلفة المحتسبة</span>
                  <div className="text-right shrink-0">
                    <span className="text-xl font-black text-emerald-950 font-mono tracking-tight">{computedTotalFormCost.toLocaleString('en-US')}</span>
                    <span className="text-xs font-bold text-slate-450 mr-1">ر.س</span>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="block text-xs font-black text-slate-700">ملاحظات ومبررات الانتداب</label>
                  <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="أهداف التكليف وتفاصيل المهمة..." className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:bg-white" />
                </div>

                <div className="md:col-span-4 space-y-1.5">
                  <label className="block text-xs font-black text-slate-700">إرفاق تذاكر السفر أو قرار الانتداب (PDF / صور)</label>
                  <div className="border border-dashed border-slate-350 hover:border-emerald-600 rounded-xl p-3 bg-slate-50 flex flex-col items-center justify-center relative cursor-pointer min-h-[90px]">
                    <input type="file" accept="application/pdf,image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="text-center pointer-events-none space-y-1">
                      <span className="text-xl block">✈️</span>
                      <p className="text-[11px] font-bold text-slate-700">اسحب الملف أو اضغط للرفع</p>
                      <p className="text-[9.5px] text-slate-400">PDF أو صور (حد أقصى 2 ميجابايت)</p>
                      {formFileName && (
                        <div className="mt-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                          <span>✓ {formFileName}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFormFileData(''); setFormFileName(''); }} className="bg-transparent border-none text-rose-500 hover:text-rose-700 cursor-pointer p-0 font-bold mr-1.5 text-xs">حذف</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button type="button" onClick={() => { setIsFormOpen(false); resetForm(); }} className="px-4 py-2 bg-white border border-slate-250 text-slate-650 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer">إلغاء</button>
                  <button type="submit" disabled={formBusy} className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white border-none rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    {formBusy ? 'جاري الحفظ...' : 'حفظ الانتداب ✈️'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Decision Modal */}
          {decisionModal && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-md space-y-3 animate-slideup">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-amber-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-550" />
                  قرار الانتداب
                </h4>
                <button onClick={() => setDecisionModal(null)} className="bg-transparent border-none text-slate-500 hover:text-slate-800 text-xs font-bold cursor-pointer">إغلاق ×</button>
              </div>
              <div className="flex gap-2">
                <input type="text" value={resolutionNotesInput} onChange={(e) => setResolutionNotesInput(e.target.value)} placeholder="ملاحظات أو أسباب القرار..." className="flex-1 bg-white border border-amber-250 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-550" />
                <button onClick={handleApplyDecision} disabled={actionBusy} className="bg-amber-600 hover:bg-amber-700 text-white border-none px-4 py-2 rounded-xl text-xs font-black shrink-0 cursor-pointer disabled:opacity-50">
                  {actionBusy ? 'جاري...' : 'تثبيت القرار'}
                </button>
              </div>
            </div>
          )}

          {/* Trips Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-800" />
                قائمة الانتدابات والمأموريات
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{filteredTrips.length} مأمورية</span>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold max-w-md mx-auto space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs">لا توجد انتدابات تطابق البحث.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50 text-slate-400 font-extrabold text-[10.5px]">
                      <th className="p-3.5">#</th>
                      <th className="p-3.5">الموظف</th>
                      <th className="p-3.5">الوجهة</th>
                      <th className="p-3.5">الغرض</th>
                      <th className="p-3.5">الفترة</th>
                      <th className="p-3.5">التكلفة</th>
                      <th className="p-3.5 text-center">التأمين</th>
                      <th className="p-3.5 text-center">الحالة</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTrips.map((trip, idx) => {
                      const emp = employees.find(e => e.id === trip.empId);
                      const isExpanded = expandedTripId === trip.id;
                      let statusClass = 'bg-amber-50 text-amber-705 border-amber-200';
                      if (trip.status === 'موافق عليها') statusClass = 'bg-emerald-50 text-emerald-705 border-emerald-250';
                      else if (trip.status === 'مرفوضة') statusClass = 'bg-rose-50 text-rose-705 border-rose-200';

                      return (
                        <React.Fragment key={trip.id}>
                          <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-indigo-50/10' : ''}`}>
                            <td className="p-3.5 text-slate-400 font-mono font-semibold">#{idx + 1}</td>
                            <td className="p-3.5 font-bold text-slate-800">
                              {emp ? (
                                <button type="button" onClick={() => handleNavigateToEmployee(trip.empId)} className="p-0 bg-transparent border-none text-right hover:text-emerald-700 hover:underline cursor-pointer flex flex-col group">
                                  <span className="font-extrabold text-[12.5px] group-hover:text-emerald-800 flex items-center gap-1">
                                    {emp.name} <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-700" />
                                  </span>
                                  <span className="text-[9.5px] text-slate-400 block font-normal">{emp.job} · {emp.dept}</span>
                                </button>
                              ) : <span className="text-slate-400">({trip.empId})</span>}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-black text-slate-850">{trip.dest}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${(trip.type || 'داخلي') === 'خارجي' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                                  {(trip.type || 'داخلي') === 'خارجي' ? '🌐 خارجي' : '🇸🇦 داخلي'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 font-bold text-slate-700">{trip.purpose}</td>
                            <td className="p-3.5 text-[11.5px] text-slate-650 font-semibold">
                              <div className="font-mono">{trip.from} — {trip.to}</div>
                            </td>
                            <td className="p-3.5 font-mono text-slate-800 text-[12.5px] font-black">
                              {trip.cost ? trip.cost.toLocaleString('en-US') : '0'} ر.س
                              <span className="text-[9.5px] text-indigo-650 font-sans block font-semibold">{trip.allowance || 0} ر.س/يوم</span>
                            </td>
                            <td className="p-3.5 text-center text-slate-500 text-[11px]">
                              {trip.insuranceCompany ? (
                                <div className="space-y-0.5">
                                  <span className="text-slate-700 font-semibold">{trip.insuranceCompany}</span>
                                  <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold block rounded w-fit mx-auto px-1">نشطة</span>
                                </div>
                              ) : <span className="text-slate-400 italic">—</span>}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-block border px-2.5 py-1 rounded-full text-[10.5px] font-black ${statusClass}`}>
                                {trip.status === 'بانتظار الموافقة' ? '⏱ معلّقة' : trip.status === 'موافق عليها' ? '✓ معتمدة' : '✕ مرفوضة'}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex gap-1 justify-center items-center">
                                {trip.status === 'بانتظار الموافقة' && hasPermission('approve_operations') && (
                                  <>
                                    <button onClick={() => handleOpenDecision(trip.id, 'موافق عليها')} className="p-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border border-emerald-200 rounded cursor-pointer transition hover:scale-105" title="اعتماد">
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleOpenDecision(trip.id, 'مرفوضة')} className="p-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200 rounded cursor-pointer transition hover:scale-105" title="رفض">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                                <button onClick={() => startEditTrip(trip)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border-none rounded-md cursor-pointer transition hover:scale-105" title="تعديل">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteTrip(trip.id)} className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-650 border-none rounded-md cursor-pointer transition hover:scale-105" title="حذف">
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                                <button onClick={() => setExpandedTripId(isExpanded ? null : trip.id)} className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-none rounded-md cursor-pointer transition hover:scale-105" title="تفاصيل">
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="bg-slate-50/75 p-5 border-b border-slate-200">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
                                  
                                  <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-150">
                                    <h4 className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                                      المبررات والملاحظات
                                    </h4>
                                    <p className="text-[11.5px] text-slate-650 leading-relaxed font-semibold">
                                      {trip.notes || 'لا توجد ملاحظات.'}
                                    </p>
                                    {trip.fileData ? (
                                      <div className="pt-2 border-t border-slate-100">
                                        <button type="button" onClick={() => { const link = document.createElement('a'); link.href = trip.fileData!; link.download = trip.fileName || 'travel.pdf'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} className="text-[10px] text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 px-2.5 py-1.5 rounded-lg mt-1 font-bold flex items-center gap-1.5 cursor-pointer transition w-full justify-between">
                                          <span className="truncate flex items-center gap-1">📄 <strong className="font-mono truncate">{trip.fileName || 'مرفق.pdf'}</strong></span>
                                          <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded shrink-0">تحميل 📥</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="pt-2 border-t border-slate-100">
                                        <span className="text-[10px] text-slate-405 font-bold">⚠️ لا يوجد مرفق</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-150">
                                    <h4 className="text-[11px] font-black text-slate-805 flex items-center gap-1">
                                      <DollarSign className="w-3.5 h-3.5 text-emerald-805" />
                                      تفصيل الميزانية
                                    </h4>
                                    <div className="divide-y divide-slate-100 text-[11px] font-semibold space-y-1 text-slate-600">
                                      <div className="flex justify-between py-1">
                                        <span>البدل اليومي:</span>
                                        <span className="font-mono text-slate-900 font-bold">{trip.allowance ? (trip.allowance * calculatedDays).toLocaleString() : '0'} ر.س</span>
                                      </div>
                                      <div className="flex justify-between py-1">
                                        <span>تذاكر الطيران:</span>
                                        <span className="font-mono text-slate-900 font-bold">{(trip.ticketCost || 0).toLocaleString()} ر.س</span>
                                      </div>
                                      <div className="flex justify-between py-1">
                                        <span>السكن:</span>
                                        <span className="font-mono text-slate-900 font-bold">{(trip.housingCost || 0).toLocaleString()} ر.س</span>
                                      </div>
                                      <div className="flex justify-between py-1">
                                        <span>الانتقالات:</span>
                                        <span className="font-mono text-slate-900 font-bold">{(trip.transportCost || 0).toLocaleString()} ر.س</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2 p-3.5 bg-white rounded-xl border border-slate-150">
                                    <h4 className="text-[11px] font-black text-slate-805 flex items-center gap-1">
                                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                      القرار والاعتماد
                                    </h4>
                                    <div className="text-[11px] space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-slate-500 font-bold">الحالة:</span>
                                        <span className="font-black text-indigo-700">{trip.status}</span>
                                      </div>
                                      {trip.decisionDate && (
                                        <div className="flex justify-between">
                                          <span className="text-slate-500 font-bold">تاريخ القرار:</span>
                                          <span className="font-mono text-slate-700 font-bold">{trip.decisionDate}</span>
                                        </div>
                                      )}
                                      <div className="mt-1 pb-2 border-b border-slate-100">
                                        <span className="text-slate-500 font-bold block">ملاحظات القرار:</span>
                                        <p className="text-[11px] text-slate-650 italic mt-0.5 leading-relaxed font-semibold">
                                          {trip.resolvedNotes || 'قيد المراجعة.'}
                                        </p>
                                      </div>
                                      {trip.status === 'بانتظار الموافقة' && (
                                        <div className="pt-2 flex flex-col gap-1.5">
                                          {hasPermission('approve_operations') ? (
                                            <div className="flex gap-1.5">
                                              <button onClick={() => handleOpenDecision(trip.id, 'موافق عليها')} className="flex-1 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded text-[10px] font-black cursor-pointer transition">✓ اعتماد</button>
                                              <button onClick={() => handleOpenDecision(trip.id, 'مرفوضة')} className="flex-1 py-1 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-650 hover:text-white rounded text-[10px] font-black cursor-pointer transition">✕ رفض</button>
                                            </div>
                                          ) : (
                                            <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-1.5 rounded border border-rose-150 text-center">⚠️ لا تملك صلاحية الاعتماد</p>
                                          )}
                                        </div>
                                      )}
                                    </div>
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

      {/* TAB 2: Analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-3xs grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 select-none">
              <span className="text-[10px] text-slate-400 font-bold block">تكلفة السكن الفندقي</span>
              <h4 className="text-lg font-black text-slate-800 font-mono tracking-tight mt-1">
                {analyticsData.totalHousingEstimation.toLocaleString('en-US')} <span className="text-xs">ر.س</span>
              </h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 select-none">
              <span className="text-[10px] text-slate-400 font-bold block">تكلفة تذاكر الطيران</span>
              <h4 className="text-lg font-black text-slate-800 font-mono tracking-tight mt-1">
                {analyticsData.totalTicketEstimation.toLocaleString('en-US')} <span className="text-xs">ر.س</span>
              </h4>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 select-none">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي البدلات اليومية</span>
              <h4 className="text-lg font-black text-slate-800 font-mono tracking-tight mt-1">
                {analyticsData.totalAllowanceEstimation.toLocaleString('en-US')} <span className="text-xs">ر.س</span>
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
              <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-emerald-800" />
                الميزانية حسب الوجهة (ر.س)
              </h3>
              {destinationBudgetData.length === 0 ? (
                <div className="py-24 text-center text-slate-405 font-bold">لا توجد بيانات كافية.</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={destinationBudgetData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" fontSize={10} stroke="#64748b" />
                      <YAxis dataKey="name" type="category" width={80} fontSize={10} stroke="#64748b" />
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ر.س`} />
                      <Bar dataKey="إجمالي التكلفة" fill="#059669" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
              <h3 className="text-xs font-black text-slate-800 mb-4 flex items-center gap-1">
                <Activity className="w-4 h-4 text-indigo-700" />
                داخلي مقابل خارجي
              </h3>
              {trips.length === 0 ? (
                <div className="py-24 text-center text-slate-405 font-bold">لا توجد مأموريات.</div>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="h-56 w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={tripTypeComparison} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                          {tripTypeComparison.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ر.س`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4 flex-1 text-slate-700 text-xs w-full">
                    {tripTypeComparison.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border-r-4" style={{ borderColor: item.color }}>
                        <span className="font-bold">{item.name}</span>
                        <span className="font-mono font-black">{item.value.toLocaleString()} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};