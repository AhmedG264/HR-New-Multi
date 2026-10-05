import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { Lock, User, AlertCircle, Building2, Phone, Briefcase, Mail, CheckCircle2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, registerCompany, resetPassword, loadError } = useHR();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [companyName, setCompanyName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToReset = resetEmail.trim();
    if (!emailToReset) {
      setResetErrorMsg('فضلاً أدخل البريد الإلكتروني');
      return;
    }
    if (!emailToReset.includes('@') || !emailToReset.includes('.')) {
      setResetErrorMsg('فضلاً أدخل بريد إلكتروني صحيح ومعتمد');
      return;
    }

    setResetLoading(true);
    setResetErrorMsg('');
    setResetSuccessMsg('');

    try {
      await resetPassword(emailToReset);
      setResetSuccessMsg(
        'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى مراجعة البريد الوارد أو مجلد الرسائل غير المرغوب فيها (Spam).'
      );
    } catch (err: any) {
      setResetErrorMsg(err.message || 'تعذر إرسال رابط إعادة التعيين. يرجى المحاولة لاحقاً.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !adminName.trim() || !adminEmail.trim() || !registerPassword) {
      setErrorMsg('فضلاً املأ جميع الحقول الإلزامية المطلوبة');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await registerCompany({
        companyName,
        crNumber,
        adminName,
        email: adminEmail,
        password: registerPassword,
        phone
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل المنشأة. يرجى المحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_screen_container" className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Decorative Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-100 rounded-full blur-[130px] opacity-40 pointer-events-none z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-slate-100 rounded-full blur-[140px] opacity-45 pointer-events-none z-0"></div>

      <div className="max-w-md w-full space-y-6 bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-[#00875A] mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">سحابة الأعمال لشؤون الموظفين</h2>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            النظام السعودي الموحد لإدارة الموارد البشرية، الرواتب والامتثال
          </p>
        </div>

        {showForgotPassword ? (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center pb-1">
              <h3 className="text-lg font-black text-slate-800">استعادة كلمة المرور</h3>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                أدخل بريدك الإلكتروني المسجل في المنظومة وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور.
              </p>
            </div>

            {resetSuccessMsg ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs flex gap-2.5 items-start font-semibold leading-relaxed">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{resetSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccessMsg('');
                    setResetErrorMsg('');
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 px-4 rounded-2xl transition duration-150 cursor-pointer border border-slate-200 flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>العودة لشاشة تسجيل الدخول</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                {resetErrorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{resetErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">البريد الإلكتروني المسجل *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full text-xs pr-10 pl-4 py-3 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-[#00875A] hover:bg-[#006e49] focus:outline-hidden text-white font-bold text-xs py-3 px-4 rounded-2xl transition duration-150 ease-in-out shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {resetLoading ? 'جاري إرسال رابط الاستعادة...' : 'إرسال رابط إعادة تعيين كلمة المرور'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetErrorMsg('');
                      setResetSuccessMsg('');
                    }}
                    disabled={resetLoading}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2.5 px-4 rounded-2xl transition duration-150 cursor-pointer border border-slate-200"
                  >
                    إلغاء والعودة لتسجيل الدخول
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl transition duration-150 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl transition duration-150 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-[#00875A] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                تسجيل شركة جديدة
              </button>
            </div>

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
                </div>
              </div>
            )}

            {activeTab === 'login' ? (
              <form className="mt-6 space-y-5" onSubmit={handleLoginSubmit}>
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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">كلمة المرور *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setResetEmail(username.includes('@') ? username : '');
                          setErrorMsg('');
                          setResetErrorMsg('');
                          setResetSuccessMsg('');
                        }}
                        className="text-[11px] font-bold text-[#00875A] hover:text-[#006e49] hover:underline transition-colors cursor-pointer"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
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
                    className="w-full bg-[#00875A] hover:bg-[#006e49] focus:outline-hidden text-white font-bold text-sm py-3 px-4 rounded-2xl transition duration-150 ease-in-out shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'جاري التحقق من الهوية والأدلة...' : 'تسجيل الدخول الآمن'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleRegisterSubmit}>
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">اسم الشركة / المؤسسة *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: شركة الرواد للتقنية"
                    className="w-full text-xs pr-10 pl-4 py-2.5 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم السجل التجاري</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={crNumber}
                      onChange={(e) => setCrNumber(e.target.value)}
                      placeholder="1010xxxxxx"
                      className="w-full text-xs pr-10 pl-4 py-2.5 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">رقم الهاتف</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full text-xs pr-10 pl-4 py-2.5 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">اسم مدير النظام / المسؤول *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="الاسم الثلاثي للمسؤول"
                    className="w-full text-xs pr-10 pl-4 py-2.5 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">البريد الإلكتروني للمدير *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@company.sa"
                    className="w-full text-xs pr-10 pl-4 py-2.5 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden font-mono text-left"
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
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs pr-10 pl-4 py-2.5 border border-slate-200 rounded-2xl focus:border-[#00875A] focus:ring-1 focus:ring-[#00875A] focus:outline-hidden font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00875A] hover:bg-[#006e49] focus:outline-hidden text-white font-bold text-sm py-3 px-4 rounded-2xl transition duration-150 ease-in-out shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'جاري تأسيس مساحة الشركة السحابية...' : 'تأسيس المنشأة وبدء العمل'}
              </button>
            </div>
          </form>
        )}
        </>
      )}
      </div>
    </div>
  );
};
