/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Employee } from '../../../types';
import { FileText, ShieldCheck, Printer } from 'lucide-react';

interface SalaryCertTabProps {
  activeEmployee: Employee;
  isSaudi: boolean;
  basicSalary: number;
  allowance: number;
  totalDeducts: number;
  netSalary: number;
  onPrintCertificate: () => void;
}

export const SalaryCertTab: React.FC<SalaryCertTabProps> = ({
  activeEmployee,
  isSaudi,
  basicSalary,
  allowance,
  totalDeducts,
  netSalary,
  onPrintCertificate,
}) => {
  return (
    <div id="salary_cert_tab_container" className="space-y-6" dir="rtl">
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-800">شهادة تعريف بالراتب</h3>
          <p className="text-sm text-slate-500">
            يمكنك طباعة شهادة تعريف رسمية ومصدقة إلكترونياً ببياناتك الوظيفية والمالية الحالية.
          </p>
        </div>
        <button
          onClick={onPrintCertificate}
          className="flex items-center gap-2 bg-[#00875A] text-white px-5 py-2.5 rounded-xl hover:bg-[#00704a] transition-all font-medium text-sm cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة الشهادة (PDF)</span>
        </button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-3xl mx-auto shadow-md relative overflow-hidden font-sans">
        {/* Riyadh Green accent border */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-[#00875A]" />

        {/* Certificate Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-8">
          <div className="space-y-1.5 text-right">
            <h4 className="font-extrabold text-slate-900 text-lg">شركة سحابة الأعمال المحدودة</h4>
            <p className="text-xs text-slate-400">قسم الموارد البشرية والعمليات</p>
            <p className="text-xs text-slate-400">الرقم المرجعي: HR-CERT-{activeEmployee.id}</p>
          </div>
          <div className="text-left space-y-1">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 mx-auto">
              <FileText className="w-5 h-5 text-[#00875A]" />
            </div>
            <p className="text-[10px] font-bold text-emerald-700 tracking-wider">SAHABA CLOUD</p>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-xl font-bold text-slate-800 underline decoration-emerald-500 underline-offset-8">
            شهادة تعريف بالراتب والوظيفة
          </h2>
        </div>

        {/* Certificate Body */}
        <div className="space-y-6 text-slate-700 leading-relaxed text-sm">
          <p>تشهد شركة <span className="font-bold text-slate-900">سحابة الأعمال المحدودة</span> بأن الموظف الموضحة بياناته أدناه يعمل لدينا وفقاً للتفاصيل التالية:</p>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 grid grid-cols-2 gap-y-3 gap-x-6">
            <div>
              <span className="text-slate-400 text-xs">اسم الموظف:</span>
              <p className="font-bold text-slate-800 text-sm">{activeEmployee.name}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">المسمى الوظيفي:</span>
              <p className="font-bold text-slate-800 text-sm">{activeEmployee.job}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">الإدارة/القسم:</span>
              <p className="font-bold text-slate-800 text-sm">{activeEmployee.dept}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">تاريخ الالتحاق:</span>
              <p className="font-bold text-slate-800 text-sm">{activeEmployee.hire}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">حالة الموظف:</span>
              <p className="font-bold text-emerald-700 text-sm">{activeEmployee.status}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs">الجنسية:</span>
              <p className="font-bold text-slate-800 text-sm">{isSaudi ? 'سعودي' : 'مقيم'}</p>
            </div>
          </div>

          <p>وبناءً على طلبه، فقد تم توضيح هيكل الراتب الشهري الحالي الخاص به كالآتي:</p>

          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <th className="p-3 font-bold">البند المالي</th>
                  <th className="p-3 font-bold text-left">المبلغ بالريال السعودي (SAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td className="p-3">الراتب الأساسي</td>
                  <td className="p-3 text-left font-semibold">{(basicSalary || 0).toLocaleString()} ر.س</td>
                </tr>
                <tr>
                  <td className="p-3">البدلات والمزايا الثابتة</td>
                  <td className="p-3 text-left font-semibold">{(allowance || 0).toLocaleString()} ر.س</td>
                </tr>
                <tr className="text-red-600">
                  <td className="p-3">إجمالي الخصومات والاستقطاعات</td>
                  <td className="p-3 text-left font-semibold">- {(totalDeducts || 0).toLocaleString()} ر.س</td>
                </tr>
                <tr className="bg-[#00875A]/5 font-bold text-[#00875A] text-sm">
                  <td className="p-3">صافي الراتب المستحق</td>
                  <td className="p-3 text-left font-bold">{(netSalary || 0).toLocaleString()} ر.س</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 leading-normal">
            قدمت هذه الشهادة بناءً على طلب الموظف لتقديمها إلى الجهات الرسمية والتمويلية المعنية دون أدنى مسؤولية أو التزام مالي على عاتق الشركة.
          </p>
        </div>

        {/* Certificate Footer / Signature and Stamp */}
        <div className="flex justify-between items-end border-t border-slate-150 pt-8 mt-10">
          <div className="space-y-1">
            <p className="text-[10px] text-slate-400">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
            <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>مصادق إلكترونياً وبطابع رسمي معتمد</span>
            </div>
          </div>
          <div className="text-center space-y-1 shrink-0">
            <p className="text-xs font-bold text-slate-700">الختم والتوقيع الإلكتروني</p>
            <div className="w-20 h-20 border border-emerald-100 rounded-full flex items-center justify-center bg-emerald-50/40 relative rotate-12 mx-auto">
              <span className="text-[9px] font-extrabold text-[#00875A] text-center uppercase tracking-tighter leading-tight">
                شركة سحابة<br />الأعمال
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
