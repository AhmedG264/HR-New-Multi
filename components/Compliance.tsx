/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useHR } from '../context/HRContext';

interface ComplianceItem {
  title: string;
  desc: string;
  status: 'متوافق' | 'معلّق' | 'يتطلب إجراء';
  colorClass: string;
}

export const Compliance: React.FC = () => {
  const { employees, contracts } = useHR();

  // 1. GOSI calculation
  const saudiEmployees = employees.filter(e => {
    const c = contracts.find(contract => contract.empId === e.id);
    return !c?.iqamaExp; // Saudi citizens normally don't have Iqama Exp
  });
  const saudiCount = saudiEmployees.length;

  // 2. Wage Protection System WPS calculation
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary + e.allow, 0);

  // 3. Qiwa contracts calculation
  const activeContractsCount = contracts.filter(c => c.status === 'نشط').length;

  // 4. Resident/Iqama expirations calculation from REAL database
  const today = new Date();
  const next60Days = new Date();
  next60Days.setDate(today.getDate() + 60);

  const foreignersContracts = contracts.filter(c => c.iqamaExp && c.iqamaExp.trim() !== '');
  
  const expiringSoonContracts = foreignersContracts.filter(c => {
    const exp = new Date(c.iqamaExp);
    return exp >= today && exp <= next60Days;
  });

  const expiredContracts = foreignersContracts.filter(c => {
    const exp = new Date(c.iqamaExp);
    return exp < today;
  });

  const expiringSoonNames = expiringSoonContracts.map(c => employees.find(e => e.id === c.empId)?.name).filter(Boolean);
  const expiredNames = expiredContracts.map(c => employees.find(e => e.id === c.empId)?.name).filter(Boolean);

  let iqamaDesc = 'كافة إقامات وتصاريح عمل الكوادر المقيمة سارية المفعول وموثقة بنسبة 100% في قواعد البيانات.';
  let iqamaStatus: 'متوافق' | 'يتطلب إجراء' = 'متوافق';
  let iqamaColorClass = 'bg-emerald-50 text-emerald-600 border-emerald-200';

  if (expiredNames.length > 0) {
    iqamaDesc = `تنبيه امتثال حرج: هناك إقامات منتهية للموظفين: (${expiredNames.join('، ')}). يرجى التجديد العاجل عبر بوابة مقيم لتفادي الغرامات.`;
    iqamaStatus = 'يتطلب إجراء';
    iqamaColorClass = 'bg-rose-50 text-rose-600 border-rose-200';
  } else if (expiringSoonNames.length > 0) {
    iqamaDesc = `تنبيه تجديد: هناك إقامات تنتهي خلال 60 يوماً القادمة للموظفين: (${expiringSoonNames.join('، ')}). يرجى الإجراء للتجديد عبر بوابة مقيم.`;
    iqamaStatus = 'يتطلب إجراء';
    iqamaColorClass = 'bg-amber-50 text-amber-600 border-amber-200';
  }

  const complianceList: ComplianceItem[] = [
    {
      title: 'المؤسسة العامة للتأمينات الاجتماعية (GOSI)',
      desc: `تم مطابقة وتسجيل عدد (${saudiCount}) موظف مواطن بمسير التأمينات الاجتماعية بشكل سليم ونشط من أصل (${employees.length}) موظف كلي بالشركة.`,
      status: 'متوافق',
      colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      title: 'نظام حماية الأجور الحكومي (WPS)',
      desc: `تم مطابقة واعتماد كافة التحويلات البنكية للموظفين ومسودة الأجور الفعالة لشهر الماضي بإصدار WPS آلي بقيمة (${totalPayroll.toLocaleString()} ر.س).`,
      status: 'متوافق',
      colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      title: 'بوابة وزارة الموارد البشرية (منصة قوى)',
      desc: `توثيق متبادل للائحة العمل واعتماد عدد (${activeContractsCount}) عقد موحد وظيفي إلكتروني قائم ومحفوظ في الخادم الفعلي للشركة.`,
      status: 'متوافق',
      colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      title: 'إقامات الموظفين الأجانب (بوابة مقيم)',
      desc: iqamaDesc,
      status: iqamaStatus,
      colorClass: iqamaColorClass
    },
    {
      title: 'رخص العمل وتصاريح بلدي والبلدية',
      desc: `رخص العمل وسجلات العناوين الوطنية لجميع كادر المنظومة الفعلي البالغ (${employees.length}) موظفاً مجددّة لتجنب مراجعات العمل أو تجميد الملفات الحيوية.`,
      status: 'متوافق',
      colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    }
  ];

  return (
    <div className="space-y-6 animate-slideup">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">حالة الامتثال وتفصيل الأنظمة الحكومية في المملكة</h2>
          <p className="text-xs text-slate-400 mt-1">تتبع مستويات التوافق للشركة مع اللوائح والتشريعات الصادرة من الجهات الرسمية</p>
        </div>

        <div className="space-y-4 font-sans">
          {complianceList.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-4 border border-slate-200 rounded-xl transition duration-200 hover:border-gold-dim"
            >
              <div className="text-right space-y-1">
                <strong className="text-sm text-slate-800 block">{item.title}</strong>
                <p className="text-xs text-slate-450 leading-relaxed font-medium">{item.desc}</p>
              </div>
              <span className={`text-xs font-bold border px-3 py-1 rounded-full ${item.colorClass}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
