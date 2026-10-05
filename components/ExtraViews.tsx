/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useHR } from '../context/HRContext';

// ----------------------------------------------------
// 1. Company Documents & Policies View
// ----------------------------------------------------
export const CompanyDocs: React.FC = () => {
  const { docs } = useHR();

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'policy': return 'سياسات';
      case 'contract': return 'عقود';
      case 'hr': return 'موارد بشرية';
      case 'financial': return 'مالية';
      case 'legal': return 'قانوني';
      case 'training': return 'تدريب';
      default: return cat;
    }
  };

  return (
    <div className="space-y-6 animate-slideup font-sans">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">مستندات وسياسات الشركة الرسمية</h2>
          <p className="text-xs text-slate-400 mt-1">تنزيل ومطالعة لوائح وسياسات العمل المعتمدة المستقاة من قاعدة البيانات الفعلية</p>
        </div>

        {docs.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">لا توجد أي مستندات رسمية مسجلة في قاعدة البيانات حالياً.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((docItem) => (
              <div
                key={docItem.id}
                onClick={() => alert(`جاري تنزيل ملف السياسة الرسمي المشفّر: ${docItem.name}`)}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-gold-dim cursor-pointer transition bg-slate-50/50 hover:bg-slate-50"
              >
                <div className="text-right space-y-1">
                  <span className="text-[10px] bg-gold-bg text-gold border border-gold-border px-2 py-0.5 rounded-full font-bold">
                    {getCategoryLabel(docItem.cat)}
                  </span>
                  <strong className="text-xs font-bold text-slate-800 block mt-1.5">{docItem.name}</strong>
                  <p className="text-[10px] text-slate-400">تاريخ النشر: {docItem.date} · حجم الملف: {docItem.size} · الإصدار: {docItem.version}</p>
                </div>
                <span className="text-slate-400 text-lg">📥</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// ----------------------------------------------------
// 2. Interactive Tasks view
// ----------------------------------------------------
import { TasksManager as ModernTasksManager } from './TasksManager';

export const TasksManager: React.FC = () => {
  return <ModernTasksManager />;
};


// ----------------------------------------------------
// 3. Health Insurance View (Bupa)
// ----------------------------------------------------
import { HealthInsuranceManager } from './HealthInsuranceManager';

export const HealthInsurance: React.FC = () => {
  return <HealthInsuranceManager />;
};


// ----------------------------------------------------
// 4. Reports and Saudi HR Analytics Page
// ----------------------------------------------------
import { ReportsAndStats as ComprehensiveReportsAndStats } from './ReportsAndStats';

export const ReportsAndStats: React.FC = () => {
  return <ComprehensiveReportsAndStats />;
};
