/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Send, Clock, XCircle } from 'lucide-react';
import { Employee, Leave } from '../../../types';

interface LeaveTabProps {
  activeEmployee: Employee;
  myLeaves: Leave[];
  addLeave: (leave: {
    empId: string;
    type: 'سنوية' | 'مرضية' | 'اضطرارية' | 'بدون راتب';
    from: string;
    to: string;
    days: number;
    status: 'بانتظار الموافقة' | 'موافق عليها' | 'مرفوضة';
  }) => Promise<void>;
}

export const LeaveTab: React.FC<LeaveTabProps> = ({
  activeEmployee,
  myLeaves,
  addLeave
}) => {
  // Local Form States
  const [leaveType, setLeaveType] = useState<'سنوية' | 'مرضية' | 'اضطرارية' | 'بدون راتب'>('سنوية');
  const [leaveFrom, setLeaveFrom] = useState<string>('');
  const [leaveTo, setLeaveTo] = useState<string>('');
  const [leaveNotes, setLeaveNotes] = useState<string>('');
  const [leaveError, setLeaveError] = useState<string>('');
  const [leaveSuccess, setLeaveSuccess] = useState<boolean>(false);

  // Reset form when employee switches
  useEffect(() => {
    setLeaveFrom('');
    setLeaveTo('');
    setLeaveNotes('');
    setLeaveSuccess(false);
    setLeaveError('');
  }, [activeEmployee.id]);

  // Calculate workdays count between two date inputs
  const leaveDays = useMemo(() => {
    if (!leaveFrom || !leaveTo) return 0;
    const fromDate = new Date(leaveFrom);
    const toDate = new Date(leaveTo);
    if (toDate < fromDate) return 0;
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [leaveFrom, leaveTo]);

  // Submit Leave Request
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveSuccess(false);

    if (!leaveFrom || !leaveTo) {
      setLeaveError('فضلاً اختر تاريخ بدء وانتهاء الإجازة المطلوبة.');
      return;
    }
    if (new Date(leaveTo) < new Date(leaveFrom)) {
      setLeaveError('تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البدء.');
      return;
    }
    if (leaveType === 'سنوية' && leaveDays > (activeEmployee.leaveBalance ?? 21)) {
      setLeaveError(`عذراً، رصيد إجازاتك السنوية المتبقي (${activeEmployee.leaveBalance ?? 21} أيام) غير كافٍ لطلب إجازة مدتها ${leaveDays} أيام.`);
      return;
    }

    try {
      await addLeave({
        empId: activeEmployee.id,
        type: leaveType,
        from: leaveFrom,
        to: leaveTo,
        days: leaveDays,
        status: 'بانتظار الموافقة'
      });
      setLeaveSuccess(true);
      setLeaveNotes('');
      setLeaveFrom('');
      setLeaveTo('');
    } catch (err: any) {
      setLeaveError(err.message || 'فشل إرسال طلب الإجازة. يرجى المحاولة لاحقاً.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-black text-sm text-slate-800">
          <Calendar className="w-4 h-4 text-[#00875A]" />
          <h3>تقديم طلب إجازة جديدة</h3>
        </div>
        <p className="text-[11px] text-slate-400">
          سيتم ترحيل الطلب مباشرة إلى مدير القسم المعني لمراجعته والبت فيه.
        </p>
        <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-2">
          {leaveError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-[11px] flex gap-2 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{leaveError}</span>
            </div>
          )}
          {leaveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-[11px] flex gap-2 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>✓ تم إرسال طلب إجازتك بنجاح وبانتظار الموافقة الرسمية!</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">نوع الإجازة *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-2xl text-slate-750 focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden"
            >
              <option value="سنوية">إجازة سنوية اعتيادية (Annual Leave)</option>
              <option value="مرضية">إجازة مرضية بعذر طبي (Sick Leave)</option>
              <option value="اضطرارية">إجازة اضطرارية طارئة (Emergency Leave)</option>
              <option value="بدون راتب">إجازة مرافقة بدون راتب (Unpaid Leave)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">تاريخ البدء *</label>
              <input
                type="date"
                required
                value={leaveFrom}
                onChange={(e) => setLeaveFrom(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-2xl text-slate-750 font-mono text-right"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">تاريخ الانتهاء *</label>
              <input
                type="date"
                required
                value={leaveTo}
                onChange={(e) => setLeaveTo(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-2xl text-slate-750 font-mono text-right"
              />
            </div>
          </div>

          {leaveDays > 0 && (
            <div className="bg-slate-50 border p-3 rounded-2xl text-xs flex justify-between items-center font-bold">
              <span className="text-slate-500">المدة المحسوبة للإجازة:</span>
              <span
                className={`${
                  leaveType === 'سنوية' && leaveDays > (activeEmployee.leaveBalance ?? 21)
                    ? 'text-rose-600'
                    : 'text-[#00875A]'
                } font-bold font-mono`}
              >
                {leaveDays} أيام عمل
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">ملاحظات أو مبررات الغياب</label>
            <textarea
              value={leaveNotes}
              onChange={(e) => setLeaveNotes(e.target.value)}
              placeholder="اكتب هنا المبررات أو ظروف طلب الإجازة..."
              rows={2}
              className="w-full text-xs p-3 border border-slate-200 rounded-2xl text-slate-750 focus:border-[#00875A] focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#00875A] hover:bg-[#006e49] text-white font-bold py-3 text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>رفع وإرسال طلب الإجازة</span>
          </button>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">سجل طلبات الإجازات المرفوعة</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              عرض كافة طلبات الإجازة المرفوعة بجميع حالاتها (موافق عليها، مرفوضة، أو معلقة بانتظار الموافقة).
            </p>
          </div>
        </div>

        {myLeaves.length === 0 ? (
          <div className="border border-dashed border-slate-200 p-12 text-center rounded-2xl text-slate-450 text-xs font-bold">
            لا توجد طلبات إجازة سابقة مسجلة لملفك الوظيفي حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50">
                  <th className="p-3">نوع الإجازة</th>
                  <th className="p-3">الفترة والتواريخ</th>
                  <th className="p-3">أيام الإجازة</th>
                  <th className="p-3">الحالة والقرار الإداري</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition">
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          leave.type === 'سنوية'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            : leave.type === 'مرضية'
                            ? 'bg-amber-50 text-amber-800 border border-amber-100'
                            : leave.type === 'اضطرارية'
                            ? 'bg-blue-50 text-blue-800 border border-blue-100'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {leave.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-550">
                      من {leave.from} إلى {leave.to}
                    </td>
                    <td className="p-3 font-bold font-mono text-slate-700">{leave.days} أيام</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                          leave.status === 'بانتظار الموافقة'
                            ? 'bg-amber-50 text-amber-700'
                            : leave.status === 'موافق عليها'
                            ? 'bg-emerald-50 text-emerald-700 font-bold'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {leave.status === 'بانتظار الموافقة' && <Clock className="w-3 h-3" />}
                        {leave.status === 'موافق عليها' && <CheckCircle2 className="w-3 h-3" />}
                        {leave.status === 'مرفوضة' && <XCircle className="w-3 h-3" />}
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
