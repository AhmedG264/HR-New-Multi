/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { Employee } from '../../../types';

interface ESSHeaderProps {
  activeEmployee: Employee;
  onOpenSecureLogin: () => void;
}

export const ESSHeader: React.FC<ESSHeaderProps> = ({ activeEmployee, onOpenSecureLogin }) => {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="space-y-1 text-right">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">بوابة ESS للموظف</span>
          <h2 className="text-lg font-black text-slate-800">الخدمة الذاتية للموظفين</h2>
        </div>
        <p className="text-xs text-slate-550 font-semibold">
          الملف النشط الحالي: <span className="text-emerald-700 font-extrabold font-sans">{activeEmployee.name}</span> ({activeEmployee.job})
        </p>
      </div>

      <div className="flex items-center gap-2 bg-white px-4 py-2 border rounded-2xl shadow-2xs self-stretch md:self-auto justify-between" id="ess-switch-account-container">
        <span className="text-xs font-bold text-slate-400 shrink-0">تبديل حساب الموظف:</span>
        <button
          type="button"
          onClick={onOpenSecureLogin}
          className="text-xs font-bold text-[#00875A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 px-3.5 py-2 rounded-xl cursor-pointer transition flex items-center gap-1.5"
          id="open-secure-login-btn"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>تسجيل دخول موثق</span>
        </button>
      </div>
    </div>
  );
};
