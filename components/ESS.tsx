/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Calendar, Receipt, Briefcase, FileText, Wallet } from 'lucide-react';
import { useHR } from '../context/HRContext';
import { Employee } from '../types';
import { ESSHeader } from './ess/components/ESSHeader';
import { ESSKpis } from './ess/components/ESSKpis';
import { LeaveTab } from './ess/components/LeaveTab';
import { PayrollTab } from './ess/components/PayrollTab';
import { ExpensesTripsTab } from './ess/components/ExpensesTripsTab';
import { AssetsTab } from './ess/components/AssetsTab';
import { SalaryCertTab } from './ess/components/SalaryCertTab';
import { SecureLoginModal } from './ess/components/SecureLoginModal';
import { PayslipDetails, printCertificate, printPayslip } from './ess/utils/printUtils';

type ESSTab = 'leaves' | 'payroll' | 'certificate' | 'expenses' | 'assets';

const resolveActiveEmployee = (
  employees: Employee[],
  employeeId?: string,
  empCode?: string
): Employee | null => {
  if (!employees.length) return null;
  if (employeeId) {
    const linked = employees.find((e) => e.id === employeeId);
    if (linked) return linked;
  }
  if (empCode) {
    const byCode = employees.find((e) => e.id === empCode);
    if (byCode) return byCode;
  }
  return employees[0];
};

const buildPayslipDetails = (
  employee: Employee,
  monthId: string,
  isSaudi: boolean
): PayslipDetails => {
  const monthConfig: Record<
    string,
    { monthName: string; monthStatus: string; isCurrent: boolean; extraBonus: number; extraNotes: string }
  > = {
    current_jun: {
      monthName: 'يونيو ٢٠٢٦',
      monthStatus: '⏱ معلّق - بانتظار اعتماد الصرف',
      isCurrent: true,
      extraBonus: 0,
      extraNotes: 'دورة الصرف الحالية قيد المراجعة النهائية من قسم الرواتب.'
    },
    may: {
      monthName: 'مايو ٢٠٢٦',
      monthStatus: '✓ تم صرفه',
      isCurrent: false,
      extraBonus: 500,
      extraNotes: 'تمت إضافة مكافأة تميز للأداء عن شهر مايو.'
    },
    apr: {
      monthName: 'أبريل ٢٠٢٦',
      monthStatus: '✓ تم صرفه',
      isCurrent: false,
      extraBonus: 1000,
      extraNotes: 'تمت إضافة مكافأة ربع سنوية ضمن دورة أبريل.'
    },
    mar: {
      monthName: 'مارس ٢٠٢٦',
      monthStatus: '✓ تم صرفه',
      isCurrent: false,
      extraBonus: 0,
      extraNotes: 'دورة صرف اعتيادية بدون إضافات.'
    }
  };

  const config = monthConfig[monthId] || monthConfig.current_jun;
  const gosiPct = isSaudi ? 9.75 : 0;
  const medPct = 1.5;

  const calcBasic = employee.salary;
  const calcHousing = Math.round(employee.allow * 0.6);
  const calcTransport = Math.round(employee.allow * 0.3);
  const calcOtherAllow = Math.round(employee.allow * 0.1);
  const calcGosi = Math.round(calcBasic * (gosiPct / 100));
  const calcMed = Math.round(calcBasic * (medPct / 100));
  const calcOtherDeduct = employee.deduct;
  const calcGross = calcBasic + calcHousing + calcTransport + calcOtherAllow + config.extraBonus;
  const calcTotalDeds = calcGosi + calcMed + calcOtherDeduct;
  const calcNet = calcGross - calcTotalDeds;

  return {
    monthName: config.monthName,
    monthStatus: config.monthStatus,
    isCurrent: config.isCurrent,
    extraBonus: config.extraBonus,
    extraDeduct: 0,
    extraNotes: config.extraNotes,
    calcBasic,
    calcHousing,
    calcTransport,
    calcOtherAllow,
    calcGross,
    calcGosi,
    calcMed,
    calcOtherDeduct,
    calcTotalDeds,
    calcNet
  };
};

