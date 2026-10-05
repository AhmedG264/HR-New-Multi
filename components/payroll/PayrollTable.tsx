/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Edit3, ExternalLink, Info } from 'lucide-react';
import { Employee } from '../../types';

interface PayrollItem {
  employee: Employee;
  gosiPct: number;
  gosiAmount: number;
  medPct: number;
  medAmount: number;
  taxPct: number;
  taxAmount: number;
  otherPct: number;
  otherAmount: number;
  unpaidDays: number;
  unpaidDeduct: number;
  totalDeductions: number;
  netSalary: number;
  isWpsCompliant: boolean;
  isSaudi: boolean;
}

interface PayrollTableProps {
  filteredItems: PayrollItem[];
  totals: {
    net: number;
  };
  selectedMonth: string;
  selectedYear: string;
  onSelectEmployeeForAdjustment: (empId: string) => void;
  onNavigateToProfile: (empId: string) => void;
  onNavigateToVacations: () => void;
}

export const PayrollTable: React.FC<PayrollTableProps> = ({
  filteredItems,
  totals,
  selectedMonth,
  selectedYear,
  onSelectEmployeeForAdjustment,
  onNavigateToProfile,
  onNavigateToVacations,
}) => {
  return (
    <div className="space-y-4" id="payroll_table_container">
      {/* Main Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4 text-right">بيانات كادر المنشأة</th>
                <th className="p-4 text-right">تدرج الراتب الأساسي</th>
                <th className="p-4 text-right">البدلات والمزايا</th>
                <th className="p-4 text-right">اشتراك التأمينات GOSI</th>
                <th className="p-4 text-right">تفاصيل خصم أو إجازة</th>
                <th className="p-4 text-right">صافي النقد المحول لقوى</th>
                <th className="p-4 text-center">خدمات التدقيق والتعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 font-bold">
                    لا توجد نتائج مطابقة لمؤشرات الفلترة والبحث الحالي.
                  </td>
                </tr>
              ) : (
                filteredItems.map(({ employee: e, gosiPct, gosiAmount, unpaidDays, unpaidDeduct, netSalary, isWpsCompliant, isSaudi }) => {
                  return (
                    <tr 
                      key={e.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        e.status === 'موقوف' ? 'bg-rose-50/30 text-rose-800' : ''
                      }`}
                    >
                      {/* Name + Details with flags */}
                      <td className="p-4 text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {e.name[0]}
                          </div>
                          <div className="space-y-0.5">
                            <span className={`text-xs font-black block ${
                              e.status === 'موقوف' ? 'text-rose-700 line-through' : 'text-slate-800'
                            }`}>
                              {e.name}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span>{e.job}</span>
                              <span>•</span>
                              <span>{e.dept}</span>
                              <span>•</span>
                              <span className={`px-1 rounded-sm text-[9px] font-bold ${
                                isSaudi ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                              }`}>
                                {isSaudi ? 'سعودي 🇸🇦' : 'وافد 🌍'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Basic Salary */}
                      <td className="p-4 font-mono font-bold text-slate-700 text-right">
                        {e.salary.toLocaleString()} ر.س
                        {e.salary < 3000 && e.status !== 'موقوف' && (
                          <span className="block text-[8.5px] text-rose-600 font-sans font-bold mt-0.5" title="الحد الأدنى للأجور في منصة قوى والاشتراطات">⚠️ راتب منخفض لحصانة الموظف</span>
                        )}
                      </td>

                      {/* Allowances */}
                      <td className="p-4 text-emerald-700 font-bold font-mono text-right">
                        +{e.allow.toLocaleString()} ر.س
                        <span className="block text-[9px] text-slate-400 font-sans font-medium mt-0.5">بدل السكن والنقل</span>
                      </td>

                      {/* GOSI */}
                      <td className="p-4 font-mono font-bold text-amber-600 text-right">
                        -{gosiAmount.toLocaleString()} ر.س
                        <span className="block text-[9.5px] text-slate-400 font-semibold font-sans mt-0.5">نسبة الاشتراك: {gosiPct}%</span>
                      </td>

                      {/* Direct and unpaid leave deductions */}
                      <td className="p-4 font-mono text-slate-600 text-right">
                        <div className="space-y-0.5">
                          {/* Direct Deduct */}
                          {e.deduct > 0 && (
                            <div className="text-[10px] font-bold">
                              خصم مباشر: -{e.deduct.toLocaleString()} ر.س
                            </div>
                          )}
                          
                          {/* Unpaid leaves deduct */}
                          {unpaidDays > 0 && (
                            <div className="text-[10.5px] text-rose-600 font-bold flex items-center justify-start gap-1">
                              <span>إجازة بدون راتب: -{unpaidDeduct.toLocaleString()} ر.س</span>
                              <button
                                onClick={onNavigateToVacations}
                                className="p-0 bg-transparent border-0 text-[10px] text-indigo-500 hover:underline inline-flex items-center hover:text-indigo-700 cursor-pointer text-right"
                                title="شاهد كشف الإجازات المعتمدة للموظف"
                              >
                                ({unpaidDays} أيام) ↗
                              </button>
                            </div>
                          )}

                          {e.deduct === 0 && unpaidDays === 0 && (
                            <span className="text-slate-400 font-normal italic">لا توجد حسميات</span>
                          )}
                        </div>
                      </td>

                      {/* Net Pay */}
                      <td className="p-4 text-right">
                        <span className="text-sm font-extrabold text-gold font-mono block">
                          {netSalary.toLocaleString()} ر.س
                        </span>
                        <span className="block text-[9.5px] mt-0.5 text-slate-400 font-sans">
                          {e.status === 'موقوف' ? (
                            <strong className="text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded">موقوف الصرف</strong>
                          ) : isWpsCompliant ? (
                            <strong className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">✓ مطابق قوى</strong>
                          ) : (
                            <strong className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">⚠️ يحتاج تصفية</strong>
                          )}
                        </span>
                      </td>

                      {/* Actions Panel */}
                      <td className="p-4 text-center">
                        <div className="flex gap-1.5 justify-center">
                          {/* Quick Adjustment Settings */}
                          <button
                            type="button"
                            onClick={() => onSelectEmployeeForAdjustment(e.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-gold hover:text-slate-900 text-slate-600 border border-slate-200 rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="تعديل مباشر وحوسبة تفاصيل راتب الموظف"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            ضبط الرواتب
                          </button>

                          {/* Inter-linkage: Jump to profile */}
                          <button
                            type="button"
                            onClick={() => onNavigateToProfile(e.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded text-[10.5px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title="الانتقال إلى كشف الحركات والملف الوظيفي للموظف"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            الملف المالي
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

        {/* Total Aggregate */}
        <div className="p-5 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/40 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-right">
            <h4 className="text-xs font-bold text-slate-800">إجمالي صافي الحوالات المستحقة للرواتب لشهر {selectedMonth} / {selectedYear}</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              هذه الحوالات مستحقة الدفع بعد تصفية التأمينات الاجتماعية والحسوم. يحسب النظام موازنة متكاملة لحوالة الصراف المعتمدة.
            </p>
          </div>
          <div className="text-2xl font-black text-gold font-mono tracking-tight text-left shrink-0 block">
            {totals.net.toLocaleString()} ر.س
          </div>
        </div>
      </div>

    </div>
  );
};
