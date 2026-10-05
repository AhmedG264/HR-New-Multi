/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HRProvider, useHR } from '../context/HRContext';
import { Login } from '../components/Login';
import { Sidebar } from '../components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { ESS } from '../components/ESS';
import { Employees } from '../components/Employees';
import { Attendance } from '../components/Attendance';
import { Leaves } from '../components/Leaves';
import { Payroll } from '../components/Payroll';
import { Compliance } from '../components/Compliance';
import { Recruitment } from '../components/Recruitment';
import { Performance } from '../components/Performance';
import { Training } from '../components/Training';
import { Expenses } from '../components/Expenses';
import { Trips } from '../components/Trips';
import { EmployeeFiles } from '../components/EmployeeFiles';
import { CompanyDocs } from '../components/CompanyDocs';
import { Deductions } from '../components/Deductions';
import { TasksManager } from '../components/TasksManager';
import { AssetsManager } from '../components/AssetsManager';
import { RBACUsers } from '../components/RBACUsers';
import { RBACRoles } from '../components/RBACRoles';
import { HealthInsuranceManager } from '../components/HealthInsuranceManager';
import { ReportsAndStats } from '../components/ReportsAndStats';

const AppContent: React.FC = () => {
  const {
    currentUser,
    firebaseAuthReady,
    currentView,
    loading,
    loadError,
    seedStatus
  } = useHR();

  const [showLocalFallbackBtn, setShowLocalFallbackBtn] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!firebaseAuthReady) {
        setShowLocalFallbackBtn(true);
      }
    }, 3000); // 3 seconds timeout
    return () => clearTimeout(timer);
  }, [firebaseAuthReady]);

  const isLocalSession = localStorage.getItem('sahaba_session_type') === 'local';

  const handleBypassToLocal = () => {
    localStorage.setItem('sahaba_session_type', 'local');
    window.location.reload();
  };

  // Wait for Firebase Authentication initialization before showing anything,
  // except when running a local fallback session.
  if (!firebaseAuthReady && !isLocalSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-4" dir="rtl">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-700 font-semibold text-center">جاري تهيئة الاتصال السحابي الآمن سحابة الأعمال...</p>
        
        {showLocalFallbackBtn && (
          <div className="mt-8 max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <p className="text-xs text-amber-700 font-bold mb-2">💡 ملاحظة الاتصال بقاعدة البيانات</p>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              يبدو أن الاتصال بخوادم غوغل السحابية يستغرق وقتاً أطول من المعتاد. قد يكون هذا بسبب قيود جدار الحماية، VPN أو سرعة الشبكة.
            </p>
            <button
              onClick={handleBypassToLocal}
              className="w-full bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl transition duration-150 cursor-pointer shadow-xs"
            >
              الاستمرار بوضعية العمل المحلي (تخطي الانتظار)
            </button>
          </div>
        )}
      </div>
    );
  }

  // If not logged in, render the login page.
  if (!currentUser) {
    return <Login />;
  }

  // Render the selected view inside the layout.
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'ess':
        return <ESS />;
      case 'employees':
        return <Employees />;
      case 'attendance':
        return <Attendance />;
      case 'leaves':
        return <Leaves />;
      case 'payroll':
        return <Payroll />;
      case 'compliance':
        return <Compliance />;
      case 'recruit':
        return <Recruitment />;
      case 'perf':
        return <Performance />;
      case 'training':
        return <Training />;
      case 'expenses':
        return <Expenses />;
      case 'trips':
        return <Trips />;
      case 'empfiles':
        return <EmployeeFiles />;
      case 'docs':
        return <CompanyDocs />;
      case 'deductions':
        return <Deductions />;
      case 'tasks':
        return <TasksManager />;
      case 'all-assets':
        return <AssetsManager />;
      case 'rbac-users':
        return <RBACUsers />;
      case 'rbac-roles':
        return <RBACRoles />;
      case 'health':
        return <HealthInsuranceManager />;
      case 'reports':
        return <ReportsAndStats />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex text-slate-800" dir="rtl">
      {/* Sidebar (Fixed layout on the right side) */}
      <Sidebar />

      {/* Main Content Area (To the left of Sidebar) */}
      <main className="flex-1 mr-64 min-h-screen relative overflow-x-hidden p-6 lg:p-8">
        {/* Loading overlay for view data loading */}
        {loading && (
          <div className="absolute top-4 left-4 z-50 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-full shadow-md border border-slate-100 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 font-medium">جاري المزامنة...</span>
          </div>
        )}

        {/* Database Seeding Status banner */}
        {seedStatus === 'seeding' && (
          <div className="mb-6 bg-emerald-50 border border-emerald-150 text-[#00875A] p-4 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
            <div className="text-sm">
              <span className="font-bold">تهيئة قاعدة البيانات الأولى:</span> جاري بذر الجداول الافتراضية والعهد ومستلزمات الحماية السحابية بالسيستم. فضلاً لا تغلق المتصفح...
            </div>
          </div>
        )}

        {/* Load Error Alert banner */}
        {loadError && (
          <div className="mb-6 bg-amber-50 border border-amber-150 text-amber-800 p-4 rounded-2xl text-sm flex items-center gap-3 shadow-xs">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="font-bold">تنبيه النظام:</span> {loadError}
            </div>
          </div>
        )}

        {/* Actual dynamic view */}
        <div className="w-full">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <HRProvider>
      <AppContent />
    </HRProvider>
  );
}
