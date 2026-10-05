/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Employee } from '../../types';

interface WpsAuditItem {
  employee: Employee;
  gosiAmount: number;
  totalDeductions: number;
  netSalary: number;
  isWpsCompliant: boolean;
  isSaudi: boolean;
  gosiPct: number;
}

interface WpsAuditViewProps {
  items: WpsAuditItem[];
  totals: {
    net: number;
  };
  wps: {
    complianceRate: number;
    compliantCount: number;
    nonCompliantCount: number;
  };
  onTriggerWPSExport: () => void;
}

export const WpsAuditView: React.FC<WpsAuditViewProps> = ({
  items,
  totals,
  wps,
  onTriggerWPSExport,
}) => {
  const activeCount = items.filter(i => i.employee.status !== 'موقوف').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right" id="wps_audit_container">
      {/* Compliance Stats and Guidelines (Left columns) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Compliance Banner explanation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 justify-start">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            دليل نظام حماية الأجور الوزاري (MHRSD WPS)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed text-right font-sans">
            نظام حماية الأجور السعودي هو خطوة أساسية للاستقرار الوظيفي وضمان الشفافية. يهدف النظام إلى تمكين ملاك الأعمال والشركات من إثبات نسبة سداد أجور عمالتهم بشكل دوري لآفاق متوافقة مع منصة (قوى). عدم الالتزام بقرار الحماية يهدد المنشأة بإيقاف بعض الخدمات والتحويل إلى اللجان القانونية.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-lg text-[11px] text-emerald-800 space-y-1 font-sans text-right">
              <strong>💡 شرط الحد الأدنى لأجور السلف:</strong>
              <p className="text-slate-600 leading-relaxed text-[10.5px]">
                يجب أن لا يقل الراتب الأساسي للمواطن السعودي المسجل لمنحه ركيزة التأمين عن 3,000 ر.س للامتثال لحماية الأجور (4,000 ر.س للاستفادة الكاملة بالتوطين).
              </p>
            </div>
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-lg text-[11px] text-amber-800 space-y-1 font-sans text-right">
              <strong>⚠️ شرط نسب الاقتطاع:</strong>
              <p className="text-slate-650 leading-relaxed text-[10.5px]">
                لا يحق لصاحب العمل استقطاع أي جزء من أجر العامل إلا بموافقته الخطية أو بموجب تأمينات GOSI الرسمية واللوائح القانونية المبرمة بمكتب العمل.
              </p>
            </div>
          </div>
        </div>

        {/* WPS Checklist Table audit result */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 text-right">
            <h4 className="text-xs font-bold text-slate-800">تدقيق سجل الموظفين الفعليين ومدى ملاءتهم لقوى</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/55 text-slate-400 font-bold">
                  <th className="p-4 text-right">الموظف</th>
                  <th className="p-4 text-right">الراتب الأساسي</th>
                  <th className="p-4 text-right">قيمة الخصومات</th>
                  <th className="p-4 text-right">صافي النقد</th>
                  <th className="p-4 text-center">أسباب ونتائج الفحص والتدقيق المالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans font-medium">
                {items.map(({ employee: e, totalDeductions, netSalary, isSaudi }) => {
                  if (e.status === 'موقوف') return null; // Ignore suspended

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-right">
                        <span className="text-xs font-bold text-slate-800 block">{e.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{isSaudi ? 'سعودي 🇸🇦' : 'وافد 🌍'}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-right">{e.salary.toLocaleString()} ر.س</td>
                      <td className="p-4 text-rose-600 font-mono text-right">-{totalDeductions.toLocaleString()} ر.س</td>
                      <td className="p-4 font-mono font-bold text-gold text-right">{netSalary.toLocaleString()} ر.s</td>
                      <td className="p-4 text-center">
                        {e.salary < 3000 ? (
                          <span className="inline-block bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded px-2.5 py-1 text-[10.5px]">
                            ❌ غير مطابق: الراتب الأساسي أقل من 3000 ر.س
                          </span>
                        ) : netSalary < 1000 ? (
                          <span className="inline-block bg-amber-50 text-amber-700 font-bold border border-amber-200 rounded px-2.5 py-1 text-[10.5px]">
                            ⚠️ تمهل: صافي مستحقات الموظف منخفض جداً
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 rounded px-2.5 py-1 text-[10.5px]">
                            ✓ مطابق تماماً لشروط برنامج حماية الأجور الوزاري
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Right sidebar compliance score breakdown */}
      <div className="space-y-6">
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute left-[-20px] bottom-[-20px] opacity-10">
            <ShieldCheck className="w-40 h-40" />
          </div>
          <h4 className="text-xs font-bold text-gold flex items-center gap-1.5 uppercase font-sans justify-start">
            🛡️ حالة التزام المنشأة النشط
          </h4>
          <div className="mt-4 space-y-1 text-right">
            <span className="text-xs text-slate-350 block">معدل الاعتمادات هذا الشهر:</span>
            <span className="text-4xl font-extrabold text-white tracking-widest font-sans inline-block">
              {wps.complianceRate}%
            </span>
          </div>
          
          <div className="space-y-3 mt-6 border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between text-xs font-sans font-medium">
              <span className="text-slate-350">طاقم الموظفين النشطين:</span>
              <span className="font-bold text-white">{activeCount} فرد</span>
            </div>
            <div className="flex items-center justify-between text-xs font-sans font-medium">
              <span className="text-slate-350">سوف يصرف لهم:</span>
              <span className="font-bold text-emerald-400">{totals.net.toLocaleString()} ر.س</span>
            </div>
            <div className="flex items-center justify-between text-xs font-sans font-medium">
              <span className="text-slate-350">مطابقة منصة قوى:</span>
              <span className="font-bold text-white">متكامل</span>
            </div>
          </div>

          {/* Action buttons inside sidebar */}
          <div className="mt-6 pt-4 border-t border-slate-705">
            <button
              type="button"
              onClick={onTriggerWPSExport}
              className="w-full py-2.5 bg-gold text-slate-900 hover:bg-gold-light border-none rounded-xl text-xs font-extrabold transition text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              أرسل اعتماد WPS إلى منصة قوى
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center font-sans">
              سيتم فوراً تحميل مسير الأجور متوافقاً مع صيغة البنوك المعتمدة
            </p>
          </div>

        </div>

        {/* Direct Warning list widget */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 justify-start">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            تحذيرات وقائية قبل السداد
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-650 font-sans text-right">
            {items.filter(i => i.employee.salary < 3000 && i.employee.status !== 'موقوف').map(x => (
              <li key={x.employee.id} className="flex items-start gap-2 bg-rose-50/50 p-2 rounded border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2"></span>
                <p className="leading-relaxed text-[11px] text-right">
                  الموظف <strong>{x.employee.name}</strong> ركيزة الأساس لديه أقل من 3,000 ر.س، وهو ما يحد من كفاءة امتثال المنشأة. يرجى ضبط الراتب والمستحقات.
                </p>
              </li>
            ))}
            {items.filter(i => i.gosiPct === 0 && i.isSaudi).map(x => (
              <li key={x.employee.id} className="flex items-start gap-2 bg-amber-50/50 p-2 rounded border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2"></span>
                <p className="leading-relaxed text-[11px] text-right">
                  المواطن السعودي <strong>{x.employee.name}</strong> اشتراكه GOSI محدد بقيمة 0%. يرجى مراجعة لوائحه لتجنب مخالفات هيئة التأمينات الاجتماعية.
                </p>
              </li>
            ))}
            {wps.nonCompliantCount === 0 && (
              <div className="text-center py-6 text-slate-450 font-bold text-[11.5px]">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                كافة كشوف الموظفين مطابقة وسليمة بمعدل 100%. لا تتوفر أي تحذيرات نشطة!
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
