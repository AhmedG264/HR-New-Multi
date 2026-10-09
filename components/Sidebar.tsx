import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { ChevronDown, Lock, LogOut, Building2, Bell, CheckCheck, CheckSquare } from 'lucide-react';
import { InAppNotification } from '../types';
import logo from './logo.png';

interface MenuItem {
  view: string;
  label: string;
  icon: string;
  requiredPermission: string;
}

interface MenuSection {
  heading: string | null;
  items: MenuItem[];
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    if (diffHours < 24) return `منذ ${diffHours} س`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  } catch {
    return isoString;
  }
}

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    setSelectedEmployeeId,
    currentUser,
    currentRole,
    hasPermission,
    logout,
    currentCompany,
    currentCompanyId,
    allCompanies,
    switchCompany,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setSelectedTaskId
  } = useHR();

  const [showNotifications, setShowNotifications] = useState(false);

  const handleNotificationClick = async (notif: InAppNotification) => {
    try {
      if (!notif.isRead) {
        await markNotificationAsRead(notif.id);
      }
    } catch (err) {
      console.warn('Failed to mark notification as read:', err);
    }
    setShowNotifications(false);
    if (notif.taskId) {
      setSelectedTaskId(notif.taskId);
    }
    handleNavigate('tasks');
  };

  // Expanded sections state. Default all to true.
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'الحزمة الأساسية': true,
    'إدارة المواهب': true,
    'إدارة النفقات والمصاريف': true,
    'الملفات والوثائق الرسمية': true,
    'إدارة الأمان والصلاحيات (RBAC)': true,
    'خدمات إضافية': true,
  });

  const menu: MenuSection[] = [
    {
      heading: null,
      items: [
        { view: 'dashboard', label: 'الرئيسية والتحليلات', icon: '📊', requiredPermission: 'view_dashboard' },
        { view: 'ess', label: 'الخدمة الذاتية للموظف ESS', icon: '👤', requiredPermission: 'view_ess' }
      ]
    },
    {
      heading: 'الحزمة الأساسية',
      items: [
        { view: 'employees', label: 'الموظفون والربط', icon: '👥', requiredPermission: 'view_employees' },
        { view: 'attendance', label: 'الحضور والانصراف', icon: '🕐', requiredPermission: 'view_attendance' },
        { view: 'leaves', label: 'الإجازات والغياب', icon: '🌴', requiredPermission: 'view_leaves' },
        { view: 'payroll', label: 'مسير الرواتب الموحد', icon: '💰', requiredPermission: 'view_payroll' },
        { view: 'compliance', label: 'الالتزام والأنظمة', icon: '🛡️', requiredPermission: 'view_compliance' }
      ]
    },
    {
      heading: 'إدارة المواهب',
      items: [
        { view: 'recruit', label: 'التوظيف والتعاقد', icon: '🎯', requiredPermission: 'view_recruit' },
        { view: 'perf', label: 'تقييم الأداء والمؤشرات', icon: '⭐', requiredPermission: 'view_perf' },
        { view: 'training', label: 'التدريب والتطوير', icon: '🎓', requiredPermission: 'view_training' }
      ]
    },
    {
      heading: 'إدارة النفقات والمصاريف',
      items: [
        { view: 'expenses', label: 'المصروفات المستردة', icon: '🧾', requiredPermission: 'view_expenses' },
        { view: 'trips', label: 'انتداب ورحلات العمل', icon: '✈️', requiredPermission: 'view_trips' }
      ]
    },
    {
      heading: 'الملفات والوثائق الرسمية',
      items: [
        { view: 'empfiles', label: 'ملفات الموظفين والعقود', icon: '🗂️', requiredPermission: 'view_empfiles' },
        { view: 'docs', label: 'مستندات وسياسات الشركة', icon: '📁', requiredPermission: 'view_docs' },
        { view: 'deductions', label: 'التأمينات والخصومات GOSI', icon: '💸', requiredPermission: 'view_deductions' },
        { view: 'tasks', label: 'إدارة ومهام الفريق', icon: '✅', requiredPermission: 'view_tasks' },
        { view: 'all-assets', label: 'العهد ومستلزمات العمل', icon: '💼', requiredPermission: 'view_assets' }
      ]
    },
    {
      heading: 'إدارة الأمان والصلاحيات (RBAC)',
      items: [
        { view: 'rbac-users', label: 'إدارة المستخدمين', icon: '🔑', requiredPermission: 'view_rbac' },
        { view: 'rbac-roles', label: 'صلاحيات وأدوار العمل', icon: '🔐', requiredPermission: 'view_rbac' }
      ]
    },
    {
      heading: 'خدمات إضافية',
      items: [
        { view: 'health', label: 'التأمين الطبي بوبا', icon: '🏥', requiredPermission: 'view_health' },
        { view: 'reports', label: 'التقارير والإحصاءات', icon: '📈', requiredPermission: 'view_reports' }
      ]
    }
  ];

  const handleNavigate = (view: string) => {
    // Reset selection when navigating to other screens
    if (view === 'empfiles') {
      setSelectedEmployeeId(null);
    }
    setCurrentView(view);
  };

  const toggleSection = (heading: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [heading]: !prev[heading]
    }));
  };

  return (
    <aside className="w-64 bg-white border-l border-slate-200 flex flex-col h-screen fixed top-0 right-0 z-20 shadow-xs overflow-hidden font-sans select-none">
      {/* Riyadh Green accent top line */}
      <div className="h-0.5 w-full bg-[#00875A]" />

      {/* Brand Header */}
      <div className="p-4 border-b border-slate-150">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0 overflow-hidden">
              <img
                src={logo}
                alt="سحابة الأعمال"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xs font-black text-slate-800 leading-tight truncate">سحابة الأعمال</h1>
              <p className="text-[10px] text-emerald-700 font-bold truncate mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{currentCompany?.name || 'شركة سحابة الأعمال'}</span>
              </p>
            </div>
          </div>

          {/* Notification Bell Button (Requirement 4) */}
          <button
            type="button"
            onClick={() => setShowNotifications(prev => !prev)}
            className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shrink-0"
            title="الإشعارات والتنبيهات"
            aria-label="الإشعارات والتنبيهات"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                {unreadNotificationsCount > 9 ? '+9' : unreadNotificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Super Admin Company Switcher (Requirement #8) */}
        {currentUser?.isSuperAdmin && allCompanies.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-150">
            <label className="text-[9px] font-bold text-amber-700 block mb-1">
              👑 نطاق المنشأة (المشرف العام)
            </label>
            <select
              value={currentCompanyId}
              onChange={(e) => switchCompany(e.target.value)}
              className="w-full text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:border-[#00875A] focus:outline-hidden"
            >
              {allCompanies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id === 'company_default' ? '(الرئيسية)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Nav Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar space-y-2">
        {/* Super Admin Company Approvals Quick Launcher */}
        {currentUser?.isSuperAdmin && (
          <div className="mb-2 pb-2 border-b border-slate-200">
            <button
              onClick={() => handleNavigate('company-approvals')}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                currentView === 'company-approvals'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>🏢</span>
                <span>إدارة واعتماد المنشآت</span>
              </span>
              {allCompanies.filter(c => c.status === 'pending').length > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {allCompanies.filter(c => c.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        )}

        {menu.map((section, idx) => {
          // If all items inside this section are locked for current simulation user, we can hide/disable the section header
          const visibleItems = section.items.filter(item => hasPermission(item.requiredPermission));
          if (visibleItems.length === 0 && section.heading) return null;

          const isSectionExpanded = section.heading ? !!expandedSections[section.heading] : true;

          return (
            <div key={idx} className="mb-2">
              {section.heading ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.heading!)}
                  className="w-full flex items-center justify-between text-[10px] text-slate-450 px-3 py-1.5 font-bold tracking-widest uppercase mb-1 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-all text-right cursor-pointer"
                >
                  <span>{section.heading}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isSectionExpanded ? 'rotate-0' : '-rotate-90'
                      }`}
                  />
                </button>
              ) : null}

              {isSectionExpanded && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const active = currentView === item.view;
                    const canAccess = hasPermission(item.requiredPermission);

                    return (
                      <button
                        key={item.view}
                        onClick={() => canAccess && handleNavigate(item.view)}
                        disabled={!canAccess}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 text-right cursor-pointer group ${active
                          ? 'bg-[#00875A]/8 text-[#00875A] border-r-4 border-r-[#00875A] font-bold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <span className={`text-sm transition-transform duration-200 group-hover:scale-110 ${active ? 'text-[#00875A]' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                        {!canAccess && (
                          <Lock className="w-3 h-3 text-red-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer User Info */}
      <div className="p-4 border-t border-slate-150 bg-slate-50">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00875A] to-emerald-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-inner">
              {currentUser ? currentUser.fullName.substring(0, 1) : 'م'}
            </div>
            <div className="min-w-0 flex-1 text-right">
              <div className="text-[11px] font-bold text-slate-800 truncate leading-tight flex items-center gap-1 bg-transparent">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0"></span>
                <span className="truncate">{currentUser ? currentUser.fullName : 'زائر المنصة'}</span>
              </div>
              <div className="text-[9px] text-[#00875A] font-semibold truncate mt-0.5">
                {currentRole ? currentRole.name : 'بدون منصب'} • {currentUser?.empCode}
              </div>
            </div>
            {currentUser && currentUser.status === 'inactive' && (
              <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center">
                <span className="text-[10px] font-bold text-red-600">الحساب معطل حالياً</span>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 border border-rose-200 text-xs py-2.5 rounded-xl transition font-black cursor-pointer shadow-2xs"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-500" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Notifications Dropdown Panel (Requirement 4) */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-2xs"
            onClick={() => setShowNotifications(false)}
          />
          <div
            className="fixed top-14 left-4 sm:left-auto sm:right-68 w-84 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 text-right font-sans flex flex-col max-h-[82vh]"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-3.5 border-b border-slate-150 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800">الإشعارات والتنبيهات</h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {unreadNotificationsCount > 0
                      ? `${unreadNotificationsCount} إشعار غير مقروء`
                      : 'جميع الإشعارات مقروءة'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadNotificationsCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    title="تحديد الكل كمقروء"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تحديد الكل</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 max-h-[380px] scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Bell className="w-6 h-6 text-slate-350" />
                  </div>
                  <p className="text-xs font-black text-slate-700">لا توجد إشعارات حالياً</p>
                  <p className="text-[10px] text-slate-400">ستظهر هنا التنبيهات وإشعارات مهام الأقسام فور إنشائها</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 rounded-xl transition cursor-pointer space-y-1.5 ${
                      !n.isRead
                        ? 'bg-emerald-50/50 hover:bg-emerald-50/90 border-r-4 border-r-[#00875A]'
                        : 'hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{n.title}</span>
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium font-mono">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {n.message}
                    </p>

                    {n.departmentId && (
                      <div className="flex items-center gap-1 text-[9.5px] text-slate-500 font-bold">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          القسم: {n.departmentId}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-slate-150 bg-slate-50 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(false);
                  handleNavigate('tasks');
                }}
                className="text-[11px] text-[#00875A] font-bold hover:underline cursor-pointer"
              >
                الانتقال إلى لوحة مهام الفريق ←
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
