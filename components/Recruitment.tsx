/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { 
  Briefcase, 
  Users, 
  UserCheck, 
  Smile, 
  Star, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Printer, 
  Download, 
  RefreshCw, 
  FileText, 
  Calendar, 
  Building, 
  Award, 
  BookOpen, 
  HeartHandshake, 
  MapPin, 
  Sparkles, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Candidate, RecruitmentJob, Employee } from '../types';

export const Recruitment: React.FC = () => {
  const { 
    jobs, 
    candidates, 
    employees,
    addJob, 
    updateJob, 
    deleteJob,
    addCandidate, 
    updateCandidate, 
    deleteCandidate, 
    addEmployee,
    setCurrentView,
    setSelectedEmployeeId,
    setEmployeeFileTab
  } = useHR();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'candidates' | 'jobs' | 'compliance'>('candidates');

  // Search and Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateJobFilter, setCandidateJobFilter] = useState('الكل');
  const [candidateStageFilter, setCandidateStageFilter] = useState('الكل');
  
  const [jobSearch, setJobSearch] = useState('');
  const [jobDeptFilter, setJobDeptFilter] = useState('الكل');
  const [jobStatusFilter, setJobStatusFilter] = useState('الكل');

  // Add Job Form State
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDept, setNewJobDept] = useState('تقنية المعلومات');
  const [newJobStatus, setNewJobStatus] = useState<'مفتوحة' | 'مغلقة'>('مفتوحة');
  const [newJobStage, setNewJobStage] = useState('فرز السير الذاتية');
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Add Candidate Form State
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [newCandName, setNewCandName] = useState('');
  const [newCandJobId, setNewCandJobId] = useState('');
  const [newCandStage, setNewCandStage] = useState('فرز السير الذاتية');
  const [newCandRating, setNewCandRating] = useState(3);
  const [isSubmittingCand, setIsSubmittingCand] = useState(false);

  // Contracting / Hire Form State for a candidate
  const [hiringCandidate, setHiringCandidate] = useState<Candidate | null>(null);
  const [hireBasicSalary, setHireBasicSalary] = useState<number>(5000);
  const [hireAllowance, setHireAllowance] = useState<number>(1500);
  const [hireDate, setHireDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hireContractType, setHireContractType] = useState<string>('دوام كامل');
  const [hireNationality, setHireNationality] = useState<'saudi' | 'expat'>('saudi');
  const [isHiringSubmit, setIsHiringSubmit] = useState(false);
  const [hireSuccessMsg, setHireSuccessMsg] = useState(false);

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalOpenJobs = jobs.filter(j => j.status === 'مفتوحة').length;
    const totalCandidatesCount = candidates.length;
    const candidatesInInterviews = candidates.filter(c => 
      ['مقابلة أولى', 'مقابلة نهائية', 'عرض عمل'].includes(c.stage)
    ).length;
    const itemsHired = candidates.filter(c => c.stage === 'تم التعيين والتعاقد').length;

    // Estimate Saudization percentage based on existing employees
    const saudiCount = employees.filter(e => {
      // Heuristic indicator: check if basic salary is >= 4000 or general stats
      return e.salary >= 4000 && e.status !== 'موقوف';
    }).length;
    const totalActiveEmp = employees.filter(e => e.status !== 'موقوف').length;
    const saudizationRate = totalActiveEmp ? Math.round((saudiCount / totalActiveEmp) * 100) : 40;

    return {
      totalOpenJobs,
      totalCandidatesCount,
      candidatesInInterviews,
      itemsHired,
      saudizationRate
    };
  }, [jobs, candidates, employees]);

  // Candidates stages in standard recruiter flow
  const recruitmentStages = [
    'فرز السير الذاتية',
    'اختبار فني',
    'مقابلة أولى',
    'مقابلة نهائية',
    'تقديم عرض العمل',
    'تم التعيين والتعاقد',
    'مرفوض'
  ];

  const departments = [
    'تقنية المعلومات',
    'الموارد البشرية',
    'المالية',
    'التسويق',
    'المبيعات',
    'العمليات'
  ];

  // Filters candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(candidateSearch.toLowerCase());
      const matchesJob = candidateJobFilter === 'الكل' || c.jobId === candidateJobFilter;
      const matchesStage = candidateStageFilter === 'الكل' || c.stage === candidateStageFilter;
      return matchesSearch && matchesJob && matchesStage;
    });
  }, [candidates, candidateSearch, candidateJobFilter, candidateStageFilter]);

  // Filters jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchesSearch = j.title.toLowerCase().includes(jobSearch.toLowerCase());
      const matchesDept = jobDeptFilter === 'الكل' || j.dept === jobDeptFilter;
      const matchesStatus = jobStatusFilter === 'الكل' || j.status === jobStatusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [jobs, jobSearch, jobDeptFilter, jobStatusFilter]);

  // Submit Job Vacancy
  const handleCreateJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim()) return;

    setIsSubmittingJob(true);
    try {
      await addJob({
        title: newJobTitle,
        dept: newJobDept,
        applicants: 0,
        stage: newJobStage,
        status: newJobStatus
      });
      setNewJobTitle('');
      setIsAddJobOpen(false);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء إضافة الوظيفة');
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Submit Candidate Profile
  const handleCreateCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandName.trim() || !newCandJobId) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmittingCand(true);
    try {
      await addCandidate({
        name: newCandName,
        jobId: newCandJobId,
        stage: newCandStage,
        rating: newCandRating
      });

      // Update applicant count in job schema dynamically
      const targetJob = jobs.find(j => j.id === newCandJobId);
      if (targetJob) {
        await updateJob(newCandJobId, {
          applicants: (targetJob.applicants || 0) + 1
        });
      }

      setNewCandName('');
      setIsAddCandidateOpen(false);
    } catch (err) {
      console.error(err);
      alert('خطأ أثناء إضافة المرشح');
    } finally {
      setIsSubmittingCand(false);
    }
  };

  // Update Candidate Stage Live
  const handleUpdateCandidateStage = async (id: string, stage: string) => {
    try {
      await updateCandidate(id, { stage });
    } catch (err) {
      console.error(err);
      alert('فشل تحديث مرحلة المرشح في قاعدة البيانات');
    }
  };

  // Update Candidate Rating Live
  const handleUpdateCandidateRating = async (id: string, rating: number) => {
    try {
      await updateCandidate(id, { rating });
    } catch (err) {
      console.error(err);
      alert('فشل تحديث التقييم في قاعدة البيانات');
    }
  };

  // Onboarding / Contract Accepting Function
  const handleFinalizeContractAndHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiringCandidate) return;

    setIsHiringSubmit(true);
    try {
      // 1. Resolve targeted job
      const originalJob = jobs.find(j => j.id === hiringCandidate.jobId);
      const title = originalJob ? originalJob.title : 'موظف تعاقدي جديد';
      const dept = originalJob ? originalJob.dept : 'العمليات';

      // 2. Invoke real system addEmployee to initialize Employee profile, Contract, and Deductions!
      await addEmployee({
        name: hiringCandidate.name,
        job: title,
        dept: dept,
        salary: hireBasicSalary,
        allow: hireAllowance,
        deduct: 0,
        status: 'نشط',
        hire: hireDate,
        leaveBalance: 21,
        perf: 5
      });

      // 3. Update candidate stage in database to 'تم التعيين والتعاقد'
      await updateCandidate(hiringCandidate.id, { stage: 'تم التعيين والتعاقد' });

      setHireSuccessMsg(true);
      setTimeout(() => {
        setHireSuccessMsg(false);
        setHiringCandidate(null);
      }, 2500);

    } catch (err) {
      console.error(err);
      alert('خطأ أثناء إتمام إجراءات التعاقد وحفظ البيانات بالكلاود');
    } finally {
      setIsHiringSubmit(false);
    }
  };

  // Delete Candidate Card
  const handleDeleteCandidateCard = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف ملف هذا المرشح تماماً من الكلاود؟')) return;
    try {
      await deleteCandidate(id);
    } catch (err) {
      console.error(err);
      alert('فشل حذف المرشح');
    }
  };

  // Delete Job Openings
  const handleDeleteJobOpening = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء وحذف هذه الفرصة وجميع مراحلها المعتمدة؟')) return;
    try {
      await deleteJob(id);
    } catch (err) {
      console.error(err);
      alert('فشل حذف الوظيفة الشاغرة');
    }
  };

  // Jump to Employees profile for checking and confirmation
  const handleNavigateToCreatedEmployee = (name: string) => {
    const created = employees.find(emp => emp.name === name);
    if (created) {
      setSelectedEmployeeId(created.id);
      setEmployeeFileTab('general');
      setCurrentView('empfiles');
    } else {
      setCurrentView('empfiles');
    }
  };

  return (
    <div className="space-y-6 text-right animate-slideup font-sans" id="recruitment_main_screen">
      
      {/* 📊 Premium Dynamic Metics Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Open Vacancies */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">الوظائف الشاغرة المفتوحة</span>
            <div className="p-1.5 bg-gold-bg text-gold rounded-full">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
              {metrics.totalOpenJobs} <span className="text-xs font-normal text-slate-450">فرص شاغرة</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
              الوظائف النشطة عبر بوابة الموارد وقوى
            </p>
          </div>
        </div>

        {/* KPI 2: Total Active Candidates */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">إجمالي طلبات المرشحين</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-full">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
              {metrics.totalCandidatesCount} <span className="text-xs font-normal text-slate-450">طلب سيرة</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5">
              الملفات المفحوصة والمقابلة باللجان
            </p>
          </div>
        </div>

        {/* KPI 3: Undergoing Interviews */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">في مرحلة المقابلات الفعّالة</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-full">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-blue-800 font-sans tracking-tight">
              {metrics.candidatesInInterviews} <span className="text-xs font-normal text-blue-400">أفراد</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5">
              مرحلة المقابلة الأولى، النهائية والعروض الرسمية
            </p>
          </div>
        </div>

        {/* KPI 4: Successful Contracting & Onboarding */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400">معدل التعاقدات والتعيين</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-emerald-700 font-sans tracking-tight">
              {metrics.itemsHired} <span className="text-xs font-normal text-emerald-400">تم تعيينهم</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1.5">
              مرشحين تم نقلهم تلقائياً لقسم الموظفين النشطين
            </p>
          </div>
        </div>

      </div>

      
      {/* 🧭 Screen Tab Options Controller */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-5 py-3.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'candidates' 
              ? 'border-gold text-slate-900 font-extrabold font-sans' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
          id="tab_candidates"
        >
          <Users className="w-4 h-4 text-slate-450" />
          حقيبة فرز وتقييم المرشحين القائمين
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600 font-sans">
            {candidates.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-5 py-3.5 text-xs font-black transition-all flex items-center gap-2 border-b-2 bg-transparent cursor-pointer ${
            activeTab === 'jobs' 
              ? 'border-gold text-slate-900 font-extrabold font-sans' 
              : 'border-transparent text-slate-450 hover:text-slate-700'
          }`}
          id="tab_jobs"
        >
          <Briefcase className="w-4 h-4 text-slate-450" />
          بوابة الوظائف الشاغرة وهرم الطلبات
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600 font-sans">
            {jobs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Candidates Management */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          
          {/* Candidates Filter and search */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700">تصفية وبحث قاعدة بيانات المرشحين والتعيين</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">فرز الكفاءات، مراجعة التقييم ونقلهم كعقود عمل نشطة بالمنشأة</p>
              </div>
              
              <button
                type="button"
                onClick={() => setIsAddCandidateOpen(true)}
                className="px-4 py-2 bg-gold text-slate-900 border-none rounded-lg text-xs font-bold hover:bg-gold/80 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                تسجيل مرشح جديد بقاعدة الكلاود
              </button>
            </div>

            {/* Selection inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {/* Search text */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث باسم المرشح..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-8 pl-3 py-2 text-xs text-slate-700 focus:border-gold outline-none font-sans"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>

              {/* Filter by Job offer */}
              <div>
                <select
                  value={candidateJobFilter}
                  onChange={(e) => setCandidateJobFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">كل فرص العمل والوظائف</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.dept})</option>
                  ))}
                </select>
              </div>

              {/* Filter by recruiter Flow Stage */}
              <div>
                <select
                  value={candidateStageFilter}
                  onChange={(e) => setCandidateStageFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">كل المراحل التصفوية</option>
                  {recruitmentStages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Hiring Contract Form Panel when dynamic Hiring is active */}
          {hiringCandidate && (
            <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-600/10 border-2 border-gold-border rounded-xl p-5 shadow-md space-y-4 animate-slideup">
              <div className="flex justify-between items-start border-b border-gold-border pb-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-gold" />
                    استكمال وبث عقد العمل الموحد وتنسيب المرشح: {hiringCandidate.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    المرشح التابع لوظيفة (<strong>{jobs.find(j => j.id === hiringCandidate.jobId)?.title || 'وافدة'}</strong>). باعتمادك العقد سيتم تلقائياً إنشاء كود ملف وظيفي متكامل وبث بياناته للتأمينات والمسيرات.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHiringCandidate(null)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 rounded text-xs shrink-0 cursor-pointer"
                >
                  إلغاء التعيين
                </button>
              </div>

              {hireSuccessMsg ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />
                  <div>
                    <strong>تهانينا! لقد تم إقرار عقد العمل ودمج الكفاءة بنجاح بالشبكة:</strong> تم إدراج الموظف مباشرة في جدول الكفاءات الفعّالة، بمسير راتب وظيفي يبلغ {(hireBasicSalary + hireAllowance).toLocaleString()} ر.س مع تمكين البنود الأساسية بالاتحاد والامتثال لقوى ومكتب العمل.
                    <button
                      onClick={() => handleNavigateToCreatedEmployee(hiringCandidate.name)}
                      className="block text-indigo-600 underline font-bold mt-2 text-right text-[11px] hover:text-indigo-800"
                    >
                      اضغط هنا للانتقال مباشرة لملف الموظف الجديد ومطابقة وثائقه ↗
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFinalizeContractAndHire} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                  
                  {/* Nationality selection (Saudi / Expat) */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 block">الجنسية والامتثال</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHireNationality('saudi');
                          setHireBasicSalary(4000); // Qiwa Full point Saudization is standard 4000
                        }}
                        className={`flex-1 py-1.8 text-center rounded text-[11px] font-bold border cursor-pointer ${
                          hireNationality === 'saudi' 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold' 
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        سعودي 🇸🇦
                      </button>
                      <button
                        type="button"
                        onClick={() => setHireNationality('expat')}
                        className={`flex-1 py-1.8 text-center rounded text-[11px] font-bold border cursor-pointer ${
                          hireNationality === 'expat' 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 font-extrabold' 
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        مقيم وافد 🌍
                      </button>
                    </div>
                  </div>

                  {/* Basic Salary */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 block">الراتب الأساسي المعتمد (ر.س)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={hireBasicSalary}
                      onChange={(e) => setHireBasicSalary(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-xs text-slate-700 focus:border-gold outline-none"
                    />
                    {hireNationality === 'saudi' && hireBasicSalary < 4000 && (
                      <span className="block text-[9.5px] text-amber-600 font-semibold" title="أقل من 4000 ر.س يمنح المنشأة نصف نقطة في نطاقات التوطين">⚠️ التوطين لكامل القوى يحتاج 4000+ ر.س</span>
                    )}
                  </div>

                  {/* Transport / Housing Allowance */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 block">البدلات والمزايا (سكن + نقل)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={hireAllowance}
                      onChange={(e) => setHireAllowance(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-xs text-slate-700 focus:border-gold outline-none"
                    />
                  </div>

                  {/* Onboarding Start Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 block">تاريخ بداية مباشرة الموظف</label>
                    <input
                      type="date"
                      required
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:border-gold outline-none"
                    />
                  </div>

                  {/* Contract Type */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-650 block">نوع عقد الموظف الموحد</label>
                    <select
                      value={hireContractType}
                      onChange={(e) => setHireContractType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs text-slate-700 focus:border-gold outline-none cursor-pointer"
                    >
                      <option value="دوام كامل">دوام كامل (كامل الميزات والاشتراك)</option>
                      <option value="دوام جزئي">دوام جزئي (ساعات مرنة)</option>
                      <option value="عقد محدد المدة">عقد محدد المدة / مواسم</option>
                    </select>
                  </div>

                  {/* Information and submission button */}
                  <div className="md:col-span-4 flex justify-between items-center bg-white border border-amber-200 rounded p-3 mt-1 text-[10.5px]">
                    <div className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                      🔍 <strong>ملحوظة التأمين الصحي ودعم الموارد البشرية (هدف):</strong> عند إقرار التعيين الفعلي، يتم تلقائياً تفعيل استقطاع GOSI بنسبة 9.75% للسعوديين، وتلقائياً يُفتح مسار التأمينات الطبية. سيتمكن الموظف من سحب الرواتب دورياً بموجب نظام حماية الأجور الوزاري.
                    </div>
                    <button
                      type="submit"
                      disabled={isHiringSubmit}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                    >
                      <FileCheck className="w-4 h-4" />
                      {isHiringSubmit ? 'جاري توثيق قوى وحكومة الموظف...' : 'اعتماد العقد وإقرار التعيين المباشر'}
                    </button>
                  </div>

                </form>
              )}
            </div>
          )}

          {/* Candidates Index Table Grid */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex justify-between items-center flex-wrap">
              <h5 className="text-xs font-black text-slate-700">سجل المرشحين والمتقدمين الفعليين من خادم قواعد البيانات</h5>
              <span className="text-[10px] text-slate-400 font-medium">مجموع التصفية الحالي: ({filteredCandidates.length}) مرشح من الكلاود</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">اسم وبيانات المرشّح الفعلي</th>
                    <th className="p-4">المنصب المتقدّم عليه</th>
                    <th className="p-4">الجودة والتقييم الفني (رأي اللجنة)</th>
                    <th className="p-4">سير التقدم ومرحلة المقابلة الحالية</th>
                    <th className="p-4 text-center">الإجراءات والتعاقد الفعلي للكلاود</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-450 font-bold">
                        لم يتم العثور على أي ملف مرشح بقاعدة البيانات يطابق معايير وتصفية البحث الحالي.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c) => {
                      const jobObj = jobs.find(x => x.id === c.jobId);
                      const isHired = c.stage === 'تم التعيين والتعاقد';
                      const isRejected = c.stage === 'مرفوض';

                      return (
                        <tr 
                          key={c.id} 
                          className={`hover:bg-slate-50/50 transition-colors ${
                            isHired ? 'bg-emerald-50/20 text-emerald-900 border-r-4 border-r-emerald-500' : ''
                          } ${
                            isRejected ? 'bg-rose-50/15 text-rose-800' : ''
                          }`}
                        >
                          {/* Name avatar with status */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-dim to-gold flex items-center justify-center text-white text-xs font-black shrink-0 shadow-2xs">
                                {c.name[0]}
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-black text-slate-800 block">{c.name}</span>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <span>مرشح خارجي</span>
                                  <span>•</span>
                                  <span className="text-indigo-600 font-bold">ID: {c.id}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Applied job position */}
                          <td className="p-4 font-bold text-slate-700">
                            {jobObj ? jobObj.title : 'منصب مستجد أو غير مسجل'}
                            <span className="block text-[9.5px] text-slate-400 font-semibold mt-0.5">{jobObj ? jobObj.dept : 'القسم المتاح'}</span>
                          </td>

                          {/* Evaluation / Rating with active stars that update the DB! */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <div className="flex text-amber-500 text-xs">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleUpdateCandidateRating(c.id, star)}
                                    className="p-0 bg-transparent border-0 hover:scale-130 transition text-amber-500 cursor-pointer text-xs"
                                    title={`تقييم بالنجم المباشر: ${star}/5`}
                                  >
                                    {star <= c.rating ? '★' : '☆'}
                                  </button>
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-400">({c.rating}/5)</span>
                            </div>
                            <span className="block text-[8.5px] text-slate-400 mt-1">اضغط على النجوم لتحديث التقييم في قاعدة البيانات</span>
                          </td>

                          {/* Recruiter lifecycle stage select that updates the DB! */}
                          <td className="p-4">
                            <select
                              value={c.stage}
                              onChange={(e) => handleUpdateCandidateStage(c.id, e.target.value)}
                              className={`text-[11px] font-bold px-2 py-1.2 rounded-lg border outline-none cursor-pointer ${
                                isHired 
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-black' 
                                  : isRejected 
                                  ? 'bg-rose-50 border-rose-300 text-rose-800'
                                  : c.stage === 'تقديم عرض العمل'
                                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              {recruitmentStages.map(stg => (
                                <option key={stg} value={stg}>{stg}</option>
                              ))}
                            </select>
                          </td>

                          {/* Direct Actions and Contracting */}
                          <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              
                              {/* Open Contracting Dialog if not already hired */}
                              {!isHired ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setHiringCandidate(c);
                                    // Reset standard presets
                                    setHireBasicSalary(originalJob => 5000);
                                    setHireAllowance(1500);
                                  }}
                                  className="px-2.5 py-1.8 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs"
                                  title="توقيع عقد العمل ونقله تلقائياً لقسم الموظفين النشطين"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  توثيق عقد والتعيين 🇸🇦
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleNavigateToCreatedEmployee(c.name)}
                                  className="px-2.5 py-1.8 bg-emerald-100 text-emerald-800 border-none rounded text-[10px] font-black transition flex items-center gap-1 cursor-pointer"
                                  title="شاهد ورقة التأمين وتفاصيل مسير هذا الموظف الجديد"
                                >
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                                  تفاصيل الموظف المعين
                                </button>
                              )}

                              {/* Delete Profile */}
                              <button
                                type="button"
                                onClick={() => handleDeleteCandidateCard(c.id)}
                                className="p-1.8 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded transition cursor-pointer"
                                title="حذف طلب المرشح نهائياً من قاعدة البيانات"
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

      {/* Tab 2: Vacancy Management */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          
          {/* Job Search bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs space-y-3">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-700">تصفية وبحث الوظائف والمنشآت الشاغرة</h4>
                <p className="text-[10px] text-slate-405 mt-0.5">مراقبة احتياجات الهيكل التنظيمي وفتح وإغلاق مسارات الاستقطاب</p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddJobOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-none rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-gold" />
                إعلان عن وظيفة شاغرة جديدة بالمنشأة
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
              {/* Search Job */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث بمسمى الوظيفة الشاغرة..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-8 pl-3 py-2 text-xs text-slate-705 focus:border-gold outline-none font-sans"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>

              {/* Department */}
              <div>
                <select
                  value={jobDeptFilter}
                  onChange={(e) => setJobDeptFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">كل أقسام المنشأة</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="الكل">جميع الحالات (مفتوحة ومغلقة)</option>
                  <option value="مفتوحة">مفتوحة للتقديم نشط</option>
                  <option value="مغلقة">مغلقة ومستكفية</option>
                </select>
              </div>

            </div>
          </div>

          {/* Job Openings Grid Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/75 flex justify-between items-center flex-wrap">
              <h5 className="text-xs font-black text-slate-700">احتياج الهيكل التنظيمي وشغل الوظائف المفتوحة</h5>
              <span className="text-[10px] text-slate-400 font-medium">مجموع التصفية: ({filteredJobs.length}) وظيفة من قواعد البيانات</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-4">المسمى الوظيفي الشاغر</th>
                    <th className="p-4">القسم والقطاع المالي</th>
                    <th className="p-4">عدد الطلبات المقدمة</th>
                    <th className="p-4">المرحلة الاستقطابية المفترضة</th>
                    <th className="p-4">حالة البث النشط</th>
                    <th className="p-4 text-center">خدمات التحكم والحذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-450 font-bold">
                        لم يتم العثور على أي وظائف شاغرة بالمنشأة تتطابق مع مدخلات البحث الحالية.
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((j) => {
                      const totalApplicantsForThisJob = candidates.filter(cand => cand.jobId === j.id).length;

                      return (
                        <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Title */}
                          <td className="p-4 font-black text-slate-800">
                            {j.title}
                            <span className="block text-[9px] text-indigo-600 font-mono mt-0.5">Job ID: {j.id}</span>
                          </td>

                          {/* Sector */}
                          <td className="p-4 text-slate-500 font-bold font-sans">
                            {j.dept}
                          </td>

                          {/* Applicants Count */}
                          <td className="p-4">
                            <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2 py-1 rounded text-[11px]">
                              {totalApplicantsForThisJob} متقدمين فعليين
                            </span>
                            <span className="block text-[9.5px] text-slate-400 mt-1">تزامن تلقائي من سلات التقديم</span>
                          </td>

                          {/* Default onboarding stage */}
                          <td className="p-4 text-slate-650 font-bold">
                            {j.stage || 'فرز السير الذاتية'}
                          </td>

                          {/* Live Status Select */}
                          <td className="p-4">
                            <select
                              value={j.status}
                              onChange={async (e) => {
                                try {
                                  await updateJob(j.id, { status: e.target.value as 'مفتوحة' | 'مغلقة' });
                                } catch (err) {
                                  console.error(err);
                                  alert('خطأ أثناء التعديل');
                                }
                              }}
                              className={`text-[10.5px] font-black px-2 py-1 rounded border outline-none cursor-pointer ${
                                j.status === 'مفتوحة'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-rose-50 border-rose-200 text-rose-800'
                              }`}
                            >
                              <option value="مفتوحة">نشطة للتقديم (مفتوحة)</option>
                              <option value="مغلقة">مأهولة بالكامل (مغلقة)</option>
                            </select>
                          </td>

                          {/* Action Delete */}
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteJobOpening(j.id)}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded transition cursor-pointer"
                              title="حذف الوظيفة الشاغرة وجميع متعلقاتها من الكلاود"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      

      {/* dialog / Modal: Add vacancy job */}
      {isAddJobOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-right animate-slideup space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Briefcase className="w-4.5 h-4.5 text-gold" />
                إعلان عن فرصة عمل شاغرة جديدة الكلاود
              </h3>
              <button
                type="button"
                onClick={() => setIsAddJobOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJobSubmit} className="space-y-4 text-xs">
              {/* Job Title */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">المسمى الوظيفي الشاغر</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مهندس برمجيات أول، منسق تسويق"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:border-gold outline-none"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">القسم والقطاع التنظيمي</label>
                <select
                  value={newJobDept}
                  onChange={(e) => setNewJobDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Default Evaluation Stage */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">المرحلة الأساسية المفتوحة للتقديم</label>
                <select
                  value={newJobStage}
                  onChange={(e) => setNewJobStage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  {recruitmentStages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Job Status */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">حالة البث للوظيفة</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="jobStatus"
                      checked={newJobStatus === 'مفتوحة'}
                      onChange={() => setNewJobStatus('مفتوحة')}
                      className="cursor-pointer"
                    />
                    <span>شاغرة ومفتوحة للتقديم</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="jobStatus"
                      checked={newJobStatus === 'مغلقة'}
                      onChange={() => setNewJobStatus('مغلقة')}
                      className="cursor-pointer"
                    />
                    <span>مغلقة واستكفائية</span>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="px-4 py-2 bg-gold hover:bg-gold/85 text-slate-900 border-none rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmittingJob ? 'جاري بث الإعلان...' : 'نشر الوظيفة لقاعدة الكلاود'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddJobOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  إلغاء التراجع
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* dialog / Modal: Add Candidate */}
      {isAddCandidateOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-right animate-slideup space-y-4">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-gold" />
                تسجيل مرشح ومتقدم جديد لقواعد البيانات
              </h3>
              <button
                type="button"
                onClick={() => setIsAddCandidateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCandidateSubmit} className="space-y-4 text-xs font-sans">
              
              {/* Candidate Name */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">اسم المرشّح الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ماجد بن عبد العزيز العتيبي"
                  value={newCandName}
                  onChange={(e) => setNewCandName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-705 focus:border-gold outline-none"
                />
              </div>

              {/* Target Job opening */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">الوظيفة والفرصة المستهدفة</label>
                <select
                  required
                  value={newCandJobId}
                  onChange={(e) => setNewCandJobId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  <option value="">اطلب الوظيفة المستهدفة...</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} — {j.dept}</option>
                  ))}
                </select>
              </div>

              {/* Selection Stage */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">محطة المقابلات والفرز كبداية</label>
                <select
                  value={newCandStage}
                  onChange={(e) => setNewCandStage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none focus:border-gold cursor-pointer"
                >
                  {recruitmentStages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Technical Star Rating */}
              <div className="space-y-1">
                <label className="font-extrabold text-slate-600 block">التقييم والترشيح الفني من اللجنة (1-5)</label>
                <select
                  value={newCandRating}
                  onChange={(e) => setNewCandRating(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-705 outline-none focus:border-gold cursor-pointer"
                >
                  <option value={1}>★☆☆☆☆ نجمة واحدة (مقبول ضعيف)</option>
                  <option value={2}>★★☆☆☆ نجمتين (متوسط المهارات)</option>
                  <option value={3}>★★★☆☆ 3 نجوم (جيد وملائم للمهنة)</option>
                  <option value={4}>★★★★☆ 4 نجوم (كفاءة متميزة جداً)</option>
                  <option value={5}>★★★★★ 5 نجوم (خيار مثالي ونادر)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmittingCand || jobs.length === 0}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border-none rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-gold" />
                  {isSubmittingCand ? 'جاري تسجيل الطلب...' : 'إضافة المرشح للكلاود'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCandidateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                >
                  تراجع
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
