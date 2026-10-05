/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, AlertCircle, CheckCircle2, User } from 'lucide-react';

interface SecureLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  login: (u: string, p: string) => Promise<void>;
}

export const SecureLoginModal: React.FC<SecureLoginModalProps> = ({
  isOpen,
  onClose,
  login
}) => {
  const [secureUsername, setSecureUsername] = useState<string>('');
  const [securePassword, setSecurePassword] = useState<string>('');
  const [secureLoading, setSecureLoading] = useState<boolean>(false);
  const [secureError, setSecureError] = useState<string>('');
  const [secureSuccessMsg, setSecureSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSecureLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secureUsername || !securePassword) {
      setSecureError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setSecureLoading(true);
    setSecureError('');
    setSecureSuccessMsg('');

    try {
      await login(secureUsername, securePassword);
      setSecureSuccessMsg('تم التحقق وتسجيل الدخول للحساب بنجاح!');
      setTimeout(() => {
        onClose();
        setSecureUsername('');
        setSecurePassword('');
        setSecureSuccessMsg('');
      }, 1200);
    } catch (err: any) {
      setSecureError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من المدخلات.');
    } finally {
      setSecureLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadein" id="secure-login-modal-overlay">
      <div className="bg-white border border-slate-205 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scaleup text-right">
        
        {/* Header */}
        <div className="pb-3 border-b border-slate-150 mb-4 flex justify-between items-start">
          <div className="space-y-1 text-right">
            <span className="bg-[#00875A]/10 text-[#00875A] border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
              <Lock className="w-3 h-3" /> بوابة تسجيل الدخول الموثق
            </span>
            <h3 className="text-sm font-black text-slate-900">
              تسجيل الدخول والولوج الفعلي للحساب
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              أدخل بيانات اعتماد الموظف للتحقق الآمن والوصول المباشر إلى سجلاته وملفه.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              setSecureError('');
              setSecureSuccessMsg('');
            }}
            className="text-slate-400 hover:text-slate-700 bg-transparent border-none text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error & Success States */}
        {secureError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs mb-4 flex gap-2 items-start font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{secureError}</span>
          </div>
        )}

        {secureSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-[#00875A] p-3.5 rounded-xl text-xs mb-4 flex gap-2 items-start font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{secureSuccessMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSecureLoginSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">اسم المستخدم أو البريد الإلكتروني *</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-3.5 h-3.5" />
              </div>
              <input
                type="email"
                required
                value={secureUsername}
                onChange={(e) => setSecureUsername(e.target.value)}
                placeholder="example@sahaba.sa"
                className="w-full text-xs pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden font-mono text-left bg-slate-50"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">كلمة المرور الآمنة *</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type="password"
                required
                value={securePassword}
                onChange={(e) => setSecurePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pr-9 pl-4 py-2.5 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden font-mono text-left bg-slate-50"
                dir="ltr"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-150 flex gap-2 justify-end items-center bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <button
              type="button"
              onClick={() => {
                onClose();
                setSecureError('');
                setSecureSuccessMsg('');
              }}
              className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2.5 rounded-xl text-xs font-black border-none cursor-pointer transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={secureLoading}
              className="bg-[#00875A] hover:bg-[#006e49] text-white px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-md transition disabled:opacity-45 flex items-center gap-1.5 border-none"
            >
              {secureLoading ? 'جاري التحقق...' : 'تسجيل دخول آمن'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
