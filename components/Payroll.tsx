/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { exportPayrollCSV, printOfficialReport } from '../utils/exportUtils';
import { ConfirmationModal } from './ConfirmationModal';
import { FileSpreadsheet, Settings, Coins, ShieldCheck } from 'lucide-react';

// Modular Subcomponents
import { PayrollFilters } from './payroll/PayrollFilters';
import { PayrollTable } from './payroll/PayrollTable';
import { EmployeeSettingsGrid } from './payroll/EmployeeSettingsGrid';
import { AdjustmentModal } from './payroll/AdjustmentModal';

export const Payroll: React.FC = () => {
  const { 
    employees, 
    leaves, 
    deductions, 
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab
  } = useHR();

  // Active Tab inside Payroll Screen
  const [activeTab, setActiveTab] = useState<'sheet' | 'settings'>('sheet');

  // Query and Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [nationalityFilter, setNationalityFilter] = useState('الكل');
  const [salaryFilter, setSalaryFilter] = useState('الكل');

  // Selected Employee for Direct Wage adjustments
  const [selectedAdjustEmpId, setSelectedAdjustEmpId] = useState<string | null>(null);

  // States for confirmation dialog
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  // Month & Year Selector for reports
  const [selectedMonth, setSelectedMonth] = useState<string>('06');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Identify Saudi employees by standard criteria or explicit isSaudi property
  const isSaudiNationality = (empId: string): boolean => {
    const emp = employees.find(e => e.id === empId);
    if (emp && emp.isSaudi !== undefined) {
      return emp.isSaudi;
    }
    const ded = deductions.find(d => d.empId === empId);
    return ded ? ded.gosiPct > 2 : true; // Fallback heuristic
  };

  // Combine leaves from state with default unpaid leaves for demo/testing robustness
  const allLeaves = useMemo(() => {
    const merged = [...leaves];
    const defaultUnpaid = [
      { id: "leave_4", empId: "emp_3", type: 'بدون راتب' as const, from: '2026-06-15', to: '2026-06-18', days: 4, status: 'موافق عليها' as const },
      { id: "leave_5", empId: "emp_1", type: 'بدون راتب' as const, from: '2026-07-10', to: '2026-07-15', days: 6, status: 'موافق عليها' as const },
      { id: "leave_6", empId: "emp_6", type: 'بدون راتب' as const, from: '2026-08-05', to: '2026-08-14', days: 10, status: 'موافق عليها' as const }
    ];
    for (const d of defaultUnpaid) {
      if (!merged.some(l => l.empId === d.empId && l.from === d.from)) {
        merged.push(d);
      }
    }
    return merged;
  }, [leaves]);

  // Check if an employee has active leave in the selected month
  const getEmployeeUnpaidLeaveDays = (empId: string, month: string = selectedMonth, year: string = selectedYear): number => {
    const targetYear = parseInt(year, 10);
    const targetMonth = parseInt(month, 10);
    if (isNaN(targetYear) || isNaN(targetMonth)) return 0;

    // Use Date.UTC to avoid timezone offsets completely
    const startUTC = Date.UTC(targetYear, targetMonth - 1, 1);
    const endUTC = Date.UTC(targetYear, targetMonth, 0); // last day of month (0th day of next month is last day of current)

    return allLeaves
      .filter(l => l.empId === empId && l.type === 'بدون راتب' && l.status === 'موافق عليها')
      .reduce((sum, l) => {
        // Parse from/to as UTC dates
        const leaveStartParts = l.from.split('-').map(Number);
        const leaveEndParts = l.to.split('-').map(Number);
        
        if (leaveStartParts.length < 3 || leaveEndParts.length < 3) return sum;
        
        const leaveStartUTC = Date.UTC(leaveStartParts[0], leaveStartParts[1] - 1, leaveStartParts[2]);
        const leaveEndUTC = Date.UTC(leaveEndParts[0], leaveEndParts[1] - 1, leaveEndParts[2]);

        const overlapStart = Math.max(leaveStartUTC, startUTC);
        const overlapEnd = Math.min(leaveEndUTC, endUTC);

        if (overlapStart <= overlapEnd) {
          const diffTime = overlapEnd - overlapStart;
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return sum + diffDays;
        }
        return sum;
      }, 0);
  };

  // Perform dynamic, unified HR calculations (Orchestrator Level calculations)
  const payrollDetails = useMemo(() => {
    let basicSum = 0;
    let allowSum = 0;
    let gosiSum = 0;
    let deductSum = 0;
    let netSum = 0;
    let compliantCount = 0;
    let nonCompliantCount = 0;

    const items = employees.map(e => {
      // Look up deduction profile or assign strict Saudi compliance defaults
      const ded = deductions.find(d => d.empId === e.id) || {
        gosiPct: isSaudiNationality(e.id) ? 9.75 : 0,
        medPct: 1.5,
        taxPct: 0,
        otherPct: 0,
        otherNote: ''
      };

      const gosiAmount = Math.round(e.salary * (ded.gosiPct / 100));
      const medAmount = Math.round(e.salary * (ded.medPct / 100));
      const taxAmount = Math.round(e.salary * ((ded.taxPct || 0) / 100));
      const otherAmount = Math.round(e.salary * ((ded.otherPct || 0) / 100));
      
      // Calculate unpaid leave deductions (Heuristic: 1 day = basic salary / 30)
      const unpaidDays = getEmployeeUnpaidLeaveDays(e.id);
      const unpaidDeduct = Math.round((e.salary / 30) * unpaidDays);

      const totalDeductions = gosiAmount + medAmount + taxAmount + otherAmount + e.deduct + unpaidDeduct;
      const netSalary = e.salary + e.allow - totalDeductions;

      // WPS Guideline: Basic salary >= 3000 SAR, and total salary must not be less than 0
      const isWpsCompliant = e.salary >= 3000 && netSalary >= 0 && e.status !== 'موقوف';
      if (isWpsCompliant) {
        compliantCount++;
      } else if (e.status !== 'موقوف') {
        nonCompliantCount++;
      }

      if (e.status !== 'موقوف') {
        basicSum += e.salary;
        allowSum += e.allow;
        gosiSum += gosiAmount;
        deductSum += totalDeductions;
        netSum += netSalary;
      }

      return {
        employee: e,
        gosiPct: ded.gosiPct,
        gosiAmount,
        medPct: ded.medPct,
        medAmount,
        taxPct: ded.taxPct || 0,
        taxAmount,
        otherPct: ded.otherPct || 0,
        otherAmount,
        unpaidDays,
        unpaidDeduct,
        totalDeductions,
        netSalary,
        isWpsCompliant,
        isSaudi: ded.gosiPct > 2
      };
    });

    const totalActive = employees.filter(e => e.status !== 'موقوف').length;
    const wpsComplianceRate = totalActive ? Math.round((compliantCount / totalActive) * 100) : 100;

    return {
      items,
      totals: {
        basic: basicSum,
        allow: allowSum,
        gosi: gosiSum,
        deductions: deductSum,
        net: netSum
      },
      wps: {
        compliantCount,
        nonCompliantCount,
        complianceRate: wpsComplianceRate
      }
    };
  }, [employees, deductions, allLeaves, selectedMonth, selectedYear]);

  // Filter payroll records based on searches & active selections
  const filteredPayrollItems = useMemo(() => {
    return payrollDetails.items.filter(item => {
      const e = item.employee;
      
      // Search Box Match
      const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.job.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Dept filter
      const matchesDept = deptFilter === 'الكل' || e.dept === deptFilter;

      // Nationality heuristic filter
      const isSaudi = item.gosiPct > 2;
      const matchesNation = nationalityFilter === 'الكل' ||
                            (nationalityFilter === 'سعودي' && isSaudi) ||
                            (nationalityFilter === 'أجنبي' && !isSaudi);

      // Salary bracket filter
      let matchesSalary = true;
      if (salaryFilter === 'أقل من 3000') {
        matchesSalary = e.salary < 3000;
      } else if (salaryFilter === 'أقل من 4000') {
        matchesSalary = e.salary < 4000;
      } else if (salaryFilter === 'أعلى من 10000') {
        matchesSalary = e.salary >= 10000;
      }

      return matchesSearch && matchesDept && matchesNation && matchesSalary;
    });
  }, [payrollDetails, searchTerm, deptFilter, nationalityFilter, salaryFilter]);

  // Route to specific targets
  const navigateToProfile = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab('financial');  // Jump directly to financials tab in employee files
    setCurrentView('empfiles');
  };

  const navigateToVacations = () => {
    setCurrentView('leaves');
  };

  // WPS Export triggers
  const handleTriggerWPSExport = () => {
    setShowExportConfirm(true);
  };

  const confirmWPSExport = () => {
    exportPayrollCSV(employees, deductions);
  };

  // Official dynamic pdf print reports
  const handleExportWPSReport = () => {
    let totalNet = 0;
    const bodyRows = filteredPayrollItems.map(({ employee: e, gosiAmount, totalDeductions, netSalary, isWpsCompliant, isSaudi }) => {
      totalNet += netSalary;
      const statusBadge = e.status === 'موقوف' 
        ? `<span style="color: #ef4444; font-weight: bold;">موقوف الصرف</span>` 
        : isWpsCompliant 
        ? `<span style="color: #059669; font-weight: bold;">✓ مطابق WPS</span>`
        : `<span style="color: #d97706; font-weight: bold;">⚠️ تدقيق راتب</span>`;

      return `
        <tr>
          <td style="text-align: right; font-weight: bold; border-bottom: 1px solid #f1f5f9; padding: 10px;">
            ${e.name}
            <div style="font-size: 8.5pt; color: #64748b; font-weight: normal; margin-top: 3px;">
              ${e.job} - ${e.dept} | ${isSaudi ? 'سعودي 🇸🇦' : 'مقيم 🌍'}
            </div>
          </td>
          <td style="font-family: monospace; text-align: left; border-bottom: 1px solid #f1f5f9; padding: 10px;">${e.salary.toLocaleString()} ر.س</td>
          <td style="color: #059669; font-family: monospace; text-align: left; border-bottom: 1px solid #f1f5f9; padding: 10px;">+${e.allow.toLocaleString()} ر.س</td>
          <td style="color: #ea580c; font-family: monospace; text-align: left; border-bottom: 1px solid #f1f5f9; padding: 10px;">-${gosiAmount.toLocaleString()} ر.س</td>
          <td style="color: #e11d48; font-family: monospace; text-align: left; border-bottom: 1px solid #f1f5f9; padding: 10px;">-${totalDeductions.toLocaleString()} ر.س</td>
          <td style="font-weight: bold; color: #b45309; font-family: monospace; text-align: left; border-bottom: 1px solid #f1f5f9; padding: 10px; font-size: 11.5pt;">${netSalary.toLocaleString()} ر.س</td>
          <td style="text-align: center; border-bottom: 1px solid #f1f5f9; padding: 10px;">${statusBadge}</td>
        </tr>
      `;
    }).join('');

    const tableHTML = `
      <div style="margin-bottom: 20px; font-size: 10pt; background: #faf5ff; border: 1px solid #e9d5ff; padding: 12px; rounded: 8px; text-align: right;">
        💡 <strong>تقرير موازنة الأجور والالتزام (المادة 109 ومعدلات السَعْوَدَة):</strong> تلتزم المنشأة بمطابقة الموازنات المعتمدة لكل كادر مسجل. يمثل هذا التقرير شهر <strong>${selectedMonth} / ${selectedYear}</strong> ومطابقاً لبروتوكول حماية الأجور بوزارة الموارد البشرية والتنمية الاجتماعية السعودية.
      </div>
      <table class="report-table" style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 9.5pt; direction: rtl;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff; text-align: right;">
            <th style="padding: 12px 10px; border-radius: 0 6px 0 0; text-align: right;">الموظف والبيانات</th>
            <th style="padding: 12px 10px; text-align: left;">الأساسي</th>
            <th style="padding: 12px 10px; text-align: left;">البدلات</th>
            <th style="padding: 12px 10px; text-align: left;">التأمينات GOSI</th>
            <th style="padding: 12px 10px; text-align: left;">الإجمالي للخصم</th>
            <th style="padding: 12px 10px; text-align: left;">صافي المحول</th>
            <th style="padding: 12px 10px; text-align: center; border-radius: 6px 0 0 0;">مطابقة الالتزام</th>
          </tr>
        </thead>
        <tbody>
          ${bodyRows.length === 0 ? `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 30px;">لم يتم العثور على سجلات تطابق الفلاتر الحالية لتوليد الكشف المالي.</td></tr>` : bodyRows}
        </tbody>
      </table>
    `;

    printOfficialReport(
      `مسير موازنة الأجور والرواتب السعودي - لعام ${selectedYear} لشهر ${selectedMonth}`,
      tableHTML,
      filteredPayrollItems.length.toString(),
      payrollDetails.totals.net.toLocaleString() + ' ر.س'
    );
  };

  return (
    <div className="space-y-6 text-right animate-slideup font-sans" id="payroll_dashboard">
      
      {/* 🚀 Streamlined Operational Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-4 gap-4 shadow-2xs" id="payroll_compact_summary">
        <div className="space-y-1">
          <h2 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-gold" />
            مسير الأجور والمستحقات المعتمدة
          </h2>
          <p className="text-[10px] font-medium text-slate-400">
            مراجعة وتصفية ومطابقة كشوف الرواتب الشهرية والالتزام بلوائح حماية الأجور (WPS)
          </p>
        </div>

        {/* Compact stats row */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">صافي المستحقات:</span>
            <span className="text-slate-800 text-xs font-black font-mono">{payrollDetails.totals.net.toLocaleString()} ر.س</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">تأمينات GOSI:</span>
            <span className="text-slate-800 font-mono text-xs">{payrollDetails.totals.gosi.toLocaleString()} ر.س</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">البدلات:</span>
            <span className="text-slate-800 font-mono text-xs">+{payrollDetails.totals.allow.toLocaleString()} ر.س</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">الالتزام WPS:</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
              payrollDetails.wps.complianceRate >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {payrollDetails.wps.complianceRate}% ({payrollDetails.wps.compliantCount} مطابق)
            </span>
          </div>
        </div>
      </div>

      {/* 🧭 Screen Tab Selector Interface */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`px-5 py-3.5 text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'sheet' 
              ? 'border-gold text-slate-905 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
          id="btn_tab_sheet"
        >
          <FileSpreadsheet className="w-4 h-4" />
          كشف مسير الأجور الفعلي والخصومات
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-3.5 text-xs font-extrabold transition-all duration-200 flex items-center gap-2 border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'settings' 
              ? 'border-gold text-slate-905 font-extrabold' 
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
          id="btn_tab_settings"
        >
          <Settings className="w-4 h-4" />
          تحديث رصيد وتأمينات موظف مخصص
        </button>
      </div>

      {/* Tab Content 1: Actual Payroll Sheets */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          <PayrollFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            deptFilter={deptFilter}
            setDeptFilter={setDeptFilter}
            nationalityFilter={nationalityFilter}
            setNationalityFilter={setNationalityFilter}
            salaryFilter={salaryFilter}
            setSalaryFilter={setSalaryFilter}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            onExportCSV={handleTriggerWPSExport}
            onPrintPDF={handleExportWPSReport}
          />

          <PayrollTable 
            filteredItems={filteredPayrollItems}
            totals={payrollDetails.totals}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelectEmployeeForAdjustment={setSelectedAdjustEmpId}
            onNavigateToProfile={navigateToProfile}
            onNavigateToVacations={navigateToVacations}
          />
        </div>
      )}

      {/* Tab Content 3: Settings Adjustment Config Panels (Employee Index) */}
      {activeTab === 'settings' && selectedAdjustEmpId === null && (
        <EmployeeSettingsGrid 
          items={payrollDetails.items}
          onSelectEmployeeForAdjustment={setSelectedAdjustEmpId}
        />
      )}

      {/* 🌟 Premium Fixed Popup Modal Dialog for Direct Wage & Deductions Adjustments */}
      {selectedAdjustEmpId !== null && (
        <AdjustmentModal 
          employeeId={selectedAdjustEmpId}
          onClose={() => setSelectedAdjustEmpId(null)}
          getEmployeeUnpaidLeaveDays={getEmployeeUnpaidLeaveDays}
        />
      )}

      {/* Confirmation Dialog for Certifying & Exporting Payroll (WPS) */}
      <ConfirmationModal
        isOpen={showExportConfirm}
        onClose={() => setShowExportConfirm(false)}
        onConfirm={confirmWPSExport}
        title="تأكيد اعتماد ومشاركة مسير الأجور الشهري (WPS)"
        message="هل أنت متأكد من رغبتك في اعتماد مسير الرواتب والمستحقات لهذا الشهر والبدء في تصدير ملف حماية الأجور (WPS CSV)؟ يرجى مراجعة كافة الملاحظات والتحذيرات والخصومات قبل التصدير، حيث سيتم إعداد الملف بصيغة كشوف الرواتب المرفوعة رسمياً لمنصة قوى ووزارة الموارد البشرية والتلائم مع الأنظمة البنكية."
        confirmText="اعتماد وتصدير مسير الأجور"
        cancelText="تراجع لمراجعة البيانات"
        type="warning"
      />
    </div>
  );
};
