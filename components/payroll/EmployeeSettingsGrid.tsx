/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Sparkles, Edit3 } from 'lucide-react';
import { Employee } from '../../types';

interface SettingsItem {
  employee: Employee;
  gosiPct: number;
  medPct: number;
}

interface EmployeeSettingsGridProps {
  items: SettingsItem[];
  onSelectEmployeeForAdjustment: (empId: string) => void;
}

export const EmployeeSettingsGrid: React.FC<EmployeeSettingsGridProps> = ({
  items,
  onSelectEmployeeForAdjustment,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 animate-slideup" id="employee_settings_grid_container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-150 pb-4">
        <div className="text-right">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 justify-start">
            <Settings className="w-4 h-4 text-gold" />
            لوحة التحكم بالرواتب والتأمينات لموظفي المنشأة
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-semibold text-right">
            استعرض وفنّد لوائح الادخار واشتراكات التأمينات الاجتماعية (GOSI)، ومخصصات التأمين الطبي لجميع منسوبي المنشأة.
          </p>
        </div>
        {/* Quick stats brief */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-2 text-xs font-semibold text-amber-800 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>إجمالي الموظفين الخاضعين للتحديث: {items.length}</span>
        </div>
      </div>

      {/* Quick List/Table of Employees for Settings */}
      <div className="overflow-x-auto border border-slate-150 rounded-2xl shadow-2xs">
        <table className="w-full text-right border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 font-black uppercase text-[10px]">
              <th className="p-3.5 text-right">الموظف والبيانات</th>
              <th className="p-3.5 text-right">القسم والوظيفة</th>
              <th className="p-3.5 text-right">الراتب الأساسي الحالي</th>
              <th className="p-3.5 text-right">التأمينات GOSI</th>
              <th className="p-3.5 text-right">نسبة التأمين الطبي</th>
              <th className="p-3.5 text-center">خدمات الضبط والتعديل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans font-medium">
            {items.map(item => {
              const e = item.employee;
              const isSaudi = item.gosiPct > 2;
              return (
                <tr 
                  key={e.id} 
                  className={`hover:bg-slate-50/50 transition ${
                    e.status === 'موقوف' ? 'bg-rose-50/20 text-rose-800' : ''
                  }`}
                >
                  <td className="p-3.5 text-right">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 text-[11px]">
                        {e.name[0]}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black block text-slate-800">{e.name}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">رمز الموظف: <code>{e.id}</code></span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <span className="text-xs font-bold text-slate-700 block">{e.job}</span>
                    <span className="text-[10px] text-indigo-700 block mt-0.5 font-bold">قسم {e.dept}</span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-800 text-right">
                    {e.salary.toLocaleString()} ر.س
                  </td>
                  <td className="p-3.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono inline-block ${
                      isSaudi ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                    }`}>
                      {isSaudi ? '🇸🇦' : '🌍'} {item.gosiPct}% GOSI
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-700 font-bold text-right">
                    {item.medPct}%
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectEmployeeForAdjustment(e.id)}
                      className="px-3.5 py-1.8 bg-[#00875A] hover:bg-[#006e49] text-white rounded-xl text-xs font-black transition cursor-pointer active:scale-95 flex items-center gap-1.5 mx-auto shadow-xs border-none"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل وضبط الراتب</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
