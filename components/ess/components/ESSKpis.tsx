/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ESSKpisProps {
  basicSalary: number;
  leaveBalance: number;
  netSalary: number;
  perf?: number;
}

export const ESSKpis: React.FC<ESSKpisProps> = ({
  basicSalary,
  leaveBalance,
  netSalary,
  perf
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white border p-4 rounded-3xl shadow-2xs space-y-1.5 text-right">
        <span className="text-[10px] text-slate-400 block font-bold">الراتب الأساسي الشهري</span>
        <span className="text-base font-black text-slate-800 block font-mono">
          {basicSalary.toLocaleString()}{' '}
          <span className="text-xs font-bold font-sans">ر.س</span>
        </span>
      </div>
      <div className="bg-white border p-4 rounded-3xl shadow-2xs space-y-1.5 text-right">
        <span className="text-[10px] text-slate-400 block font-bold">رصيد الإجازات السنوية</span>
        <span className="text-base font-black text-teal-750 block font-mono">
          {leaveBalance}{' '}
          <span className="text-xs font-bold font-sans">يوم</span>
        </span>
      </div>
      <div className="bg-white border p-4 rounded-3xl shadow-2xs space-y-1.5 text-right">
        <span className="text-[10px] text-slate-400 block font-bold">صافي الأجر الشهري</span>
        <span className="text-base font-black text-emerald-700 block font-mono">
          {netSalary.toLocaleString()}{' '}
          <span className="text-xs font-bold font-sans">ر.س</span>
        </span>
      </div>
      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-3xl shadow-2xs space-y-1.5 text-right">
        <span className="text-[10px] text-[#00875A] block font-bold">تقييم الكفاءة والأداء</span>
        <span className="text-base font-black text-[#00875A] block font-mono">
          {perf ? `${perf} / 5` : "أداء ممتاز"}
        </span>
      </div>
    </div>
  );
};