export const ESS: React.FC = () => {
  const {
    employees,
    leaves,
    expenses,
    trips,
    assets,
    deductions,
    currentUser,
    login,
    addLeave,
    addExpense,
    addTrip
  } = useHR();

  const [activeTab, setActiveTab] = useState<ESSTab>('leaves');
  const [secureLoginOpen, setSecureLoginOpen] = useState(false);
  const [selectedPayslipMonth, setSelectedPayslipMonth] = useState('current_jun');

  const activeEmployee = useMemo(
    () => resolveActiveEmployee(employees, currentUser?.employeeId, currentUser?.empCode),
    [employees, currentUser]
  );

  const isSaudi = useMemo(() => {
    if (!activeEmployee) return true;
    if (activeEmployee.isSaudi !== undefined) return activeEmployee.isSaudi;
    const ded = deductions.find((d) => d.empId === activeEmployee.id);
    return ded ? ded.gosiPct > 2 : true;
  }, [activeEmployee, deductions]);

  const salarySummary = useMemo(() => {
    if (!activeEmployee) {
      return { basicSalary: 0, allowance: 0, totalDeducts: 0, netSalary: 0 };
    }

    const ded = deductions.find((d) => d.empId === activeEmployee.id) || {
      gosiPct: isSaudi ? 9.75 : 0,
      medPct: 1.5,
      taxPct: 0,
      otherPct: 0
    };

    const gosiAmount = Math.round(activeEmployee.salary * (ded.gosiPct / 100));
    const medAmount = Math.round(activeEmployee.salary * (ded.medPct / 100));
    const taxAmount = Math.round(activeEmployee.salary * ((ded.taxPct || 0) / 100));
    const otherAmount = Math.round(activeEmployee.salary * ((ded.otherPct || 0) / 100));
    const totalDeducts = gosiAmount + medAmount + taxAmount + otherAmount + activeEmployee.deduct;
    const netSalary = activeEmployee.salary + activeEmployee.allow - totalDeducts;

    return {
      basicSalary: activeEmployee.salary,
      allowance: activeEmployee.allow,
      totalDeducts,
      netSalary
    };
  }, [activeEmployee, deductions, isSaudi]);

  const payslipDetails = useMemo(() => {
    if (!activeEmployee) {
      return buildPayslipDetails(
        { id: '', name: '', job: '', dept: '', salary: 0, allow: 0, deduct: 0, status: 'نشط', hire: '', leaveBalance: 0, perf: 0 },
        selectedPayslipMonth,
        isSaudi
      );
    }
    return buildPayslipDetails(activeEmployee, selectedPayslipMonth, isSaudi);
  }, [activeEmployee, selectedPayslipMonth, isSaudi]);

  const myLeaves = useMemo(
    () => (activeEmployee ? leaves.filter((l) => l.empId === activeEmployee.id) : []),
    [leaves, activeEmployee]
  );
  const myExpenses = useMemo(
    () => (activeEmployee ? expenses.filter((e) => e.empId === activeEmployee.id) : []),
    [expenses, activeEmployee]
  );
  const myTrips = useMemo(
    () => (activeEmployee ? trips.filter((t) => t.empId === activeEmployee.id) : []),
    [trips, activeEmployee]
  );

  const handlePrintPayslip = () => {
    if (!activeEmployee) return;
    printPayslip(activeEmployee, payslipDetails);
  };

  const handlePrintCertificate = () => {
    if (!activeEmployee) return;
    printCertificate(
      activeEmployee,
      isSaudi,
      salarySummary.basicSalary,
      salarySummary.allowance,
      salarySummary.totalDeducts,
      salarySummary.netSalary
    );
  };

  const tabs: { id: ESSTab; label: string; icon: React.ReactNode }[] = [
    { id: 'leaves', label: 'طلبات الإجازات', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'payroll', label: 'كشوف الرواتب', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: 'certificate', label: 'تعريف الراتب', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'expenses', label: 'المصروفات والانتدابات', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'assets', label: 'عهدي وأصولي', icon: <Briefcase className="w-3.5 h-3.5" /> }
  ];

  if (!activeEmployee) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center space-y-3">
        <h2 className="text-lg font-black text-slate-800">لا يوجد ملف موظف مرتبط</h2>
        <p className="text-sm text-slate-500">يرجى ربط حسابك بملف موظف من إدارة المستخدمين للوصول إلى الخدمة الذاتية.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ESSHeader
        activeEmployee={activeEmployee}
        onOpenSecureLogin={() => setSecureLoginOpen(true)}
      />

      <ESSKpis
        basicSalary={salarySummary.basicSalary}
        leaveBalance={activeEmployee.leaveBalance ?? 21}
        netSalary={salarySummary.netSalary}
        perf={activeEmployee.perf}
      />

      <div className="flex flex-wrap gap-2 bg-white border border-slate-100 p-2 rounded-2xl shadow-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition border-none cursor-pointer ${activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'leaves' && (
        <LeaveTab activeEmployee={activeEmployee} myLeaves={myLeaves} addLeave={addLeave} />
      )}

      {activeTab === 'payroll' && (
        <PayrollTab
          basicSalary={salarySummary.basicSalary}
          allowance={salarySummary.allowance}
          totalDeducts={salarySummary.totalDeducts}
          activeEmployee={activeEmployee}
          payslipDetails={payslipDetails}
          selectedPayslipMonth={selectedPayslipMonth}
          setSelectedPayslipMonth={setSelectedPayslipMonth}
          handlePrintPayslip={handlePrintPayslip}
        />
      )}

      {activeTab === 'certificate' && (
        <SalaryCertTab
          activeEmployee={activeEmployee}
          isSaudi={isSaudi}
          basicSalary={salarySummary.basicSalary}
          allowance={salarySummary.allowance}
          totalDeducts={salarySummary.totalDeducts}
          netSalary={salarySummary.netSalary}
          onPrintCertificate={handlePrintCertificate}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesTripsTab
          activeEmployee={activeEmployee}
          myExpenses={myExpenses}
          myTrips={myTrips}
          addExpense={addExpense}
          addTrip={addTrip}
        />
      )}

      {activeTab === 'assets' && <AssetsTab activeEmployee={activeEmployee} assets={assets} />}

      <SecureLoginModal
        isOpen={secureLoginOpen}
        onClose={() => setSecureLoginOpen(false)}
        login={login}
      />
    </div>
  );
};
