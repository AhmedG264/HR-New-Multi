import React from 'react';
import { Company } from '../types';
import { Clock, Ban, AlertTriangle, LogOut, Building2, Mail, Calendar, Phone, Hash } from 'lucide-react';

interface CompanyStatusNoticeProps {
  status: 'pending' | 'rejected' | 'suspended';
  company: Company | null;
  onLogout: () => void;
}

export const CompanyStatusNotice: React.FC<CompanyStatusNoticeProps> = ({
  status,
  company,
  onLogout
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-12 h-12 text-amber-600 animate-pulse" />,
          iconBg: 'bg-amber-50 border-amber-200',
          title: 'طلب تسجيل المنشأة قيد المراجعة والاعتماد',
          subtitle: 'Your company registration is pending approval.',
          badge: 'قيد الاعتماد والتدقيق',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          description:
            'تم استلام بيانات تسجيل منشأتكم بنجاح عبر خوادم سحابة الأعمال. الحساب حالياً قيد المراجعة والتحقق من قِبل المشرف العام لاعتماد الاشتراك وتفعيل المنظومة. سيتم فتح لوحة التحكم وكافة الوحدات التشغيلية فور الاعتماد.',
          color: 'text-amber-700'
        };
      case 'rejected':
        return {
          icon: <Ban className="w-12 h-12 text-rose-600" />,
          iconBg: 'bg-rose-50 border-rose-200',
          title: 'تم رفض طلب تسجيل المنشأة',
          subtitle: 'Your company registration has been rejected.',
          badge: 'مرفوض',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
          description:
            'نعتذر منك، لقد تم رفض طلب تسجيل هذه المنشأة من قِبل إدارة النظام. يمكنك مراجعة البيانات أو التواصل مع المشرف العام لمعرفة مزيد من التفاصيل.',
          color: 'text-rose-700'
        };
      case 'suspended':
        return {
          icon: <AlertTriangle className="w-12 h-12 text-slate-700" />,
          iconBg: 'bg-slate-100 border-slate-300',
          title: 'تم تعليق حساب المنشأة مؤقتاً',
          subtitle: 'Your company account has been suspended.',
          badge: 'معلق إدارياً',
          badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
          description:
            'تم إيقاف صلاحيات الوصول لمنشأتكم مؤقتاً من قِبل إدارة المنظومة. يرجى التواصل مع فريق الدعم الفني أو المشرف العام لإعادة تفعيل الحساب.',
          color: 'text-slate-800'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      id="company_status_screen"
      className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Background Decorative Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-100/60 rounded-full blur-[130px] opacity-40 pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-[550px] h-[550px] bg-slate-200/50 rounded-full blur-[140px] opacity-40 pointer-events-none"></div>

      <div className="max-w-lg w-full bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-150 relative z-10 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Status Icon */}
        <div
          className={`w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center mb-5 ${config.iconBg}`}
        >
          {config.icon}
        </div>

        {/* Status Badge */}
        <div className="mb-3 inline-block">
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${config.badgeClass}`}>
            {config.badge}
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-1 tracking-tight">
          {config.title}
        </h2>
        <p className="text-xs text-slate-450 font-medium mb-4">{config.subtitle}</p>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
          {config.description}
        </p>

        {/* Rejection reason if applicable */}
        {status === 'rejected' && company?.rejectionReason && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-right">
            <span className="text-xs font-bold text-rose-800 block mb-1">سبب الرفض المسجل:</span>
            <p className="text-xs text-rose-700">{company.rejectionReason}</p>
          </div>
        )}

        {/* Company Summary Info */}
        {company && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2 mb-6 text-right">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> اسم المنشأة:
              </span>
              <span className="font-bold text-slate-800">{company.name}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> معرف المنشأة:
              </span>
              <span className="font-mono text-[11px] text-slate-700">{company.id}</span>
            </div>

            {company.adminEmail && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> البريد الإلكتروني:
                </span>
                <span className="font-mono text-[11px] text-slate-700">{company.adminEmail}</span>
              </div>
            )}

            {company.crNumber && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" /> السجل التجاري:
                </span>
                <span className="text-slate-700">{company.crNumber}</span>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> رقم الهاتف:
                </span>
                <span className="text-slate-700" dir="ltr">{company.phone}</span>
              </div>
            )}

            {company.createdAt && (
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> تاريخ التسجيل:
                </span>
                <span className="text-slate-700">
                  {new Date(company.createdAt).toLocaleDateString('ar-SA')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Button: Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span>تسجيل الخروج والعودة لاحقاً</span>
        </button>
      </div>
    </div>
  );
};
