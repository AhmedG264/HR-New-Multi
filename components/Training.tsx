/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { processAttachedFile } from '../utils/fileUtils';
import { 
  GraduationCap, 
  Award, 
  Users, 
  Clock, 
  BookOpen, 
  MapPin, 
  UserPlus, 
  UserMinus, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  DollarSign,
  Briefcase,
  AlertTriangle,
  FileText,
  TrendingUp,
  X,
  Target,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Building
} from 'lucide-react';
import { Employee, TrainingCourse } from '../types';
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
  CartesianGrid
} from 'recharts';

export const Training: React.FC = () => {
  const { 
    employees, 
    trainings, 
    addTraining, 
    updateTraining, 
    deleteTraining,
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab
  } = useHR();

  // Screen layout state
  const [activeTab, setActiveTab] = useState<'programs' | 'charts' | 'compliance'>('programs');
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل');

  // Accordion details toggle states
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  // Success messaging
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Course registration & update form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('تقني');
  const [formTrainer, setFormTrainer] = useState('');
  const [formDate, setFormDate] = useState('2026-06-25');
  const [formDur, setFormDur] = useState('3 أيام');
  const [formCost, setFormCost] = useState<number>(1500);
  const [formVenue, setFormVenue] = useState('مقر الشركة بالرياض');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'قادمة' | 'مكتملة'>('قادمة');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFileData, setFormFileData] = useState('');
  const [formFileName, setFormFileName] = useState('');

  // Handle PDF/Image File upload conversion to Base64 with compression/size checks
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processAttachedFile(
      file,
      (base64) => {
        setFormFileData(base64);
        setFormFileName(file.name);
      },
      (error) => {
        alert(error);
        setFormFileData('');
        setFormFileName('');
      }
    );
  };

  // Search filter for enrolling employees within expanded cards
  const [enrollSearchMap, setEnrollSearchMap] = useState<Record<string, string>>({});

  // Defined Categories supported in MHRSD qualification programs
  const availableCategories = [
    'تقني',
    'إداري وقيادي',
    'أمن سيبراني',
    'خدمة العملاء',
    'أنظمة وتوافق',
    'مالي ومحاسبي',
    'مبيعات وتسويق'
  ];

  // Dynamic Statistics computed directly from the live database records
  const statistics = useMemo(() => {
    const totalPrograms = trainings.length;
    const completedPrograms = trainings.filter(t => t.status === 'مكتملة').length;
    const upcomingPrograms = trainings.filter(t => t.status === 'قادمة').length;
    
    // Sum total investment budget (default back to 0 if undefined)
    const totalBudget = trainings.reduce((sum, t) => sum + (t.cost || 0), 0);
    
    // Sum of enrolled participants across all courses
    const totalParticipants = trainings.reduce((sum, t) => {
      const empListLength = t.empIds ? t.empIds.length : 0;
      return sum + Math.max(t.enrolled || 0, empListLength);
    }, 0);

    return {
      totalPrograms,
      completedPrograms,
      upcomingPrograms,
      totalBudget,
      totalParticipants
    };
  }, [trainings]);

  // List filter logic
  const filteredCourses = useMemo(() => {
    return trainings.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (t.trainer && t.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (t.desc && t.desc.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'الكل' || (t.category || 'تقني') === categoryFilter;
      const matchesStatus = statusFilter === 'الكل' || t.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [trainings, searchTerm, categoryFilter, statusFilter]);

  // Handle Form Submission (Add or Update)
  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('الرجاء إدخال اسم البرنامج التدريبي');
      return;
    }
    setIsSubmitting(true);

    try {
      if (editingCourse) {
        // Update existing document
        await updateTraining(editingCourse.id, {
          title: formTitle,
          category: formCategory,
          trainer: formTrainer,
          date: formDate,
          dur: formDur,
          cost: formCost,
          venue: formVenue,
          desc: formDesc,
          status: formStatus,
          fileData: formFileData,
          fileName: formFileName
        });
        setSuccessMessage('تم تحديث تفاصيل الدورة التدريبية ومزامنتها بالكلاود بنجاح! 🇸🇦');
      } else {
        // Create new document
        await addTraining({
          title: formTitle,
          category: formCategory,
          trainer: formTrainer,
          date: formDate,
          dur: formDur,
          cost: formCost,
          venue: formVenue,
          desc: formDesc,
          status: formStatus,
          enrolled: 0,
          empIds: [],
          fileData: formFileData,
          fileName: formFileName
        });
        setSuccessMessage('تم تدشين البرنامج التدريبي وحفظه في خوادم الكلاود الفورية! 🎉');
      }
      
      // Cleanup form
      resetForm();
      setIsFormOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('عذراً، فشل تسجيل البرنامج التدريبي بقاعدة البيانات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('تقني');
    setFormTrainer('');
    setFormDate('2026-06-25');
    setFormDur('3 أيام');
    setFormCost(1500);
    setFormVenue('مقر الشركة بالرياض');
    setFormDesc('');
    setFormStatus('قادمة');
    setFormFileData('');
    setFormFileName('');
    setEditingCourse(null);
  };

  // Trigger form into edit state
  const handleOpenEdit = (course: TrainingCourse) => {
    setEditingCourse(course);
    setFormTitle(course.title);
    setFormCategory(course.category || 'تقني');
    setFormTrainer(course.trainer || '');
    setFormDate(course.date);
    setFormDur(course.dur);
    setFormCost(course.cost || 0);
    setFormVenue(course.venue || '');
    setFormDesc(course.desc || '');
    setFormStatus(course.status);
    setFormFileData(course.fileData || '');
    setFormFileName(course.fileName || '');
    setIsFormOpen(true);
    // Smooth scroll to form container
    const formElement = document.getElementById('course-form-element');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleStatus = async (courseId: string, currentStatus: 'قادمة' | 'مكتملة') => {
    const nextStatus = currentStatus === 'قادمة' ? 'مكتملة' : 'قادمة';
    try {
      await updateTraining(courseId, { status: nextStatus });
      setSuccessMessage('تم تحديث حالة البرنامج التدريبي بنجاح!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('فشل تبديل حالة الدورة');
    }
  };

  const handleExportTrainingCSV = () => {
    const headers = [
      'عنوان البرنامج',
      'التصنيف',
      'المدرب/الجهة',
      'التاريخ',
      'المدة',
      'الافتراض المالي للمتدرب (ر.س)',
      'مقر الدورة',
      'الحالة',
      'عدد الموظفين المسجلين',
      'أسماء الموظفين المسجلين'
    ];
    
    const rows = filteredCourses.map(t => {
      const enrolledNames = (t.empIds || []).map(id => {
        const emp = employees.find(e => e.id === id);
        return emp ? emp.name : '';
      }).filter(Boolean).join(' - ');

      return [
        t.title,
        t.category || 'تقني',
        t.trainer || 'غير محدد',
        t.date,
        t.dur,
        t.cost || 0,
        t.venue || '',
        t.status === 'مكتملة' ? 'مكتملة وجرى تسليمها' : 'مزمّعة وستبدأ قريباً',
        t.empIds?.length || 0,
        enrolledNames
      ];
    });

    exportToCSV(`برامج_التدريب_والتطوير_سحابة_الأعمال_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('⚠️ تحذير: هل أنت متأكد من حذف هذا البرنامج التدريبي نهائياً من القوائم؟\nسيتم إزالة وحذف كافة ارتباطات الموظفين التدريبية المرتبطة.')) return;
    try {
      await deleteTraining(courseId);
      setSuccessMessage('تم إلغاء وحذف البرنامج التدريبي من قاعدة بيانات السحابة.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء إلغاء الدورة من الكلاود');
    }
  };

  // Cross screen deep link function to Employee Profile
  const handleNavigateToEmployeeFile = (empId: string) => {
    setSelectedEmployeeId(empId);
    setEmployeeFileTab('info');
    setCurrentView('empfiles');
  };

  // Dynamic Enrollment Mechanics
  const handleEnrollEmployee = async (courseId: string, empId: string) => {
    if (!empId) return;
    const course = trainings.find(c => c.id === courseId);
    if (!course) return;

    const currentEmpIds = course.empIds || [];
    if (currentEmpIds.includes(empId)) {
      alert('هذا الموظف مسجل ومدرج بالفعل في هذا البرنامج!');
      return;
    }

    const nextEmpIds = [...currentEmpIds, empId];
    try {
      await updateTraining(courseId, {
        empIds: nextEmpIds,
        enrolled: nextEmpIds.length
      });
      // Clear enroll search text for this course
      setEnrollSearchMap(prev => ({ ...prev, [courseId]: '' }));
      setSuccessMessage('تم قيد وإدراج الموظف في الدورة التدريبية ومزامنته فورياً! 🇸🇦');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('عذراً، فشلت عملية ربط الموظف في البرنامج');
    }
  };

  const handleUnenrollEmployee = async (courseId: string, empId: string) => {
    const course = trainings.find(c => c.id === courseId);
    if (!course) return;

    const currentEmpIds = course.empIds || [];
    const nextEmpIds = currentEmpIds.filter(id => id !== empId);
    try {
      await updateTraining(courseId, {
        empIds: nextEmpIds,
        enrolled: nextEmpIds.length
      });
      setSuccessMessage('تم إلغاء التزام الموظف التدريبية واستبعاده بنجاح.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert('فشل استبعاد الموظف');
    }
  };

  // Recharts Data Computations
  const coursesByCategoryData = useMemo(() => {
    const map: Record<string, { count: number; enrolled: number; budget: number }> = {};
    
    // Initialize standard categories
    availableCategories.forEach(cat => {
      map[cat] = { count: 0, enrolled: 0, budget: 0 };
    });

    trainings.forEach(t => {
      const cat = t.category || 'تقني';
      if (!map[cat]) {
        map[cat] = { count: 0, enrolled: 0, budget: 0 };
      }
      map[cat].count += 1;
      const participants = t.empIds ? t.empIds.length : (t.enrolled || 0);
      map[cat].enrolled += participants;
      map[cat].budget += (t.cost || 0);
    });

    return Object.keys(map).map(cat => ({
      name: cat,
      'البرامج المخططة': map[cat].count,
      'إجمالي المسجلين': map[cat].enrolled,
      'الميزانية المستثمرة': map[cat].budget
    })).filter(item => item['البرامج المخططة'] > 0 || item['إجمالي المسجلين'] > 0);
  }, [trainings]);

  const coursesByStatusData = useMemo(() => {
    const activeCount = trainings.filter(t => t.status === 'قادمة').length;
    const doneCount = trainings.filter(t => t.status === 'مكتملة').length;
    
    return [
      { name: 'برامج قادمة وجارية', value: activeCount, color: '#eab308' },
      { name: 'برامج مكتملة ومنجزة', value: doneCount, color: '#10b981' }
    ].filter(item => item.value > 0);
  }, [trainings]);

  return (
    <div className="space-y-6 text-right animate-slideup font-sans" id="training_development_workspace">
      
      {/* 🚀 Dynamic Statistics Hub Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">البرامج التدريبية</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {statistics.totalPrograms} <span className="text-xs font-bold text-slate-400">دورات</span>
            </h3>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-blue-500"></div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400"> برامج منجزة</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-800 tracking-tight">
              {statistics.completedPrograms} <span className="text-xs font-bold text-slate-400">مكتملة</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">شملت تسليم شهادات التأهيل</p>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">برامج جارية وقادمة</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-800 tracking-tight">
              {statistics.upcomingPrograms} <span className="text-xs font-bold text-slate-400">نشطة</span>
            </h3>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-amber-500"></div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">إجمالي الموظفين المدرجين</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-indigo-800 tracking-tight">
              {statistics.totalParticipants} <span className="text-xs font-bold text-slate-400">تسجيل</span>
            </h3>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-indigo-500"></div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">الاستثمار في كوادرنا</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md">
              <DollarSign className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {statistics.totalBudget.toLocaleString('en-US')} <span className="text-xs font-bold text-slate-400">ر.س</span>
            </h3>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-rose-500"></div>
        </div>

      </div>



      {/* Cloud DB Success banner notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 🧭 Horizontal navigation sub-tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-3xs">
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${
            activeTab === 'programs' 
              ? 'bg-slate-900 text-white font-extrabold shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab_programs"
        >
          <GraduationCap className="w-4 h-4" />
          الباقة والبرامج التأهيلية الجارية
          <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${activeTab === 'programs' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
            {trainings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-3 text-xs font-black transition-all flex items-center justify-center gap-2 border-none rounded-lg cursor-pointer ${
            activeTab === 'charts' 
              ? 'bg-slate-900 text-white font-extrabold shadow-sm' 
              : 'bg-transparent text-slate-500 hover:text-slate-950'
          }`}
          id="tab_charts"
        >
          <TrendingUp className="w-4 h-4" />
          مؤشرات الاستثمار التدريبي والعائد التدريبي
        </button>

      </div>

      {/* Tab 1: Programs List & Operations */}
      {activeTab === 'programs' && (
        <div className="space-y-6">
          
          {/* Action Row - Trigger Add Program or Edit program */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            
            {/* Filter Options */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              
              {/* Search Course input */}
              <div className="relative min-w-[200px] flex-1 md:flex-initial">
                <input
                  type="text"
                  placeholder="ابحث بالدورة، المدرب أو المحتوى..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pr-8 pl-3 py-2 text-xs text-slate-700 focus:border-gold outline-none"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>

              {/* Categorization filter */}
              <div className="min-w-[130px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="الكل">جميع التصنيفات</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="min-w-[130px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="الكل">كل الحالات الزمنية</option>
                  <option value="قادمة">برامج قادمة وجارية</option>
                  <option value="مكتملة">برامج منقضية ومكتملة</option>
                </select>
              </div>

              {/* Clear Filter Action */}
              {(searchTerm || categoryFilter !== 'الكل' || statusFilter !== 'الكل') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('الكل');
                    setStatusFilter('الكل');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-xl transition"
                >
                  إعادة تهيئة
                </button>
              )}

            </div>

            <div className="flex gap-2">
              {/* CSV Export */}
              <button
                onClick={handleExportTrainingCSV}
                className="bg-emerald-600 border-none hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shrink-0 transition"
                title="تصدير السجل الفعلي في مفردات Excel"
              >
                📊 تصدير Excel (CSV)
              </button>

              {/* Launch program button */}
              <button
                onClick={() => {
                  resetForm();
                  setIsFormOpen(!isFormOpen);
                }}
                className="bg-slate-900 border-none hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shrink-0 transition"
              >
                <Plus className="w-4 h-4 text-gold" />
                تدشين برنامج تدريبي جديد 🇸🇦
              </button>
            </div>
          </div>

          {/* Collapsible Creator/Editor Form */}
          {isFormOpen && (
            <div 
              id="course-form-element"
              className="bg-white border-2 border-slate-900 rounded-2xl shadow-md overflow-hidden animate-slideup"
            >
              <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-xs font-black">
                    {editingCourse ? `تعديل ومواءمة البرنامج: ${editingCourse.title}` : 'بناء وتدشين برنامج تدريبي قياسي'}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                  className="bg-transparent border-none text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  إلغاء ×
                </button>
              </div>

              <form onSubmit={handleSubmitCourse} className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Course Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">موضوع أو عنوان الدورة التدريبية</label>
                  <input
                    required
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثال: أساسيات الأمن السيبراني والامتثال لمنصة قوى"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">التصنيف الإداري / الفني</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none cursor-pointer"
                  >
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Trainer / Coaching org */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">اسم المدرب أو الجهة الموفرة</label>
                  <input
                    required
                    type="text"
                    value={formTrainer}
                    onChange={(e) => setFormTrainer(e.target.value)}
                    placeholder="مثال: المؤسسة العامة للتدريب التقني والمهني"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none"
                  />
                </div>

                {/* Date Calendar */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">تاريخ بدء وانطلاق الدورة</label>
                  <input
                    required
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">المدة الزمنية (أيام أو ساعات)</label>
                  <input
                    required
                    type="text"
                    value={formDur}
                    onChange={(e) => setFormDur(e.target.value)}
                    placeholder="مثال: 5 أيام (بمعدل 25 ساعة مخصصة)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none"
                  />
                </div>

                {/* Cost limit */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">تكلفة الدورة للموظف الواحد (ر.س)</label>
                  <input
                    required
                    type="number"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none"
                  />
                </div>

                {/* Venue / Location */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">مقر أو موضع إقامة الدورة</label>
                  <input
                    required
                    type="text"
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value)}
                    placeholder="مثال: أونلاين على زووم / مقر الإدارة بالعليا"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none"
                  />
                </div>

                {/* Initial Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-black text-slate-700">الحالة الزمنية للبرنامج</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormStatus('قادمة')}
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-black border cursor-pointer ${
                        formStatus === 'قادمة'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 font-extrabold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      مزمّعة وستبدأ قريباً
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStatus('مكتملة')}
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-black border cursor-pointer ${
                        formStatus === 'مكتملة'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      مكتملة وجرى تسليمها
                    </button>
                  </div>
                </div>

                {/* Additional notes/description */}
                <div className="md:col-span-3 space-y-1">
                  <label className="block text-xs font-black text-slate-700">التوصيف الكلي للحقيبة ومستخرجات الدورة (Objectives)</label>
                  <textarea
                    rows={2}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="اذكر المحاور الأساسية للبرنامج لتأهيل المتدرب وقياس مهاراته بعد الانقضاء..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-gold outline-none"
                  />
                </div>

                {/* PDF/Word File Upload */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-xs font-black text-slate-700">تحميل ملف الحقيبة أو مقرر الدورة التدريبية (PDF أو صور)</label>
                  <div className="border border-dashed border-slate-350 hover:border-emerald-600 rounded-xl p-3 bg-slate-50 hover:bg-slate-50/50 flex flex-col items-center justify-center relative cursor-pointer min-h-[90px]">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="text-center pointer-events-none space-y-1">
                      <span className="text-xl block">📋</span>
                      <p className="text-[11px] font-bold text-slate-700">اسحب ملف الحقيبة المعتمدة أو اضغط هنا لرفعه يدويًا</p>
                      <p className="text-[9.5px] text-slate-400">ملفات PDF أو صور (بحد أقصى 2 ميجابايت للتخزين الفوري المصدق)</p>
                      {formFileName && (
                        <div className="mt-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 border border-emerald-200">
                          <span>✓ تم إرفاق: {formFileName}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormFileData('');
                              setFormFileName('');
                            }}
                            className="bg-transparent border-none text-rose-500 hover:text-rose-700 cursor-pointer p-0 font-bold mr-1.5 text-xs"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submission CTA footer */}
                <div className="md:col-span-3 border-t border-slate-100 pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-white border border-slate-250 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 border-none rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    {isSubmitting ? 'جاري مزامنة قاعدة البيانات...' : 'حفظ وإرساء البرنامج التدريبي بالحوسبة'}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Cards Portfolio layout - with details integration and actual live links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.length === 0 ? (
              <div className="col-span-2 py-16 text-center bg-white border border-slate-200 rounded-2xl font-bold text-slate-400">
                لم يتم العثور على أي برامج تدريبية تطابق التصفية الحالية. يمكنك إضافة دورة تدريبية جديدة!
              </div>
            ) : (
              filteredCourses.map((t) => {
                const isExpanded = expandedCourseId === t.id;
                const isCompleted = t.status === 'مكتملة';
                const enrolledList = t.empIds || [];
                const displayEnrolledCount = Math.max(t.enrolled || 0, enrolledList.length);

                return (
                  <div 
                    key={t.id}
                    className={`bg-white border rounded-2xl hover:shadow-sm transition-all overflow-hidden ${
                      isExpanded ? 'border-indigo-400 ring-1 ring-indigo-100' : 'border-slate-200'
                    }`}
                  >
                    {/* Header bar of internal Training Card */}
                    <div className="p-4 border-b border-indigo-50/50 bg-slate-50/50 flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <span className="inline-block bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-black">
                          {t.category || 'تقني'}
                        </span>
                        <h4 className="text-xs font-black text-slate-800">{t.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <span>الجهة: {t.trainer || 'غير محدد'}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-550">{t.dur}</span>
                        </div>
                      </div>

                      {/* Status switch badge click toggles status immediately in Real DB */}
                      <button
                        onClick={() => handleToggleStatus(t.id, t.status)}
                        className={`px-3 py-1 text-[9.5px] font-bold rounded-full border cursor-pointer min-w-[80px] text-center shrink-0 transition ${
                          isCompleted
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700 font-black'
                        }`}
                        title="انقر لتغيير حالة البرنامج بشكل فوري بكلاود"
                      >
                        {isCompleted ? '✓ مكتملة' : '⏱ قادمة'}
                      </button>
                    </div>

                    {/* Quick Specs Body row */}
                    <div className="p-4 grid grid-cols-3 gap-2 text-right bg-white select-none">
                      
                      {/* Date */}
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">تاريخ الانطلاق</span>
                        </div>
                        <p className="text-[11px] font-black text-slate-700 font-mono mt-1">{t.date}</p>
                      </div>

                      {/* Cost limit */}
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-[10px] font-bold">رسوم مقدرة</span>
                        </div>
                        <p className="text-[11px] font-black text-slate-700 mt-1">
                          {t.cost ? `${t.cost.toLocaleString('ar-SA')} ر.س` : 'درع مجاني / مدعوم'}
                        </p>
                      </div>

                      {/* Location or Venue */}
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[10px] font-bold">المقر والقناة</span>
                        </div>
                        <p className="text-[11px] font-black text-slate-700 truncate mt-1" title={t.venue}>
                          {t.venue || 'المنصة الافتراضية'}
                        </p>
                      </div>

                    </div>

                    {/* Collapsible Enrolled Employees panel and Description */}
                    {isExpanded && (
                      <div className="border-t border-slate-150 p-4 bg-slate-50 space-y-4 animate-slideup">
                        
                        {/* Course Description */}
                        {t.desc && (
                          <div className="space-y-1">
                            <h5 className="text-[11px] font-extrabold text-slate-400 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              أهداف وحقيبة الدورة التأهيلية:
                            </h5>
                            <p className="text-[11px] text-slate-650 leading-relaxed font-semibold bg-white p-2.5 border border-slate-200 rounded-xl">
                              {t.desc}
                            </p>
                          </div>
                        )}

                        {/* Attached PDF document / Outline */}
                        {t.fileData && (
                          <div className="space-y-1.5">
                            <h5 className="text-[11px] font-extrabold text-slate-400 flex items-center gap-1.5">
                              📎 الحقيبة والملفات المرفقة:
                            </h5>
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = t.fileData!;
                                link.download = t.fileName || `${t.title.replace(/\s+/g, '_')}_outline.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 w-full justify-between"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                📄 <strong className="truncate font-mono">{t.fileName || 'ملف الحقيبة التدريبية.pdf'}</strong>
                              </span>
                              <span className="shrink-0 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md">تنزيل المستند 📥</span>
                            </button>
                          </div>
                        )}

                        {/* List of enrolled active Employees in this program */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h5 className="text-[11px] font-extrabold text-slate-400 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />
                              الكوادر المدرجة بالبرنامج ({displayEnrolledCount} أفراد):
                            </h5>
                            <span className="text-[9px] text-indigo-600 font-extrabold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                              ✓ مؤمنة فورياً بوزارة العمل
                            </span>
                          </div>

                          {enrolledList.length === 0 ? (
                            <div className="text-center py-5 bg-white border border-slate-205 rounded-xl text-[10.5px] text-slate-400 font-bold">
                              لم يتم ربط أو تسجيل أي موظف في هذا البرنامج حالياً. استخدم القائمة بالأسفل للربط الفوري!
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                              {enrolledList.map(empId => {
                                const matchedEmployee = employees.find(e => e.id === empId);
                                if (!matchedEmployee) {
                                  return (
                                    <div key={empId} className="flex justify-between items-center p-1.5 bg-slate-50 border border-slate-100 rounded text-[10px]">
                                      <span className="text-slate-400">موظف برقم وظيفي ({empId})</span>
                                      <button
                                        type="button" 
                                        onClick={() => handleUnenrollEmployee(t.id, empId)}
                                        className="p-1 text-slate-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                                        title="إلغاء قيد التسجيل"
                                      >
                                        <UserMinus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div 
                                    key={empId} 
                                    className="flex justify-between items-center p-1.5 bg-slate-50 hover:bg-indigo-50/50 border border-slate-150 rounded-lg text-[10px] transition"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-800 text-white text-[10px] font-black flex items-center justify-center">
                                        {matchedEmployee.name[0]}
                                      </div>
                                      <div className="text-right">
                                        {/* Direct Cross linking capability to Employee profile with clear indicator ↗ */}
                                        <button
                                          type="button"
                                          onClick={() => handleNavigateToEmployeeFile(empId)}
                                          className="p-0 bg-transparent border-none text-[10.5px] font-black text-slate-800 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                                          title="انتقل إلى ملف الموظف"
                                        >
                                          {matchedEmployee.name} ↗
                                        </button>
                                        <span className="text-[8.5px] text-slate-400 block font-semibold">
                                          {matchedEmployee.job} • {matchedEmployee.dept}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleUnenrollEmployee(t.id, empId)}
                                      className="p-1 text-slate-400 hover:text-red-500 bg-transparent border-none transition-transform hover:scale-115 cursor-pointer"
                                      title="استبعاد وإلغاء تسجيل الموظف"
                                    >
                                      <UserMinus className="w-3.5 h-3.5 text-red-400" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Interactive Dropdown Search to enroll active employee */}
                        <div className="space-y-1">
                          <label className="block text-[10.5px] font-black text-slate-500">
                            + إلحاق وربط موظف جديد بهذا البرنامج:
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={enrollSearchMap[t.id] || ''}
                              onChange={(e) => setEnrollSearchMap(prev => ({ ...prev, [t.id]: e.target.value }))}
                              className="flex-1 bg-white border border-slate-250 rounded-lg px-2.5 py-1.8 text-[11px] text-slate-700 outline-none focus:border-indigo-400 cursor-pointer"
                            >
                              <option value="">-- اختر موظفاً لإلحاقه بالقائمة التدريبية --</option>
                              {employees
                                .filter(e => e.status !== 'موقوف' && !enrolledList.includes(e.id))
                                .map(e => (
                                  <option key={e.id} value={e.id}>
                                    {e.name} ({e.job} - {e.dept})
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleEnrollEmployee(t.id, enrollSearchMap[t.id] || '')}
                              className="px-4 py-1.5 bg-slate-900 border-none hover:bg-slate-800 text-white text-[10.5px] font-black rounded-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <UserPlus className="w-3.5 h-3.5 text-gold" />
                              إدراج
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Operational Actions bar on bottom */}
                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex justify-between items-center">
                      
                      {/* Toggle Collapse */}
                      <button
                        onClick={() => setExpandedCourseId(isExpanded ? null : t.id)}
                        className="p-1 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded bg-transparent text-xs font-bold transition flex items-center gap-1. cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            إغلاق التفاصيل والمسجلين
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          </>
                        ) : (
                          <>
                            تفاصيل وموظفي الحقيبة ({displayEnrolledCount})
                            <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                          </>
                        )}
                      </button>

                      {/* Controls */}
                      <div className="flex gap-2">
                        {/* Edit Course details */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-450 hover:text-slate-700 border border-slate-200 rounded transition cursor-pointer"
                          title="تعديل تفاصيل وأوقات وهدف الحقيبة"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete course document from real DB */}
                        <button
                          onClick={() => handleDeleteCourse(t.id)}
                          className="p-1.5 bg-white hover:bg-rose-50 text-slate-350 hover:text-rose-600 border border-slate-200 rounded transition cursor-pointer"
                          title="حذف وإلغاء هذا البرنامج تماماً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* Tab 2: Recharts Advanced Analytics charts */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-black text-slate-800">جداول ومخططات الاستثمار التدريبي الفعلي</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">مخططات إحصائية حية مستوحاة ومطابقة لمدخلات السحابة التدريبية</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Enrolled Employees by Course Category */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
              <h5 className="text-xs font-black text-slate-750 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                توزيع الكوادر البشرية المستفيدة على حسب التخصص
              </h5>
              
              <div className="h-68 font-mono">
                {coursesByCategoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                    أدخل برامج وموظفين لاستعراض الرسوم البيانية الفورية
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coursesByCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => `${value} مشارك`} />
                      <Bar dataKey="إجمالي المسجلين" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Budget Distribution by Category */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
              <h5 className="text-xs font-black text-slate-750 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                توزيع الميزانيات المالية المستثمرة حسب فئة البرنامج
              </h5>
              
              <div className="h-68 font-mono">
                {coursesByCategoryData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                    لا توجد بيانات استثمارية مسجلة لعرضها
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coursesByCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value) => `${value.toLocaleString('ar-SA')} ر.س`} />
                      <Bar dataKey="الميزانية المستثمرة" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Status Breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3 lg:col-span-2">
              <h5 className="text-xs font-black text-slate-750 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                نسبة إنجاز وتقويم المحفظة التدريبية وعقود الموردين
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                
                {/* Recharts Pie component */}
                <div className="h-52 font-mono md:col-span-2 relative">
                  {coursesByStatusData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                      أدخل كلاسات تدريبية لتفصيل مؤشر الإنجاز
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={coursesByStatusData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {coursesByStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {/* Absolute Center rating */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[20px] font-black text-slate-800">
                      {trainings.length}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">مجموع الدورات</span>
                  </div>
                </div>

                {/* Status legend indicators */}
                <div className="space-y-3 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                  <h6 className="text-[11px] font-black text-slate-400">حالة الدورات الفعّالة:</h6>
                  {coursesByStatusData.map((item, idx) => {
                    const pct = trainings.length ? ((item.value / trainings.length) * 100).toFixed(0) : '0';
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="text-slate-800 font-extrabold font-mono">{item.value} دورة ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>

        </div>
      )}


    </div>
  );
};
