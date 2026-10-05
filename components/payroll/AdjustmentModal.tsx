/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useHR } from '../../context/HRContext';
import { Settings, X, Save } from 'lucide-react';

// Modular subcomponents
import { PresetButtons } from './adjustment-modal/PresetButtons';
import { EarningFields } from './adjustment-modal/EarningFields';
import { DeductionPctFields } from './adjustment-modal/DeductionPctFields';
import { LiveStubPreview } from './adjustment-modal/LiveStubPreview';

interface AdjustmentModalProps {
  employeeId: string | null;
  onClose: () => void;
  getEmployeeUnpaidLeaveDays: (empId: string) => number;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({
  employeeId,
  onClose,
  getEmployeeUnpaidLeaveDays,
}) => {
  const { employees, deductions, updateEmployee, updateEmployeeDeductions } = useHR();

  // Selected Target Employee
  const targetEmployee = employees.find((e) => e.id === employeeId);

  // Local form states
  const [formSalary, setFormSalary] = useState<number>(0);
  const [formAllow, setFormAllow] = useState<number>(0);
  const [formDeduct, setFormDeduct] = useState<number>(0);
  const [formGosiPct, setFormGosiPct] = useState<number>(9.75);
  const [formMedPct, setFormMedPct] = useState<number>(1.5);
  const [formTaxPct, setFormTaxPct] = useState<number>(0);
  const [formOtherPct, setFormOtherPct] = useState<number>(0);
  const [formOtherNote, setFormOtherNote] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize form when employee selection changes or list upgrades
  useEffect(() => {
    if (!employeeId || !targetEmployee) return;

    setFormSalary(targetEmployee.salary || 0);
    setFormAllow(targetEmployee.allow || 0);
    setFormDeduct(targetEmployee.deduct || 0);

    // Look up the deduction mapping
    const matchedDed = deductions.find((d) => d.empId === employeeId) || {
      gosiPct: targetEmployee.isSaudi !== false ? 9.75 : 0,
      medPct: 1.5,
      taxPct: 0,
      otherPct: 0,
      otherNote: '',
    };

    setFormGosiPct(matchedDed.gosiPct ?? (targetEmployee.isSaudi !== false ? 9.75 : 0));
    setFormMedPct(matchedDed.medPct ?? 1.5);
    setFormTaxPct(matchedDed.taxPct ?? 0);
    setFormOtherPct(matchedDed.otherPct ?? 0);
    setFormOtherNote(matchedDed.otherNote ?? '');
    setSaveSuccess(false);
  }, [employeeId, targetEmployee, deductions]);

  if (!employeeId || !targetEmployee) return null;

  // Quick preset helper
  const applyPreset = (type: 'saudi' | 'expat') => {
    if (type === 'saudi') {
      setFormGosiPct(9.75); // Saudi Citizens standard pension
      setFormMedPct(1.5);
      setFormTaxPct(0);
      setFormOtherNote('تسجيل مواطن سعودي كامل التأمينات والاشتراكات');
    } else if (type === 'expat') {
      setFormGosiPct(0); // Expats do not pay standard pension GOSI
      setFormMedPct(1.5);
      setFormTaxPct(0);
      setFormOtherNote('تسجيل مقيم غير خاضع لاشتراك التأمينات الاجتماعي');
    }
  };

  // Perform calculations for reactive paystub preview
  const unpaidDays = getEmployeeUnpaidLeaveDays(targetEmployee.id);
  const unpaidDeduct = Math.round((formSalary / 30) * unpaidDays);

  const gosiAmount = Math.round(formSalary * (formGosiPct / 100));
  const medAmount = Math.round(formSalary * (formMedPct / 100));
  const taxAmount = Math.round(formSalary * (formTaxPct / 100));
  const otherAmount = Math.round(formSalary * (formOtherPct / 100));

  const totalCalculatedDeductions = gosiAmount + medAmount + taxAmount + otherAmount + formDeduct + unpaidDeduct;
  const netSuggestedPayout = formSalary + formAllow - totalCalculatedDeductions;

  // Handle Save Submission
  const handleSaveAdjustments = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Update basic employee metrics in HR Database (salary, allowance, custom deduct)
      await updateEmployee(targetEmployee.id, {
        salary: formSalary,
        allow: formAllow,
        deduct: formDeduct,
      });

      // 2. Update specific GOSI/Medical and custom percentages
      await updateEmployeeDeductions(
        targetEmployee.id,
        {
          id: 'ded_' + targetEmployee.id,
          empId: targetEmployee.id,
          gosiPct: formGosiPct,
          medPct: formMedPct,
          taxPct: formTaxPct,
          otherPct: formOtherPct,
          otherNote: formOtherNote,
        },
        formDeduct
      );

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('فشل حفظ التعديلات وحوسبة الاستقطاعات من خادم الكلاود. يرجى التحقق من الشبكة.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden animate-fadeIn" 
      id="adjustment_modal_overlay"
      dir="rtl"
    >
      {/* Backdrop overlay click out */}
      <div 
        className="absolute inset-0 cursor-default" 
        onClick={onClose}
      />

      {/* Modal Dialog Container Body */}
      <div className="relative w-full max-w-5xl bg-white shadow-2xl rounded-3xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden transition-all transform z-10 text-right animate-slideup">
        
        {/* Modal Top Header Row */}
        <div className="flex justify-between items-center border-b border-slate-100 px-6 py-5 shrink-0 bg-slate-50/50">
          <div className="space-y-1 text-right">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 justify-start">
              <Settings className="w-5 h-5 text-gold" />
              <span>ضبط وتعديل قسيمة الراتب والتأمينات للموظف</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">
              تعديل تفاصيل الراتب والخصومات والافتراضات التأمينية GOSI لخدمة الامتثال ونظام حماية الأجور (WPS)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/55 rounded-full transition cursor-pointer border-none bg-transparent"
            title="إغلاق وتراجع"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Form Section (3/5 columns in big views) */}
            <div className="lg:col-span-3 space-y-5">
              
              {/* Target Employee Context Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">الموظف الجاري ضبطه:</span>
                  <strong className="text-slate-800 text-xs block">{targetEmployee.name}</strong>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold inline-block">
                    {targetEmployee.job} — {targetEmployee.dept}
                  </span>
                </div>

                {/* Preset selectors */}
                <PresetButtons onApplyPreset={applyPreset} />
              </div>

              {/* Master Form Fields */}
              <form onSubmit={handleSaveAdjustments} id="adjustment_modal_form" className="space-y-5">
                {/* Earnings */}
                <EarningFields 
                  salary={formSalary}
                  allow={formAllow}
                  deduct={formDeduct}
                  onSalaryChange={setFormSalary}
                  onAllowChange={setFormAllow}
                  onDeductChange={setFormDeduct}
                />

                {/* Specific Deductions Pct & Reasons */}
                <DeductionPctFields 
                  gosiPct={formGosiPct}
                  medPct={formMedPct}
                  taxPct={formTaxPct}
                  otherPct={formOtherPct}
                  otherNote={formOtherNote}
                  onGosiPctChange={setFormGosiPct}
                  onMedPctChange={setFormMedPct}
                  onTaxPctChange={setFormTaxPct}
                  onOtherPctChange={setFormOtherPct}
                  onOtherNoteChange={setFormOtherNote}
                />
              </form>

              {/* Success Notification Alert */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-850 font-bold border border-emerald-200 rounded-xl text-center text-xs animate-slideup leading-relaxed">
                  ✓ تم تعديل ومزامنة توازنات الراتب والنسب بنجاح في قاعدة بيانات الكلاود السحابية!
                </div>
              )}
            </div>

            {/* Live Paystub Preview Side (2/5 columns) */}
            <div className="lg:col-span-2">
              <LiveStubPreview 
                salary={formSalary}
                allow={formAllow}
                unpaidDays={unpaidDays}
                unpaidDeduct={unpaidDeduct}
                gosiPct={formGosiPct}
                gosiAmount={gosiAmount}
                medPct={formMedPct}
                medAmount={medAmount}
                taxPct={formTaxPct}
                taxAmount={taxAmount}
                otherPct={formOtherPct}
                otherAmount={otherAmount}
                directDeduct={formDeduct}
                totalCalculatedDeductions={totalCalculatedDeductions}
                netSuggestedPayout={netSuggestedPayout}
              />
            </div>

          </div>
        </div>

        {/* Modal Bottom Fixed Action Footer Row */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إلغاء التعديل
          </button>
          
          <button
            type="submit"
            form="adjustment_modal_form"
            disabled={isSaving}
            className="px-6 py-2.5 bg-gold text-slate-900 border-none rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-gold-light transition shadow-xs cursor-pointer min-w-[200px]"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                <span>جاري حفظ التغييرات...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق ومزامنة السحابة</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
