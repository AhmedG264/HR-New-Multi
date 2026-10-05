/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Briefcase, Download } from 'lucide-react';
import { Employee, EmployeeAsset } from '../../../types';

interface AssetsTabProps {
  activeEmployee: Employee;
  assets: EmployeeAsset[];
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ activeEmployee, assets }) => {
  const activeAssetsCount = assets.filter(
    a => a.empId === activeEmployee.id && ['Assigned', 'Under Maintenance', 'Damaged'].includes(a.status)
  ).length;

  const myAssets = assets.filter(a => a.empId === activeEmployee.id);

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div className="text-right">
          <h3 className="text-sm font-black text-slate-800">📦 عهدي وأصولي العينية المستلمة</h3>
          <p className="text-xs text-slate-400 mt-1">
            قائمة بكافة ممتلكات شريك الموارد المسلمة لك لإقران مهام العمل والتزاماتك التعاقدية.
          </p>
        </div>
        <div className="text-xs bg-slate-50 text-slate-600 border px-3 py-1.5 rounded-xl font-bold font-mono">
          إجمالي العهد النشطة: {activeAssetsCount}
        </div>
      </div>

      {myAssets.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Briefcase className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-slate-400">لا توجد أية عهد أو ممتلكات مسجلة بعهدتك حالياً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {myAssets.map((asset) => (
            <div
              key={asset.id}
              className="border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all space-y-4 bg-white flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                    {asset.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      asset.status === 'Assigned'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                        : asset.status === 'Returned'
                        ? 'text-slate-600 bg-slate-50 border-slate-100'
                        : asset.status === 'Lost'
                        ? 'text-rose-700 bg-rose-50 border-rose-100'
                        : asset.status === 'Damaged'
                        ? 'text-amber-700 bg-amber-50 border-amber-100'
                        : 'text-sky-700 bg-sky-50 border-sky-100'
                    }`}
                  >
                    {asset.status === 'Assigned'
                      ? '● قيد استخدامك'
                      : asset.status === 'Returned'
                      ? '✓ تم الاسترجاع والكلية'
                      : asset.status === 'Lost'
                      ? '⚠️ مفقود وضائع'
                      : asset.status === 'Damaged'
                      ? '⚠️ تالف وبحاجة لإصلاح'
                      : '⚙️ تحت الصيانة الفنية'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-[#00875A]">{asset.name}</h4>
                  <p className="text-xs text-slate-550 leading-relaxed font-semibold">{asset.description}</p>
                </div>

                {asset.imageData && (
                  <div className="rounded-xl overflow-hidden border border-slate-100 h-36 bg-slate-50 relative group">
                    <img
                      src={asset.imageData}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {asset.notes && (
                  <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                    📌 مبررات: {asset.notes}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 flex flex-wrap justify-between items-center gap-2 mt-2 text-[10px] text-slate-400">
                <div className="space-y-1 text-right">
                  <span className="block font-bold">
                    تاريخ الاستلام:{' '}
                    <span className="font-mono text-slate-600">{asset.assignDate || '-'}</span>
                  </span>
                  {asset.returnDate && (
                    <span className="block font-bold">
                      تاريخ التسليم والعودة:{' '}
                      <span className="font-mono text-slate-600">{asset.returnDate}</span>
                    </span>
                  )}
                  <span className="block text-slate-400">
                    صُرفت بواسطة:{' '}
                    <strong className="text-slate-600">{asset.assignedBy || 'المدير المالي'}</strong>
                  </span>
                </div>

                {asset.agreementData ? (
                  <button
                    onClick={() => {
                      const aEl = document.createElement('a');
                      aEl.href = asset.agreementData || '';
                      aEl.download = asset.agreementName || 'custody_agreement.pdf';
                      document.body.appendChild(aEl);
                      aEl.click();
                      document.body.removeChild(aEl);
                    }}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-none px-3 py-1.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    تحميل إقرار العهدة المالي
                  </button>
                ) : (
                  <span className="text-slate-400 font-semibold italic text-[10px]">
                    دون وثيقة إقرار مرفقة
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
