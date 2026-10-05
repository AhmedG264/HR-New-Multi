/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Receipt, AlertCircle, CheckCircle2, Upload, Plane, Send } from 'lucide-react';
import { Employee, Expense, Trip } from '../../../types';

interface ExpensesTripsTabProps {
  activeEmployee: Employee;
  myExpenses: Expense[];
  myTrips: Trip[];
  addExpense: (expense: {
    empId: string;
    item: string;
    amount: number;
    date: string;
    status: 'بانتظار الموافقة' | 'موافق عليها' | 'مرفوضة';
    category?: string;
    desc?: string;
  }) => Promise<void>;
  addTrip: (trip: {
    empId: string;
    dest: string;
    purpose: string;
    from: string;
    to: string;
    cost: number;
    type: 'داخلي' | 'خارجي';
    allowance?: number;
    status: 'بانتظار الموافقة' | 'موافق عليها' | 'مرفوضة';
  }) => Promise<void>;
}

export const ExpensesTripsTab: React.FC<ExpensesTripsTabProps> = ({
  activeEmployee,
  myExpenses,
  myTrips,
  addExpense,
  addTrip
}) => {
  // Expense Form State
  const [expItem, setExpItem] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('وقود وتنقلات');
  const [expDesc, setExpDesc] = useState<string>('');
  const [expError, setExpError] = useState<string>('');
  const [expSuccess, setExpSuccess] = useState<boolean>(false);

  // Trip Form State
  const [tripDest, setTripDest] = useState<string>('');
  const [tripPurpose, setTripPurpose] = useState<string>('');
  const [tripFrom, setTripFrom] = useState<string>('');
  const [tripTo, setTripTo] = useState<string>('');
  const [tripCost, setTripCost] = useState<string>('');
  const [tripType, setTripType] = useState<'داخلي' | 'خارجي'>('داخلي');
  const [tripAllowance, setTripAllowance] = useState<string>('');
  const [tripError, setTripError] = useState<string>('');
  const [tripSuccess, setTripSuccess] = useState<boolean>(false);

  // Clear states when employee switches
  useEffect(() => {
    setExpItem('');
    setExpAmount('');
    setExpDate('');
    setExpDesc('');
    setExpSuccess(false);
    setExpError('');

    setTripDest('');
    setTripPurpose('');
    setTripFrom('');
    setTripTo('');
    setTripCost('');
    setTripAllowance('');
    setTripSuccess(false);
    setTripError('');
  }, [activeEmployee.id]);

  // Submit Expense Request
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError('');
    setExpSuccess(false);

    if (!expItem.trim() || !expAmount || !expDate) {
      setExpError('يرجى تعبئة كافة الحقول الإلزامية لطلب التعويض المالي.');
      return;
    }
    const parsedAmount = Number(expAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setExpError('الرجاء إدخال قيمة مالية صحيحة أكبر من الصفر.');
      return;
    }

    try {
      await addExpense({
        empId: activeEmployee.id,
        item: `${expCategory} - ${expItem.trim()}`,
        amount: parsedAmount,
        date: expDate,
        status: 'بانتظار الموافقة',
        category: expCategory,
        desc: expDesc.trim() || undefined
      });
      setExpSuccess(true);
      setExpItem('');
      setExpAmount('');
      setExpDate('');
      setExpDesc('');
    } catch (err: any) {
      setExpError(err.message || 'فشل إرسال الفاتورة والمصروف التابع لك. حاول مرة أخرى.');
    }
  };

  // Submit Business Trip Request
  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTripError('');
    setTripSuccess(false);

    if (!tripDest.trim() || !tripPurpose.trim() || !tripFrom || !tripTo || !tripCost) {
      setTripError('يرجى ملء جميع الحقول الضرورية لرحلة الانتداب للموظف.');
      return;
    }
    if (new Date(tripTo) < new Date(tripFrom)) {
      setTripError('تاريخ نهاية رحلة الانتداب لا يمكن أن يسبق تاريخ البدء.');
      return;
    }
    const parsedCost = Number(tripCost);
    if (isNaN(parsedCost) || parsedCost <= 0) {
      setTripError('يرجى تحديد تكلفة إجمالية صحيحة للانتداب ومأمورية السفر.');
      return;
    }

    try {
      await addTrip({
        empId: activeEmployee.id,
        dest: tripDest.trim(),
        purpose: tripPurpose.trim(),
        from: tripFrom,
        to: tripTo,
        cost: parsedCost,
        type: tripType,
        allowance: tripAllowance ? Number(tripAllowance) : undefined,
        status: 'بانتظار الموافقة'
      });
      setTripSuccess(true);
      setTripDest('');
      setTripPurpose('');
      setTripFrom('');
      setTripTo('');
      setTripCost('');
      setTripAllowance('');
    } catch (err: any) {
      setTripError(err.message || 'فشل إرسال طلب مأمورية السفر والانتداب.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Claim Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <Receipt className="w-4 h-4 text-[#00875A]" />
            <h3>رفع فاتورة مصروفات وعهدة إدارية</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            لطلب تعويض مالي للبنزين، المشتريات، الضيافة والأدوات التي قمت بالدفع لها لمصلحة العمل.
          </p>
          <form onSubmit={handleExpenseSubmit} className="space-y-4 pt-2">
            {expError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-[11px] flex gap-2 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{expError}</span>
              </div>
            )}
            {expSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3 rounded-2xl text-[11px] flex gap-2 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>✓ تم رفع وإرسال فاتورة المصروفات لمديرك لاعتمادها المالي الحركي.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">فئة المصروف *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-2xl text-slate-750 focus:border-[#00875A]"
                >
                  <option value="وقود وتنقلات">بترول وتأمين تنقلات</option>
                  <option value="ضيافة وعملاء">ضيافة عمل واجتماعات</option>
                  <option value="أدوات ومشتريات">أجهزة وأدوات مكتبية</option>
                  <option value="اتصالات وإنترنت">اتصالات واشتراكات برمجية</option>
                  <option value="أخرى">أخرى / مصروفات متنوعة</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">تاريخ الفاتورة *</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl font-mono text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-slate-700 block">القيمة شاملة الضريبة (ر.س) *</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-slate-700 block">اسم البند / الفاتورة الملخص *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة بنزين أو حبار طباعة"
                  value={expItem}
                  onChange={(e) => setExpItem(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">تفاصيل أو ملاحظات دقيقة للمصروف</label>
              <textarea
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="اكتب الغرض الإداري من الصرف لتسهيل تدقيقها..."
                rows={2}
                className="w-full text-xs p-3 border border-slate-200 rounded-2xl"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00875A] hover:bg-[#006e49] text-white font-bold py-3 text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع الفاتورة وتسجيل المصروف</span>
            </button>
          </form>
        </div>

        {/* Trip Request Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-black text-sm text-slate-800">
            <Plane className="w-4 h-4 text-[#00875A]" />
            <h3>تقديم طلب انتداب ومأمورية عمل خارجية</h3>
          </div>
          <p className="text-[11px] text-slate-400">
            لتقديم انتدابات السفر الرسمية لتأدية مهام خارج المقر المعتمد واستحقاق بدل اليوم المالي.
          </p>
          <form onSubmit={handleTripSubmit} className="space-y-4 pt-2">
            {tripError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-[11px] flex gap-2 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{tripError}</span>
              </div>
            )}
            {tripSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-3 rounded-2xl text-[11px] flex gap-2 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>✓ تم تقديم طلب الانتداب ومأمورية السفر لمديرك لاعتماد ميزانيتها.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">نوع ومحيط الانتداب *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTripType('داخلي')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      tripType === 'داخلي'
                        ? 'bg-emerald-50 border-[#00875A] text-[#00875A]'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    داخلي (بالمملكة)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTripType('خارجي')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      tripType === 'خارجي'
                        ? 'bg-emerald-50 border-[#00875A] text-[#00875A]'
                        : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    خارجي (دولي)
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">الوجهة المستهدفة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: جيبوتي، دبي، أو جدة"
                  value={tripDest}
                  onChange={(e) => setTripDest(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">تاريخ البدء *</label>
                <input
                  type="date"
                  required
                  value={tripFrom}
                  onChange={(e) => setTripFrom(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl font-mono text-right"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">تاريخ العودة والانتهاء *</label>
                <input
                  type="date"
                  required
                  value={tripTo}
                  onChange={(e) => setTripTo(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl font-mono text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">التكلفة المتوقعة الإجمالية (ر.س) *</label>
                <input
                  type="number"
                  required
                  placeholder="تكلفة حجز السكن والطيران..."
                  value={tripCost}
                  onChange={(e) => setTripCost(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">بدل يومي إضافي (اختياري ر.س)</label>
                <input
                  type="number"
                  placeholder="بدل الجيب والمصروف اليومي..."
                  value={tripAllowance}
                  onChange={(e) => setTripAllowance(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-2xl font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">الغرض من الانتداب والبعثة *</label>
              <input
                type="text"
                required
                placeholder="مثال: توثيق تعاقد شركة كبرى، تدريب فني وإداري..."
                value={tripPurpose}
                onChange={(e) => setTripPurpose(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-2xl"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#00875A] hover:bg-[#006e49] text-white font-bold py-3 text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>تقديم طلب الانتداب والمأمورية</span>
            </button>
          </form>
        </div>
      </div>

      {/* History Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Expense History */}
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-xs font-black text-slate-800">تتبع طلبات تسوية المصروفات والعهدة</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                عرض جميع الفواتير والتعويضات المرفوعة بكافة حالاتها الإدارية.
              </p>
            </div>
          </div>

          {myExpenses.length === 0 ? (
            <div className="border border-dashed p-10 text-center rounded-2xl text-slate-450 text-xs font-bold">
              لا توجد مصروفات إدارية أو فواتير تعويضات سابقة مسجلة.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-400 font-bold">
                    <th className="p-3">المصروف / البند</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">المبلغ شامل الضريبة</th>
                    <th className="p-3">الحالة والمراجعة</th>
                  </tr>
                </thead>
                <tbody>
                  {myExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-750">{exp.item}</td>
                      <td className="p-3 font-mono text-slate-500">{exp.date}</td>
                      <td className="p-3 font-black font-mono text-emerald-800">{exp.amount.toLocaleString()} ر.س</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            exp.status === 'بانتظار الموافقة'
                              ? 'bg-amber-50 text-amber-700'
                              : exp.status === 'موافق عليها'
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Trip History */}
        <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-xs font-black text-slate-800">تتبع طلبات انتدابات رحلات العمل</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                عرض جميع طلبات مأموريات الانتداب والبعثات بكافة حالاتها.
              </p>
            </div>
          </div>

          {myTrips.length === 0 ? (
            <div className="border border-dashed p-10 text-center rounded-2xl text-slate-450 text-xs font-bold">
              لا توجد طلبات لمأموريات ورحلات عمل مسجلة سلفاً.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-400 font-bold">
                    <th className="p-3">الوجهة المستهدفة</th>
                    <th className="p-3">الغرض والبعثة</th>
                    <th className="p-3">الفترة والموعد</th>
                    <th className="p-3">الميزانية المقررة</th>
                    <th className="p-3">الحالة والقرار</th>
                  </tr>
                </thead>
                <tbody>
                  {myTrips.map((trip) => (
                    <tr key={trip.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-750">✈️ {trip.dest}</td>
                      <td className="p-3 text-slate-550 font-medium">{trip.purpose}</td>
                      <td className="p-3 font-mono text-slate-450 text-[11px]">
                        من {trip.from} إلى {trip.to}
                      </td>
                      <td className="p-3 font-black font-mono text-[#00875A]">{trip.cost.toLocaleString()} ر.س</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trip.status === 'بانتظار الموافقة'
                              ? 'bg-amber-50 text-amber-700'
                              : trip.status === 'موافق عليها'
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {trip.status}
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
    </div>
  );
};
