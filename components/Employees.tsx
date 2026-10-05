/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { Employee } from '../types';
import { exportEmployeesListCSV, printOfficialReport } from '../utils/exportUtils';
import {
  CURRENCIES,
  WORK_TYPES,
  CONTRACT_TYPES,
  DEFAULT_CURRENCY,
  DEFAULT_WORK_TYPE,
  DEFAULT_CONTRACT_TYPE,
  UNSPECIFIED_LABEL,
  getCurrencySymbol,
  formatMoney,
  sumByCurrency,
  formatCurrencyTotals
} from '../utils/employmentOptions';
import { isSaudiEmployee } from '../utils/nationality';
import { ConfirmationModal } from './ConfirmationModal';

export const Employees: React.FC = () => {
  const { 
    employees, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    contracts,
    updateContract,
    professions,
    deductions,
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab
  } = useHR();

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // States for confirmation dialog
  const [employeeToDelete, setEmployeeToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Form fields
  const [fName, setFName] = useState('');
  const [fJob, setFJob] = useState('');
  const [fDept, setFDept] = useState('تقنية المعلومات');
  const [fSalary, setFSalary] = useState('');
  const [fAllow, setFAllow] = useState('');
  const [fDeduct, setFDeduct] = useState('');
  const [fStatus, setFStatus] = useState<'نشط' | 'إجازة' | 'موقوف'>('نشط');
  const [fCurrency, setFCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [fWorkType, setFWorkType] = useState<string>(DEFAULT_WORK_TYPE);
  const [fContractType, setFContractType] = useState<string>(DEFAULT_CONTRACT_TYPE);

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');

  const depts = ['تقنية المعلومات', 'الموارد البشرية', 'المالية', 'التسوق', 'المبيعات', 'العمليات'];
  const statuses: ('نشط' | 'إجازة' | 'موقوف')[] = ['نشط', 'إجازة', 'موقوف'];

  // Visual identity per work arrangement (on-site / remote / hybrid)
  const workTypeStyle = (workType?: string) => {
    switch (workType) {
      case 'عن بعد':
        return { cls: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: '🏠' };
      case 'هجين':
        return { cls: 'bg-violet-50 text-violet-600 border-violet-200', icon: '🔀' };
      default:
        return { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: '🏢' };
    }
  };

  const getDaysLeft = (dateStr: string | undefined) => {
    if (!dateStr || dateStr === '-' || dateStr === '') return null;
    const diffTime = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const openForm = (emp: Employee | null) => {
    if (emp) {
      setEditingEmployee(emp);
      setFName(emp.name);
      setFJob(emp.job);
      setFDept(emp.dept);
      setFSalary(emp.salary.toString());
      setFAllow(emp.allow.toString());
      setFDeduct(emp.deduct.toString());
      setFStatus(emp.status);
      setFCurrency(emp.currency || DEFAULT_CURRENCY);
      setFWorkType(emp.workType || DEFAULT_WORK_TYPE);
      setFContractType(emp.contractType || DEFAULT_CONTRACT_TYPE);
    } else {
      setEditingEmployee(null);
      setFName('');
      setFJob('');
      setFDept('تقنية المعلومات');
      setFSalary('');
      setFAllow('');
      setFDeduct('0');
      setFStatus('نشط');
      setFCurrency(DEFAULT_CURRENCY);
      setFWorkType(DEFAULT_WORK_TYPE);
      setFContractType(DEFAULT_CONTRACT_TYPE);
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim() || !fJob.trim() || !fSalary) {
      alert('الرجاء تعبئة كافة الحقول المطلوبة بشكل صحيح.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: fName.trim(),
        job: fJob.trim(),
        dept: fDept,
        salary: Number(fSalary) || 0,
        allow: Number(fAllow) || 0,
        deduct: Number(fDeduct) || 0,
        status: fStatus,
        currency: fCurrency,
        workType: fWorkType,
        contractType: fContractType,
        hire: editingEmployee ? editingEmployee.hire : new Date().toISOString().slice(0, 10),
        leaveBalance: editingEmployee ? editingEmployee.leaveBalance : 21,
        perf: editingEmployee ? editingEmployee.perf : 4.0
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload);
        // Keep the signed contract record aligned with the engagement type
        const linkedContract = contracts?.find(c => c.id === 'cont_' + editingEmployee.id);
        if (linkedContract && linkedContract.type !== fContractType) {
          await updateContract(editingEmployee.id, { type: fContractType });
        }
      } else {
        await addEmployee(payload);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ الملف.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setEmployeeToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete.id);
      } catch (err) {
        console.error(err);
      }
      setEmployeeToDelete(null);
    }
  };

  // Navigates directly into Employee File module with a specific tab focused
  const navigateToProfileTab = (empId: string, tabName: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab(tabName);
    setCurrentView('empfiles');
  };

  // Filter & Search Logic
  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.job.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'الكل' || e.dept === selectedDept;
    const matchesStatus = selectedStatus === 'الكل' || e.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate live statistics
  const totalCount = employees.length;
  const activeCount = employees.filter(e => e.status === 'نشط').length;
  const leaveCount = employees.filter(e => e.status === 'إجازة').length;
  const suspendedCount = employees.filter(e => e.status === 'موقوف').length;
  // Salary packages may be issued in different currencies, so totals are grouped
  // per currency instead of being summed into one misleading figure.
  const payrollByCurrency = sumByCurrency<Employee>(employees, e => e.salary + e.allow, e => e.currency);
  const primaryPayroll = payrollByCurrency[0];
  const otherPayrolls = payrollByCurrency.slice(1);

  // Symbol of the currency selected in the open form (labels + placeholders)
  const currencySymbol = getCurrencySymbol(fCurrency);

  const handleExportPDF = () => {
    const tableHTML = `
      <table class="report-table">
        <thead>
          <tr>
            <th>اسم الموظف</th>
            <th>المسمى الوظيفي</th>
            <th>القسم</th>
            <th>الراتب الأساسي</th>
            <th>البدلات</th>
            <th>العملة</th>
            <th>نوع العمل</th>
            <th>نوع العقد</th>
            <th>تاريخ التعيين</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${filteredEmployees.map(e => `
            <tr>
              <td><strong>${e.name}</strong></td>
              <td>${e.job}</td>
              <td>${e.dept}</td>
              <td style="font-family: monospace;">${formatMoney(e.salary, e.currency)}</td>
              <td style="font-family: monospace;">${formatMoney(e.allow, e.currency)}</td>
              <td>${e.currency || DEFAULT_CURRENCY}</td>
              <td>${e.workType || UNSPECIFIED_LABEL}</td>
              <td>${e.contractType || UNSPECIFIED_LABEL}</td>
              <td>${e.hire}</td>
              <td>${e.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    printOfficialReport(
      'بيان السجل الإداري الشامل للكوادر البشرية والامتثال',
      tableHTML,
      filteredEmployees.length.toString(),
      formatCurrencyTotals(sumByCurrency<Employee>(filteredEmployees, e => e.salary + e.allow, e => e.currency))
    );
  };

  return (
    <div className="space-y-6 animate-slideup">
      {/* 🚀 Dynamic Metric Analytics Dashboard Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-[11px] font-bold text-slate-400">إجمالي الموظفين</p>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-xl font-bold text-slate-800">{totalCount}</span>
            <span className="text-xs text-slate-400">ملف مسجل</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-gold h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-[11px] font-bold text-emerald-600">على رأس العمل</p>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-xl font-bold text-emerald-700">{activeCount}</span>
            <span className="text-xs text-emerald-500">نشط الآن</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalCount ? (activeCount / totalCount) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-[11px] font-bold text-indigo-600">في إجازة رسمية</p>
          <div className="flex justify-between items-baseline mt-1 font-sans">
            <span className="text-xl font-bold text-indigo-700">{leaveCount}</span>
            <button 
              onClick={() => setCurrentView('leaves')} 
              className="text-[10px] text-indigo-500 hover:underline hover:font-bold bg-transparent border-none cursor-pointer"
            >
              عرض الطلبات ↗
            </button>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${totalCount ? (leaveCount / totalCount) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
          <p className="text-[11px] font-bold text-rose-500">موجَّه بالإيقاف</p>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-xl font-bold text-rose-700">{suspendedCount}</span>
            <span className="text-[10px] text-rose-500 bg-rose-50 px-1 py-0.5 rounded">حماية الأجور</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${totalCount ? (suspendedCount / totalCount) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-white border border-slate-250 rounded-xl p-4 shadow-sm col-span-2 md:col-span-1 bg-gradient-to-br from-slate-50 to-amber-50/20">
          <p className="text-[11px] font-bold text-amber-700">فاتورة الأجور الشاملة</p>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-base font-bold text-amber-800">{(primaryPayroll?.total || 0).toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-bold">{getCurrencySymbol(primaryPayroll?.code)} / شهر</span>
          </div>
          {otherPayrolls.length > 0 && (
            <p className="text-[9px] text-slate-500 font-bold mt-0.5" title="فاتورة الأجور موزعة حسب عملة كل موظف">
              + {otherPayrolls.map(t => formatMoney(t.total, t.code)).join(' + ')}
            </p>
          )}
          <button 
            onClick={() => setCurrentView('payroll')}
            className="text-[10px] text-amber-600 font-bold hover:underline bg-transparent border-none cursor-pointer mt-1 block"
          >
            تفاصيل الاستحقاقات والمسير ↗
          </button>
        </div>
      </div>

      {/* Search & Statistics Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="🔍 ابحث بالاسم أو المسمى الوظيفي..."
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-gold outline-none w-full sm:w-64 bg-slate-50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-gold outline-none bg-slate-50"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="الكل">كل الأقسام</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            className="border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-700 focus:border-gold outline-none bg-slate-50"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="الكل">جميع الحالات</option>
            <option value="نشط">نشط (على رأس العمل)</option>
            <option value="إجازة">في إجازة</option>
            <option value="موقوف">موقوف الصرف</option>
          </select>
        </div>
        <button
          onClick={() => openForm(null)}
          className="bg-gold text-slate-900 border-none px-5 py-2.5 rounded-lg cursor-pointer text-sm font-bold transition-all duration-200 hover:bg-gold-light hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto text-center shadow-sm"
        >
          + إضافة موظف جديد
        </button>
      </div>

      {/* Main List Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 overflow-hidden">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">قائمة الكوادر البشرية النشطة والمكلفة بالعمل ({filteredEmployees.length})</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => exportEmployeesListCSV(filteredEmployees)}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="تصدير السجل الفعلي في صيغة ملف Excel CSV"
            >
              📊 تصدير CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-gold-bg border border-gold-border text-gold hover:bg-gold-bg/80 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="توليد مستند تعيين رسمي معتمد بصيغة PDF"
            >
              📄 تقرير رسمي PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px] uppercase tracking-wider bg-slate-50/50">
                <th className="p-3 text-right">الموظف والمعلومات الأساسية</th>
                <th className="p-3">المسمى الوظيفي والمهنة</th>
                <th className="p-3">القسم</th>
                <th className="p-3">الحزمة المالية (أساسي + بدلات) بعملة الموظف</th>
                <th className="p-3">التأمينات والخصومات</th>
                <th className="p-3">الحالة والامتثال</th>
                <th className="p-3 text-center">إجراءات الإدارة والمطابقة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">لا يوجد موظفين مسجلين يطابقون شروط البحث الحالية</td>
                </tr>
              ) : (
                filteredEmployees.map((e) => {
                  const statusClass = 
                    e.status === 'نشط' 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                      : e.status === 'إجازة' 
                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                      : 'bg-slate-50 text-slate-500 border-slate-200';
                  
                  // Search for additional linked items in real-time
                  const empContract = contracts?.find(c => c.empId === e.id);
                  const empDeduction = deductions?.find(d => d.empId === e.id);
                  const empProf = professions?.find(p => p.empId === e.id);

                  const isSaudi = isSaudiEmployee(e, empContract);

                  // Extract specific compliance warnings
                  const iqamaDaysLeft = empContract ? getDaysLeft(empContract.iqamaExp) : null;
                  const contractDaysLeft = empContract ? getDaysLeft(empContract.end) : null;

                  const hasIqamaWarning = iqamaDaysLeft !== null && iqamaDaysLeft <= 30;
                  const hasContractWarning = contractDaysLeft !== null && contractDaysLeft <= 30;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                      <td className="p-3 font-semibold text-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {e.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-800 text-sm font-bold">{e.name}</span>
                              <span
                                className={`text-[9px] font-bold border px-1.5 py-0.5 rounded shrink-0 ${
                                  isSaudi
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-sky-50 text-sky-700 border-sky-100'
                                }`}
                                title="أهليّة الجنسية"
                              >
                                {isSaudi ? 'سعودي' : 'وافد مقيم'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">ID: {e.id} | ت: {e.hire}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <span className="font-semibold block">{e.job}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">المهنة: {empProf?.specialty || 'غير محددة'}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {e.workType && (
                            <span
                              className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${workTypeStyle(e.workType).cls}`}
                              title="نوع العمل / مقر تنفيذ المهام"
                            >
                              {workTypeStyle(e.workType).icon} {e.workType}
                            </span>
                          )}
                          {(e.contractType || empContract?.type) && (
                            <span
                              className="text-[9px] font-bold border border-sky-200 bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded"
                              title="نوع العقد ودرجة الالتزام بالدوام"
                            >
                              ⏱️ {e.contractType || empContract?.type}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{e.dept}</span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-700 text-xs">الأساسي: {formatMoney(e.salary, e.currency)}</p>
                          <p className="text-emerald-600 text-[11px] font-medium">البدلات: +{formatMoney(e.allow, e.currency)}</p>
                          {e.currency && <p className="text-[9px] text-slate-400 font-bold">عملة الصرف: {e.currency}</p>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5 text-xs text-slate-500">
                          <p>GOSI: <span className="font-semibold text-slate-700">{empDeduction?.gosiPct || '9.75'}%</span></p>
                          <p className="text-[10px] text-rose-500 font-medium">الخصم المباشر: {formatMoney(e.deduct, e.currency)}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1.5">
                          <span className={`inline-block border px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass}`}>
                            {e.status}
                          </span>
                          
                          {/* Live compliance notification flags (Saudization/Residency alerts) */}
                          <div className="space-y-1">
                            {hasIqamaWarning && (
                              <span className="block text-[9px] bg-rose-50 text-rose-600 border border-rose-100 rounded px-1.5 py-0.5 font-bold animate-pulse">
                                ⚠️ تجديد الإقامة قريباً ({iqamaDaysLeft} يوم)
                              </span>
                            )}
                            {hasContractWarning && (
                              <span className="block text-[9px] bg-amber-50 text-amber-600 border border-amber-100 rounded px-1.5 py-0.5 font-bold">
                                ⚠️ انتهاء العقد ({contractDaysLeft} يوم)
                              </span>
                            )}
                            {!empContract && (
                              <span className="block text-[9px] bg-slate-50 text-slate-400 border border-slate-100 rounded px-1.5 py-0.5">
                                ℹ️ مسودة عقد لم تُوقع
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-2">
                          {/* Top Row: Direct Edit Actions */}
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => openForm(e)}
                              className="px-2.5 py-1 text-xs font-bold text-gold bg-gold-bg border border-gold-border rounded hover:bg-gold-light hover:text-slate-900 transition-colors cursor-pointer"
                              title="تعديل المسميات والراتب المسجل"
                            >
                              ✏️ تعديل الراتب
                            </button>
                            <button
                              onClick={() => handleDelete(e.id, e.name)}
                              className="px-2 py-1 text-xs font-bold text-red-hr bg-rose-50 border border-rose-200 rounded hover:bg-red-hr hover:text-white transition-colors cursor-pointer"
                              title="حذف السجل الإداري نهائياً"
                            >
                              🗑️
                            </button>
                          </div>

                          {/* Bottom Row: Deep HRMS Module Navigation */}
                          <div className="flex flex-wrap gap-1 justify-center border-t border-slate-100 pt-1.5">
                            <button
                              onClick={() => navigateToProfileTab(e.id, 'info')}
                              className="text-[9px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-none px-1.5 py-1 rounded cursor-pointer transition"
                              title="فتح الملف الإلكتروني الشامل وبوابة الموظف"
                            >
                              📁 الملف الـشخصي
                            </button>
                            <button
                              onClick={() => navigateToProfileTab(e.id, 'contract')}
                              className="text-[9px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border-none px-1.5 py-1 rounded cursor-pointer transition"
                              title="مراجعة وتوقيع وتعديل عقد العمل وبوابات التصاريح"
                            >
                              ✍️ العقد القانوني
                            </button>
                            <button
                              onClick={() => navigateToProfileTab(e.id, 'deduct')}
                              className="text-[9px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border-none px-1.5 py-1 rounded cursor-pointer transition"
                              title="تعديل حصة الاشتراك بالتأمينات الاجتماعية GOSI والخصومات"
                            >
                              🛡️ التأمينات GOSI
                            </button>
                          </div>
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

      {/* Insert / Edit Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto animate-slideup">
            <h3 className="text-base font-bold text-gold mb-4 pb-2 border-b border-slate-100">
              {editingEmployee ? 'تعديل بيانات موظف' : 'إضافة موظف جديد لـسحابة الأعمال'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">الاسم الكامل (ثنائي أو ثلاثي بالأرقام المدنية) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد الحربي"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">المسمى الوظيفي *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مسؤول علاقات حكومية"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50"
                  value={fJob}
                  onChange={(e) => setFJob(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">القسم</label>
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold bg-slate-50"
                    value={fDept}
                    onChange={(e) => setFDept(e.target.value)}
                  >
                    {depts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">الحالة</label>
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold bg-slate-50"
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value as any)}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Employment nature: where the work happens and how it is contracted */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">نوع العمل</label>
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold bg-slate-50"
                    value={fWorkType}
                    onChange={(e) => setFWorkType(e.target.value)}
                  >
                    {WORK_TYPES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">نوع العقد</label>
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold bg-slate-50"
                    value={fContractType}
                    onChange={(e) => setFContractType(e.target.value)}
                  >
                    {CONTRACT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Salary currency: drives every amount rendered for this employee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400">عملة الراتب والمستحقات</label>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-gold bg-slate-50"
                  value={fCurrency}
                  onChange={(e) => setFCurrency(e.target.value)}
                >
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
                <span className="text-[10px] text-slate-400 leading-relaxed">
                  تُطبَّق هذه العملة على الراتب الأساسي والبدلات والخصومات لهذا الموظف (مثال: سعودي ← ريال، مصري ← جنيه).
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">الراتب الأساسي ({currencySymbol}) *</label>
                  <input
                    type="number"
                    required
                    placeholder={currencySymbol}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50"
                    value={fSalary}
                    onChange={(e) => setFSalary(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">البدلات ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder={currencySymbol}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50"
                    value={fAllow}
                    onChange={(e) => setFAllow(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400">الخصومات ({currencySymbol})</label>
                  <input
                    type="number"
                    placeholder={currencySymbol}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gold bg-slate-50"
                    value={fDeduct}
                    onChange={(e) => setFDeduct(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold text-slate-900 border-none px-5 py-2 rounded-lg cursor-pointer text-sm font-bold hover:bg-gold-light flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    '💾 حفظ البيانات'
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowModal(false)}
                  className="bg-transparent text-slate-400 border border-slate-200 px-5 py-2 rounded-lg cursor-pointer text-sm font-bold hover:text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Employee */}
      <ConfirmationModal
        isOpen={employeeToDelete !== null}
        onClose={() => setEmployeeToDelete(null)}
        onConfirm={confirmDelete}
        title="تأكيد حذف موظف"
        message={`هل أنت متأكد من رغبتك في حذف الموظف: "${employeeToDelete?.name}" بصفة نهائية؟ هذا الإجراء سيقوم بحذف وإزالة جميع بياناته وعقوده ووثائقه من الكلاود بشكل دائم ولا يمكن التراجع عنه.`}
        confirmText="نعم، احذف الموظف"
        cancelText="تراجع وإلغاء"
        type="danger"
      />
    </div>
  );
};
