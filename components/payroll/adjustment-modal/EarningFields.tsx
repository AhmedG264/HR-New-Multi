/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface EarningFieldsProps {
  salary: number;
  allow: number;
  deduct: number;
  onSalaryChange: (val: number) => void;
  onAllowChange: (val: number) => void;
  onDeductChange: (val: number) => void;
}

export const EarningFields: React.FC<EarningFieldsProps> = ({
  salary,
  allow,
  deduct,
  onSalaryChange,
  onAllowChange,
  onDeductChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Basic Salary */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-bold text-slate-500 text-right">الراتب الأساسي (SAR) *</label>
        <input
          type="number"
          required
          min={0}
          value={salary === 0 ? '' : salary}
          onChange={(e) => onSalaryChange(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-mono"
        />
      </div>

      {/* Allowances */}
      <div className="flex flex-col gap-1.5 w-full font-sans">
        <label className="text-xs font-bold text-slate-500 text-right">البدلات والسكن والمواصلات (SAR)</label>
        <input
          type="number"
          min={0}
          value={allow === 0 ? '' : allow}
          onChange={(e) => onAllowChange(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-mono"
        />
      </div>

      {/* Custom Deduct */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-bold text-slate-500 text-right">حسم مباشر / عقوبة وتأخيرات (SAR)</label>
        <input
          type="number"
          min={0}
          value={deduct === 0 ? '' : deduct}
          onChange={(e) => onDeductChange(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-mono"
        />
      </div>
    </div>
  );
};
