import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { Lock, User, AlertCircle, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loadError } = useHR();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('فضلاً أدخل اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول. يرجى التحقق من المدخلات.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_screen_container" className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Decorative Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100 rounded-full blur-[130px] opacity-40 pointer-events-none z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-slate-100 rounded-full blur-[140px] opacity-45 pointer-events-none z-0"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-[#00875A] mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">سحابة الأعمال لشؤون الموظفين</h2>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            النظام السعودي الموحد لإدارة الموارد البشرية، الرواتب والامتثال
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs flex gap-2.5 items-start font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loadError && (
            <div className="bg-[#FFF9E6] border border-[#FFE599] text-[#7F6000] p-4 rounded-2xl text-xs flex gap-2.5 items-start font-semibold leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[12px]">ملاحظة اتصال بقاعدة البيانات:</p>
                <p className="mt-1 font-normal text-[11px] opacity-90">{loadError}</p>
                <p className="mt-1.5 font-normal text-[11px] opacity-90">تم تفعيل وضع العمل السحابي/المحلي المشترك بأمان لتوفير تجربة مستقرة متصلة.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">اسم المستخدم أو البريد الإلكتروني *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@sahaba.sa"
                  className="w-full text-xs pr-10 pl-4 py-3 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">كلمة المرور *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pr-10 pl-4 py-3 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00875A] hover:bg-[#006e49] focus:outline-hidden text-white font-bold text-sm py-3 px-4 rounded-2xl transition duration-150 ease-in-out shadow-md disabled:opacity-50"
            >
              {loading ? 'جاري التحقق من الهوية والأدلة...' : 'تسجيل الدخول الآمن'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
