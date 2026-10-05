/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface PresetButtonsProps {
  onApplyPreset: (type: 'saudi' | 'expat') => void;
}

export const PresetButtons: React.FC<PresetButtonsProps> = ({ onApplyPreset }) => {
  return (
    <div className="text-left space-y-1.5 shrink-0 flex flex-col items-end">
      <span className="text-[10px] text-slate-400 block font-bold text-left">ملاءمة سريعة لمعدل التأمينات:</span>
      <div className="flex gap-1.5 justify-end">
        <button
          type="button"
          onClick={() => onApplyPreset('saudi')}
          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold transition cursor-pointer"
        >
          سعودي (9.75%) 🇸🇦
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('expat')}
          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-[10px] font-bold transition cursor-pointer"
        >
          وافد مقيم (0%) 🌍
        </button>
      </div>
    </div>
  );
};
