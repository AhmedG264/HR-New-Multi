/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { Employee, Leave, Attendance, Expense, Trip, HealthInsurance, EmployeeContract } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Award,
  Clock,
  Briefcase,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Heart,
  BarChart2,
  RefreshCw,
  Download,
  Printer,
  ChevronLeft,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Search,
  CheckSquare,
  Bookmark,
  ChevronDown
} from 'lucide-react';
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
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export const ReportsAndStats: React.FC = () => {
  const {
    employees,
    leaves,
    attendance,
    jobs,
    candidates,
    reviews,
    trainings,
    expenses,
    trips,
    health,
    contracts,
    deductions,
    setCurrentView,
    seedStatus,
    triggerSeeding
  } = useHR();

  // Selected Active Tab Inside Analytics Page
  const [activeTab, setActiveTab] = useState<'financial' | 'saudization' | 'attendance' | 'talent'>( 'financial' );
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Helper: Trigger custom toast feedback
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ----------------------------------------------------
  // Dynamic Real-Time Calculations & Metric Synthesis
  // ----------------------------------------------------

  // 1. Nationality / Saudization Logic
  const getEmployeeNationality = (empId: string): 'Saudi' | 'Expat' => {
    const contract = contracts.find(c => c.empId === empId);
    return !contract?.iqamaExp || contract.iqamaExp.trim() === '' ? 'Saudi' : 'Expat';
  };

  // General Metrics
  const metrics = useMemo(() => {
    const activeEmployees = employees.filter(e => e.status !== 'موقوف');
    const totalEmployeesCount = employees.length;
    
    // Saudization Numbers (derived purely from db iqama data)
    let saudiCount = 0;
    let expatCount = 0;
    employees.forEach(e => {
      if (getEmployeeNationality(e.id) === 'Saudi') {
        saudiCount++;
      } else {
        expatCount++;
      }
    });

    const isSaudiRatio = totalEmployeesCount > 0 ? (saudiCount / totalEmployeesCount) : 0;
    const saudizationPct = Math.round(isSaudiRatio * 100);

    // Nitaqat Banding calculation
    let nitaqatZone: 'platinum' | 'high_green' | 'medium_green' | 'low_green' | 'yellow' | 'red' = 'red';
    let nitaqatLabel = 'النطاق الأحمر (عالي الخطورة)';
    let nitaqatColor = 'text-rose-600 bg-rose-50 border-rose-200';
    let nitaqatThemeColor = '#dc2626';

    if (saudizationPct >= 60) {
      nitaqatZone = 'platinum';
      nitaqatLabel = 'النطاق البلاتيني (امتياز كامل)';
      nitaqatColor = 'text-emerald-700 bg-emerald-50 border-emerald-250';
      nitaqatThemeColor = '#059669';
    } else if (saudizationPct >= 45) {
      nitaqatZone = 'high_green';
      nitaqatLabel = 'النطاق الأخضر المرتفع';
      nitaqatColor = 'text-teal-700 bg-teal-50 border-teal-200';
      nitaqatThemeColor = '#0d9488';
    } else if (saudizationPct >= 30) {
      nitaqatZone = 'medium_green';
      nitaqatLabel = 'النطاق الأخضر المتوسط';
      nitaqatColor = 'text-accent-blue bg-blue-50 border-blue-200';
      nitaqatThemeColor = '#2563eb';
    } else if (saudizationPct >= 15) {
      nitaqatZone = 'low_green';
      nitaqatLabel = 'النطاق الأخضر المنخفض';
      nitaqatColor = 'text-amber-700 bg-amber-50 border-amber-200';
      nitaqatThemeColor = '#d97706';
    } else if (saudizationPct > 0) {
      nitaqatZone = 'yellow';
      nitaqatLabel = 'النطاق الأصفر (مقيد الصلاحيات)';
      nitaqatColor = 'text-orange-600 bg-orange-50 border-orange-200';
      nitaqatThemeColor = '#ea580c';
    }

    // Payroll expenditures calculations
    let totalSalaries = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;

    activeEmployees.forEach(e => {
      totalSalaries += (e.salary || 0);
      totalAllowances += (e.allow || 0);
      totalDeductions += (e.deduct || 0);
    });

    const netMonthlyPayroll = totalSalaries + totalAllowances - totalDeductions;
    const avgSalary = activeEmployees.length > 0 ? Math.round(netMonthlyPayroll / activeEmployees.length) : 0;

    // Expenses Approved
    const approvedExpensesSum = expenses
      .filter(exp => exp.status === 'موافق عليها')
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Business Trips Costs Approved
    const approvedTripsSum = trips
      .filter(t => t.status === 'موافق عليها')
      .reduce((sum, t) => {
        const costVal = t.cost || 0;
        const ticketVal = t.ticketCost || 0;
        const housingVal = t.housingCost || 0;
        const transportVal = t.transportCost || 0;
        const allowanceVal = (t.allowance || 0) * (getDaysDifference(t.from, t.to) || 1);
        return sum + costVal + ticketVal + housingVal + transportVal + allowanceVal;
      }, 0);

    // Bupa Medical Premium Year-wise Sum
    const activeInsurancePremiumSum = health
      .filter(h => h.status === 'نشط')
      .reduce((sum, h) => sum + (h.premium || 0), 0);

    // Total Operational Costs
    const grandCostAggregate = netMonthlyPayroll + approvedExpensesSum + approvedTripsSum + (activeInsurancePremiumSum / 12);

    return {
      activeEmployeesCount: activeEmployees.length,
      totalEmployeesCount,
      saudiCount,
      expatCount,
      saudizationPct,
      nitaqatZone,
      nitaqatLabel,
      nitaqatColor,
      nitaqatThemeColor,
      totalSalaries,
      totalAllowances,
      totalDeductions,
      netMonthlyPayroll,
      avgSalary,
      approvedExpensesSum,
      approvedTripsSum,
      activeInsurancePremiumSum,
      grandCostAggregate,
      suspendedCount: employees.filter(e => e.status === 'موقوف').length,
      leaveCount: employees.filter(e => e.status === 'إجازة').length
    };
  }, [employees, expenses, trips, health, contracts]);

  // Attendance Analytics Panel (purely derived from the db 'attendance' records)
  const attendanceStats = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let vacationCount = 0;

    attendance.forEach(att => {
      if (att.status === 'حاضر') presentCount++;
      else if (att.status === 'متأخر') lateCount++;
      else if (att.status === 'غائب') absentCount++;
      else if (att.status === 'إجازة') vacationCount++;
    });

    const activeTotalDuty = presentCount + lateCount + absentCount;
    const disciplineRate = activeTotalDuty > 0 ? Math.round(((presentCount + lateCount) / activeTotalDuty) * 100) : 100;
    const tardinessRate = activeTotalDuty > 0 ? Math.round((lateCount / activeTotalDuty) * 100) : 0;

    // Leave Types Analysis
    const leaveTypesCount = {
      'annual': leaves.filter(l => l.status === 'موافق عليها' && l.type === 'سنوية').reduce((sum, l) => sum + l.days, 0),
      'sick': leaves.filter(l => l.status === 'موافق عليها' && l.type === 'مرضية').reduce((sum, l) => sum + l.days, 0),
      'urgent': leaves.filter(l => l.status === 'موافق عليها' && l.type === 'اضطرارية').reduce((sum, l) => sum + l.days, 0),
      'unpaid': leaves.filter(l => l.status === 'موافق عليها' && l.type === 'بدون راتب').reduce((sum, l) => sum + l.days, 0)
    };

    return {
      presentCount,
      lateCount,
      absentCount,
      vacationCount,
      disciplineRate,
      tardinessRate,
      activeTotalDuty,
      leaveTypesCount
    };
  }, [attendance, leaves]);

  // Talent & Review metrics
  const talentStats = useMemo(() => {
    const reviewsWithScores = reviews.filter(rev => rev.status === 'مكتمل' && rev.score > 0);
    const avgScore = reviewsWithScores.length > 0 
      ? (reviewsWithScores.reduce((sum, rev) => sum + rev.score, 0) / reviewsWithScores.length).toFixed(2)
      : 'N/A';

    const scoreDistribution = [
      { name: 'ممتاز (5/5)', value: reviewsWithScores.filter(r => r.score === 5).length, color: '#059669' },
      { name: 'جيد جداً (4/5)', value: reviewsWithScores.filter(r => r.score === 4).length, color: '#10b981' },
      { name: 'جيد (3/5)', value: reviewsWithScores.filter(r => r.score === 3).length, color: '#3b82f6' },
      { name: 'مقبول (2/5)', value: reviewsWithScores.filter(r => r.score === 2).length, color: '#f59e0b' },
      { name: 'ضعيف (1/5)', value: reviewsWithScores.filter(r => r.score === 1).length, color: '#ef4444' }
    ].filter(item => item.value > 0);

    const openJobsCount = jobs.filter(j => j.status === 'مفتوحة').length;
    const totalApplicantsCount = candidates.length;

    // Training Enrollment stats
    const totalTrainingsCount = trainings.length;
    const completedTrainingsCount = trainings.filter(t => t.status === 'مكتملة').length;

    return {
      reviewsCount: reviews.length,
      completedReviewsCount: reviewsWithScores.length,
      avgScore,
      scoreDistribution,
      openJobsCount,
      totalApplicantsCount,
      totalTrainingsCount,
      completedTrainingsCount
    };
  }, [reviews, jobs, candidates, trainings]);

  // Department Table Metrics Grouping
  const departmentAnalytics = useMemo(() => {
    const depts = Array.from(new Set(employees.map(e => e.dept)));
    return depts.map(deptName => {
      const deptEmployees = employees.filter(e => e.dept === deptName);
      
      let saudi = 0;
      let expat = 0;
      let salariesSum = 0;
      let allowancesSum = 0;
      let deductionsSum = 0;

      deptEmployees.forEach(e => {
        if (getEmployeeNationality(e.id) === 'Saudi') {
          saudi++;
        } else {
          expat++;
        }
        if (e.status !== 'موقوف') {
          salariesSum += (e.salary || 0);
          allowancesSum += (e.allow || 0);
          deductionsSum += (e.deduct || 0);
        }
      });

      const totalDeptPremium = health
        .filter(h => h.status === 'نشط' && deptEmployees.some(e => e.id === h.empId))
        .reduce((sum, h) => sum + (h.premium || 0), 0);

      const netPayroll = salariesSum + allowancesSum - deductionsSum;
      const totalCount = deptEmployees.length;
      const saudizationPct = totalCount > 0 ? Math.round((saudi / totalCount) * 100) : 0;
      const averageSalary = totalCount > 0 ? Math.round(netPayroll / totalCount) : 0;

      return {
        department: deptName,
        totalEmployees: totalCount,
        saudiCount: saudi,
        expatCount: expat,
        saudizationPct,
        netPayroll,
        averageSalary,
        totalDeptPremium
      };
    }).filter(d => departmentFilter === 'all' || d.department === departmentFilter);
  }, [employees, health, contracts, departmentFilter]);

  // List of unique departments for filtering
  const allDepartmentsList = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.dept)));
  }, [employees]);

  // ----------------------------------------------------
  // Chart Data Synthesizers
  // ----------------------------------------------------

  // 1. Department Expenses Chart (Recharts Format)
  const departmentExpenditureChartData = useMemo(() => {
    return departmentAnalytics.map(d => ({
      name: d.department,
      'تكلفة مسير الرواتب الشهري': d.netPayroll,
      'متوسط الراتب المقبوض': d.averageSalary,
      'أقساط بوبا للتأمين الطبي السنوية': d.totalDeptPremium
    }));
  }, [departmentAnalytics]);

  // 2. Saudization Department comparison chart
  const departmentSaudizationChartData = useMemo(() => {
    return departmentAnalytics.map(d => ({
      name: d.department,
      'نسبة التوطين (%)': d.saudizationPct,
      'المواطنون السعوديون': d.saudiCount,
      'الوافدون المقيمون': d.expatCount
    }));
  }, [departmentAnalytics]);

  // 3. Attendance distribution per status
  const attendanceBreakdownChartData = useMemo(() => {
    return [
      { name: 'حاضر في الموعد', value: attendanceStats.presentCount, color: '#10b981' },
      { name: 'متأخر عن الدوام', value: attendanceStats.lateCount, color: '#f59e0b' },
      { name: 'غائب بدون عذر', value: attendanceStats.absentCount, color: '#ef4444' },
      { name: 'إجازة معتمدة', value: attendanceStats.vacationCount, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [attendanceStats]);

  // Calculate days difference between dates helper
  function getDaysDifference(fromStr: string, toStr: string): number {
    try {
      const d1 = new Date(fromStr);
      const d2 = new Date(toStr);
      const diff = d2.getTime() - d1.getTime();
      return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    } catch {
      return 1;
    }
  }

  // 100% Client-side CSV Exporter of dynamic data for true compliance
  const exportCsv = (dataType: 'financial' | 'saudization' | 'departments' | 'attendance') => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Include BOM for proper MS Excel Arabic rendering
      
      if (dataType === 'financial') {
        csvContent += "المؤشر المالي,القيمة بالريال السعودي\r\n";
        csvContent += `إجمالي الرواتب الأساسية النشطة,${metrics.totalSalaries}\r\n`;
        csvContent += `إجمالي البدلات الممنوحة,${metrics.totalAllowances}\r\n`;
        csvContent += `إجمالي الخصومات الشهرية الموثقة,${metrics.totalDeductions}\r\n`;
        csvContent += `مسير الرواتب الشهري الصافي,${metrics.netMonthlyPayroll}\r\n`;
        csvContent += `متوسط الدخل الشهري للموظف,${metrics.avgSalary}\r\n`;
        csvContent += `إجمالي مصروفات التعويضات المعتمدة,${metrics.approvedExpensesSum}\r\n`;
        csvContent += `نفقات انتداب وبدلات العمل المعتمدة,${metrics.approvedTripsSum}\r\n`;
        csvContent += `إجمالي بوليصة التأمين السنوية بوبا,${metrics.activeInsurancePremiumSum}\r\n`;
        csvContent += `المجموع الكلي للتكاليف التشغيلية,${metrics.grandCostAggregate}\r\n`;
      } else if (dataType === 'saudization') {
        csvContent += "المؤشر,العدد / النسبة\r\n";
        csvContent += `إجمالي قوة العمل بالمنشأة,${metrics.totalEmployeesCount}\r\n`;
        csvContent += `الكوادر الوطنية (سعودي),${metrics.saudiCount}\r\n`;
        csvContent += `الكوادر الوافدة (مقيم),${metrics.expatCount}\r\n`;
        csvContent += `نسبة التوطين والسعودة,${metrics.saudizationPct}%\r\n`;
        csvContent += `تصنيف نطاقات بوزارة الموارد البشرية,${metrics.nitaqatLabel}\r\n`;
      } else if (dataType === 'departments') {
        csvContent += "القسم,عدد الموظفين,السعوديون,الوافدون,نسبة التوطين (%),مسير الرواتب الشهري,متوسط الرواتب\r\n";
        departmentAnalytics.forEach(d => {
          csvContent += `"${d.department}",${d.totalEmployees},${d.saudiCount},${d.expatCount},${d.saudizationPct}%,${d.netPayroll},${d.averageSalary}\r\n`;
        });
      } else if (dataType === 'attendance') {
        csvContent += "مؤشر الحضور والالتزام,العدد\r\n";
        csvContent += `معدل الانضباط الإجمالي,${attendanceStats.disciplineRate}%\r\n`;
        csvContent += `معدل التأخير التراكمي,${attendanceStats.tardinessRate}%\r\n`;
        csvContent += `حاضر,${attendanceStats.presentCount}\r\n`;
        csvContent += `متأخر,${attendanceStats.lateCount}\r\n`;
        csvContent += `غائب,${attendanceStats.absentCount}\r\n`;
        csvContent += `في إيجازة,${attendanceStats.vacationCount}\r\n`;
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `تقرير_${dataType}_سحابة_الأعمال_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("تم إنشاء وتنزيل ملف التقرير بتنسيق Excel/CSV بنجاح!", "success");
    } catch (err) {
      console.error(err);
      triggerToast("حدث خلل أثناء تصدير التقرير.", "error");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-sans select-none animate-slideup mb-12 text-right text-slate-800" dir="rtl" id="reports-statistics-root">
      
      {/* Toast Notification Element */}
      {toastMessage && (
        <div className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
          'bg-slate-800 text-white border-slate-755'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5 text-white" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-white" />}
          {toastMessage.type === 'info' && <Bookmark className="w-5 h-5 text-white" />}
          <span className="text-xs font-bold leading-normal">{toastMessage.text}</span>
        </div>
      )}

      {/* Styled Printable Header / Corporate Logo Accent */}
      <div className="bg-gradient-to-l from-slate-900 via-emerald-950 to-slate-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-900/30 relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none">
        
        {/* Glow Spheres for aesthetic depth */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-44 h-44 bg-blue-500/50 rounded-full blur-2xl pointer-events-none opacity-20" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative z-10 w-full">

          <div className="flex flex-wrap gap-2 shrink-0 self-end md:self-auto print:hidden">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> طباعة التقرير / PDF
            </button>
            <button
              onClick={() => exportCsv(activeTab)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-none px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" /> تصدير الجدول الحالي
            </button>
          </div>
        </div>
      </div>

      {/* CORE BIG KPI STRIP - DYNAMIC SUMMARY METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="reports-big-kpi-panel">
        
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">إجمالي نفقات مسير الرواتب الصافي</span>
            <div className="flex items-baseline gap-0.5">
              <strong className="text-lg font-black font-mono text-emerald-600">
                {metrics.netMonthlyPayroll.toLocaleString('en-US')}
              </strong>
              <span className="text-[9px] text-slate-400 font-bold">ر.س / شهري</span>
            </div>
            <span className="text-[9.5px] text-slate-500 block">لمجموع {metrics.activeEmployeesCount} موظفاً نشطاً</span>
          </div>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">معدل التوطين في نطاقات</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-lg font-black font-mono text-indigo-700">{metrics.saudizationPct}%</strong>
              <span className="text-[9.5px] text-slate-400 font-bold">({metrics.saudiCount} مواطن)</span>
            </div>
            <span className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded border inline-block leading-none mt-1 ${metrics.nitaqatColor}`}>
              {metrics.nitaqatLabel}
            </span>
          </div>
          <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">معدل انضباط الحضور والانصراف</span>
            <div className="flex items-baseline gap-1">
              <strong className="text-lg font-black font-mono text-amber-600">{attendanceStats.disciplineRate}%</strong>
              <span className="text-[9px] text-amber-500 font-bold">حضور مثالي</span>
            </div>
            <span className="text-[9.5px] text-slate-500 block">إجمالي سجلات الدوام: {attendanceStats.activeTotalDuty}</span>
          </div>
          <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">متوسط الرواتب الشهري بالمنشأة</span>
            <div className="flex items-baseline gap-0.5">
              <strong className="text-lg font-black font-mono text-blue-600">
                {metrics.avgSalary.toLocaleString('en-US')}
              </strong>
              <span className="text-[9px] text-slate-400 font-bold">ر.س / موظف</span>
            </div>
            <span className="text-[9.5px] text-slate-500 block">بدون حساب البدلات أو التأمينات</span>
          </div>
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* TABS SELECTOR FOR SPECIFIC METRICS BLOCK */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-xs print:hidden">
        
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex-1 py-3 text-center text-xs font-black rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${
            activeTab === 'financial'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> التقرير المالي الشامل للتكاليف
        </button>

        <button
          onClick={() => setActiveTab('saudization')}
          className={`flex-1 py-3 text-center text-xs font-black rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${
            activeTab === 'saudization'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" /> التوطين ومؤشرات قوى (نطاقات)
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-3 text-center text-xs font-black rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${
            activeTab === 'attendance'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" /> الحضور والالتزام والإجازات
        </button>

        <button
          onClick={() => setActiveTab('talent')}
          className={`flex-1 py-3 text-center text-xs font-black rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 ${
            activeTab === 'talent'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" /> الكفاءات والتقييم والتوظيف
        </button>

      </div>

      {/* TAB CONTENT 1: FINANCIALS */}
      {activeTab === 'financial' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slideup">
          
          {/* Detailed breakdown table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                💼 كشف تفاصيل التكلفة التشغيلية وحسابات الرواتب لشركة التقنية
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">بموجب البيانات النشطة حياً</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-550 font-bold">مجموع الرواتب الأساسية (Basic Salaries):</span>
                <span className="font-mono text-slate-800 font-extrabold">{metrics.totalSalaries.toLocaleString()} ر.س</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-550 font-bold">مجموع بدلات السكن والنقل والإضافية (Allowances):</span>
                <span className="font-mono text-slate-700 font-bold">+{metrics.totalAllowances.toLocaleString()} ر.س</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-550 font-bold">مجموع خصومات الغياب والمخالفات والتأمينات (Deductions):</span>
                <span className="font-mono text-rose-600 font-bold">-{metrics.totalDeductions.toLocaleString()} ر.س</span>
              </div>

              <div className="py-3 flex justify-between items-center font-bold text-slate-900 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-800 font-black">صافي مسير الرواتب الفعلي (Net Monthly Payroll):</span>
                <span className="font-mono text-emerald-700 font-black text-sm">{metrics.netMonthlyPayroll.toLocaleString()} ر.س / شهري</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-550 font-bold">مصاريف تعويض الموظفين المعتمدة (Approved Petty Cash/Expenses):</span>
                <span className="font-mono text-slate-650">{metrics.approvedExpensesSum.toLocaleString()} ر.س</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-550 font-bold">إجمالي تكاليف انتدابات السفر وسكن العمل المعتمدة (Business Trips):</span>
                <span className="font-mono text-slate-650">{metrics.approvedTripsSum.toLocaleString()} ر.س</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-550 font-bold">الأقساط الشهرية لبوليصة تأمين بوبا العربية الطبية للموظفين:</span>
                <span className="font-mono text-slate-650">{Math.round(metrics.activeInsurancePremiumSum / 12).toLocaleString()} ر.س / شهري</span>
              </div>

              <div className="py-3 flex justify-between items-center font-bold text-slate-950 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                <div className="space-y-0.5">
                  <span className="text-emerald-950 font-black block">المجموع الكلي للتكلفة والتشغيل المالي الإجمالي:</span>
                  <span className="text-[10px] text-emerald-800 font-bold">شاملاً مسير الرواتب + المصاريف والرحلات + التأمين الشهري</span>
                </div>
                <span className="font-mono text-emerald-700 font-black text-base">{Math.round(metrics.grandCostAggregate).toLocaleString()} ر.س / شهري</span>
              </div>

            </div>

            {/* Quick Actions Router to Payroll & Expenses */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setCurrentView('payroll')}
                className="flex-1 py-1.5 text-center text-[11px] font-black cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1"
              >
                مسير الرواتب التفصيلي ومكافأة قوى <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentView('expenses')}
                className="flex-1 py-1.5 text-center text-[11px] font-black cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1"
              >
                تتبع المطالبات والعهد والتعويضات <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Graphical Breakdown Pie/Bar Charts */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800">📊 التمثيل البياني للتكاليف التشغيلية</h3>
              <p className="text-[9.5px] text-slate-400">توزيع المصروفات شهرياً بالمنشأة</p>
            </div>

            {/* Render Recharts PieChart */}
            <div className="h-56 w-full relative">
              {metrics.grandCostAggregate > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'الرواتب والبدلات الصافية', value: metrics.netMonthlyPayroll, color: '#047857' },
                        { name: 'التعويضات المالية', value: metrics.approvedExpensesSum, color: '#2563eb' },
                        { name: 'انتدابات وبدلات السفر', value: metrics.approvedTripsSum, color: '#f59e0b' },
                        { name: 'قسط بوبا شهرياً', value: Math.round(metrics.activeInsurancePremiumSum / 12), color: '#7c3aed' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      <Cell fill="#047857" />
                      <Cell fill="#2563eb" />
                      <Cell fill="#f59e0b" />
                      <Cell fill="#7c3aed" />
                    </Pie>
                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ر.س`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold">لا توجد بيانات مالية متوفرة في قاعدة البيانات</div>
              )}
            </div>

            {/* Legend block */}
            <div className="space-y-2 text-[10.5px]">
              <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-700" /> مسير الرواتب:
                </span>
                <strong className="font-mono">{metrics.netMonthlyPayroll.toLocaleString()} ر.س</strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> التعويضات الورقية:
                </span>
                <strong className="font-mono">{metrics.approvedExpensesSum.toLocaleString()} ر.س</strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> انتدابات العمل:
                </span>
                <strong className="font-mono">{metrics.approvedTripsSum.toLocaleString()} ر.س</strong>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <span className="w-2 h-2 rounded-full bg-purple-600" /> تأمين بوبا شهرياً:
                </span>
                <strong className="font-mono">{Math.round(metrics.activeInsurancePremiumSum / 12).toLocaleString()} ر.س</strong>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 2: SAUDIZATION & NITAQAT */}
      {activeTab === 'saudization' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slideup">
          
          {/* Left panel: Saudization Analysis and Saudi Law Constraints */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                🇸🇦 لوحة تفاصيل التوطين والحماية المهنية للشركة
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold">مكتب العمل والضمان الصحي السعودي</span>
            </div>

            {/* Metric Boxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <span className="text-[10.5px] text-slate-400 font-bold">القوى العاملة الإجمالية</span>
                <strong className="text-2xl font-black font-mono text-slate-800 block">{metrics.totalEmployeesCount}</strong>
                <span className="text-[9px] text-slate-400">منهم {metrics.activeEmployeesCount} نشط</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <span className="text-[10.5px] text-indigo-400 font-bold">الكوادر الوطنية (السعودية)</span>
                <strong className="text-2xl font-black font-mono text-indigo-700 block">{metrics.saudiCount}</strong>
                <span className="text-[9px] text-slate-400">مسجل بالتأمينات الاجتماعية</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <span className="text-[10.5px] text-amber-500 font-bold">الكوادر الوافدة (الوافدون)</span>
                <strong className="text-2xl font-black font-mono text-amber-700 block">{metrics.expatCount}</strong>
                <span className="text-[9px] text-slate-400">بوابة مقيم ومنصة قوى</span>
              </div>
            </div>

            {/* Saudization Range Indicator Bar (Nitaqat compliance) */}
            <div id="saudization-progress-component" className="p-4 bg-emerald-50/50 border border-emerald-250 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-705">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" /> نسبة التوطين الحالية:</span>
                <span className="font-black text-emerald-700 text-sm font-mono">{metrics.saudizationPct}%</span>
              </div>
              
              {/* Dynamic Bar */}
              <div className="h-6 bg-slate-200 border border-slate-205 rounded-lg overflow-hidden flex font-bold text-[10.5px] text-white">
                <div style={{ width: `${metrics.saudizationPct}%` }} className="bg-emerald-600 flex items-center justify-center shadow-inner">
                  سعوديون ({metrics.saudiCount})
                </div>
                <div className="flex-1 bg-slate-400 flex items-center justify-center">
                  وافدون ({metrics.expatCount})
                </div>
              </div>

              {/* Goal Range Alert */}
              <p className="text-[10px] text-slate-500 leading-normal pt-1 bg-white p-2.5 rounded-lg border border-emerald-100">
                <strong>📝 مراجعة الالتزام القانوني بمكتب العمل:</strong> تعد تصنيفات قوى ونطاقات حاسمة لمؤسسات القطاع الخاص بالمملكة العربية السعودية. يتيح لك الحفاظ على نسبة توطين أعلى من ٣٠٪ الدخول في <strong>النطاق الأخضر المتوسط</strong> كحد أدنى، مما يمكن المنشأة من نقل كفالات الأجانب وفورات التأشيرات وإتمام ترخيص السجل في منصة بلدي وقوى دون عوائق بيروقراطية.
              </p>
            </div>

            {/* Quick Actions link to Compliance & EmployeeFiles view */}
            <div className="pt-1 flex gap-2">
              <button
                onClick={() => setCurrentView('compliance')}
                className="flex-1 py-1.5 text-center text-[10.5px] font-black cursor-pointer bg-slate-50 border border-slate-250 text-indigo-750 font-bold rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
              >
                📊 رادار انتهاء الإقامات ورخص العمل الموحد <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentView('empfiles')}
                className="flex-1 py-1.5 text-center text-[10.5px] font-black cursor-pointer bg-slate-50 border border-slate-250 text-indigo-750 font-bold rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
              >
                📂 إدارة ملفات وعقود التأمينات للموظفين <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Right panel: Recharts Saudization comparison per Department */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800">🇸🇦 التوطين والسعودة حسب الأقسام</h3>
              <p className="text-[9.5px] text-slate-400">توزيع الكوادر الوطنية والأجانب</p>
            </div>

            {/* Render Recharts BarChart comparing Saudization per Department */}
            <div className="h-64 w-full">
              {departmentSaudizationChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentSaudizationChartData}
                    margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 9 }} expiration={100} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fontWeight: 705 }} width={75} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                    <Bar dataKey="المواطنون السعوديون" fill="#047857" stackId="a" name="سعودي" />
                    <Bar dataKey="الوافدون المقيمون" fill="#94a3b8" stackId="a" name="مقيم" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-slate-400 font-bold">لا يوجد كادر وظيفي بقاعدة البيانات</div>
              )}
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-[9.5px] text-blue-800 leading-normal flex items-start gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <p>نطاقات تحسب نسبة التوطين الإجمالية كوزن متراكم لـ (سحابة الأعمال) الموحدة على الرقم الموحد للمنشأة 700.</p>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 3: ATTENDANCE & LEAVES */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slideup">
          
          {/* Detailed statistics for Attendance and Discipline */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-slideup">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                📅 تحليل الحضور اليومي، التأخير والانصراف
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">التسجيل المعتمد والربط بجهاز البصمة</span>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">حاصرو بانتظام</span>
                <strong className="text-xl font-black text-emerald-600 block">{attendanceStats.presentCount}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">حالة متأخر</span>
                <strong className="text-xl font-black text-amber-600 block">{attendanceStats.lateCount}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">غياب معلن</span>
                <strong className="text-xl font-black text-rose-600 block">{attendanceStats.absentCount}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold">في إجازة رسمية</span>
                <strong className="text-xl font-black text-blue-600 block">{attendanceStats.vacationCount}</strong>
              </div>
            </div>

            {/* Attendance Analytics summary */}
            <div className="p-4 bg-amber-50/20 border border-amber-200 rounded-xl space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="font-black text-slate-800">معدل الانضباط وتقليل الخسائر والغياب:</span>
                <strong className="text-emerald-700 text-sm font-mono">{attendanceStats.disciplineRate}%</strong>
              </div>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                برنامج حماية الوجوب لوزارة الموارد البشرية يوصي بالحفاظ على معدل انضباط للحضور لا يقل عن <strong>92%</strong> لتفادي خصم نسب السعودة أو تكاليف الغرامات عن الموظفين الذين لا يتواجدون بشكل فعلي.
              </p>
              
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-550">تراكم نسبة التأخير الشهري عن الدوام:</span>
                <span className="text-amber-600 font-mono">{attendanceStats.tardinessRate}%</span>
              </div>
            </div>

            {/* Approved Leaves Breakdown by category */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 block uppercase">مجموع أيام الإجازات المستهلكة المعتمدة بالكامل:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold text-slate-650">
                <div className="p-2 border border-slate-100 rounded-lg flex justify-between items-center bg-slate-50/50">
                  <span>🌴 سنوية:</span>
                  <span className="font-mono text-slate-800">{attendanceStats.leaveTypesCount.annual} يوم</span>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg flex justify-between items-center bg-slate-50/50">
                  <span>🤒 مرضية:</span>
                  <span className="font-mono text-slate-800">{attendanceStats.leaveTypesCount.sick} يوم</span>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg flex justify-between items-center bg-slate-50/50">
                  <span>🚨 اضطرارية:</span>
                  <span className="font-mono text-slate-800">{attendanceStats.leaveTypesCount.urgent} يوم</span>
                </div>
                <div className="p-2 border border-slate-100 rounded-lg flex justify-between items-center bg-slate-50/50">
                  <span>✖️ بلا راتب:</span>
                  <span className="font-mono text-slate-800">{attendanceStats.leaveTypesCount.unpaid} يوم</span>
                </div>
              </div>
            </div>

            {/* Hot link to Attendance Manager */}
            <div className="pt-1">
              <button
                onClick={() => setCurrentView('attendance')}
                className="w-full py-1.5 text-center text-[10.5px] font-black cursor-pointer bg-slate-50 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
              >
                📅 فتح شاشة إدارة وإقرار كشوفات الحضور اليومية <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Right panel: Recharts Attendance split Pie Chart */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800">📊 تحليل حالات الانضباط</h3>
              <p className="text-[9.5px] text-slate-400">توزيع إحصائيات البصمة التراكمية</p>
            </div>

            <div className="h-48 w-full relative">
              {attendanceBreakdownChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceBreakdownChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendanceBreakdownChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold">لا يوجد سجلات حضور في قاعدة البيانات</div>
              )}
            </div>

            <div className="space-y-1.5">
              {attendanceBreakdownChartData.map((d, index) => (
                <div key={index} className="flex justify-between items-center text-[10.5px] pb-1 border-b border-slate-50">
                  <span className="flex items-center gap-1 text-slate-550 font-bold">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}:
                  </span>
                  <span className="font-mono text-slate-800 font-extrabold">{d.value} مرات</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT 4: TALENT, PERFORMANCE & RECRUITMENT */}
      {activeTab === 'talent' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slideup">
          
          {/* Detailed performance scores and recruitment pipelines */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 animate-slideup">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                🚀 التقييم الدوري والتدريب والتوظيف الفعال للمنشأة
              </h3>
              <span className="text-[10px] text-slate-401 font-bold">تنمية الموارد البشرية والقدرات</span>
            </div>

            {/* Mini KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center space-y-1">
                <span className="text-[10.5px] text-slate-400 font-bold">المعدل العام لتقييم الأداء</span>
                <strong className="text-2xl font-black font-mono text-emerald-600 block">{talentStats.avgScore} / 5</strong>
                <span className="text-[9px] text-slate-400">بناءً على {talentStats.completedReviewsCount} تقييم مكتمل</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center space-y-1">
                <span className="text-[10.5px] text-indigo-400 font-bold">الوظائف الشاغرة المفتوحة</span>
                <strong className="text-2xl font-black font-mono text-indigo-700 block">{talentStats.openJobsCount} وظائف</strong>
                <span className="text-[9px] text-slate-400">تستقبل طلبات التقديم حالياً</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-center space-y-1">
                <span className="text-[10.5px] text-slate-500 font-bold">الدورات التدريبية المجدولة</span>
                <strong className="text-2xl font-black font-mono text-slate-705 block">{talentStats.totalTrainingsCount} دورات</strong>
                <span className="text-[9px] text-slate-405">{talentStats.completedTrainingsCount} دورات منجزة بنجاح</span>
              </div>
            </div>

            {/* Performance Review details */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2.5">
              <span className="text-[11px] font-black text-indigo-950 block">💡 أثر التقييمات وتنمية المهارات وتوطين الوظائف التقنية:</span>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                يهدف نظام شؤون الموظفين (سحابة الأعمال) لمراقبة تصاعد جودة المخرج والإنتاجية من خلال ربط الكادر ببرامج <strong>هدف (صندوق تنمية الموارد البشرية)</strong> وربط التقييمات الدورية لدعم تدريبات المنشأة لرفع وتيرة التميز وبناء القادة وبناء ملف تفصيلي مستحق لكل مسمى وظيفي بالقسم المعين.
              </p>

              {/* Action routes link */}
              <div className="pt-2 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCurrentView('perf')}
                  className="py-1.5 px-3 bg-white hover:bg-slate-55 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer transition text-center flex items-center justify-center gap-1"
                >
                  🎯 شاشة تقييمات أداء الموظفين <ArrowUpRight className="w-3 px-0 bg-transparent shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('training')}
                  className="py-1.5 px-3 bg-white hover:bg-slate-55 border border-slate-200 rounded-lg text-slate-700 font-bold cursor-pointer transition text-center flex items-center justify-center gap-1"
                >
                  🎓 حزم ودورات التدريب بالشركة <ArrowUpRight className="w-3 px-0 bg-transparent shrink-0" />
                </button>
              </div>
            </div>

          </div>

          {/* Right panel: Recharts Performance distribution */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800">📊 توزيع منجزات تقييم الأداء</h3>
              <p className="text-[9.5px] text-slate-400">تصنيف أرقام تقييم الموظفين</p>
            </div>

            <div className="h-44 w-full">
              {talentStats.scoreDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={talentStats.scoreDistribution}
                    margin={{ top: 5, right: -5, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {talentStats.scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">لا يوجد مراجعات أداء منجزة ومقيدة بالكامل</div>
              )}
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-[9.5px] text-amber-800 leading-normal flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p>يساعد التحقق من معدلات نجاح الموظفين الدوري في رسم خريطة الرواتب والترقيات بقرارات حكيمة خالية من التحيز.</p>
            </div>
          </div>

        </div>
      )}

      {/* CORE DEPARTMENT ANALYTICS GRID TABLE AND DETAILED VISUAL CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="reports-dept-analytics-grid">
        
        {/* Table representation (Department Summary Grid) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-100">
            <div className="space-y-0.5">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                🏢 التحسين الإحصائي وتوزيع الميزانيات للأقسام
              </h3>
              <p className="text-[10px] text-slate-400">تجميع فوري ومطابقة لأثر الرواتب والتوطين في كل وحدة إدارية</p>
            </div>

            {/* Department filter dropdown inside reports screen */}
            <div className="flex items-center gap-1.5 text-xs text-slate-550 min-w-[200px] sm:self-end">
              <span className="shrink-0 font-bold text-[10.5px]">فلترة الأقسام:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full border border-slate-250 rounded-lg py-1 px-2.5 text-xs font-bold bg-white text-slate-700 outline-none focus:border-emerald-600 text-right"
              >
                <option value="all">كافة الأقسام بالمنتدبين</option>
                {allDepartmentsList.map((dName, i) => (
                  <option key={i} value={dName}>{dName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto" id="reports-dept-table-wrapper">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase text-[9.5px]">
                  <th className="p-2.5">القسم الإداري</th>
                  <th className="p-2.5 text-center">الموظفون</th>
                  <th className="p-2.5 text-center">سعوديون</th>
                  <th className="p-2.5 text-center">وافدون</th>
                  <th className="p-2.5 text-center">نسبة التوطين</th>
                  <th className="p-2.5 text-left">التكلفة الإجمالية للرواتب</th>
                  <th className="p-2.5 text-left">متوسط الراتب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">لا توجد أقسام متوافقة مع المحدد حالياً</td>
                  </tr>
                ) : (
                  departmentAnalytics.map((d, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition duration-150">
                      <td className="p-2.5 font-bold text-slate-850 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-650" /> {d.department}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold text-slate-700">{d.totalEmployees}</td>
                      <td className="p-2.5 text-center font-mono text-emerald-650 font-bold">{d.saudiCount}</td>
                      <td className="p-2.5 text-center font-mono text-slate-500 font-bold">{d.expatCount}</td>
                      <td className="p-2.5 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          d.saudizationPct >= 60 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          d.saudizationPct >= 30 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                        }`}>
                          {d.saudizationPct}%
                        </span>
                      </td>
                      <td className="p-2.5 text-left font-mono font-extrabold text-slate-800">{d.netPayroll.toLocaleString()} ر.س</td>
                      <td className="p-2.5 text-left font-mono text-indigo-700 font-bold">{d.averageSalary.toLocaleString()} ر.س</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Panel Bar chart: Department Payroll Cost comparison */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-800">📊 مقارنة ميزانية رواتب الأقسام</h3>
            <p className="text-[9.5px] text-slate-400">إجمالي فاتورة الصرف الشهري ر.س</p>
          </div>

          <div className="h-60 w-full">
            {departmentExpenditureChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentExpenditureChartData}
                  margin={{ top: 10, right: -5, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 8 }} />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()} ر.س`} />
                  <Bar dataKey="تكلفة مسير الرواتب الشهري" fill="#047857" radius={[4, 4, 0, 0]} name="رواتب القسم" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">لا توجد بيانات للأقسام حالياً</div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
