/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Filter, 
  Briefcase, 
  User, 
  Target, 
  ChevronRight, 
  Star, 
  X, 
  BookOpen, 
  HeartHandshake, 
  Sliders,
  ChevronLeft,
  Sparkles,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  FileCheck,
  Building,
  GraduationCap
} from 'lucide-react';
import { Employee, PerformanceReview } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

export const Performance: React.FC = () => {
  const { 
    employees, 
    reviews, 
    addReview, 
    updateReview, 
    deleteReview,
    updateEmployee,
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab
  } = useHR();

  // Active Screen Tab
  const [activeTab, setActiveTab2] = useState<'reviews' | 'charts' | 'compliance'>('reviews');

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [scoreFilter, setScoreFilter] = useState('الكل'); // e.g. "high", "low", etc.

  // Creation form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formEmpId, setFormEmpId] = useState('');
  const [formPeriod, setFormPeriod] = useState('الربع الأول 2026');
  const [formGoal, setFormGoal] = useState('');
  const [formScore, setFormScore] = useState<number>(4);
  const [formStatus, setFormStatus] = useState<'مكتمل' | 'قيد التقييم'>('قيد التقييم');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit popover/modal state
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [editScore, setEditScore] = useState<number>(4);
  const [editGoal, setEditGoal] = useState('');
  const [editStatus, setEditStatus] = useState<'مكتمل' | 'قيد التقييم'>('قيد التقييم');
  const [isUpdating, setIsUpdating] = useState(false);

  // Success highlights
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Available periods list
  const availablePeriods = [
    'الربع الأول 2026',
    'الربع الثاني 2026',
    'الربع الثالث 2026',
    'الربع الرابع 2026',
    'التقييم السنوي 2026',
    'فترة التجربة (90 يوماً)'
  ];

  // Group departments dynamically
  const departmentsList = useMemo(() => {
    const list = new Set(employees.map(e => e.dept));
    return Array.from(list).filter(Boolean);
  }, [employees]);

  // Overall Statistics Calculations (Strictly from current live arrays)
  const metrics = useMemo(() => {
    const totalReviews = reviews.length;
    const completedCount = reviews.filter(r => r.status === 'مكتمل').length;
    const pendingCount = reviews.filter(r => r.status === 'قيد التقييم').length;
    
    // Average score across completed reviews
    const completedReviewsWithScore = reviews.filter(r => r.status === 'مكتمل' && r.score > 0);
    const avgScore = completedReviewsWithScore.length 
      ? (completedReviewsWithScore.reduce((sum, r) => sum + r.score, 0) / completedReviewsWithScore.length).toFixed(2)
      : '0.00';

    // Top employees based on rating or review
    const topPerformersArr = employees
      .filter(e => e.status !== 'موقوف')
      .sort((a, b) => (b.perf || 0) - (a.perf || 0))
      .slice(0, 3);

    // Count of employees below standard (score < 3.0)
    const lowPerfCount = employees.filter(e => e.status !== 'موقوف' && (e.perf || 4) < 3.0).length;

    return {
      totalReviews,
      completedCount,
      pendingCount,
      avgScore,
      topPerformersArr,
      lowPerfCount
    };
  }, [reviews, employees]);

  // Dynamic Recharts Data Feed (Performance metrics by department)
  const chartDataByDept = useMemo(() => {
    const map: Record<string, { sum: number; count: number; completedCount: number }> = {};
    
    employees.forEach(e => {
      const dept = e.dept || 'أخرى';
      if (!map[dept]) {
        map[dept] = { sum: 0, count: 0, completedCount: 0 };
      }
      map[dept].sum += (e.perf || 4);
      map[dept].count += 1;
    });

    // Count completed reviews in each department
    reviews.forEach(r => {
      const emp = employees.find(e => e.id === r.empId);
      if (emp) {
        const dept = emp.dept || 'أخرى';
        if (map[dept]) {
          if (r.status === 'مكتمل') {
            map[dept].completedCount += 1;
          }
        }
      }
    });

    return Object.keys(map).map(dept => {
      const avg = map[dept].count ? Number((map[dept].sum / map[dept].count).toFixed(2)) : 0;
      return {
        name: dept,
        'متوسط الأداء': avg,
        'عدد الموظفين': map[dept].count,
        'التقييمات المنجزة': map[dept].completedCount
      };
    });
  }, [employees, reviews]);

  // Distribution of scores
  const scoreDistributionData = useMemo(() => {
    const ranges = {
      'ممتاز (4.5 - 5.0)': 0,
      'جيد جداً (3.5 - 4.4)': 0,
      'جيد (2.5 - 3.4)': 0,
      'مقبول (2.0 - 2.4)': 0,
      'ضعيف (تحت 2.0)': 0
    };

    employees.forEach(e => {
      const p = e.perf || 4;
      if (p >= 4.5) ranges['ممتاز (4.5 - 5.0)'] += 1;
      else if (p >= 3.5) ranges['جيد جداً (3.5 - 4.4)'] += 1;
      else if (p >= 2.5) ranges['جيد (2.5 - 3.4)'] += 1;
      else if (p >= 2.0) ranges['مقبول (2.0 - 2.4)'] += 1;
      else ranges['ضعيف (تحت 2.0)'] += 1;
    });

    const COLORS = ['#1a9e72', '#b5822a', '#2e6db4', '#c97e10', '#d03a3a'];

    return Object.keys(ranges).map((key, index) => ({
      name: key,
      value: ranges[key as keyof typeof ranges],
      color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);
  }, [employees]);

  // Filters calculation logic
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const emp = employees.find(e => e.id === r.empId);
      
      const empName = emp ? emp.name : 'موظف مجهول';
      const empDept = emp ? emp.dept : 'غير محدد';

      // 1. Name query matching
      const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.goal.toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Period Filter matching
      const matchesPeriod = periodFilter === 'الكل' || r.period === periodFilter;

      // 3. Status Filter matching
      const matchesStatus = statusFilter === 'الكل' || r.status === statusFilter;

      // 4. Department Filter matching
      const matchesDept = deptFilter === 'الكل' || empDept === deptFilter;

      // 5. Score Filter matching
      let matchesScore = true;
      if (scoreFilter === 'high') {
        matchesScore = r.score >= 4.5;
      } else if (scoreFilter === 'medium') {
        matchesScore = r.score >= 3.0 && r.score < 4.5;
      } else if (scoreFilter === 'low') {
        matchesScore = r.score > 0 && r.score < 3.0;
      } else if (scoreFilter === 'pending') {
        matchesScore = r.score === 0;
      }

      return matchesSearch && matchesPeriod && matchesStatus && matchesDept && matchesScore;
    });
  }, [reviews, employees, searchTerm, periodFilter, statusFilter, deptFilter, scoreFilter]);

  // Excel/CSV Arabic Export of Performance evaluations
  const handleExportPerformanceCSV = () => {
    const headers = [
      'اسم الموظف',
      'القسم',
      'المسمى الوظيفي',
      'فترة التقييم',
      'أهداف وألـ OKRs المعتمدة',
      'الدرجة التقديرية (1-5)',
      'الحالة التنفيذية'
    ];
    
    const rows = filteredReviews.map(r => {
      const emp = employees.find(e => e.id === r.empId);
      return [
        emp ? emp.name : 'غير معروف',
        emp ? emp.dept : 'غير معروف',
        emp ? emp.job : 'غير معروف',
        r.period,
        r.goal,
        r.score,
        r.status
      ];
    });

    exportToCSV(`تقرير_مؤشرات_وتقييم_الأداء_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Launch New Evaluation Submission
  const handleLaunchReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) {
      alert('الرجاء اختيار الموظف أولاً لتوجيه دورة التقييم');
      return;
    }
    if (!formGoal.trim()) {
      alert('الرجاء صياغة الأهداف والـ OKRs المحددة للموظف');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Push review data to Firestore
      await addReview({
        empId: formEmpId,
        period: formPeriod,
        score: formScore,
        goal: formGoal,
        status: formStatus
      });

      // 2. Cross-screen synchronization: Update employee rating if finalized as completed
      if (formStatus === 'مكتمل' && formScore > 0) {
        await updateEmployee(formEmpId, { perf: formScore });
      }

      // Reset form variables
      setFormGoal('');
      setFormEmpId('');
      setFormScore(4);
      setFormStatus('قيد التقييم');
      setIsFormOpen(false);

      setSyncSuccessMsg('تم تدشين وحفظ الدورة التقييمية ومزامنتها بملف الكفاءة الفوري بالكلاود بنجاح! 🇸🇦');
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
      alert('عذراً، فشل تسجيل نموذج مراجعة الأداء بالكلاود');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Session
  const handleOpenEdit = (review: PerformanceReview) => {
    setEditingReview(review);
    setEditScore(review.score);
    setEditGoal(review.goal);
    setEditStatus(review.status);
  };

  // Submit Edit changes
  const handleUpdateReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    setIsUpdating(true);
    try {
      // 1. Update firestore review document
      await updateReview(editingReview.id, {
        score: editScore,
        goal: editGoal,
        status: editStatus
      });

      // 2. Sync core employee record if status is marked as 'مكتمل'
      if (editStatus === 'مكتمل' && editScore > 0) {
        await updateEmployee(editingReview.empId, { perf: editScore });
      }

      setEditingReview(null);
      setSyncSuccessMsg('تم تحديث التقييم وإعادة تقويم مؤشر الأداء بملف الموظف بنجاح!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
      alert('عذراً، فشلت مزامنة تعديل الأداء');
    } finally {
      setIsUpdating(false);
    }
  };

  // Single click instant toggle status
  const handleToggleStatus = async (id: string, currentStatus: 'مكتمل' | 'قيد التقييم', empId: string, currentScore: number) => {
    const nextStatus = currentStatus === 'مكتمل' ? 'قيد التقييم' : 'مكتمل';
    try {
      await updateReview(id, { status: nextStatus });
      
      // If toggling to completed, sync rating as well
      if (nextStatus === 'مكتمل' && currentScore > 0) {
        await updateEmployee(empId, { perf: currentScore });
      }
      setSyncSuccessMsg('تم تبديل الحالة ومزامنة المؤشر بنجاح على خوادم الكلاود');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء تبديل حالة المراجعة');
    }
  };

  // Single click instant Star Rating updater inside table
  const handleTableStarUpdate = async (id: string, empId: string, itemScore: number, status: string) => {
    try {
      await updateReview(id, { score: itemScore });
      
      // If review is already completed, dynamically update the employee core rating too
      if (status === 'مكتمل') {
        await updateEmployee(empId, { perf: itemScore });
      }
      setSyncSuccessMsg(`تم تحديث التقييم الفوري إلى ${itemScore} من 5 نجوم`);
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('فشل تحديث التقييم بالنجم');
    }
  };

  // Delete Performance Entry
  const handleDeleteReviewCard = async (id: string) => {
    if (!window.confirm('🚨 هل أنت متأكد من حذف وإلغاء بطاقة مراجعة التقييم هذه نهائياً من الكلاود؟\nهذا الإجراء غير قابل للتراجع.')) return;
    try {
      await deleteReview(id);
      setSyncSuccessMsg('تم حذف جلسة التقييم تماماً من قاعدة البيانات.');
      setTimeout(() => setSyncSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء حذف التقييم');
    }
  };

  // Cross link navigation direct helper
  const handleNavigateToEmployeeFile = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab('info'); // switch to info tab
    setCurrentView('empfiles'); // redirect to Employee profiles screen
  };

  return (
    <div className="space-y-6 text-right animate-slideup font-sans" id="performance_review_main_container">
      
      {/* 🚀 Dynamic Metric Counters Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">المعدل العام للمنشأة</span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-full">
              <TrendingUp className="w-4 h-4 text-gold" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.avgScore} <span className="text-xs font-bold text-slate-400">/ 5.0</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              متوسط التقييمات المكتملة الفعّالة
            </p>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-r from-gold to-amber-500"></div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">التقييمات المنجزة</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-green-hr" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-800 tracking-tight">
              {metrics.completedCount} / {metrics.totalReviews}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              مرات التطوير والتقارير المعتمدة
            </p>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-green-hr"></div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">جلسات قيد المراجعة</span>
            <div className="p-1.5 bg-orange-50 text-orange-650 rounded-full">
              <Clock className="w-4 h-4 text-orange-hr" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.pendingCount} <span className="text-xs font-bold text-slate-400">أفراد</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              بحاجة إلى إرساء الدرجة والاعتماد الرسمي
            </p>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-orange-hr"></div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">بوجوب المتابعة (ضعيف)</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-full">
              <AlertTriangle className="w-4 h-4 text-red-hr" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-700 tracking-tight">
              {metrics.lowPerfCount} <span className="text-xs font-bold text-slate-450">موظفين</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">
              من حازوا على تقييم تحت 3.0 درجات
            </p>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-red-hr"></div>
        </div>

      </div>


      {/* Synchronized Action Messaging feedback banner */}
      {syncSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* 🧭 Sub Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-3xs">
        <button
          onClick={() => setActiveTab2('reviews')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${
            activeTab === 'reviews' 
              ? 'bg-slate-900 text-white font-extrabold shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab_reviews"
        >
          <UserCheck className="w-4 h-4" />
          حقيبة وسجلات تقييمات الأداء
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${activeTab === 'reviews' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
            {reviews.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab2('charts')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${
            activeTab === 'charts' 
              ? 'bg-slate-900 text-white font-extrabold shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab_charts"
        >
          <TrendingUp className="w-4 h-4" />
          تحليلات الأداء ومؤشرات الأقسام
        </button>
      </div>

      {/* Tab 1: Reviews Management Workspace */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          
          {/* Collapsible Action Form: Create New Review */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden">
            <div 
              className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"
              onClick={() => setIsFormOpen(!isFormOpen)}
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <Plus className="w-4 h-4 text-gold" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">تدشين نموذج تقييم ومراجعة أداء جديدة</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">تسجيل الدورة التقييمية ومطابقتها بالتأمينات ونطاقات قوى</p>
                </div>
              </div>
              <button 
                type="button" 
                className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                {isFormOpen ? 'إغلاق نافذة التدشين ↑' : 'افتح نموذج التدشين الجديد ↓'}
              </button>
            </div>

            {isFormOpen && (
              <form onSubmit={handleLaunchReview} className="p-5 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Select Employee Dropdown */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650">اختيار الموظف المعني بالتقييم</label>
                    <select
                      required
                      value={formEmpId}
                      onChange={(e) => setFormEmpId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:border-gold outline-none cursor-pointer"
                    >
                      <option value="">-- يرجى اختيار الموظف --</option>
                      {employees
                        .filter(e => e.status !== 'موقوف')
                        .map(e => (
                          <option key={e.id} value={e.id}>
                            {e.name} ({e.job} - {e.dept})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Evaluation Period */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650">فترة التقييم للأهداف والمؤشرات</label>
                    <select
                      value={formPeriod}
                      onChange={(e) => setFormPeriod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-750 focus:border-gold outline-none cursor-pointer"
                    >
                      {availablePeriods.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating score set */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650">درجة التقييم المفترضة (أو الحالية)</label>
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={formScore}
                        onChange={(e) => setFormScore(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-gold"
                      />
                      <div className="flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <span className="text-xs font-black text-slate-800">{formScore}.0</span>
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      </div>
                    </div>
                  </div>

                  {/* Form OKR Goals text Area */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650">نص الأهداف التنموية ومستهدفات الأداء (OKRs)</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="اكتب مستهدفات الموظف الفردية، المخرجات الرئيسية OKRs، مؤشرات كمية (KPIs)، أو خطط معالجة الأثر..."
                      value={formGoal}
                      onChange={(e) => setFormGoal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 focus:border-gold outline-none"
                    />
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold text-slate-650">الحالة المبدئية للتقرير</label>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setFormStatus('قيد التقييم')}
                        className={`flex-1 py-2 text-center rounded-lg text-xs font-bold border transition cursor-pointer ${
                          formStatus === 'قيد التقييم'
                            ? 'bg-amber-50 border-amber-300 text-amber-800 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        قيد التقييم (مسودة)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStatus('مكتمل')}
                        className={`flex-1 py-2 text-center rounded-lg text-xs font-bold border transition cursor-pointer ${
                          formStatus === 'مكتمل'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        مكتمل ومعتمد ✓
                      </button>
                    </div>
                  </div>

                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white border-none rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-gold" />
                    {isSubmitting ? 'جاري الحفظ بالسيرفر...' : 'تدشين وحفظ جلسة التقييم بالشبكة'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Edit Session Dialog Popover / Form */}
          {editingReview && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-2xl p-5 shadow-xl space-y-4 animate-slideup border border-slate-800">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-extrabold text-gold flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-gold" />
                    تحديث وضبط استحقاق تقييم الموظف: {employees.find(e => e.id === editingReview.empId)?.name || 'أحد منسوبي المنشأة'}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">ضبط صياغة الأهداف ومؤشرات التقرير بشكل فوري ومواءمته بقواعد بيانات الكلاود</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 border-none text-slate-350 rounded text-xs shrink-0 cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>

              <form onSubmit={handleUpdateReviewSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* Score updater */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">درجة التقييم الحالية</label>
                  <div className="flex items-center gap-2 bg-slate-800 rounded px-2.5 py-1.5 border border-slate-700">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={editScore}
                      onChange={(e) => setEditScore(Number(e.target.value))}
                      className="w-full accent-gold h-1.5 cursor-pointer bg-slate-700 rounded-lg"
                    />
                    <span className="text-gold font-sans font-extrabold text-xs shrink-0">{editScore}.0 / 5</span>
                  </div>
                </div>

                {/* Edit Status */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">تعديل الحالة التنفيذية</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'مكتمل' | 'قيد التقييم')}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.8 text-xs text-slate-100 outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="قيد التقييم">قيد التقييم والاعتماد</option>
                    <option value="مكتمل">مكتمل ومعتمد رسمياً</option>
                  </select>
                </div>

                {/* Goals content area */}
                <div className="md:col-span-3 space-y-1">
                  <label className="font-bold text-slate-300 block">مواءمة نص الأهداف المخرجات OKRs</label>
                  <textarea
                    required
                    rows={2}
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-xs text-slate-100 focus:border-gold outline-none"
                  />
                </div>

                {/* Confirm operations actions */}
                <div className="md:col-span-3 flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">
                    ⚠️ تذكير: تحديث الدرجات ومواقعها سيغير ترتيب نجوم كفاءة الموظف العام وتزامن حافز الأداء.
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingReview(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border-none rounded text-slate-300 font-bold transition cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="px-5 py-2 bg-gold hover:bg-gold/80 text-slate-900 border-none rounded-lg font-black transition cursor-pointer"
                    >
                      {isUpdating ? 'جاري تعديل السجل الكلاود...' : 'حفظ وإرساء التعديلات بالمؤشر'}
                    </button>
                  </div>
                </div>

              </form>
            </div>
          )}

          {/* Search filter panels and settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
            <h5 className="text-xs font-black text-slate-700">تصفية وفرز قاعدة بيانات تقييم الأداء</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-1 font-sans">
              
              {/* Query search text */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث باسم الموظف أو الهدف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-8 pl-3 py-2 text-xs text-slate-755 focus:border-gold outline-none font-sans"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>

              {/* Department Filter option */}
              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">كل الأقسام الإدارية</option>
                  {departmentsList.map(dp => (
                    <option key={dp} value={dp}>{dp}</option>
                  ))}
                </select>
              </div>

              {/* Period Filter option */}
              <div>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">جميع الفترات الزمنية</option>
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">جميع الحالات التقييمية</option>
                  <option value="مكتمل">المكتمل والمعتمد فقط</option>
                  <option value="قيد التقييم">قيد التقييم والمعالجة</option>
                </select>
              </div>

              {/* Score breakdown filter */}
              <div>
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">تصفية بنطاق الدرجة التقديرية</option>
                  <option value="high">مرتفع وممتاز (4.5+ نجوم)</option>
                  <option value="medium">متوسط ومستقر (3.0 - 4.4)</option>
                  <option value="low">متطلب لخطط تطوير (دون 3.0)</option>
                  <option value="pending">غير مسجل / معلق (0 نجوم)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Evaluations Grid table index */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h5 className="text-xs font-black text-slate-700">سجل دورات مراجعة الأداء والهدف الدوري</h5>
                <span className="text-[10px] text-slate-400 font-medium">مجموع السجلات المطابقة: ({filteredReviews.length}) مراجعة تقييم</span>
              </div>
              <button
                onClick={handleExportPerformanceCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold border-none cursor-pointer shadow-3xs flex items-center gap-1.5 transition"
                title="تصدير السجل المفلتر الحالي إلى ملف Excel CSV متوافق"
              >
                <span>📊</span>
                تصدير Excel (CSV)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">اسم وبيانات الموظف المعني</th>
                    <th className="p-4">الجودة والتقييم ربع السنوي</th>
                    <th className="p-4">أهداف وألـ OKRs المعتمدة</th>
                    <th className="p-4">فترة التقييم</th>
                    <th className="p-4">الحالة التنفيذية</th>
                    <th className="p-4 text-center">خدمات وقنوات الربط التحكمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-sans">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 font-bold">
                        لم يتم العثور على أي جلسات لمراجعة الأداء تطابق تصفية البحث الحالي من قاعدة بيانات الكلاود.
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((r) => {
                      const emp = employees.find(e => e.id === r.empId);
                      const isReviewCompleted = r.status === 'مكتمل';

                      return (
                        <tr 
                          key={r.id} 
                          className={`hover:bg-slate-50/50 transition-colors ${
                            isReviewCompleted ? 'bg-emerald-50/10' : 'bg-amber-50/5'
                          }`}
                        >
                          {/* Employee meta info with avatar selection */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-xs font-black shrink-0 shadow-2xs">
                                {emp ? emp.name[0] : 'م'}
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-black text-slate-800 block">{emp ? emp.name : 'موظف غير متوفر'}</span>
                                <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 font-semibold">
                                  <span>{emp ? emp.dept : 'القسم'}</span>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-mono text-[9px]">{emp ? emp.job : 'الوظيفة'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dynamic star ratings (allows single click to update the review and the employee) */}
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex text-amber-500 text-sm">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleTableStarUpdate(r.id, r.empId, star, r.status)}
                                    className="p-0 bg-transparent border-none transition-transform hover:scale-130 text-amber-500 cursor-pointer text-xs"
                                    title={`انقر لتعديل التقييم والامتثال إلى ${star}`}
                                  >
                                    {star <= r.score ? '★' : '☆'}
                                  </button>
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-400">({r.score}/5.0 نجوم)</span>
                            </div>
                          </td>

                          {/* Goal objective details text */}
                          <td className="p-4 max-w-xs">
                            <div className="text-xs text-slate-700 leading-relaxed font-sans font-medium line-clamp-2" title={r.goal}>
                              {r.goal}
                            </div>
                          </td>

                          {/* Period */}
                          <td className="p-4 font-bold text-slate-600 font-sans">
                            {r.period}
                          </td>

                          {/* Status toggle directly on click of Badge */}
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(r.id, r.status, r.empId, r.score)}
                              className={`px-3 py-1 text-[10px] font-black rounded-full border transition cursor-pointer flex items-center gap-1.5 justify-center w-28 text-center ${
                                isReviewCompleted 
                                  ? 'bg-emerald-50 border-emerald-250 text-emerald-800 font-extrabold' 
                                  : 'bg-amber-55/60 border-amber-300 text-amber-800'
                              }`}
                              title="اضغط للتبديل الفوري بين مكتمل ومسودة"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isReviewCompleted ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`}></span>
                              {r.status}
                            </button>
                            <span className="block text-[8px] text-slate-400 text-center mt-1">✓ انقر للتبديل السريع</span>
                          </td>

                          {/* Controls & Navlink Actions */}
                          <td className="p-4">
                            <div className="flex justify-center items-center gap-1.5">
                              
                              {/* Go to files context profile page directly (Cross screen Linking feature!) */}
                              <button
                                type="button"
                                onClick={() => handleNavigateToEmployeeFile(r.empId)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 hover:text-blue-900 border border-blue-200 rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="الانتقال الفوري إلى ورقة ملف الموظف والوثائق"
                              >
                                <User className="w-3.5 h-3.5 text-blue-700" />
                                ملف الموظف ↗
                              </button>

                              {/* Edit review detail parameters */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(r)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-805 border border-slate-200 rounded transition cursor-pointer"
                                title="تعديل تفاصيل وأهداف البطاقة التقييمية"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete complete sheet card from platform */}
                              <button
                                type="button"
                                onClick={() => handleDeleteReviewCard(r.id)}
                                className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded transition cursor-pointer"
                                title="حذف وإلغاء هذه المراجعة نهائياً من الكلاود"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Recharts Performance Analytics & Indicator Visualizations */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          
          {/* Charts Header Information */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-black text-slate-800">جداول الأشكال الهندسية ومؤشرات نجاح الموارد</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">رسوم بيانية حية تعرض متوسط كفاءة الأداء للأقسام وتوزيع النجوم الحالي في المنشأة</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Average Score by Department */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-gold"></span>
                  متوسط درجات الأداء للكفاءات حسب القسم (من 5.0 نجوم)
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5">مأخوذة بناءً على متوسط درجات الأداء الفعّالة لجميع موظفي المنشأة بقواعد البيانات</p>
              </div>

              <div className="h-64 font-sans text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartDataByDept}
                    margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis domain={[0, 5]} stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px' }} 
                      formatter={(value) => [`${value} نجوم`, 'متوسط الأداء']}
                    />
                    <Legend />
                    <Bar dataKey="متوسط الأداء" fill="#b5822a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Distribution of Scores inside company */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-green-hr"></span>
                  توزيع مستويات الكفاءة والنجوم الحالي بالمنشأة
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5">عدد الموارد البشرية النشطة مقسمة حسب تقييمات ميزان الأداء العام</p>
              </div>

              <div className="h-64 flex flex-col md:flex-row items-center justify-around font-sans">
                {scoreDistributionData.length === 0 ? (
                  <span className="text-xs text-slate-400 font-bold">يرجى تسجيل تقييمات لإظهار دائرة التوزيع التلقائي</span>
                ) : (
                  <>
                    <div className="w-full md:w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={scoreDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {scoreDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} موظف`, 'مجموع الكادر']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col gap-1.5 text-xs">
                      {scoreDistributionData.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }}></span>
                            <span className="font-bold text-slate-700">{entry.name}</span>
                          </div>
                          <span className="font-mono text-xs font-extrabold text-slate-800">{entry.value} أفراد</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Chart 3: Review count completions / activity status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 lg:col-span-2">
              <div>
                <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded bg-blue-hr"></span>
                  نشاط مراجعات الأداء والتخطيط المقابل حسب القسم الإداري
                </h5>
                <p className="text-[10px] text-slate-400 mt-0.5">مقارنة بين عدد الموظفين الفعليين والتقييمات المنجزة المعتمدة</p>
              </div>

              <div className="h-64 font-sans text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartDataByDept}
                    margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '12px' }} />
                    <Legend />
                    <Bar dataKey="عدد الموظفين" fill="#2e6db4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="التقييمات المنجزة" fill="#1a9e72" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}


    </div>
  );
};
