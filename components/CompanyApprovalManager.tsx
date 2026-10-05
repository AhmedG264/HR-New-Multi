import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { Company } from '../types';
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
  Hash,
  ShieldCheck,
  ChevronRight,
  ArrowRightLeft
} from 'lucide-react';

export const CompanyApprovalManager: React.FC = () => {
  const {
    currentUser,
    allCompanies,
    currentCompanyId,
    switchCompany,
    approveCompany,
    rejectCompany,
    suspendCompany,
    reactivateCompany,
    refreshCompanies
  } = useHR();

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'active' | 'suspended' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Rejection modal state
  const [rejectingCompanyId, setRejectingCompanyId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Suspension modal state
  const [suspendingCompany, setSuspendingCompany] = useState<Company | null>(null);

  if (!currentUser?.isSuperAdmin) {
    return (
      <div className="p-8 text-center text-slate-600 bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">صلاحية غير مصرح بها</h3>
        <p className="text-sm text-slate-500">هذه الشاشة متاحة حصرياً للمشرف العام على المنظومة.</p>
      </div>
    );
  }

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleApprove = async (company: Company) => {
    setActionLoading(company.id);
    try {
      await approveCompany(company.id);
      showFeedback(`تم اعتماد وتفعيل منشأة "${company.name}" بنجاح ✅`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'حدث خطأ أثناء الاعتماد', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectModal = (company: Company) => {
    setRejectingCompanyId(company.id);
    setRejectionReason('عدم اكتمال بيانات السجل التجاري أو متطلبات الاشتراك');
  };

  const handleConfirmReject = async () => {
    if (!rejectingCompanyId) return;
    setActionLoading(rejectingCompanyId);
    try {
      await rejectCompany(rejectingCompanyId, rejectionReason);
      showFeedback('تم تسجيل قرار رفض طلب المنشأة بنجاح 🚫', 'success');
      setRejectingCompanyId(null);
      setRejectionReason('');
    } catch (err: any) {
      showFeedback(err.message || 'حدث خطأ أثناء رفض الطلب', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenSuspendModal = (company: Company) => {
    setSuspendingCompany(company);
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingCompany) return;
    const targetComp = suspendingCompany;
    setActionLoading(targetComp.id);
    try {
      await suspendCompany(targetComp.id);
      showFeedback(`تم تعليق منشأة "${targetComp.name}" مؤقتاً ⚠️`, 'success');
      setSuspendingCompany(null);
    } catch (err: any) {
      showFeedback(err.message || 'حدث خطأ أثناء التعليق', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (company: Company) => {
    setActionLoading(company.id);
    try {
      await reactivateCompany(company.id);
      showFeedback(`تم إعادة تفعيل منشأة "${company.name}" بنجاح 🟢`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'حدث خطأ أثناء إعادة التفعيل', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSwitchContext = async (company: Company) => {
    setActionLoading(company.id);
    try {
      await switchCompany(company.id);
      showFeedback(`تم التبديل إلى نطاق منشأة "${company.name}" بنجاح 🏢`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'فشل التبديل إلى المنشأة', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter and search
  const filteredCompanies = allCompanies.filter((comp) => {
    const statusMatch = activeFilter === 'all' || comp.status === activeFilter;
    const term = searchTerm.trim().toLowerCase();
    const searchMatch =
      !term ||
      comp.name.toLowerCase().includes(term) ||
      comp.id.toLowerCase().includes(term) ||
      comp.adminEmail.toLowerCase().includes(term) ||
      (comp.crNumber && comp.crNumber.includes(term)) ||
      (comp.phone && comp.phone.includes(term));
    return statusMatch && searchMatch;
  });

  const counts = {
    all: allCompanies.length,
    pending: allCompanies.filter((c) => c.status === 'pending').length,
    active: allCompanies.filter((c) => c.status === 'active').length,
    suspended: allCompanies.filter((c) => c.status === 'suspended').length,
    rejected: allCompanies.filter((c) => c.status === 'rejected').length
  };

  const getStatusBadge = (status: Company['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600 animate-pulse" /> قيد المراجعة والاعتماد
          </span>
        );
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> نشطة ومعتمدة
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
            <AlertTriangle className="w-3 h-3 text-slate-600" /> معلقة إدارياً
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" /> مرفوضة
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-200" dir="rtl">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-emerald-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> لوحة المشرف العام (Super Admin)
            </span>
            {counts.pending > 0 && (
              <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-bounce">
                {counts.pending} طلب بانتظار الاعتماد
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">إدارة واعتماد المنشآت والاشتراكات</h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            مراجعة طلبات التسجيل الجديدة، اعتماد المنشآت، تعليق الحسابات، والتحكم بنطاقات الشركات.
          </p>
        </div>

        <button
          onClick={async () => {
            setActionLoading('refresh');
            await refreshCompanies();
            setActionLoading(null);
            showFeedback('تم تحديث قائمة المنشآت بنجاح 🔄', 'success');
          }}
          disabled={actionLoading === 'refresh'}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm border transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => setActiveFilter('pending')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeFilter === 'pending'
              ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-700">بانتظار الاعتماد</span>
            <span className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
              ⏳
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800">{counts.pending}</div>
          <span className="text-[10px] text-slate-400">تحتاج اتخاذ قرار تفعيل</span>
        </button>

        <button
          onClick={() => setActiveFilter('active')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeFilter === 'active'
              ? 'bg-emerald-500/10 border-emerald-400 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-700">المنشآت النشطة</span>
            <span className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
              ✓
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800">{counts.active}</div>
          <span className="text-[10px] text-slate-400">تعمل بالكامل حالياً</span>
        </button>

        <button
          onClick={() => setActiveFilter('suspended')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeFilter === 'suspended'
              ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">المعلقة إدارياً</span>
            <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
              ⏸
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800">{counts.suspended}</div>
          <span className="text-[10px] text-slate-400">إيقاف مؤقت للخدمة</span>
        </button>

        <button
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#00875A]/10 border-[#00875A] ring-2 ring-[#00875A]/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">إجمالي المنشآت</span>
            <span className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
              🏢
            </span>
          </div>
          <div className="text-2xl font-black text-slate-800">{counts.all}</div>
          <span className="text-[10px] text-slate-400">تشمل كافة الحالات</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({counts.all})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            بانتظار الاعتماد ({counts.pending})
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'active'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            نشطة ({counts.active})
          </button>
          <button
            onClick={() => setActiveFilter('suspended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'suspended'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            معلقة ({counts.suspended})
          </button>
          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'rejected'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            مرفوضة ({counts.rejected})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم، المعرف، السجل أو البريد..."
            className="w-full text-xs pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#00875A] focus:bg-white"
          />
        </div>
      </div>

      {/* Companies List */}
      <div className="space-y-3">
        {filteredCompanies.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold">لا توجد منشآت مطابقة للفلتر المحدد</p>
            <p className="text-xs text-slate-400 mt-1">جرّب اختيار تبويب آخر أو مسح كلمة البحث.</p>
          </div>
        ) : (
          filteredCompanies.map((company) => {
            const isCurrentlySelected = currentCompanyId === company.id;
            const isLoadingThis = actionLoading === company.id;

            return (
              <div
                key={company.id}
                className={`bg-white p-5 rounded-2xl border transition-all shadow-xs ${
                  company.status === 'pending'
                    ? 'border-amber-300 ring-2 ring-amber-400/10 bg-amber-50/20'
                    : isCurrentlySelected
                    ? 'border-emerald-400 ring-2 ring-emerald-400/15'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{company.name}</h3>
                      {getStatusBadge(company.status)}
                      {isCurrentlySelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          المنشأة المحددة حالياً في الجلسة
                        </span>
                      )}
                      {company.id === 'company_default' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          المنشأة الافتراضية
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono text-slate-700">
                        <Hash className="w-3.5 h-3.5 text-slate-400" /> {company.id}
                      </span>
                      {company.adminEmail && (
                        <span className="flex items-center gap-1 font-mono text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {company.adminEmail}
                        </span>
                      )}
                      {company.phone && (
                        <span className="flex items-center gap-1 text-slate-700" dir="ltr">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {company.phone}
                        </span>
                      )}
                      {company.crNumber && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> س.ت: {company.crNumber}
                        </span>
                      )}
                      {company.createdAt && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> تسجيل:{' '}
                          {new Date(company.createdAt).toLocaleDateString('ar-SA')}
                        </span>
                      )}
                    </div>

                    {company.status === 'rejected' && company.rejectionReason && (
                      <p className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
                        <span className="font-bold">سبب الرفض:</span> {company.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Approve Action (For Pending and Rejected) */}
                    {(company.status === 'pending' || company.status === 'rejected') && (
                      <button
                        onClick={() => handleApprove(company)}
                        disabled={isLoadingThis}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>اعتماد وتفعيل المنشأة</span>
                      </button>
                    )}

                    {/* Reject Action (For Pending) */}
                    {company.status === 'pending' && (
                      <button
                        onClick={() => handleOpenRejectModal(company)}
                        disabled={isLoadingThis}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض الطلب</span>
                      </button>
                    )}

                    {/* Suspend Action (For Active) */}
                    {company.status === 'active' && company.id !== 'company_default' && (
                      <button
                        onClick={() => handleOpenSuspendModal(company)}
                        disabled={isLoadingThis}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>تعليق المنشأة</span>
                      </button>
                    )}

                    {/* Reactivate Action (For Suspended) */}
                    {company.status === 'suspended' && (
                      <button
                        onClick={() => handleReactivate(company)}
                        disabled={isLoadingThis}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>إعادة التفعيل</span>
                      </button>
                    )}

                    {/* Switch Context (Super Admin feature) */}
                    {!isCurrentlySelected && (
                      <button
                        onClick={() => handleSwitchContext(company)}
                        disabled={isLoadingThis}
                        title="التبديل إلى إدارة بيانات هذه المنشأة"
                        className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition-all cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                        <span>دخول النطاق</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectingCompanyId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-rose-800 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" /> رفض طلب تسجيل المنشأة
              </h3>
              <button
                onClick={() => setRejectingCompanyId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              يرجى تدوين سبب الرفض ليظهر لإدارة المنشأة عند محاولة تسجيل الدخول:
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">سبب الرفض:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 focus:bg-white resize-none"
                placeholder="مثال: لم يتم استيفاء السجل التجاري المعتمد أو بيانات الاشتراك..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingCompanyId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer shadow-xs"
              >
                تأكيد قرار الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendingCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> تأكيد تعليق حساب المنشأة
              </h3>
              <button
                onClick={() => setSuspendingCompany(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
              <p className="font-bold mb-1">
                تنبيه: سيؤدي تعليق منشأة "{suspendingCompany.name}" إلى:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li>حظر وصول كافة موظفي ومديري المنشأة لنظام الموارد البشرية فوراً.</li>
                <li>إيقاف إمكانية تسجيل أو تعديل أي بيانات تشغيلية.</li>
                <li>ظهور إشعار التعليق الإداري للمستخدمين وإغلاق الجلسات الحية.</li>
              </ul>
            </div>

            <p className="text-xs text-slate-500">
              يمكنك إعادة تفعيل المنشأة في أي وقت لاحقاً بنقرة زر واحدة دون فقدان أي بيانات.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendingCompany(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={actionLoading === suspendingCompany.id}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {actionLoading === suspendingCompany.id ? 'جاري التعليق...' : 'تأكيد تعليق المنشأة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
