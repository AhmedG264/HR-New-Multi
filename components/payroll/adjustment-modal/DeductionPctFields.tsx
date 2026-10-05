/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';

interface DeductionPctFieldsProps {
  gosiPct: number;
  medPct: number;
  taxPct: number;
  otherPct: number;
  otherNote: string;
  onGosiPctChange: (val: number) => void;
  onMedPctChange: (val: number) => void;
  onTaxPctChange: (val: number) => void;
  onOtherPctChange: (val: number) => void;
  onOtherNoteChange: (val: string) => void;
}

export const DeductionPctFields: React.FC<DeductionPctFieldsProps> = ({
  gosiPct,
  medPct,
  taxPct,
  otherPct,
  otherNote,
  onGosiPctChange,
  onMedPctChange,
  onTaxPctChange,
  onOtherPctChange,
  onOtherNoteChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GOSI Percentage */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-bold text-slate-500 text-right flex items-center gap-1 justify-end">
            <span>نسبة استقطاع التأمينات الاجتماعية GOSI (%)</span>
            <span className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none text-center shadow-lg font-normal leading-relaxed z-35 font-sans">
                الحصة الرسمية للمشترك السعودي هي 9.75% من قيمة الراتب الأساسي كإسهام في التقاعد.
              </span>
            </span>
          </label>
          <input
            type="number"
            step={0.01}
            min={0}
            max={100}
            value={gosiPct}
            onChange={(e) => onGosiPctChange(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-mono"
          />
        </div>

        {/* Medical Insurance */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-bold text-slate-500 text-right">مساهمة التأمين الطبي للموظف (%)</label>
          <input
            type="number"
            step={0.01}
            min={0}
            max={100}
            value={medPct}
            onChange={(e) => onMedPctChange(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-mono"
          />
        </div>

        {/* Tax withholding */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-bold text-slate-500 text-right">ضريبة الدخل المستقطعة / وافدون (%)</label>
          <input
            type="number"
            step={0.01}
            min={0}
            max={100}
            value={taxPct}
            onChange={(e) => onTaxPctChange(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-mono"
          />
        </div>

        {/* Other Deduct Percent */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-bold text-slate-500 text-right">خصم إضافي مخصص (%)</label>
          <input
            type="number"
            step={0.01}
            min={0}
            max={100}
            value={otherPct}
            onChange={(e) => onOtherPctChange(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-mono"
          />
        </div>
      </div>

      {/* Remarks Box */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-xs font-bold text-slate-500 text-right">ملاحظات المسير ومذكرة الأجور والمستندات</label>
        <textarea
          rows={2}
          value={otherNote}
          onChange={(e) => onOtherNoteChange(e.target.value)}
          placeholder="قم بتدوين أسباب التعديل أو توضيح مستندات السلف والقروض المرغوب أرشفتها..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-gold outline-none text-right font-sans"
        />
      </div>
    </div>
  );
};
