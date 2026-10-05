/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { Employee, Task } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import {
  Plus,
  Trash2,
  CheckCircle,
  Calendar,
  Filter,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  Users,
  Search,
  CheckSquare,
  Tag,
  ChevronDown,
  User,
  Folder,
  ExternalLink,
  FileText,
  Sparkles,
  Layers,
  AlertTriangle,
  Info,
  Sliders,
  Play,
  RotateCw,
  Building,
  ArrowUpRight,
  CheckCheck,
  HelpCircle
} from 'lucide-react';

export const TasksManager: React.FC = () => {
  const {
    employees,
    tasks,
    addTask,
    updateTask,
    deleteTask,
    setCurrentView,
    setSelectedEmployeeId
  } = useHR();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Form states for adding new task
  const [newTitle, setNewTitle] = useState('');
  const [newAssigned, setNewAssigned] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'med' | 'low'>('med');
  const [newDesc, setNewDesc] = useState('');
  const [newDue, setNewDue] = useState(() => {
    // Default to 5 days from now
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [newServiceType, setNewServiceType] = useState<'internal' | 'external'>('internal');
  const [newServiceName, setNewServiceName] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Editing state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAssigned, setEditAssigned] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'med' | 'low'>('med');
  const [editStatus, setEditStatus] = useState<'todo' | 'inprogress' | 'review' | 'done'>('todo');
  const [editProgress, setEditProgress] = useState(0);
  const [editDesc, setEditDesc] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editServiceType, setEditServiceType] = useState<'internal' | 'external'>('internal');
  const [editServiceName, setEditServiceName] = useState('');
  const [editTagsString, setEditTagsString] = useState('');

  // UI state feedback
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Trigger Toast Notification
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Safe navigation directly into another HR Module
  const handleDeepLink = (view: string, employeeId?: string) => {
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    } else {
      setSelectedEmployeeId(null);
    }
    setCurrentView(view);
  };

  // Auto pre-fill department based on assigned employee selection
  const handleAssigneeChange = (empId: string) => {
    setNewAssigned(empId);
  };

  // Fast operational compliance templates for typical Saudi HR tasks
  const applyComplianceTemplate = (templateType: 'qiwa_contract' | 'muqeem_iqama' | 'gosi_audit' | 'wps_payroll') => {
    // Select first employee as a sensible default assignee if none selected
    const fallbackEmp = employees[0]?.id || '';
    const assigneeId = newAssigned || fallbackEmp;
    const emp = employees.find(e => e.id === assigneeId);

    // Automatically open the form modal
    setIsAddTaskOpen(true);

    switch (templateType) {
      case 'qiwa_contract':
        setNewTitle(`توثيق العقد الموحد بمنصة قوى ${emp ? `- للموظف ${emp.name}` : ''}`);
        setNewPriority('high');
        setNewServiceType('external');
        setNewServiceName('منصة قوى (Qiwa)');
        setNewDesc('مراجعة نموذج العقد الوظيفي الموحد ورفعه للتوثيق والاعتماد عبر بوابة قوى لتفادي مخالفات نظام العمل للالتزام بتنظيمات وزارة الموارد البشرية.');
        setTagInput('تنظيمي, قوى, توثيق_عقود');
        triggerToast('نموذج العقد الموحد جاهز للتحميل والتسجيل.', 'info');
        break;
      case 'muqeem_iqama':
        setNewTitle(`سداد رسوم رخصة العمل وتجديد الإقامة ${emp ? `- للموظف ${emp.name}` : ''}`);
        setNewPriority('high');
        setNewServiceType('external');
        setNewServiceName('بوابة مقيم (Muqeem)');
        setNewDesc('إصدار رخصة العمل وسداد المقابل المالي واستكمال تجديد بطاقة الإقامة للموظف الوافد لتجنب غرامات تأخر التجديد المنصوص عليها نظامياً.');
        setTagInput('حكومي, الإقامات, مقيم');
        triggerToast('نموذج تجديد الإقامة جاهز للتحميل والتسجيل.', 'info');
        break;
      case 'gosi_audit':
        setNewTitle('تحديث أجور وبيانات المشتركين في التأمينات');
        setNewPriority('med');
        setNewServiceType('external');
        setNewServiceName('التأمينات الاجتماعية (GOSI)');
        setNewDesc('تحديث قائمة الأجور والبدلات السنوية الخاضعة للاشتراك لجميع الموظفين السعوديين بنسبة 9.75% والمقيمين بنسبة 2%، ومطابقتها دفترياً.');
        setTagInput('فحص, التأمينات_gosi, مالية');
        triggerToast('نموذج تدقيق التأمينات الاجتماعية جاهز للتحميل والتسجيل.', 'info');
        break;
      case 'wps_payroll':
        setNewTitle('إرسال وتوثيق ملف حماية الأجور (WPS)');
        setNewPriority('high');
        setNewServiceType('external');
        setNewServiceName('منصة مدد / حماية الأجور');
        setNewDesc('تحضير وتوليد ملف صرف الرواتب الشهري بصيغة ملف حماية الأجور المعتمد، ومطابقته بالتنسيق مع البنك والشطب عبر مدد لتفادي التوقيف.');
        setTagInput('رواتب, حماية_الأجور, مدد');
        triggerToast('نموذج مسيرات حماية الأجور جاهز للتحميل والتسجيل.', 'info');
        break;
    }
  };

  // Add Task to DB
  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAssigned) {
      triggerToast('يرجى ملء اسم المهمة واختيار الموظف المسؤول أولاً.', 'error');
      return;
    }

    const emp = employees.find(x => x.id === newAssigned);
    if (!emp) return;

    setIsSaving(true);
    try {
      const parsedTags = tagInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await addTask({
        title: newTitle.trim(),
        assignee: emp.id,
        dept: emp.dept,
        priority: newPriority,
        status: 'todo',
        due: newDue,
        progress: 0,
        tags: parsedTags.length > 0 ? parsedTags : ['مهمة_عمل'],
        desc: newDesc.trim() || 'لا يتوفر وصف دقيق للمهمة المسجلة حالياً.',
        serviceType: newServiceType,
        serviceName: newServiceType === 'external' ? (newServiceName.trim() || 'بوابة خارجية') : 'داخلي'
      });

      // Clear Form
      setNewTitle('');
      setNewDesc('');
      setTagInput('');
      setNewServiceName('');
      setNewPriority('med');
      setNewServiceType('internal');
      setNewDue(() => {
        const d = new Date();
        d.setDate(d.getDate() + 5);
        return d.toISOString().slice(0, 10);
      });
      setIsAddTaskOpen(false);

      triggerToast('تم تكليف الموظف بالمهمة وإضافتها بقاعدة البيانات بنجاح.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('حدث خطأ أثناء الاتصال بقاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف مهمة "${name}" نهائياً من سجلات الشركة؟`)) return;
    setIsSaving(true);
    try {
      await deleteTask(id);
      triggerToast(`تم إيقاف وحذف مهمة "${name}" بنجاح.`, 'success');
      if (editingTask && editingTask.id === id) {
        setEditingTask(null);
      }
    } catch (err) {
      console.error(err);
      triggerToast('خطأ أثناء المسح من قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle quick change status
  const handleQuickStatusChange = async (id: string, currentStatus: Task['status'], direction: 'forward' | 'back') => {
    const statuses: Task['status'][] = ['todo', 'inprogress', 'review', 'done'];
    const idx = statuses.indexOf(currentStatus);
    
    let nextIdx = idx;
    if (direction === 'forward' && idx < statuses.length - 1) nextIdx = idx + 1;
    if (direction === 'back' && idx > 0) nextIdx = idx - 1;

    if (nextIdx === idx) return;

    setIsSaving(true);
    try {
      const targetStatus = statuses[nextIdx];
      const targetProgress = targetStatus === 'done' ? 100 : (targetStatus === 'todo' ? 0 : 50);
      await updateTask(id, {
        status: targetStatus,
        progress: targetProgress
      });
      triggerToast('تم تحديث حالة المهمة ومستوى التقدم تلقائياً.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('فشلت كتابة الحالة الجديدة.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Dialog
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditAssigned(task.assignee);
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditProgress(task.progress);
    setEditDesc(task.desc);
    setEditDue(task.due);
    setEditServiceType(task.serviceType);
    setEditServiceName(task.serviceType === 'external' ? task.serviceName : '');
    setEditTagsString(task.tags.join(', '));
  };

  // Save Edit Dialog
  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    if (!editTitle.trim() || !editAssigned) {
      triggerToast('الرجاء تعبئة العناوين الرئيسية المطلوبة.', 'error');
      return;
    }

    const emp = employees.find(x => x.id === editAssigned);
    if (!emp) return;

    setIsSaving(true);
    try {
      const parsedTags = editTagsString
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Intelligent status / progress coupling
      let resolvedStatus = editStatus;
      let resolvedProgress = editProgress;

      if (editProgress >= 100 && editStatus !== 'done') {
        resolvedStatus = 'done';
        resolvedProgress = 100;
      } else if (editStatus === 'done' && editProgress < 100) {
        resolvedProgress = 100;
      } else if (editStatus === 'todo' && editProgress > 0) {
        resolvedProgress = 0;
      }

      await updateTask(editingTask.id, {
        title: editTitle.trim(),
        assignee: emp.id,
        dept: emp.dept,
        priority: editPriority,
        status: resolvedStatus,
        progress: resolvedProgress,
        desc: editDesc.trim(),
        due: editDue,
        serviceType: editServiceType,
        serviceName: editServiceType === 'external' ? editServiceName.trim() : 'داخلي',
        tags: parsedTags.length > 0 ? parsedTags : ['مهمة_عمل']
      });

      setEditingTask(null);
      triggerToast('تم تحديث وتوثيق التغيرات الجديدة على المهمة بنجاح.', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('خطأ أثناء مزامنة التعديلات مع قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate high-intelligence KPIs for task workspace
  const workspaceKPIs = useMemo(() => {
    const total = tasks.length;
    let highPriority = 0;
    let todoCount = 0;
    let inprogressCount = 0;
    let reviewCount = 0;
    let doneCount = 0;
    let complianceRegulated = 0;

    tasks.forEach(t => {
      if (t.priority === 'high') highPriority++;
      if (t.status === 'todo') todoCount++;
      if (t.status === 'inprogress') inprogressCount++;
      if (t.status === 'review') reviewCount++;
      if (t.status === 'done') doneCount++;
      if (t.serviceType === 'external') complianceRegulated++;
    });

    const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    return {
      total,
      highPriority,
      todoCount,
      inprogressCount,
      reviewCount,
      doneCount,
      complianceRegulated,
      completionRate
    };
  }, [tasks]);

  // Filter criteria application
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // 1. Search text match
      const titleMatch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = t.desc.toLowerCase().includes(searchTerm.toLowerCase());
      const serviceMatch = (t.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = titleMatch || descMatch || serviceMatch;

      // 2. Department filter
      const matchesDept = selectedDept === 'all' || t.dept === selectedDept;

      // 3. Priority filter
      const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;

      // 4. Status filter
      const matchesStatus = selectedStatus === 'all' || t.status === selectedStatus;

      // 5. Assignee employee filter
      const matchesAssignee = selectedAssignee === 'all' || t.assignee === selectedAssignee;

      return matchesSearch && matchesDept && matchesPriority && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchTerm, selectedDept, selectedPriority, selectedStatus, selectedAssignee]);

  const handleExportTasksCSV = () => {
    const headers = [
      'عنوان المهمة',
      'القسم',
      'الموظف المسؤول',
      'مستوى الأولوية',
      'حالة المهمة',
      'الوصف والتفاصيل',
      'تاريخ الاستحقاق',
      'نسبة الإنجاز',
      'نوع الخدمة',
      'اسم الخدمة/المنصة',
      'الوسوم'
    ];
    
    const rows = filteredTasks.map(t => {
      const emp = employees.find(e => e.id === t.assignee);
      const empName = emp ? emp.name : 'غير محدد';
      const priorityLabel = t.priority === 'high' ? 'عالية' : t.priority === 'med' ? 'متوسطة' : 'منخفضة';
      const statusLabel = t.status === 'todo' ? 'بانتظار البدء' : t.status === 'inprogress' ? 'قيد التنفيذ' : t.status === 'review' ? 'تحت المراجعة' : 'مكتملة';
      const serviceTypeLabel = t.serviceType === 'internal' ? 'داخلية' : 'خارجية (حكومية)';
      const tagsStr = (t.tags || []).join(', ');

      return [
        t.title,
        t.dept,
        empName,
        priorityLabel,
        statusLabel,
        t.desc,
        t.due,
        `${t.progress || 0}%`,
        serviceTypeLabel,
        t.serviceName || '—',
        tagsStr
      ];
    });

    exportToCSV(`قائمة_مهام_الفريق_والامتثال_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Priority color translation
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'med': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-50 text-blue-600 border-blue-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  const getPriorityLabelLabel = (p: string) => {
    switch (p) {
      case 'high': return 'أولوية قصوى ⚠️';
      case 'med': return 'متوسطة الإلحاح ⏳';
      case 'low': return 'عادية 📅';
      default: return p;
    }
  };

  // Status color styles
  const getStatusColorStyle = (s: string) => {
    switch (s) {
      case 'todo': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'inprogress': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'review': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'done': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-205';
    }
  };

  const getStatusLabelText = (s: string) => {
    switch (s) {
      case 'todo': return 'بانتظار البدء';
      case 'inprogress': return 'قيد التنفيذ';
      case 'review': return 'تحت المراجعة والتدقيق';
      case 'done': return 'مكتملة ومؤرشفة منجزة';
      default: return s;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none animate-slideup mb-12 text-right" dir="rtl" id="tasksmanager-root">
      
      {/* Toast Message Alert */}
      {toastMessage && (
        <div className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
          'bg-slate-800 text-white border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <CheckCheck className="w-5 h-5 flex-shrink-0 text-white" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-white" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 text-white" />}
          <span className="text-xs font-bold leading-normal">{toastMessage.text}</span>
        </div>
      )}

      {/* Page Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">إدارة شؤون ومهام الفريق والامتثال الوطني</h2>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> MHRSD / Qiwa
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            البوابة المتكاملة لتكليف وتتبع المهام التشغيلية وقرارات الامتثال والربط بالمنصات الحكومية.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsAddTaskOpen(true)}
            className="bg-emerald-600 text-white border-none px-4 py-2.5 rounded-xl text-xs font-black hover:bg-emerald-700 cursor-pointer transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> تكليف بمهمة عمل
          </button>
          <button
            onClick={() => handleDeepLink('compliance')}
            className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 cursor-pointer transition flex items-center gap-1.5 shadow-xs"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" /> لوائح الامتثال
          </button>
          <button
            onClick={() => handleDeepLink('empfiles')}
            className="bg-gold text-slate-900 border-none px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-gold-light cursor-pointer transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            📁 عقود العمل بقوى
          </button>
        </div>
      </div>

      {/* Task Performance KPIs Dashboard Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-2.5 px-3.5 bg-slate-50 border border-slate-200/80 rounded-xl" id="tasks-kpi-row">
        
        <div className="flex items-center justify-between border-l border-slate-200 last:border-l-0 pl-3 last:pl-0">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">إجمالي المهام</span>
            <strong className="text-base font-black font-mono text-slate-800">{workspaceKPIs.total}</strong>
          </div>
          <div className="w-7 h-7 text-slate-400 rounded-md flex items-center justify-center">
            <Folder className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-center justify-between border-l border-slate-200 last:border-l-0 pl-3 last:pl-0 pr-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">نسبة إنجاز المهام</span>
            <div className="flex items-baseline gap-1">
              <strong className="text-base font-black font-mono text-emerald-600">{workspaceKPIs.completionRate}%</strong>
              <span className="text-[8px] text-slate-400 font-bold">({workspaceKPIs.doneCount} منجز)</span>
            </div>
          </div>
          <div className="w-7 h-7 text-emerald-500 rounded-md flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-center justify-between border-l border-slate-200 last:border-l-0 pl-3 last:pl-0 pr-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">عاجل / أولوية قصوى</span>
            <strong className="text-base font-black font-mono text-rose-650">{workspaceKPIs.highPriority}</strong>
          </div>
          <div className="w-7 h-7 text-rose-500 rounded-md flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex items-center justify-between pr-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">ارتباط منصات</span>
            <strong className="text-base font-black font-mono text-amber-600">{workspaceKPIs.complianceRegulated}</strong>
          </div>
          <div className="w-7 h-7 text-amber-500 rounded-md flex items-center justify-center">
            <Building className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

      {/* Main Workspace Layout */}
      <div className="space-y-6">

          {/* Filtering control segment */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              
              {/* Dynamic Interactive Search Box */}
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="ابحث بمسمى المهمة، الوصف، أو اسم المنصة المترابطة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-gold focus:bg-white bg-slate-50 font-bold text-right text-slate-755"
                  id="tasks-search-filter-input"
                />
                <Search className="w-4 h-4 text-slate-450 absolute right-3 top-3" />
              </div>

              {/* View Switch Button & CSV Export Button */}
              <div className="flex gap-2 items-center flex-wrap self-stretch md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleExportTasksCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-lg px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="تصدير السجل المصفى للمهام والالتزام إلى ملف Excel"
                >
                  📊 تصدير Excel (CSV)
                </button>
                <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs leading-none">
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`px-4 py-2 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'kanban' ? 'bg-white text-gold shadow-xs border-none' : 'text-slate-500 border-none bg-transparent'
                    }`}
                    id="kanban-view-mode"
                  >
                    <Layers className="w-4 h-4" /> لوحة كانبان 🗂️
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-md font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      viewMode === 'list' ? 'bg-white text-gold shadow-xs border-none' : 'text-slate-500 border-none bg-transparent'
                    }`}
                    id="list-view-mode"
                  >
                    <FileText className="w-4 h-4" /> اللائحة التفصيلية 💬
                  </button>
                </div>
              </div>

            </div>

            {/* Structured Segment Dropdowns filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
              
              {/* Filter Dept */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-450 block font-bold">القسم المستهدف:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white focus:border-gold text-slate-700 text-right outline-none"
                >
                  <option value="all">كافة الأقسام</option>
                  <option value="الهندسة">الهندسة 💻</option>
                  <option value="المبيعات">المبيعات 📈</option>
                  <option value="التسويق">التسويق 📣</option>
                  <option value="المالية">المالية 💵</option>
                  <option value="الموارد البشرية">الموارد البشرية 👥</option>
                </select>
              </div>

              {/* Filter Priority */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-450 block font-bold">سرعة الإجراء:</span>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white focus:border-gold text-slate-700 text-right outline-none"
                >
                  <option value="all">كافة الأولويات</option>
                  <option value="high">عاجلة جداً 🔥</option>
                  <option value="med">متوسطة الإلحاح ⏳</option>
                  <option value="low">عادية 📅</option>
                </select>
              </div>

              {/* Filter Status */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-450 block font-bold">الحالة التشغيلية:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white focus:border-gold text-slate-700 text-right outline-none"
                >
                  <option value="all">كافة الحالات</option>
                  <option value="todo">بانتظار البدء ⏱️</option>
                  <option value="inprogress">قيد الإجراء ⚙️</option>
                  <option value="review">تحت التدقيق 🔍</option>
                  <option value="done">مكتملة ومؤرشفة ✅</option>
                </select>
              </div>

              {/* Filter Assigned Employee */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-455 block font-bold">الموظف المكلف:</span>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold bg-white focus:border-gold text-slate-700 text-right outline-none"
                >
                  <option value="all">جميع الموظفين</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Active filters label count summary */}
            <div className="text-[10.5px] text-slate-400 font-bold flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <span>
                عثر على <strong>{filteredTasks.length}</strong> مهمة مطابقة للمرشحات المختارة من قاعدة البيانات.
              </span>
              {(selectedDept !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all' || searchTerm !== '') && (
                <button
                  onClick={() => {
                    setSelectedDept('all');
                    setSelectedPriority('all');
                    setSelectedStatus('all');
                    setSelectedAssignee('all');
                    setSearchTerm('');
                  }}
                  className="text-gold hover:text-slate-900 border-none bg-transparent font-black cursor-pointer text-[10px]"
                >
                  ❌ إعادة تعيين التصفية
                </button>
              )}
            </div>

          </div>

          {/* DUAL WORKSPACE VIEWS */}

          {/* 1. KANBAN BOARD */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="kanban-columns-container">
              
              {/* STATUSES TO ITERATE */}
              {(['todo', 'inprogress', 'review', 'done'] as Task['status'][]).map((colStatus) => {
                const columnTasks = filteredTasks.filter(t => t.status === colStatus);
                
                // Get header styles
                let colTitle = '';
                let colColor = '';
                let colBg = '';
                let dotColor = '';

                if (colStatus === 'todo') {
                  colTitle = 'المطلوبة للإنجاز';
                  colColor = 'text-slate-700';
                  colBg = 'bg-slate-100';
                  dotColor = 'bg-slate-400';
                } else if (colStatus === 'inprogress') {
                  colTitle = 'قيد العمل الفني';
                  colColor = 'text-sky-700';
                  colBg = 'bg-sky-50/70';
                  dotColor = 'bg-sky-500 animate-pulse';
                } else if (colStatus === 'review') {
                  colTitle = 'المراجعة والتدقيق';
                  colColor = 'text-purple-700';
                  colBg = 'bg-purple-50/70';
                  dotColor = 'bg-purple-500';
                } else if (colStatus === 'done') {
                  colTitle = 'تم الانتهاء وأرشفتها';
                  colColor = 'text-emerald-700';
                  colBg = 'bg-emerald-50/70';
                  dotColor = 'bg-emerald-500';
                }

                return (
                  <div key={colStatus} className="flex flex-col gap-3 rounded-xl p-3 min-h-[350px] bg-slate-50 border border-slate-200">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                        <strong className={`text-xs font-black ${colColor}`}>{colTitle}</strong>
                      </div>
                      <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-black">
                        {columnTasks.length}
                      </span>
                    </div>

                    {/* Column Cards */}
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] scrollbar-thin">
                      {columnTasks.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                          <span className="text-[10px] text-slate-400 font-medium">لا يوجد مهام</span>
                        </div>
                      ) : (
                        columnTasks.map((t) => {
                          const emp = employees.find(e => e.id === t.assignee);
                          return (
                            <div
                              key={t.id}
                              className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs hover:shadow-md transition duration-150 space-y-3 cursor-pointer hover:border-gold relative group"
                              onClick={() => openEditModal(t)}
                            >
                              
                              {/* Tags Row */}
                              <div className="flex flex-wrap gap-1 items-center justify-between">
                                <span className={`text-[9px] border px-1.5 py-0.2 rounded font-bold ${getPriorityStyle(t.priority)}`}>
                                  {getPriorityLabelLabel(t.priority)}
                                </span>
                                <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-mono">{t.due}</span>
                                </div>
                              </div>

                              {/* Title */}
                              <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-800 leading-snug hover:text-gold transition">
                                  {t.title}
                                </h4>
                                <p className="text-[10.5px] text-slate-450 line-clamp-2 leading-relaxed">
                                  {t.desc}
                                </p>
                              </div>

                              {/* Government Integration Widget */}
                              {t.serviceType === 'external' ? (
                                <div className="bg-gradient-to-l from-indigo-50 to-slate-50 border border-indigo-150 p-2 rounded-lg flex items-center justify-between text-[9.5px]">
                                  <span className="text-indigo-755 font-bold flex items-center gap-1">
                                    <Building className="w-3.5 h-3.5" /> {t.serviceName}
                                  </span>
                                  <span className="bg-indigo-600 text-white rounded px-1.5 py-0.2 font-black Scale-[0.9]">
                                    رابط حي 🛡️
                                  </span>
                                </div>
                              ) : (
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-[9px] text-slate-400 font-bold">
                                  🗃️ مهمة إدارية داخل المنشأة
                                </div>
                              )}

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold text-slate-450">
                                  <span>مستوى التقدم</span>
                                  <span className="font-mono">{t.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                  <div
                                    style={{ width: `${t.progress}%` }}
                                    className={`h-full ${
                                      t.status === 'done' ? 'bg-emerald-500' :
                                      t.status === 'review' ? 'bg-purple-500' : 'bg-gold'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Bottom Assignee Info */}
                              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-[10.5px] font-bold">
                                <div className="flex items-center gap-1.5 text-slate-700">
                                  <div className="w-5.5 h-5.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {emp ? emp.name[0] : '؟'}
                                  </div>
                                  <span className="text-slate-650 max-w-[90px] truncate" title={emp ? emp.name : 'موظف مجهول'}>
                                    {emp ? emp.name : 'مجهول'}
                                  </span>
                                </div>

                                {/* Shift Status interactive controls */}
                                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-150" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(t.id, t.status, 'back')}
                                    disabled={t.status === 'todo'}
                                    className="p-1 rounded bg-slate-150 border-none hover:bg-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="رجوع مرحلة لخلف"
                                  >
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(t.id, t.status, 'forward')}
                                    disabled={t.status === 'done'}
                                    className="p-1 rounded bg-slate-150 border-none hover:bg-slate-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="تقدم مرحلة للأمام"
                                  >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(t.id, t.title)}
                                    className="p-1 rounded bg-rose-50 border-none hover:bg-rose-100 text-rose-600 cursor-pointer"
                                    title="حذف المهمة"
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
                );
              })}

            </div>
          )}

          {/* 2. COMPREHENSIVE DETAILED LIST TABLE */}
          {viewMode === 'list' && (
            <div className="bg-white border border-slate-200 rounded-xl p-0 shadow-sm overflow-hidden" id="tasks-list-table-container">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-slate-800">تفاصيل وسجلات عقود الإنجاز والمسؤولين</h3>
                  <p className="text-[10px] text-slate-400">تدقيق إحصائي وترتيب زمني للمهام المسندة لكل فريق وعضو</p>
                </div>
                <span className="text-[10px] font-bold bg-slate-150 text-slate-700 px-3 py-1 rounded-md">
                  المجموع: {filteredTasks.length} مهام
                </span>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Sliders className="w-10 h-10 text-slate-300 mx-auto" strokeWidth={1} />
                  <p className="text-xs font-bold text-slate-700">لا تتطابق سجلات المهام المخزنة مع فلاتر البحث الحالية</p>
                  <p className="text-[10px] text-slate-400">يرجى تعديل خيارات البحث والتوليد أو تسجيل مهمة جديدة عاجلاً.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="p-3.5">البيان مسمى المهمة</th>
                        <th className="p-3.5">الموظف المكلف</th>
                        <th className="p-3.5">الأهمية</th>
                        <th className="p-3.5">حالة العمل والتقدم</th>
                        <th className="p-3.5">التاريخ المستهدف</th>
                        <th className="p-3.5 text-center">إجراءات التحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTasks.map((t) => {
                        const emp = employees.find(e => e.id === t.assignee);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/70 transition duration-150">
                            
                            {/* Title & tags */}
                            <td className="p-3.5 max-w-xs">
                              <div className="space-y-1">
                                <strong className="text-xs font-black text-slate-800 block hover:text-gold transition cursor-pointer" onClick={() => openEditModal(t)}>{t.title}</strong>
                                <p className="text-[10.5px] text-slate-400 line-clamp-1">{t.desc}</p>
                                <div className="flex flex-wrap gap-1 items-center pt-1">
                                  {t.serviceType === 'external' ? (
                                    <span className="bg-indigo-50 text-indigo-750 border border-indigo-200 px-1.5 py-0.1 rounded text-[8.5px] font-black">
                                      {t.serviceName} 📡
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.1 rounded text-[8.5px] font-medium">
                                      داخلي 🗃️
                                    </span>
                                  )}
                                  {t.tags.map(tagItem => (
                                    <span key={tagItem} className="bg-slate-50 border border-slate-150 text-slate-405 text-[8.5px] px-1 py-0.1 rounded">
                                      #{tagItem}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>

                            {/* Assignee info */}
                            <td className="p-3.5">
                              {emp ? (
                                <div className="space-y-1">
                                  <strong className="text-xs font-bold text-slate-700 block">{emp.name}</strong>
                                  <div className="text-[9.5px] text-slate-400 leading-normal">
                                    {emp.dept} · <span className="font-mono text-slate-455">الرقم: {emp.id}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400">غير محدد</span>
                              )}
                            </td>

                            {/* Priority badge */}
                            <td className="p-3.5">
                              <span className={`inline-block border text-[10px] px-2 py-0.5 rounded-full font-bold ${getPriorityStyle(t.priority)}`}>
                                {getPriorityLabelLabel(t.priority)}
                              </span>
                            </td>

                            {/* Progress & state */}
                            <td className="p-3.5 w-40">
                              <div className="space-y-1.5">
                                <span className={`inline-block border text-[9.5px] px-2 py-0.5 rounded font-black ${getStatusColorStyle(t.status)}`}>
                                  {getStatusLabelText(t.status)}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden block">
                                    <div style={{ width: `${t.progress}%` }} className="h-full bg-gold" />
                                  </div>
                                  <span className="font-mono text-[9px] font-extrabold text-slate-500">{t.progress}%</span>
                                </div>
                              </div>
                            </td>

                            {/* Due Date */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="text-xs font-bold font-mono text-slate-700">{t.due}</div>
                            </td>

                            {/* Core Edit actions */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(t)}
                                  className="bg-gold hover:bg-gold-light text-slate-900 border-none px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer transition flex items-center justify-center gap-1"
                                >
                                  ✏️ تعديل
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(t.id, t.title)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 p-1.5 rounded cursor-pointer transition"
                                  title="مسح من القائمة"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

      </div>

      {/* ADD TASK MODAL: CREATIVE TASK ASSIGNMENT */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadein" id="add-task-modal-overlay">
          <div className="bg-white border border-slate-205 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scaleup text-right max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            {/* Modal Header */}
            <div className="pb-3 border-b border-slate-150 mb-4 flex justify-between items-start">
              <div className="space-y-1 text-right">
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                  <Sparkles className="w-3 h-3" /> تكليف بمهمة جديدة للفريق
                </span>
                <h3 className="text-sm font-black text-slate-905 text-slate-900">
                  تفاصيل ومسؤوليات المهمة التشغيلية والامتثال
                </h3>
                <p className="text-[10px] text-slate-400">
                  تحديد مسؤولية وتوقيت وقرار المهمة للتوثيق في المنظومة وقاعدة البيانات.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTaskOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-transparent border-none text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates Block */}
            <div className="space-y-1.5 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80" id="compliance-quick-templates-box">
              <span className="text-[10px] text-slate-500 font-bold block">
                ⚡ نماذج سريعة للتعبئة التلقائية (الالتزام والامتثال):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => applyComplianceTemplate('qiwa_contract')}
                  className="bg-white hover:bg-gold/10 border border-slate-200 hover:border-gold px-2 py-1.5 rounded-lg text-[9.5px] font-bold text-slate-705 text-slate-700 transition cursor-pointer text-right flex items-center justify-between"
                >
                  <span>✍️ عقد قوى (Qiwa)</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => applyComplianceTemplate('muqeem_iqama')}
                  className="bg-white hover:bg-gold/10 border border-slate-200 hover:border-gold px-2 py-1.5 rounded-lg text-[9.5px] font-bold text-slate-705 text-slate-700 transition cursor-pointer text-right flex items-center justify-between"
                >
                  <span>💳 إقامة (مقيم)</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => applyComplianceTemplate('gosi_audit')}
                  className="bg-white hover:bg-gold/10 border border-slate-200 hover:border-gold px-2 py-1.5 rounded-lg text-[9.5px] font-bold text-slate-705 text-slate-700 transition cursor-pointer text-right flex items-center justify-between"
                >
                  <span>🛡️ تأمينات (GOSI)</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => applyComplianceTemplate('wps_payroll')}
                  className="bg-white hover:bg-gold/10 border border-slate-200 hover:border-gold px-2 py-1.5 rounded-lg text-[9.5px] font-bold text-slate-705 text-slate-700 transition cursor-pointer text-right flex items-center justify-between"
                >
                  <span>💵 أجور (WPS)</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddNewTask} className="space-y-4 text-right">
              
              {/* Task Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">اسم المهمة المطلوبة *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="مثال: مطابقة ملف الأجور للربع الأخير"
                    className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Assignee / Employee Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">إسناد المسؤولية إلى موظف *</label>
                <div className="relative">
                  <select
                    required
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-gold bg-slate-50 appearance-none text-right"
                    value={newAssigned}
                    onChange={(e) => handleAssigneeChange(e.target.value)}
                  >
                    <option value="">-- اختر موظفاً من السيستم --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.dept} · {e.job})
                      </option>
                    ))}
                  </select>
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Urgency / Priority Group Row */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">مستوى الأهمية والسرعة</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPriority('high')}
                    className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                      newPriority === 'high'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    عاجل جداً 🔥
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority('med')}
                    className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                      newPriority === 'med'
                        ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-sm font-extrabold'
                        : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    متوسط ⏳
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPriority('low')}
                    className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                      newPriority === 'low'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    عادي 📅
                  </button>
                </div>
              </div>

              {/* Service Type Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">نوع المهمة وتكامل النظام</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewServiceType('internal')}
                    className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                      newServiceType === 'internal'
                        ? 'bg-slate-800 text-white border-slate-900 shadow-inner'
                        : 'bg-slate-50 text-slate-650 border-slate-200'
                    }`}
                  >
                    مهمة تشغيلية داخلية
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewServiceType('external')}
                    className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                      newServiceType === 'external'
                        ? 'bg-indigo-650 text-white border-indigo-700 shadow-inner'
                        : 'bg-slate-50 text-slate-650 border-slate-205'
                    }`}
                  >
                    مرتبطة بمنصة خارجية
                  </button>
                </div>
              </div>

              {/* External Service Platform Name Input */}
              {newServiceType === 'external' && (
                <div className="flex flex-col gap-1.5 animate-slideup">
                  <label className="text-xs font-bold text-slate-500">اسم المنصة الحكومية / القطاع الخارجي *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: قوى (Qiwa)، مقيم، ساند، التأمينات"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                </div>
              )}

              {/* Due Date & Tags in Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">تاريخ الاستحقاق *</label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">الوسوم / تصنيف مالي</label>
                  <input
                    type="text"
                    placeholder="فصل، بوبا، أجور، قوى"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <span className="text-[8px] text-slate-400">افصل الكلمات بالفواصل [,]</span>
                </div>
              </div>

              {/* Task Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">تفاصيل ومبررات المهمة</label>
                <textarea
                  placeholder="الصفة الفنية أو الأهداف ومخرجات المراجعات الضرورية المطلوبة لمكتب العمل..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg p-3 text-xs outline-none focus:border-gold bg-slate-50 text-right font-medium"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              {/* Submit / Cancel Footer */}
              <div className="pt-3 border-t border-slate-150 flex gap-2 justify-end items-center bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="bg-slate-200 text-slate-700 hover:bg-slate-300 px-4 py-2.5 rounded-xl text-xs font-extrabold border-none cursor-pointer transition"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold hover:bg-gold-light text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-md transition disabled:opacity-45 flex items-center gap-1.5 border-none"
                >
                  {isSaving ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" /> جاري التوثيق بالخادم...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> إدراج وتكليف بالمهمة فوراً
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAILED MODAL: EDIT & AUDIT TASK (SAVED TO FIREBASE) */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadein" id="edit-task-modal-overlay">
          <div className="bg-white border border-slate-205 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scaleup text-right">
            
            {/* Modal Header */}
            <div className="pb-3 border-b border-slate-150 mb-4 flex justify-between items-start">
              <div className="space-y-1">
                <span className="bg-gold-bg text-gold border border-gold-border px-2.5 py-0.5 rounded-full text-[9px] font-extrabold">
                  تحرير بيانات المهمة بقاعدة البيانات
                </span>
                <h3 className="text-xs font-black text-slate-900">
                  تعديل وتدقيق المهام والربط بالملفات
                </h3>
                <p className="text-[10px] text-slate-400">
                  معلم الاستحقاق: <strong className="text-slate-600">{editingTask.title}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-700 bg-transparent border-none text-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTaskEdit} className="space-y-4">
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500">عنوان التكليف للعمل *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-black outline-none focus:border-gold bg-slate-50 text-right"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Assignee */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">إسناد المسؤولية إلى</label>
                  <select
                    className="border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold bg-slate-50 text-right outline-none focus:border-gold"
                    value={editAssigned}
                    onChange={(e) => setEditAssigned(e.target.value)}
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.dept})</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">الأولوية والسرعة</label>
                  <select
                    className="border border-slate-200 rounded-lg px-2 py-2.5 text-xs font-bold bg-slate-50 text-right outline-none focus:border-gold"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                  >
                    <option value="high">عاجل جداً 🔥</option>
                    <option value="med">متوسط ⏳</option>
                    <option value="low">عادي 📅</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-3">
                
                {/* Status Selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">مرحلة تقدم التكليف</label>
                  <select
                    className="border border-slate-200 rounded-lg px-2.5 py-2.5 text-xs font-bold bg-slate-50 text-right outline-none focus:border-gold"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                  >
                    <option value="todo">بانتظار البدء ⏱️</option>
                    <option value="inprogress">قيد الإجراء والعمل ⚙️</option>
                    <option value="review">تحت التدقيق والمراجعة 🔍</option>
                    <option value="done">مكتملة ومؤرشفة منجزة ✅</option>
                  </select>
                </div>

                {/* Target Due date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">تاريخ الاستحقاق النهائى</label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-mono font-bold text-right outline-none focus:border-gold bg-slate-50"
                    value={editDue}
                    onChange={(e) => setEditDue(e.target.value)}
                  />
                </div>

              </div>

              {/* Progress Slider (with nice numeric indicators) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>مستوى إتمام التكليف الفعلي</span>
                  <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-black">
                    {editProgress}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full accent-gold h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  value={editProgress}
                  onChange={(e) => setEditProgress(Number(e.target.value))}
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>0% (انتظار)</span>
                  <span>50% (نصف منقضية)</span>
                  <span>100% (مكتملة)</span>
                </div>
              </div>

              {/* Government platforms linkages */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">نوع الارتباط بالمنشأة</label>
                  <select
                    className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold bg-slate-50 text-right outline-none focus:border-gold"
                    value={editServiceType}
                    onChange={(e) => setEditServiceType(e.target.value as any)}
                  >
                    <option value="internal">سياق داخلي بالشركة</option>
                    <option value="external">منصة أو جهة خارجية</option>
                  </select>
                </div>
                
                {editServiceType === 'external' ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500">اسم المنصة الخارجية</label>
                    <input
                      type="text"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right"
                      value={editServiceName}
                      onChange={(e) => setEditServiceName(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 justify-end text-[10px] text-slate-400 font-bold pb-2">
                    المهمة مصنفة كعمل داخلي في مقر الشركة
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Edit tags */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">الوسوم والتصنيفات</label>
                  <input
                    type="text"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right"
                    value={editTagsString}
                    onChange={(e) => setEditTagsString(e.target.value)}
                  />
                  <span className="text-[8px] text-slate-400">افصل الكلمات بالفواصل</span>
                </div>

                {/* Edit description */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-500">الشروح والتفاصيل التشغيلية للمهمة</label>
                  <textarea
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg p-3 text-xs outline-none focus:border-gold bg-slate-50 text-right font-medium"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* DEEP LINK JUMP ACCESSORS */}
              <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl flex items-center justify-between text-right leading-relaxed">
                <div className="space-y-0.5 text-right w-3/4">
                  <span className="text-[10px] font-black text-indigo-800 flex items-center gap-1">
                    🔗 اختصارات الربط البيني للملفات والالتزام
                  </span>
                  <p className="text-[9.5px] text-slate-650">
                    يمكنك الانتقال فوراً إلى <strong>ملف الموظف المكلف</strong> لمطابقة تصريح العمل أو العقد، ومقارنة التواريخ في منصة قوى والامتثال.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeepLink('empfiles', editAssigned)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9.5px] px-3 py-2 rounded-lg border-none cursor-pointer flex items-center gap-1 shadow-sm whitespace-nowrap"
                >
                  افتح عقوده بقوى <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-150 flex flex-wrap gap-2 justify-between items-center bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id, editingTask.title)}
                  disabled={isSaving}
                  className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-45"
                >
                  🗑️ إلغاء وحذف المهمة من السيستم
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="bg-slate-200 text-slate-700 hover:bg-slate-350 px-4 py-2 rounded-xl text-xs font-extrabold border-none cursor-pointer transition"
                  >
                    إلغاء التراجع
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-gold hover:bg-gold-light text-slate-900 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm transition border-none disabled:opacity-45 flex items-center gap-1"
                  >
                    {isSaving ? <RotateCw className="w-4 h-4 animate-spin" /> : 'حفظ التغييرات بقاعدة البيانات ✓'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
