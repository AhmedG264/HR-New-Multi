/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { DeductionType, Employee, EmployeeDeduction } from '../types';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Eye,
  BookOpen,
  Filter,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Calendar,
  Layers,
  FileCheck2,
  RefreshCw,
  Database,
  ExternalLink,
  Info,
  Users,
  Building,
  Landmark,
  PiggyBank,
  AlertTriangle,
  Sparkles,
  Edit,
  Sliders,
  Briefcase
} from 'lucide-react';

export const Deductions: React.FC = () => {
  const {
    employees,
    deductions,
    deductionTypes,
    contracts,
    addDeductionType,
    updateDeductionType,
    deleteDeductionType,
    updateEmployeeDeductions,
    setCurrentView,
    setSelectedEmployeeId
  } = useHR();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedNationalityType, setSelectedNationalityType] = useState<string>('all'); // all, saudi, expat
  const [selectedComplianceType, setSelectedComplianceType] = useState<string>('all'); // all, compliant, warning

  // Modal / Dialog Screen control
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<DeductionType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom type states
  const [dtLabel, setDtLabel] = useState('');
  const [dtIcon, setDtIcon] = useState('🛡️');
  const [dtEmp, setDtEmp] = useState('');
  const [dtComp, setDtComp] = useState('');
  const [dtNote, setDtNote] = useState('');
  const [dtReq, setDtReq] = useState(true);

  // Individual employee adjustment modal
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [activeEmp, setActiveEmp] = useState<Employee | null>(null);
  const [edGosi, setEdGosi] = useState('');
  const [edMed, setEdMed] = useState('');
  const [edTax, setEdTax] = useState('');
  const [edOth, setEdOth] = useState('');
  const [edOthNote, setEdOthNote] = useState('');
  const [edFixed, setEdFixed] = useState('');

  // UI state feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isAligningGosi, setIsAligningGosi] = useState(false);

  // Trigger automated in-app toast
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Check if an employee is a Saudi citizen (check explicit property first, then fallback to lack of Iqama exp)
  const isEmployeeSaudi = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp && emp.isSaudi !== undefined) {
      return emp.isSaudi;
    }
    const contract = contracts.find(c => c.empId === empId);
    return contract ? !contract.iqamaExp : true;
  };

  // Helper labels & styles
  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'الهندسة': return 'bg-indigo-50 text-indigo-700 border-indigo-150';
      case 'المبيعات': return 'bg-amber-50 text-amber-700 border-amber-150';
      case 'التسويق': return 'bg-purple-50 text-purple-700 border-purple-150';
      case 'المالية': return 'bg-emerald-50 text-emerald-700 border-emerald-150';
      case 'الموارد البشرية': return 'bg-rose-50 text-rose-700 border-rose-150';
      default: return 'bg-slate-50 text-slate-705 border-slate-150';
    }
  };

  // Calculate detailed financial KPIs & GOSI metrics directly from database
  const metrics = useMemo(() => {
    let saudiCount = 0;
    let expatCount = 0;
    
    let totalSalaries = 0;
    let totalDeductionsInSAR = 0;
    let totalEmployerGosiSAR = 0;
    let totalEmployeeGosiSAR = 0;
    
    let compliantCount = 0;
    let warningCount = 0;

    employees.forEach(e => {
      totalSalaries += e.salary;
      const isSaudi = isEmployeeSaudi(e.id);
      if (isSaudi) {
        saudiCount++;
      } else {
        expatCount++;
      }

      // Find deductions details
      const d = deductions.find(x => x.empId === e.id) || {
        gosiPct: isSaudi ? 9.75 : 0,
        medPct: 1.5,
        taxPct: 0,
        otherPct: 0,
        otherNote: ''
      };

      // Exact GOSI rules audit
      // Saudis must have 9.75% employee GOSI
      // Expats must have 0% employee GOSI (the 2% hazard is paid 100% by company, no deduct from salary)
      const isGosiCompliant = isSaudi ? d.gosiPct === 9.75 : d.gosiPct === 0;
      if (isGosiCompliant) {
        compliantCount++;
      } else {
        warningCount++;
      }

      // Convert percentages to actual SAR values based on basic salary
      const gosiEmpAmt = e.salary * (d.gosiPct / 100);
      const medAmt = e.salary * (d.medPct / 100);
      const taxAmt = e.salary * (d.taxPct / 100);
      const otherAmt = e.salary * ((d.otherPct || 0) / 100);
      
      const fixedDeductAmt = e.deduct || 0;
      const sumDeducts = gosiEmpAmt + medAmt + taxAmt + otherAmt + fixedDeductAmt;
      
      totalDeductionsInSAR += sumDeducts;
      totalEmployeeGosiSAR += gosiEmpAmt;

      // Employer GOSI: 11.75% for Saudis, 2.0% for expats
      const employerGosiPct = isSaudi ? 11.75 : 2.00;
      totalEmployerGosiSAR += e.salary * (employerGosiPct / 100);
    });

    const totalCount = employees.length || 1;
    const gosiComplianceScore = Math.round((compliantCount / totalCount) * 100);

    return {
      saudiCount,
      expatCount,
      totalSalaries,
      totalDeductionsInSAR: Math.round(totalDeductionsInSAR),
      totalEmployerGosiSAR: Math.round(totalEmployerGosiSAR),
      totalEmployeeGosiSAR: Math.round(totalEmployeeGosiSAR),
      gosiComplianceScore,
      compliantCount,
      warningCount
    };
  }, [employees, deductions, contracts]);

  // Handle Filtering & Searching
  const filteredEmployeesList = useMemo(() => {
    return employees.filter(e => {
      // 1. Search term
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.job.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Department filter
      const matchesDept = selectedDept === 'all' || e.dept === selectedDept;

      // 3. Nationality filter
      const isSaudi = isEmployeeSaudi(e.id);
      const matchesNationality = selectedNationalityType === 'all' ||
                                 (selectedNationalityType === 'saudi' && isSaudi) ||
                                 (selectedNationalityType === 'expat' && !isSaudi);

      // 4. Compliance filter
      const d = deductions.find(x => x.empId === e.id) || { gosiPct: isSaudi ? 9.75 : 0 };
      const isGosiCompliant = isSaudi ? d.gosiPct === 9.75 : d.gosiPct === 0;
      const matchesCompliance = selectedComplianceType === 'all' ||
                                (selectedComplianceType === 'compliant' && isGosiCompliant) ||
                                (selectedComplianceType === 'warning' && !isGosiCompliant);

      return matchesSearch && matchesDept && matchesNationality && matchesCompliance;
    });
  }, [employees, searchTerm, selectedDept, selectedNationalityType, selectedComplianceType, deductions, contracts]);

  // Automated alignment trigger to align GOSI percentages for all employees in DB
  const handleAutoAlignGosi = async () => {
    setIsAligningGosi(true);
    try {
      let alignedCount = 0;
      for (const emp of employees) {
        const isSaudi = isEmployeeSaudi(emp.id);
        const expectedGosiPct = isSaudi ? 9.75 : 0;
        
        const d = deductions.find(x => x.empId === emp.id) || {
          gosiPct: expectedGosiPct,
          medPct: 1.5,
          taxPct: 0,
          otherPct: 0,
          otherNote: ''
        };

        if (d.gosiPct !== expectedGosiPct) {
          await updateEmployeeDeductions(emp.id, {
            ...d,
            gosiPct: expectedGosiPct
          });
          alignedCount++;
        }
      }

      if (alignedCount > 0) {
        triggerToast(`تم بنجاح مطابقة وتحديث عدد (${alignedCount}) من ملفات الموظفين لتتوافق مع نسب التأمينات الاجتماعية GOSI لعام 2026.`, 'success');
      } else {
        triggerToast('كافة سجلات الموظفين مطابقة ومنظمة بنسبة 100% مع لوائح التأمينات الاجتماعية GOSI.', 'info');
      }
    } catch (err) {
      console.error(err);
      triggerToast('حدث خطأ فني أثناء تحديث ملفات التأمينات بقاعدة البيانات.', 'error');
    } finally {
      setIsAligningGosi(false);
    }
  };

  // Open the Deduction Type form
  const openTypeForm = (type: DeductionType | null) => {
    if (type) {
      setEditingType(type);
      setDtLabel(type.label);
      setDtIcon(type.icon);
      setDtEmp(type.empPct.toString());
      setDtComp(type.compPct.toString());
      setDtNote(type.note);
      setDtReq(type.required);
    } else {
      setEditingType(null);
      setDtLabel('');
      setDtIcon('📊');
      setDtEmp('');
      setDtComp('');
      setDtNote('');
      setDtReq(false);
    }
    setShowTypeModal(true);
  };

  // Save the custom deduction category to DB
  const handleSaveTypePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dtLabel.trim() || !dtEmp || !dtComp) {
      triggerToast('الرجاء التأكد من ملء جميع الحقول المطلوبة بشكل دقيق.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        label: dtLabel.trim(),
        icon: dtIcon,
        empPct: Number(dtEmp) || 0,
        compPct: Number(dtComp) || 0,
        canEdit: true,
        required: dtReq,
        note: dtNote,
        color: editingType ? editingType.color : '#eab308'
      };

      if (editingType) {
        await updateDeductionType(editingType.id, payload);
        triggerToast(`تم تعديل معايير فئة الخصم "${dtLabel}" بنجاح في قاعدة البيانات.`, 'success');
      } else {
        await addDeductionType(payload);
        triggerToast(`تم إضافة فئة الخصم المفتوحة "${dtLabel}" بنجاح.`, 'success');
      }
      setShowTypeModal(false);
    } catch (err) {
      console.error(err);
      triggerToast('خطأ في كتابة التعديل على قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open the detailed custom employee deduction form
  const openEmpForm = (empId: string) => {
    const e = employees.find(x => x.id === empId);
    if (!e) return;
    setActiveEmp(e);
    
    // Fallback if not modified before
    const isSaudi = isEmployeeSaudi(empId);
    const d = deductions.find(x => x.empId === empId) || {
      gosiPct: isSaudi ? 9.75 : 0,
      medPct: 1.5,
      taxPct: 0,
      otherPct: 0,
      otherNote: ''
    };

    setEdGosi(d.gosiPct.toString());
    setEdMed(d.medPct.toString());
    setEdTax((d.taxPct || 0).toString());
    setEdOth((d.otherPct || 0).toString());
    setEdOthNote(d.otherNote || '');
    setEdFixed((e.deduct || 0).toString());
    setShowEmpModal(true);
  };

  // Save changes to the specific employee deductions to DB
  const handleSaveEmpDeductionsPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmp) return;

    setIsSaving(true);
    try {
      await updateEmployeeDeductions(activeEmp.id, {
        gosiPct: Number(edGosi) || 0,
        medPct: Number(edMed) || 0,
        taxPct: Number(edTax) || 0,
        otherPct: Number(edOth) || 0,
        otherNote: edOthNote
      }, Number(edFixed) || 0);

      triggerToast(`تم حفظ وتحديث مستقطعات الموظف "${activeEmp.name}" وإقرارها بنجاح.`, 'success');
      setShowEmpModal(false);
    } catch (err) {
      console.error(err);
      triggerToast('خطأ أثناء كتابة استقطاعات الموظف.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a customized deduction type
  const handleDeleteType = async (id: string, label: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف فئة الخصم "${label}" بصفة دائمية؟`)) return;
    try {
      await deleteDeductionType(id);
      triggerToast(`تم إلغاء وفصل فئة الخصم "${label}" من قاعدة البيانات بنجاح.`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast('حدث خطأ أثناء محاولة المسح.', 'error');
    }
  };

  // Navigate directly between views inside the single HRMS dashboard context
  const handleNavigate = (view: string) => {
    setSelectedEmployeeId(null);
    setCurrentView(view);
  };

  return (
    <div className="space-y-6 font-sans select-none animate-slideup mb-12 text-right" dir="rtl" id="deductions-root">

      {/* Toast System Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
          'bg-slate-800 text-white border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {toastMessage.type === 'error' && <ShieldAlert className="w-5 h-5 flex-shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
          <span className="text-xs font-bold leading-normal">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-150">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">سجل الاستقطاعات والتأمينات</h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> تدقيق الامتثال GOSI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            بوابة الإشراف والمطابقة للتأمينات الاجتماعية (GOSI)، التأمين الطبي، وضرائب الدخل شهرياً.
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAutoAlignGosi}
            disabled={isAligningGosi}
            className="bg-emerald-600 text-white border-none px-4 py-2.5 rounded-xl cursor-pointer text-xs font-bold hover:bg-emerald-500 flex items-center gap-1.5 shadow-md shadow-emerald-900/20 transition active:scale-95 disabled:opacity-40"
            id="gosi-align-btn"
          >
            {isAligningGosi ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> جاري المطابقة...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" /> مطابقة GOSI الآلية
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Navigation Links - Horizontal Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-2 rounded-xl border border-slate-150">
        <button
          onClick={() => handleNavigate('payroll')}
          className="w-full text-right bg-white border border-slate-200 hover:border-gold px-4 py-3 rounded-xl text-xs text-slate-850 hover:bg-gold/5 flex items-center justify-between font-bold cursor-pointer transition shadow-xs"
          id="link-payroll"
        >
          <span className="flex items-center gap-2">💰 <span>مسيرات ومطابقة الأجور WPS</span></span>
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          onClick={() => handleNavigate('compliance')}
          className="w-full text-right bg-white border border-slate-200 hover:border-gold px-4 py-3 rounded-xl text-xs text-slate-850 hover:bg-gold/5 flex items-center justify-between font-bold cursor-pointer transition shadow-xs"
          id="link-compliance"
        >
          <span className="flex items-center gap-2">🛡️ <span>لوائح الالتزام والامتثال MHRSD</span></span>
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
        </button>

        <button
          onClick={() => handleNavigate('empfiles')}
          className="w-full text-right bg-white border border-slate-200 hover:border-gold px-4 py-3 rounded-xl text-xs text-slate-850 hover:bg-gold/5 flex items-center justify-between font-bold cursor-pointer transition shadow-xs"
          id="link-empfiles"
        >
          <span className="flex items-center gap-2">📝 <span>عقود الموظفين وتفاصيل الإقامة بقوى</span></span>
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* GOSI Rules Audit Callout if Alerts detected */}
      {metrics.warningCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slideup">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-right">
              <h4 className="text-xs font-extrabold text-amber-800">تعديلات غير متطابقة بالتأمينات الاجتماعية (عدد {metrics.warningCount} موظفين)</h4>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                اكتشف محرك الارتباط التلقائي وجود موظفين لا تتطابق نسب استقطاع GOSI المسجلة لهم مع اللائحة السعودية (السعودي: 9.75%، المقيم: 0%).
              </p>
            </div>
          </div>
          <button
            onClick={handleAutoAlignGosi}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg border-none cursor-pointer whitespace-nowrap self-end sm:self-auto shadow-sm"
          >
            مزامنة ومعالجة وحفظ الآن
          </button>
        </div>
      )}

      {/* KPI Stats Widgets Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="deductions-metrics">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">نسبة تطابق بيانات GOSI</span>
            <div className="flex items-baseline gap-1.5">
              <strong className={`text-xl font-black ${metrics.gosiComplianceScore >= 90 ? 'text-emerald-600' : 'text-amber-500'}`}>
                {metrics.gosiComplianceScore}%
              </strong>
              <span className="text-[9px] text-slate-400 font-bold">
                ({metrics.compliantCount} من {employees.length})
              </span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            metrics.gosiComplianceScore >= 90 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">إجمالي استقطاع الموظفين</span>
            <strong className="text-xl font-black text-rose-600 font-mono">
              {metrics.totalEmployeeGosiSAR.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">ر.س</span>
            </strong>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center border border-rose-100">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">تحمل المنشأة الشهري (GOSI)</span>
            <strong className="text-xl font-black text-emerald-600 font-mono">
              {metrics.totalEmployerGosiSAR.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold">ر.س</span>
            </strong>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold">كادر المواطنين والمقيمين</span>
            <div className="flex gap-2 text-xs font-black text-slate-700 mt-1">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px]">
                🇸🇦 {metrics.saudiCount} مواطن
              </span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 text-[10px]">
                💼 {metrics.expatCount} مقيم
              </span>
            </div>
          </div>
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* RIGHT AREA: Employees specific ledger / deductions (Takes 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filtering and search toolbox for employees */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
            
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full sm:max-w-md">
                <input
                  type="text"
                  placeholder="ابحث باسم الموظف أو المسمى الوظيفي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-gold focus:bg-white bg-slate-50 font-medium text-right"
                  id="deductions-search-input"
                />
                <Database className="w-4 h-4 text-slate-450 absolute right-3 top-3" />
              </div>

              {/* Department Shortcut Select */}
              <div className="w-full sm:w-auto shrink-0 flex items-center gap-1.5 justify-end">
                <span className="text-[10px] font-bold text-slate-400">القسم:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold bg-white text-slate-750 focus:border-gold outline-none"
                >
                  <option value="all">كافة الأقسام</option>
                  <option value="الهندسة">الهندسة 💻</option>
                  <option value="المبيعات">المبيعات 📈</option>
                  <option value="التسويق">التسويق 📣</option>
                  <option value="المالية">المالية 💵</option>
                  <option value="الموارد البشرية">الموارد البشرية 👥</option>
                </select>
              </div>

            </div>

            {/* Quick Segment Pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 justify-start items-center">
              
              <span className="text-[10px] font-extrabold text-slate-450 ml-1">تصفية الجنسية:</span>
              <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[10px]">
                <button
                  onClick={() => setSelectedNationalityType('all')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${selectedNationalityType === 'all' ? 'bg-white text-gold shadow-xs' : 'text-slate-550'}`}
                >
                  المجموع الكل
                </button>
                <button
                  onClick={() => setSelectedNationalityType('saudi')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${selectedNationalityType === 'saudi' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-550'}`}
                >
                  مواطن سعودي 🇸🇦
                </button>
                <button
                  onClick={() => setSelectedNationalityType('expat')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${selectedNationalityType === 'expat' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-550'}`}
                >
                  مقيم أجنبي 💼
                </button>
              </div>

              <span className="text-[10px] font-extrabold text-slate-450 mr-3 ml-1">حالة التطابق:</span>
              <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-[10px]">
                <button
                  onClick={() => setSelectedComplianceType('all')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${selectedComplianceType === 'all' ? 'bg-white text-gold shadow-xs' : 'text-slate-550'}`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setSelectedComplianceType('compliant')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${selectedComplianceType === 'compliant' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-550'}`}
                >
                  سليم متطابق ✅
                </button>
                <button
                  onClick={() => setSelectedComplianceType('warning')}
                  className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${selectedComplianceType === 'warning' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-550'}`}
                >
                  يتطلب معاينة ⚠️
                </button>
              </div>

            </div>

          </div>

          {/* Main Table: Detailed withholding ledger */}
          <div className="bg-white border border-slate-200 rounded-xl p-0 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-800">بيان مسيرات أجور الكوادر ونسب الاستقطاع لحماية الأجور WPS</h3>
                <p className="text-[10px] text-slate-400">تعديل الاستقطاعات الدورية والثابتة لكل موظف والتأكد من مطابقة نسب الدفع للصافي</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                إجمالي المعروض: {filteredEmployeesList.length} موظفين
              </span>
            </div>

            {filteredEmployeesList.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">لم يعثر على موظفين في الفئة المحددة</p>
                <p className="text-[10px] text-slate-400">يرجى تعديل خيارات البحث أو مرشحات الجنسية والتطابق.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-405 font-bold text-[10px] uppercase">
                      <th className="p-3.5">الموظف والجنسية</th>
                      <th className="p-3.5">القسم والمسمى</th>
                      <th className="p-3.5">الراتب الأساسي ومعاش GOSI</th>
                      <th className="p-3.5">تأمين طبي وخصومات أخرى</th>
                      <th className="p-3.5">الصافي المقدر شهرياً</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployeesList.map((e) => {
                      const isSaudi = isEmployeeSaudi(e.id);
                      
                      const d = deductions.find(x => x.empId === e.id) || {
                        gosiPct: isSaudi ? 9.75 : 0,
                        medPct: 1.5,
                        taxPct: 0,
                        otherPct: 0,
                        otherNote: ''
                      };

                      // Calculations
                      const gosiEmpAmt = Math.round(e.salary * (d.gosiPct / 100));
                      const medAmt = Math.round(e.salary * (d.medPct / 100));
                      const taxAmt = Math.round(e.salary * (d.taxPct / 100));
                      const otherAmt = Math.round(e.salary * ((d.otherPct || 0) / 100));
                      const fixedAmt = e.deduct || 0;
                      
                      const totalWithholdingVal = gosiEmpAmt + medAmt + taxAmt + otherAmt + fixedAmt;
                      const estimatedNetSalary = e.salary + e.allow - totalWithholdingVal;

                      const isGosiCompliant = isSaudi ? d.gosiPct === 9.75 : d.gosiPct === 0;

                      return (
                        <tr key={e.id} className="hover:bg-slate-50/70 transition duration-150">
                          
                          {/* Col 1: Name and citizenship */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold leading-none shrink-0">
                                {e.name[0]}
                              </div>
                              <div className="space-y-1">
                                <strong className="font-extrabold text-slate-800 text-xs block">{e.name}</strong>
                                <div className="flex items-center gap-1">
                                  {isSaudi ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                      🇸🇦 مواطن سعودي
                                    </span>
                                  ) : (
                                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] px-1.5 py-0.2 rounded font-bold">
                                      💼 مقيم أجنبي
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-450 font-medium">الرقم: {e.id}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Dept */}
                          <td className="p-3.5">
                            <span className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold ${getDeptColor(e.dept)}`}>
                              {e.dept}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1 font-medium">{e.job}</div>
                          </td>

                          {/* Col 3: Salary and pension */}
                          <td className="p-3.5">
                            <div className="font-extrabold text-slate-700">{e.salary.toLocaleString()} ر.س</div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[9px] text-slate-450">استقطاع GOSI:</span>
                              <strong className={`font-mono text-[10px] ${isGosiCompliant ? 'text-emerald-600' : 'text-rose-600 font-black'}`}>
                                {d.gosiPct}% (-{gosiEmpAmt.toLocaleString()} ر.س)
                              </strong>
                              {!isGosiCompliant && (
                                <span className="bg-rose-50 text-rose-600 px-1 rounded text-[8px] font-bold animate-pulse" title="التأمينات تفرض نسبة أخرى">
                                  ⚠️ بحاجة مواءمة
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Col 4: Medical and others */}
                          <td className="p-3.5 space-y-0.5">
                            <div className="text-slate-650 font-medium font-mono text-[10px]">
                              التأمين الطبي: {d.medPct}% (-{medAmt.toLocaleString()} ر.س)
                            </div>
                            {fixedAmt > 0 && (
                              <div className="text-rose-650 font-bold font-mono text-[9px]">
                                خصم إداري ثابت: -{fixedAmt.toLocaleString()} ر.س
                              </div>
                            )}
                            {otherAmt > 0 && (
                              <div className="text-purple-600 font-medium text-[9px]">
                                {d.otherNote || 'أخرى'}: {d.otherPct}% (-{otherAmt.toLocaleString()} ر.س)
                              </div>
                            )}
                          </td>

                          {/* Col 5: Estimated Net pay */}
                          <td className="p-3.5">
                            <strong className="text-sm font-black text-slate-900 font-mono">
                              {estimatedNetSalary.toLocaleString()}{' '}
                              <span className="text-[9px] font-bold text-slate-450">ر.س</span>
                            </strong>
                            <div className="text-[9.2px] text-slate-400 mt-0.5">
                              البدلات المضافة: +{e.allow.toLocaleString()} ر.س
                            </div>
                          </td>

                          {/* Col 6: Control actions */}
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => openEmpForm(e.id)}
                              className="bg-gold hover:bg-gold-light text-slate-900 border-none px-2.5 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 mx-auto transition-colors"
                              id={`edit-emp-deduct-${e.id}`}
                            >
                              <Edit className="w-3 h-3" /> تعديل الميزانية
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* LEFT AREA: General Deduction Types Settings */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="text-right">
                <h3 className="text-xs font-black text-slate-800">فئات وخصومات المنشأة العامة</h3>
                <p className="text-[9px] text-slate-400">تحرير قواعد السحب العام لحسابات الأقسام</p>
              </div>
              <button
                onClick={() => openTypeForm(null)}
                className="bg-gold text-slate-900 border-none px-2.5 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gold-light cursor-pointer transition flex items-center gap-1"
                id="add-new-deduction-type-btn"
              >
                <Plus className="w-3.5 h-3.5" /> إضافة فئة
              </button>
            </div>

            {/* List of general deduction rules database */}
            <div className="space-y-3">
              {deductionTypes.map((t) => (
                <div
                  key={t.id}
                  className="p-3 border border-slate-205 rounded-xl text-right space-y-2 hover:bg-slate-50 transition relative group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.icon}</span>
                      <strong className="text-xs font-bold text-slate-800">{t.label}</strong>
                    </div>
                    {t.canEdit ? (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                        <button
                          onClick={() => openTypeForm(t)}
                          className="bg-transparent border-none text-gold p-1 hover:text-slate-900 cursor-pointer text-[10px] font-bold"
                          title="تعديل فئة استقطاع"
                        >
                          ✏️ تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteType(t.id, t.label)}
                          className="bg-transparent border-none text-rose-600 p-1 hover:text-rose-800 cursor-pointer"
                          title="مسح الفئة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] bg-slate-100 text-slate-400 font-medium px-2 py-0.5 rounded border border-slate-200">
                        مفروض اتحادياً
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {t.note || 'لا تتوفر تفاصيل إضافية لهذا السجل المالي.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-2 font-medium">
                    <div>
                      <span className="text-slate-400 block">خصم الموظف:</span>
                      <strong className="text-rose-600 font-mono">{t.empPct}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">مساهمة الشركة:</span>
                      <strong className="text-emerald-650 font-mono">+{t.compPct}%</strong>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* MODAL 1: EDIT EMPLOYEE DEDUCTIONS IN DB */}
      {showEmpModal && activeEmp && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadein" id="edit-emp-modal-overlay">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleup text-right">
            
            {/* Header */}
            <div className="pb-3 border-b border-slate-100 mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900">
                  تخصيص استقطاعات التأمين والمستحقات والخصم
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="text-slate-400 hover:text-slate-700 bg-transparent border-none text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                تعديل وتوثيق استحقاقات موظف مالي: <strong>{activeEmp.name}</strong> ({isEmployeeSaudi(activeEmp.id) ? 'موطن سعودي 🇸🇦' : 'مقيم وافد 💼'})
              </p>
            </div>

            <form onSubmit={handleSaveEmpDeductionsPost} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">حصة GOSI للموظف %</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 font-mono font-bold text-right"
                    value={edGosi}
                    onChange={(e) => setEdGosi(e.target.value)}
                    required
                  />
                  <span className="text-[8px] text-slate-400">الوطني 9.75%، الوافد 0%</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">التأمين الطبي %</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 font-mono font-bold text-right"
                    value={edMed}
                    onChange={(e) => setEdMed(e.target.value)}
                    required
                  />
                  <span className="text-[8px] text-slate-400">الافتراضي لجميع الموظفين هو 1.5%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">ضريبة الدخل الشخصي %</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 font-mono font-bold text-right"
                    value={edTax}
                    onChange={(e) => setEdTax(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">استقطاع/سلف إضافي %</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 font-mono font-bold text-right"
                    value={edOth}
                    onChange={(e) => setEdOth(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">سبب الاستقطاع الإضافي</label>
                <input
                  type="text"
                  placeholder="سلفة على الراتب، قسط مالي مخصص للتأمين..."
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-right"
                  value={edOthNote}
                  onChange={(e) => setEdOthNote(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-550">خصومات غياب مخصصة ثابتة (بالريال السعودي ر.س)</label>
                <input
                  type="number"
                  placeholder="قيمة خصم ثابت بالريال تدرج في مسير الأجور مباشرة"
                  className="border border-slate-200 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-gold bg-slate-50 font-mono font-bold text-right"
                  value={edFixed}
                  onChange={(e) => setEdFixed(e.target.value)}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold hover:bg-gold-light text-slate-900 border-none px-5 py-2 rounded-lg text-xs font-bold cursor-pointer shadow-sm flex items-center justify-center gap-1.5 min-w-[130px] disabled:opacity-50"
                  id="submit-deduct-modal-btn"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>💾 حفظ الاستقطاع</>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT GLOBAL DEDUCTION TYPE IN DB */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadein" id="deduct-type-modal-overlay">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleup text-right">
            
            {/* Header */}
            <div className="pb-3 border-b border-slate-100 mb-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900">
                  {editingType ? 'تعديل معايير فئة الخصم والاستقطاع' : 'إدراج فئة خصم عامة جديدة بالمنشأة'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="text-slate-400 hover:text-slate-750 bg-transparent border-none text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-slate-450 mt-1">
                تعديل فئة الخصم بقواعد البيانات يؤثر بشكل آلي وتلقائي على حساب كافة الموظفين.
              </p>
            </div>

            <form onSubmit={handleSaveTypePost} className="space-y-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-550 font-bold">اسم فئة الخصم والتأمينات *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خصم شركة بوبا للتأمين الطبي"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-right font-medium"
                  value={dtLabel}
                  onChange={(e) => setDtLabel(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">الرمز المعبّر / أيقونة</label>
                  <input
                    type="text"
                    required
                    placeholder="🏥"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-center font-black"
                    value={dtIcon}
                    onChange={(e) => setDtIcon(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">حكم الالتزام بالمنشأة</label>
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-xs outline-none focus:border-gold bg-slate-50 text-right"
                    value={dtReq ? '1' : '0'}
                    onChange={(e) => setDtReq(e.target.value === '1')}
                  >
                    <option value="1">إلزامي حكومي / للكل</option>
                    <option value="0">اختياري مخصص للموظف</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">نسبة سحب العامل % *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="مثال: 1.50%"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 font-mono font-bold text-center"
                    value={dtEmp}
                    onChange={(e) => setDtEmp(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">مساهمة الشركة % *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="مثال: 11.75%"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 font-mono font-bold text-center"
                    value={dtComp}
                    onChange={(e) => setDtComp(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">وصف أو تعليق مرجعي للخصم</label>
                <input
                  type="text"
                  placeholder="مستند وزارة الموارد البشرية رقم (104) للمادة الطبية..."
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-gold bg-slate-50 text-right"
                  value={dtNote}
                  onChange={(e) => setDtNote(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-none px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition"
                >
                  إلغاء التعديل
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold hover:bg-gold-light text-slate-900 border-none px-5 py-2 rounded-lg text-xs font-bold cursor-pointer shadow-sm flex items-center justify-center gap-1.5 min-w-[120px] disabled:opacity-50"
                  id="submit-type-modal-btn"
                >
                  {isSaving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>💾 حفظ الفئة</>
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
