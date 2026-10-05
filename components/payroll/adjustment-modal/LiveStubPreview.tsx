/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins, Sparkles } from 'lucide-react';

interface LiveStubPreviewProps {
  salary: number;
  allow: number;
  unpaidDays: number;
  unpaidDeduct: number;
  gosiPct: number;
  gosiAmount: number;
  medPct: number;
  medAmount: number;
  taxPct: number;
  taxAmount: number;
  otherPct: number;
  otherAmount: number;
  directDeduct: number;
  totalCalculatedDeductions: number;
  netSuggestedPayout: number;
}

export const LiveStubPreview: React.FC<LiveStubPreviewProps> = ({
  salary,
  allow,
  unpaidDays,
  unpaidDeduct,
  gosiPct,
  gosiAmount,
  medPct,
  medAmount,
  taxPct,
  taxAmount,
  otherPct,
  otherAmount,
  directDeduct,
  totalCalculatedDeductions,
  netSuggestedPayout,
}) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="absolute left-[-20px] top-[-20px] opacity-[0.03] pointer-events-none">
        <Coins className="w-40 h-40 text-slate-800" />
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-black text-slate-700 flex items-center gap-1.5 pb-2.5 border-b border-slate-200/60 justify-start">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>المسودة الحية لقسيمة الراتب المحسوبة (Live Stub)</span>
        </h4>

        <div className="space-y-3.5 mt-3 text-right">
          {/* Earnings */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-450">الراتب الأساسي:</span>
            <span className="font-mono text-slate-800 font-extrabold">{salary.toLocaleString()} ر.س</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-450">بدلات السكن والنقل والمكافآت:</span>
            <span className="font-mono text-slate-800 font-extrabold">+{allow.toLocaleString()} ر.س</span>
          </div>

          {/* Unpaid Leave Deductions */}
          {unpaidDays > 0 && (
            <div className="flex justify-between items-center text-xs bg-rose-50 border border-rose-100 p-2 rounded-xl">
              <span className="text-rose-600 font-black">غياب إجازات غير مدفوعة ({unpaidDays} أيام):</span>
              <span className="font-mono text-rose-600 font-black">-{unpaidDeduct.toLocaleString()} ر.س</span>
            </div>
          )}

          <hr className="border-slate-200 border-dashed" />

          {/* Deductions breakdown */}
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-450">حسم اشتراك GOSI المخطط ({gosiPct}%):</span>
            <span className="font-mono text-slate-800 font-bold">-{gosiAmount.toLocaleString()} ر.س</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-450">حسم شركة التأمين الطبي ({medPct}%):</span>
            <span className="font-mono text-slate-800 font-bold">-{medAmount.toLocaleString()} ر.س</span>
          </div>

          {taxPct > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-450">ضريبة الاستقطاع المستفادة ({taxPct}%):</span>
              <span className="font-mono text-slate-800 font-bold">-{taxAmount.toLocaleString()} ر.س</span>
            </div>
          )}

          {otherPct > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-450">حسم إضافي نسبي مخصص ({otherPct}%):</span>
              <span className="font-mono text-slate-800 font-bold">-{otherAmount.toLocaleString()} ر.س</span>
            </div>
          )}

          {directDeduct > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-450">حسم مباشر مضاف بالمسير:</span>
              <span className="font-mono text-slate-800 font-bold">-{directDeduct.toLocaleString()} ر.س</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <hr className="border-slate-200" />
        
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500">صافي الحسميات الكلي:</span>
          <span className="font-mono text-rose-600 font-black bg-rose-50/50 px-2.5 py-1 rounded-lg border border-rose-100">
            -{totalCalculatedDeductions.toLocaleString()} ر.س
          </span>
        </div>

        {/* Suggested Payout Card */}
        <div className="flex justify-between items-center text-sm p-3 bg-white border border-dashed border-slate-200 rounded-2xl shadow-xs">
          <span className="font-black text-slate-800">الصافي المقترح صرفه:</span>
          <span className="font-mono text-emerald-600 font-extrabold text-base bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            {netSuggestedPayout.toLocaleString()} ر.س
          </span>
        </div>
      </div>
    </div>
  );
};
