/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Globe, Printer, Search } from 'lucide-react';

interface PayrollFiltersProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  deptFilter: string;
  setDeptFilter: (val: string) => void;
  nationalityFilter: string;
  setNationalityFilter: (val: string) => void;
  salaryFilter: string;
  setSalaryFilter: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  selectedYear: string;
  setSelectedYear: (val: string) => void;
  onExportCSV: () => void;
  onPrintPDF: () => void;
}

export const PayrollFilters: React.FC<PayrollFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  deptFilter,
  setDeptFilter,
  nationalityFilter,
  setNationalityFilter,
  salaryFilter,
  setSalaryFilter,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onExportCSV,
  onPrintPDF,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3" id="payroll_filters_panel">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search & Filter dropdowns in a compact row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم والمسمى الوظيفي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-700 focus:border-gold outline-none font-sans text-right"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          {/* Department */}
          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer text-right"
            >
              <option value="الكل">جميع الأقسام</option>
              <option value="تقنية المعلومات">تقنية المعلومات</option>
              <option value="الموارد البشرية">الموارد البشرية</option>
              <option value="المالية">المالية</option>
              <option value="التسويق">التسويق</option>
              <option value="المبيعات">المبيعات</option>
              <option value="العمليات">العمليات</option>
            </select>
          </div>

          {/* Nationality */}
          <div>
            <select
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer text-right"
            >
              <option value="الكل">كل الجنسيات والاشتراكات</option>
              <option value="سعودي">سعوديين (GOSI نشط) 🇸🇦</option>
              <option value="أجنبي">مقيمين وافدين (GOSI معفى) 🌍</option>
            </select>
          </div>

          {/* Salary Brackets */}
          <div>
            <select
              value={salaryFilter}
              onChange={(e) => setSalaryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer text-right"
            >
              <option value="الكل">كل نطاقات الرواتب</option>
              <option value="أقل من 3000">أقل من 3000 ر.س (تحذير WPS)</option>
              <option value="أقل من 4000">أقل من 4000 ر.س (تحذير نطاقات)</option>
              <option value="أعلى من 10000">أعلى من 10,000 ر.س (رواتب فندقية)</option>
            </select>
          </div>
        </div>

        {/* Period selection & Action buttons */}
        <div className="flex flex-wrap items-center gap-2 justify-end shrink-0">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-500 font-bold ml-1">مسير شهر:</span>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="01">01 يناير</option>
              <option value="02">02 فبراير</option>
              <option value="03">03 مارس</option>
              <option value="04">04 أبريل</option>
              <option value="05">05 مايو</option>
              <option value="06">06 يونيو</option>
              <option value="07">07 يوليو</option>
              <option value="08">08 أغسطس</option>
              <option value="09">09 سبتمبر</option>
              <option value="10">10 أكتوبر</option>
              <option value="11">11 نوفمبر</option>
              <option value="12">12 ديسمبر</option>
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-0 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="2025">2025م</option>
              <option value="2026">2026م</option>
              <option value="2027">2027م</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onExportCSV}
            className="px-3.5 py-1.8 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            تحميل مسير WPS (CSV)
          </button>
          
          <button
            type="button"
            onClick={onPrintPDF}
            className="px-3.5 py-1.8 bg-gold-bg text-gold border border-gold-border text-xs font-bold rounded-lg hover:bg-gold-bg/80 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            طباعة كشف مالي PDF
          </button>
        </div>
      </div>
    </div>
  );
};
