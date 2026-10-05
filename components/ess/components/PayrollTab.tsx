/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Download } from 'lucide-react';
import { Employee } from '../../../types';
import { PayslipDetails } from '../utils/printUtils';

interface PayrollTabProps {
  basicSalary: number;
  allowance: number;
  totalDeducts: number;
  activeEmployee: Employee;
  payslipDetails: PayslipDetails;
  selectedPayslipMonth: string;
  setSelectedPayslipMonth: (month: string) => void;
  handlePrintPayslip: () => void;
}

export const PayrollTab: React.FC<PayrollTabProps> = ({
  basicSalary,
  allowance,
  totalDeducts,
  activeEmployee,
  payslipDetails,
  selectedPayslipMonth,
  setSelectedPayslipMonth,
  handlePrintPayslip
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-800">بوابة كشوف ومسيرات الرواتب المفصلة (Payslips)</h3>
          <p className="text-xs text-slate-550 mt-1 font-semibold">
            استعرض وفند رواتبك وبدلاتك الشهرية المحمية بموجب نظام حماية الأجور (WPS) طبقاً لضوابط وزارة الموارد البشرية والتأمينات الاجتماعية السعودية.
          </p>
        </div>
        <button
          onClick={handlePrintPayslip}
          className="bg-[#00875A] hover:bg-[#006e49] text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>تحميل أو طباعة كشف الراتب (PDF)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans">
        {/* Payslip selector side rail */}
        <div className="lg:col-span-1 space-y-3">
          <h4 className="text-xs font-black text-slate-700 uppercase px-1">دورات صرف الرواتب</h4>
          <div className="space-y-2.5">
            {[
              { id: 'current_jun', label: 'يونيو ٢٠٢٦', sub: 'دورة الصرف القادمة', status: '⏱ معلّق', isCurrent: true },
              {
                id: 'may',
                label: 'مايو ٢٠٢٦',
                sub: `صافي: ${(basicSalary + allowance + 500 - totalDeducts).toLocaleString()} ر.س`,
                status: '✓ تم صرفه',
                isCurrent: false
              },
              {
                id: 'apr',
                label: 'أبريل ٢٠٢٦',
                sub: `صافي: ${(basicSalary + allowance + 1000 - totalDeducts).toLocaleString()} ر.س`,
                status: '✓ تم صرفه',
                isCurrent: false
              },
              {
                id: 'mar',
                label: 'مارس ٢٠٢٦',
                sub: `صافي: ${(basicSalary + allowance - totalDeducts).toLocaleString()} ر.س`,
                status: '✓ تم صرفه',
                isCurrent: false
              }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedPayslipMonth(item.id)}
                className={`w-full p-4 rounded-2xl border text-right transition flex justify-between items-center ${
                  selectedPayslipMonth === item.id
                    ? 'border-[#00875A] bg-emerald-50/20 shadow-2xs'
                    : 'border-slate-150 bg-white hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="text-xs font-black block text-slate-800">{item.label}</span>
                  <span className="text-[10px] text-slate-400 block font-semibold font-sans mt-0.5">{item.sub}</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                    item.isCurrent ? 'bg-amber-150 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Payslip detailed breakdown sheet */}
        <div className="lg:col-span-3 bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">دورة استحقاق الراتب</span>
              <h4 className="text-sm font-black text-slate-800">{payslipDetails.monthName}</h4>
            </div>
            <div className="text-left font-mono text-[10px] text-slate-400">
              <span>المعرف البنكي: SA47-SHB-{activeEmployee.id}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3.5">
              <h5 className="text-xs font-black text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                <span>البنود المستحقة (Earnings)</span>
                <span className="text-emerald-700 font-bold">المبلغ</span>
              </h5>
              <div className="space-y-3 text-xs px-1 font-semibold text-slate-550">
                <div className="flex justify-between">
                  <span>الراتب الأساسي المعتمد:</span>
                  <span className="font-mono text-slate-800">{payslipDetails.calcBasic.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل السكن الموزع (60%):</span>
                  <span className="font-mono text-slate-800">{payslipDetails.calcHousing.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>بدل النقل ومصروف البنزين (30%):</span>
                  <span className="font-mono text-slate-800">{payslipDetails.calcTransport.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>بدلات أخرى متنوعة وتواصل (10%):</span>
                  <span className="font-mono text-slate-800">{payslipDetails.calcOtherAllow.toLocaleString()} ر.س</span>
                </div>
                {payslipDetails.extraBonus > 0 && (
                  <div className="flex justify-between text-emerald-600 bg-emerald-50/50 p-2 rounded-lg font-bold">
                    <span>إضافات ومكافأة تميز للمركز:</span>
                    <span className="font-mono">+{payslipDetails.extraBonus.toLocaleString()} ر.س</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3.5">
              <h5 className="text-xs font-black text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex justify-between items-center">
                <span>الاستقطاعات والخصميات (Deductions)</span>
                <span className="text-rose-700 font-bold">المستقطع</span>
              </h5>
              <div className="space-y-3 text-xs px-1 font-semibold text-slate-550">
                <div className="flex justify-between">
                  <span>تأمين المؤسسة العامة للتأمينات (GOSI):</span>
                  <span className="font-mono text-rose-600">{payslipDetails.calcGosi.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>تأمين الرعاية والاشتراك الصحي:</span>
                  <span className="font-mono text-rose-600">{payslipDetails.calcMed.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>أية حسميات غياب أو جزاءات معلقة:</span>
                  <span className="font-mono text-rose-600">{payslipDetails.calcOtherDeduct.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>-</span>
                  <span>0 ر.س</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Row */}
          <div className="border-t pt-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">إجمالي المستحق الصافي للتحويل البنكي</span>
              <span className="text-xl font-black text-[#00875A] block font-mono mt-1">
                {payslipDetails.calcNet.toLocaleString()}{' '}
                <span className="text-xs font-bold font-sans">ريال سعودي</span>
              </span>
            </div>
            <div className="shrink-0 bg-[#00875A] text-white px-3 py-1 rounded-xl text-[10px] font-black">
              مؤشر نظام حماية الأجور WPS ✓
            </div>
          </div>

          {/* Remarks */}
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl text-[11px] text-slate-600 space-y-1">
            <strong className="text-slate-700 block font-bold">شروحات ومذكرات دورة الصرف:</strong>
            <p className="font-semibold">{payslipDetails.extraNotes}</p>
            <span className="text-[9px] text-slate-400 block pt-1 font-bold">
              * تم توثيق وتصديق حركة الصرف هذه رقمياً عبر مفاتيح المنشأة المعتمدة ولا تعتبر بدلاً عن تعريف الراتب المطبوع.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
