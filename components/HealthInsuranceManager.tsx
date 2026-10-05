/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { Employee, HealthInsurance } from '../types';
import { exportToCSV } from '../utils/exportUtils';
import { processAttachedFile } from '../utils/fileUtils';
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Users,
  Check,
  RotateCw,
  Sparkles,
  ArrowUpRight,
  Shield,
  ShieldAlert,
  Info,
  Sliders,
  DollarSign,
  Heart,
  ChevronDown,
  Activity,
  FileText,
  AlertTriangle,
  User,
  ExternalLink
} from 'lucide-react';

export const HealthInsuranceManager: React.FC = () => {
  const {
    employees,
    health,
    addHealth,
    updateHealth,
    deleteHealth,
    addTask,
    setCurrentView,
    setSelectedEmployeeId
  } = useHR();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Form states for creating a new card health
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newClass, setNewClass] = useState<'VIP' | 'A' | 'B' | 'C'>('B');
  const [newCardNo, setNewCardNo] = useState('');
  const [newPremium, setNewPremium] = useState(4200);
  const [newDependents, setNewDependents] = useState(0);
  const [newStatus, setNewStatus] = useState<'نشط' | 'موقوف'>('نشط');
  const [newStart, setNewStart] = useState('2026-01-01');
  const [newEnd, setNewEnd] = useState('2026-12-31');

  // Editing state
  const [editingCard, setEditingCard] = useState<HealthInsurance | null>(null);
  const [editClass, setEditClass] = useState<'VIP' | 'A' | 'B' | 'C'>('B');
  const [editCardNo, setEditCardNo] = useState('');
  const [editPremium, setEditPremium] = useState(0);
  const [editDependents, setEditDependents] = useState(0);
  const [editStatus, setEditStatus] = useState<'نشط' | 'موقوف'>('نشط');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  const [newFileData, setNewFileData] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [editFileData, setEditFileData] = useState('');
  const [editFileName, setEditFileName] = useState('');

  // Handle upload of health insurance PDF cards or policy schedules with size limits and compression
  const handleInsuranceFileChange = (e: React.ChangeEvent<HTMLInputElement>, mode: 'new' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;

    processAttachedFile(
      file,
      (base64) => {
        if (mode === 'new') {
          setNewFileData(base64);
          setNewFileName(file.name);
        } else {
          setEditFileData(base64);
          setEditFileName(file.name);
        }
      },
      (error) => {
        alert(error);
        if (mode === 'new') {
          setNewFileData('');
          setNewFileName('');
        } else {
          setEditFileData('');
          setEditFileName('');
        }
      }
    );
  };

  // UI state feedback
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Trigger Toast Notification
  const triggerToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Safe navigation directly into Tasks with pre-filled task parameters
  const delegateRenewalTask = async (employeeName: string, cardNo: string) => {
    setIsSaving(true);
    try {
      // Find default HR employee to assign the task to
      const hrEmp = employees.find(e => e.dept === 'الموارد البشرية') || employees[0];
      if (!hrEmp) {
        triggerToast('لا يوجد موظف بالشركة لإسناد المهمة إليه.', 'error');
        return;
      }

      await addTask({
        title: `إجراء تجديد بطاقة تأمين بوبا المذيلة برقم ${cardNo} للموظف ${employeeName}`,
        assignee: hrEmp.id,
        dept: hrEmp.dept,
        priority: 'high',
        status: 'todo',
        due: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), // 7 days from now
        progress: 0,
        tags: ['تأمين_بوبا', 'الالتزام_الوطني', 'الضمان_الصحي_CCHI'],
        desc: `تنبيه نظام قوى والضمان الصحي: يرجى التواصل مع مندوب بوبا العربية لتجديد التغطية الطبية للموظف ${employeeName} وسداد قسط بوليصة التأمين لتجنب غرامات مجلس الضمان الصحي التعاوني.`,
        serviceType: 'external',
        serviceName: 'بوبا العربية (Bupa)'
      });

      triggerToast(`تم إسناد مهمة تجديد التأمين للموظف ${hrEmp.name} بقسم الموارد البشرية!`, 'success');
      // Deep link to tasks view
      setCurrentView('tasks');
    } catch (err) {
      console.error(err);
      triggerToast('فشل ربط وتكليف المهمة بقاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Smart Pre-sets for Bupa Medical categories (Council of Cooperative Health Insurance standards)
  const applyBupaTierTemplate = (className: 'VIP' | 'A' | 'B' | 'C', mode: 'add' | 'edit') => {
    let prem = 4200;
    let dep = 0;
    
    if (className === 'VIP') {
      prem = 12000;
      dep = 3;
    } else if (className === 'A') {
      prem = 6800;
      dep = 1;
    } else if (className === 'B') {
      prem = 4200;
      dep = 0;
    } else {
      prem = 2900;
      dep = 0;
    }

    if (mode === 'add') {
      setNewClass(className);
      setNewPremium(prem);
      setNewDependents(dep);
      setNewCardNo(`BU-${Math.floor(100000 + Math.random() * 900000)}`);
      triggerToast(`تم تحميل حزمة بوبا فئة (${className === 'VIP' ? 'VIP رئيسية' : 'فئة ' + className}) التعاونية.`, 'info');
    } else {
      setEditClass(className);
      setEditPremium(prem);
      setEditDependents(dep);
      triggerToast(`تمت مطابقة قسط بوبا للفئة (${className}) تلقائياً.`, 'info');
    }
  };

  // Add Health Insurance card
  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId || !newCardNo.trim()) {
      triggerToast('يرجى تعبئة كافة الحقول المطلوبة رقم العضوية واسم الموظف المؤمن.', 'error');
      return;
    }

    // Check if employee already has a card
    const alreadyExists = health.some(h => h.empId === newEmpId);
    if (alreadyExists) {
      triggerToast('تنبيه: هذا الموظف لديه تأمين مسجل بالفعل. يرجى تعديله بدلاً من ذلك.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await addHealth({
        empId: newEmpId,
        provider: 'بوبا العربية',
        class: newClass,
        cardNo: newCardNo.trim().toUpperCase(),
        start: newStart,
        end: newEnd,
        premium: Number(newPremium) || 0,
        dependents: Number(newDependents) || 0,
        status: newStatus,
        fileData: newFileData || undefined,
        fileName: newFileName || undefined
      });

      triggerToast('تم إصدار وإدراج بطاقة تأمين بوبا للموظف بقاعدة البيانات بنجاح.', 'success');
      setIsAddOpen(false);
      setNewEmpId('');
      setNewCardNo('');
      setNewPremium(4200);
      setNewDependents(0);
      setNewFileData('');
      setNewFileName('');
    } catch (err) {
      console.error(err);
      triggerToast('حدث خطأ أثناء حفظ البطاقة بالتأمين.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Single click quick toggle of status (Active / Suspended) conforming to CCHI & GOSI standards
  const toggleCardStatus = async (item: HealthInsurance) => {
    setIsSaving(true);
    const nextStatus = item.status === 'نشط' ? 'موقوف' : 'نشط';
    try {
      await updateHealth(item.id, { status: nextStatus });
      triggerToast(
        nextStatus === 'نشط'
          ? `تم تفعيل كرت بوبا الطبي للموظف بنجاح والربط فورياً.`
          : `تم تعليق التأمين الطبي (موقوف مؤقتاً) للموظف لتفادي التكاليف.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      triggerToast('فشل تحديث حالة البطاقة في قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Card entirely
  const handleDeleteCard = async (id: string, empName: string) => {
    if (!confirm(`تحذير هام ومسؤولية قانونية:\nهل أنت متأكد من رغبتك في حذف بطاقة وثيقة تأمين بوبا للموظف "${empName}" من لوائح الشركة؟`)) return;
    setIsSaving(true);
    try {
      await deleteHealth(id);
      triggerToast(`تم إلغاء وأرشفة بطاقة التأمين التابعة للموظف ${empName}.`, 'success');
      if (editingCard && editingCard.id === id) {
        setEditingCard(null);
      }
    } catch (err) {
      console.error(err);
      triggerToast('خطأ أثناء المسح من قاعدة البيانات.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modalities
  const openEditModal = (hItem: HealthInsurance) => {
    setEditingCard(hItem);
    setEditClass(hItem.class);
    setEditCardNo(hItem.cardNo);
    setEditPremium(hItem.premium);
    setEditDependents(hItem.dependents);
    setEditStatus(hItem.status);
    setEditStart(hItem.start);
    setEditEnd(hItem.end);
    setEditFileData(hItem.fileData || '');
    setEditFileName(hItem.fileName || '');
  };

  // Save edits of card
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    if (!editCardNo.trim()) {
      triggerToast('الرجاء كتابة رقم عضوية صحيح.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateHealth(editingCard.id, {
        class: editClass,
        cardNo: editCardNo.trim().toUpperCase(),
        start: editStart,
        end: editEnd,
        premium: Number(editPremium) || 0,
        dependents: Number(editDependents) || 0,
        status: editStatus,
        fileData: editFileData || undefined,
        fileName: editFileName || undefined
      });

      triggerToast('تم تعديل وحفظ بيانات بطاقة بوبا الطبية بنجاح.', 'success');
      setEditingCard(null);
      setEditFileData('');
      setEditFileName('');
    } catch (err) {
      console.error(err);
      triggerToast('فشل الاتصال ميزان الرواتب بالتعديلات بوبا.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Smart insights & analytical calculations representing real business metrics
  const bupaMetrics = useMemo(() => {
    const totalEmployees = employees.length;
    let coveredCount = 0;
    let totalPremium = 0;
    let dependentsCount = 0;
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let suspendedCount = 0;

    const todayStr = '2026-06-05'; // Guided local time
    const today = new Date(todayStr);

    health.forEach(hItem => {
      const isEmployeeActive = employees.some(e => e.id === hItem.empId);
      if (!isEmployeeActive) return;

      if (hItem.status === 'نشط') {
        coveredCount++;
        totalPremium += hItem.premium;
        dependentsCount += hItem.dependents;

        const endDate = new Date(hItem.end);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          expiredCount++;
        } else if (diffDays <= 30) {
          expiringSoonCount++;
        }
      } else {
        suspendedCount++;
      }
    });

    const averageCost = coveredCount > 0 ? Math.round(totalPremium / coveredCount) : 0;
    const complianceRate = totalEmployees > 0 ? Math.round((coveredCount / totalEmployees) * 100) : 0;

    // List of active employees who do NOT have any healthcare cards
    const missingEmployees = employees.filter(e => !health.some(hItem => hItem.empId === e.id));

    return {
      totalEmployees,
      coveredCount,
      totalPremium,
      dependentsCount,
      expiredCount,
      expiringSoonCount,
      suspendedCount,
      averageCost,
      complianceRate,
      missingEmployees
    };
  }, [employees, health]);

  // Handle opening Add Form pre-selected for missing employees
  const handleAddCardForEmployee = (empId: string) => {
    setNewEmpId(empId);
    setNewCardNo(`BU-${Math.floor(100000 + Math.random() * 900000)}`);
    setNewClass('B');
    setNewPremium(4200);
    setNewDependents(0);
    setIsAddOpen(true);
    triggerToast('تم اختيار الموظف المطلوب تلقائياً للإصدار.', 'info');
  };

  // Render list applying search filters
  const processedCards = useMemo(() => {
    return health.map(hItem => {
      const emp = employees.find(e => e.id === hItem.empId);
      return {
        ...hItem,
        employee: emp
      };
    }).filter(card => {
      if (!card.employee) return false; // Filter out if employee deleted

      const nameMatch = card.employee.name.toLowerCase().includes(searchTerm.toLowerCase());
      const cardMatch = card.cardNo.toLowerCase().includes(searchTerm.toLowerCase());
      const jobMatch = card.employee.job.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || cardMatch || jobMatch;

      const matchesClass = selectedClass === 'all' || card.class === selectedClass;
      const matchesStatus = selectedStatus === 'all' || card.status === selectedStatus;
      const matchesDept = selectedDept === 'all' || card.employee.dept === selectedDept;

      return matchesSearch && matchesClass && matchesStatus && matchesDept;
    });
  }, [health, employees, searchTerm, selectedClass, selectedStatus, selectedDept]);

  const handleExportCardsCSV = () => {
    const headers = [
      'اسم الموظف المستفيد',
      'القسم الإداري',
      'الوظيفة',
      'رقم بطاقة التأمين',
      'فئة التغطية الطبية',
      'القسط التأميني السنوي (ر.س)',
      'عدد التابعين المسجلين',
      'تاريخ بدء التغطية',
      'تاريخ انتهاء التغطية',
      'حالة بطاقة التأمين'
    ];
    
    const rows = processedCards.map(c => [
      c.employee ? c.employee.name : '—',
      c.employee ? c.employee.dept : '—',
      c.employee ? c.employee.job : '—',
      c.cardNo,
      c.class === 'VIP' ? 'VIP رئيسية' : `فئة ${c.class}`,
      c.premium,
      c.dependents,
      c.start,
      c.end,
      c.status
    ]);

    exportToCSV(`سجلات_تأمين_بوبا_الطبية_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Style class levels
  const getClassBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'VIP':
        return 'bg-gradient-to-r from-slate-900 to-amber-950 text-gold hover:from-slate-800 border border-gold/40 shadow-xs';
      case 'A':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'B':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'C':
        return 'bg-slate-50 text-slate-700 border border-slate-200';
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-200';
    }
  };

  const getBupaCardTheme = (tier: string) => {
    switch (tier) {
      case 'VIP':
        return {
          bg: 'bg-gradient-to-br from-slate-900 via-slate-850 to-amber-950 border-gold/50',
          text: 'text-white',
          subtitle: 'text-slate-300',
          accent: 'text-gold',
          badge: 'bg-gold/20 text-gold-light border border-gold/30',
          cardIcon: '👑 Bupa VIP Premium'
        };
      case 'A':
        return {
          bg: 'bg-gradient-to-br from-indigo-950 to-blue-900 border-indigo-400/30',
          text: 'text-white',
          subtitle: 'text-indigo-200',
          accent: 'text-blue-200',
          badge: 'bg-blue-500/20 text-blue-100 border border-blue-400/30',
          cardIcon: '💎 Bupa Platinum A'
        };
      case 'B':
        return {
          bg: 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700',
          text: 'text-white',
          subtitle: 'text-slate-350',
          accent: 'text-gold-dim',
          badge: 'bg-slate-700/50 text-slate-200 border border-slate-600',
          cardIcon: '🛡️ Bupa Standard B'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-700 via-slate-750 to-slate-800 border-slate-655',
          text: 'text-white',
          subtitle: 'text-slate-300',
          accent: 'text-slate-200',
          badge: 'bg-slate-600 text-slate-100',
          cardIcon: '💼 Bupa Corporate C'
        };
    }
  };

  // Expiry check highlight util
  const getExpiryLabel = (endStr: string) => {
    const today = new Date('2026-06-05');
    const end = new Date(endStr);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'منتهية الصلاحية ⚠️', style: 'text-rose-600 bg-rose-50 border-rose-250' };
    } else if (diffDays <= 30) {
      return { text: `تنتهي خلال ${diffDays} يوم ⏳`, style: 'text-amber-650 bg-amber-50 border-amber-250 animate-pulse font-extrabold' };
    } else {
      return { text: `صالح ولغاية ${endStr}`, style: 'text-emerald-700 bg-emerald-50 border-emerald-250' };
    }
  };

  return (
    <div className="space-y-6 font-sans select-none animate-slideup mb-12 text-right" dir="rtl" id="bupa-insurance-root">

      {/* Floating Dynamic Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-5 left-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
          toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
          'bg-slate-800 text-white border-slate-755'
        }`}>
          {toastMessage.type === 'success' && <Check className="w-5 h-5 text-white" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-white" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-white" />}
          <span className="text-xs font-bold leading-normal">{toastMessage.text}</span>
        </div>
      )}

      {/* Hero Group Header - Bupa Arabia theme */}
      <div className="bg-gradient-to-l from-slate-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-44 h-44 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative z-10 w-full">
          <div className="space-y-2 max-w-4xl">
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={handleExportCardsCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5 border-none"
              title="تصدير وثائق بوبا الحالية كملف Excel"
            >
              📊 تصدير Excel (CSV)
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-gold hover:bg-gold-light text-slate-900 px-4 py-2.5 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5 border-none"
            >
              <Plus className="w-4 h-4" /> إصدار بطاقة بوبا جديدة
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Panel with highly strategic information */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="bupa-kpi-panel">
        
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">إجمالي الموظفين المؤمن عليهم</span>
            <div className="flex items-baseline gap-1">
              <strong className="text-xl font-black font-mono text-slate-800">{bupaMetrics.coveredCount}</strong>
              <span className="text-[10px] text-slate-400">من أصل {bupaMetrics.totalEmployees}</span>
            </div>
          </div>
          <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">إجمالي التابعين (العائلات)</span>
            <strong className="text-xl font-black font-mono text-indigo-700">{bupaMetrics.dependentsCount}</strong>
          </div>
          <div className="w-9 h-9 bg-indigo-50 text-indigo-650 rounded-lg flex items-center justify-center border border-indigo-100">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">تكاليف وثيقة بوبا السنوية</span>
            <div className="flex items-baseline gap-0.5">
              <strong className="text-xl font-black font-mono text-emerald-600">
                {bupaMetrics.totalPremium.toLocaleString('en-US')}
              </strong>
              <span className="text-[9px] text-slate-400 font-bold">ر.س / سنوي</span>
            </div>
          </div>
          <div className="w-9 h-9 bg-emerald-50 text-emerald-650 rounded-lg flex items-center justify-center border border-emerald-100">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 block font-bold">معدل الامتثال والتغطية الموحدة</span>
            <div className="flex items-center gap-1.5">
              <strong className="text-xl font-black font-mono text-amber-600">{bupaMetrics.complianceRate}%</strong>
              <span className={`w-2 h-2 rounded-full ${bupaMetrics.complianceRate === 100 ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
            </div>
          </div>
          <div className="w-9 h-9 bg-amber-50 text-amber-650 rounded-lg flex items-center justify-center border border-amber-100">
            <Award className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Grid: Compliance Insights Widget & Policy Contract Description Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Policy Contract Details Card Dashboard */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              📋
            </div>
            <div className="text-right">
              <h3 className="text-xs font-black text-slate-800">بيانات وثيقة بوبا الموحدة</h3>
              <p className="text-[9px] text-slate-400">عقد التغطية الموحد الخاص بالمنشأة</p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 font-bold">رقم البوليصة الرسمية:</span>
              <strong className="font-mono text-slate-800">BUPA-SA-2026-X99</strong>
            </div>
            
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 font-bold">المنتج والخدمة:</span>
              <strong className="text-indigo-950 font-extrabold text-[11px]">Bupa Corporate Care GOLD</strong>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 font-bold">تاريخ تجديد الوثيقة السنوي:</span>
              <span className="font-mono text-amber-750 font-bold">2026-12-31</span>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 font-bold">تصنيف شبكة التغطية:</span>
              <strong className="text-slate-700">الشبكة الذهبية والفضية (Gold/Silver Network)</strong>
            </div>


          </div>
        </div>

        {/* Dynamic Compliance Alerts & Immediate Actions for Missing Employees */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between whitespace-normal">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-xs font-black text-rose-800">رادار الامتثال الطبي ومخاطر الغرامات (CCHI Alerts)</h3>
              </div>
              <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                تحليل تلقائي متطابق بالكامل
              </span>
            </div>

            {/* Warning Cards Expired/Soon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Box 1: Expiring soon cards */}
              <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                    ⚠️ بطاقات بحاجة لتجديد عاجل
                  </span>

                </div>
                {bupaMetrics.expiringSoonCount > 0 && (
                  <span className="inline-block text-[9.5px] text-amber-700 font-extrabold mt-1">
                    يرجى التواصل مع ممثلي بوبا لبدء السداد وإعادة تأكيد الجداول.
                  </span>
                )}
              </div>

              {/* Box 2: Missing Coverage Employees (Critical) */}
              <div className="p-3 border border-rose-250 bg-rose-50/40 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-black text-rose-700 flex items-center gap-1">
                    🚫 موظفون بدون تغطية تأمينية (مخالف للوزارة)
                  </span>

                </div>
                {bupaMetrics.missingEmployees.length === 0 && (
                  <span className="text-[10px] text-emerald-650 font-bold flex items-center gap-1 mt-1">
                    ✅ ممتاز! كافة الكوادر حالياً خاضعة للتأمين الصحي التعاوني.
                  </span>
                )}
              </div>

            </div>

            {/* Action items list for lack of coverage */}
            {bupaMetrics.missingEmployees.length > 0 && (
              <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin border border-slate-100 rounded-lg p-2 bg-slate-50">
                <p className="text-[10px] text-slate-400 font-black">إصدار تسوية فورية للمستجدين والمفتقدين للتأمين:</p>
                {bupaMetrics.missingEmployees.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded-md text-[10.5px]">
                    <span className="font-bold text-slate-700">
                      👤 {e.name} ({e.job} · {e.dept})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddCardForEmployee(e.id)}
                      className="bg-indigo-600 hover:bg-indigo-750 text-white border-none py-1 px-2.5 rounded-lg text-[9.5px] font-bold cursor-pointer transition active:scale-95"
                    >
                      إقرار وإصدار كرت طبي
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>

      </div>

      {/* Search, Grouping and Filtering Workspace controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3.5" id="bupa-search-filters bg">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Real-time Input search field */}
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="ابحث باسم الموظف أو رقم البطاقة الطبية بوبا..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-gold focus:bg-white bg-slate-50 font-bold text-right"
              id="bupa-card-search"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          </div>

          {/* Quick Clear filters */}
          {(searchTerm !== '' || selectedClass !== 'all' || selectedStatus !== 'all' || selectedDept !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('all');
                setSelectedStatus('all');
                setSelectedDept('all');
              }}
              className="text-xs bg-slate-100 text-slate-600 hover:bg-gold hover:text-slate-900 border-none rounded-lg px-3 py-2 cursor-pointer transition flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" /> إعادة تعيين التصفية
            </button>
          )}

        </div>

        {/* Dropdowns filters */}
        <div className="grid grid-cols-3 gap-3 pt-2.5 border-t border-slate-100">
          
          <div className="space-y-1">
            <label className="text-[10.5px] text-slate-400 block font-bold">فئة المزايا (Bupa Class):</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white text-slate-700 outline-none focus:border-gold text-right"
              id="selected-class-filter"
            >
              <option value="all">كافة درجات التأمين</option>
              <option value="VIP">Premium (VIP)</option>
              <option value="A">الفئة الفضية (A)</option>
              <option value="B">الفئة البرونزية (B)</option>
              <option value="C">الفئة العادية (C)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] text-slate-400 block font-bold">الوضعية والاشتراك:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white text-slate-700 outline-none focus:border-gold text-right"
            >
              <option value="all">جميع الحالات</option>
              <option value="نشط">ساري المفعول (نشط)</option>
              <option value="موقوف">موقوف مؤقتاً</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10.5px] text-slate-405 block font-bold">فرز حسب قسم العمل:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold bg-white text-slate-700 outline-none focus:border-gold text-right"
            >
              <option value="all">كافة الأقسام</option>
              <option value="الهندسة">الهندسة 💻</option>
              <option value="المبيعات">المبيعات 📈</option>
              <option value="التسويق">التسويق 📣</option>
              <option value="المالية">المالية 💵</option>
              <option value="الموارد البشرية">الموارد البشرية 👥</option>
            </select>
          </div>

        </div>
      </div>

      {/* CORE BUPA DIGITAL CARDS GRID */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-xs font-black text-slate-800">بطاقات بوبا الموثقة بقاعدة البيانات ({processedCards.length})</h3>
        </div>

        {processedCards.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-2">
            <span className="text-3xl block">🏷️</span>
            <strong className="text-xs font-black text-slate-700 block">لم نجد أي بطاقات تأمين طبي مطابقة للبحث</strong>
            <p className="text-[10px] text-slate-400">يرجى تعديل خيارات البحث أو مرشحات الفئة، أو إصدار بطاقة جديدة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="bupa-cards-wrapper">
            {processedCards.map((card) => {
              const theme = getBupaCardTheme(card.class);
              const expiry = getExpiryLabel(card.end);
              return (
                <div
                  key={card.id}
                  className="flex flex-col rounded-2xl border bg-slate-50 overflow-hidden shadow-xs hover:shadow-md transition duration-200 group"
                >
                  
                  {/* Digital Physical-looking Bupa Card representation */}
                  <div className={`p-5 rounded-t-2xl relative border-b ${theme.bg} ${theme.text} space-y-4`}>
                    
                    {/* Header level inside card */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9.5px] tracking-widest font-black uppercase text-gold opacity-90 block">
                          {theme.cardIcon}
                        </span>
                        <div className="text-[8px] opacity-75">Cooperative Health Insurance</div>
                      </div>
                      <span className="text-sm font-black italic tracking-wider text-rose-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-pulse" /> BUPA بوبا
                      </span>
                    </div>

                    {/* Member cardNo & info */}
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-col">
                        <span className="text-[8px] opacity-65">رقم العضوية فريداً / Member No:</span>
                        <span className="text-sm font-black font-mono tracking-wider text-gold-light">
                          {card.cardNo}
                        </span>
                      </div>

                      {/* Employee Insured Name */}
                      <div className="flex flex-col">
                        <span className="text-[8px] opacity-65">حامل البطاقة الأسـاسي / Insured Name:</span>
                        <span className="text-xs font-bold leading-normal truncate">
                          {card.employee?.name}
                        </span>
                      </div>
                    </div>

                    {/* Footer level inside card */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-[9px]">
                      <div>
                        <span className="opacity-60 block text-[7.5px]">التصنيف (Class)</span>
                        <strong className="font-mono text-gold-dim">{card.class}</strong>
                      </div>
                      <div>
                        <span className="opacity-60 block text-[7.5px]">التابعين (Deps)</span>
                        <strong className="font-mono">{card.dependents} أفراد</strong>
                      </div>
                      <div>
                        <span className="opacity-60 block text-[7.5px]">الحالة السارية</span>
                        <span className={`font-bold ${card.status === 'نشط' ? 'text-emerald-400' : 'text-rose-350'}`}>
                          {card.status}
                        </span>
                      </div>
                    </div>

                    {/* Subtle aesthetic card chip */}
                    <div className="absolute right-5 bottom-12 w-6 h-5 bg-gradient-to-tr from-amber-250 to-gold rounded-sm opacity-20 pointer-events-none" />
                  </div>

                  {/* Actions Area attached bottom of card representation */}
                  <div className="bg-white p-4 space-y-3.5 flex-1 flex flex-col justify-between border-x border-b border-slate-200 rounded-b-2xl">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-400 font-bold">القسم الوظيفي:</span>
                        <span className="text-slate-750 font-black">{card.employee?.dept} · {card.employee?.job}</span>
                      </div>

                      <div className="flex justify-between items-center text-[10.5px]">
                        <span className="text-slate-400 font-bold">القسط السنوي (Premium):</span>
                        <strong className="text-emerald-700 font-mono">{(card.premium || 0).toLocaleString()} ر.س</strong>
                      </div>

                      <div className="flex justify-between items-center text-[10px] py-1 border-t border-slate-50">
                        <span className="text-slate-400 font-bold">تاريخ التغطية:</span>
                        <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-bold ${expiry.style}`}>
                          {expiry.text}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Click buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 shrink-0">
                      
                      {/* Action 1: Toggle Status (suspension) */}
                      <button
                        type="button"
                        onClick={() => toggleCardStatus(card)}
                        className={`text-[10px] font-bold py-1.5 px-2 rounded-lg cursor-pointer hover:shadow-xs transition duration-150 text-center border ${
                          card.status === 'نشط'
                            ? 'bg-rose-50 text-rose-650 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                            : 'bg-emerald-55 bg-opacity-75 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        }`}
                        title={card.status === 'نشط' ? 'إيقاف مؤقت للتغطية الطبية' : 'إعادة تفعيل التغطية بقاعدة البيانات'}
                      >
                        {card.status === 'نشط' ? '⏸️ إيقاف التغطية' : '▶️ تفعيل البطاقة'}
                      </button>

                      {/* Action 2: Edit metadata */}
                      <button
                        type="button"
                        onClick={() => openEditModal(card)}
                        className="text-[10px] font-bold py-1.5 px-2 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-700 text-center flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" /> تعديل البيانات
                      </button>

                      {/* Action 3: Assign task for renewal if expired/or just generally */}
                      <button
                        type="button"
                        onClick={() => delegateRenewalTask(card.employee?.name || 'الموظف', card.cardNo)}
                        className="col-span-2 text-[10px] font-extrabold py-1.5 px-2 rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-805 border border-indigo-200 text-center flex items-center justify-center gap-1 transition"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> تكليف مهمة تجديد في المهام 📁
                      </button>

                      {card.fileData && (
                        <button
                          type="button"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = card.fileData!;
                            link.download = card.fileName || `بطاقة_تأمين_${card.cardNo}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="col-span-2 text-[10px] font-black py-1.5 px-2 rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-center flex items-center justify-center gap-1 transition-all active:scale-95"
                          title="تنزيل ملف المستند الطبي الأصلي المرفق بقاعدة البيانات"
                        >
                          📥 تحميل بطاقة التأمين المرفقة (PDF)
                        </button>
                      )}

                      {/* Deletion (Danger area) icon hover */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card.id, card.employee?.name || 'الموظف')}
                        className="col-span-2 text-[9px] font-medium text-slate-400 hover:text-rose-600 transition text-center bg-transparent border-none cursor-pointer pt-1"
                      >
                        حذف بطاقة التأمين نهائياً من سجلات الموظف
                      </button>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW BUPA CARD */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fadein">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-right" dir="rtl">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  🛡️ إصدار بطاقة تأمين طبي بوبا
                </h3>
                <p className="text-[9.5px] text-slate-400">تسجيل كرت صحي جديد لأي موظف شاغر</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white bg-transparent border-none text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCard} className="p-5 space-y-4">
              
              {/* Select Employee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-550">تسمية الموظف الأساسي *</label>
                <div className="relative">
                  <select
                    required
                    value={newEmpId}
                    onChange={(e) => setNewEmpId(e.target.value)}
                    className="w-full pl-3 pr-9 py-2.5 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-gold bg-slate-50 appearance-none text-right"
                  >
                    <option value="">-- اختر موظفاً لإصدار بطاقته --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.job} · {e.dept})
                      </option>
                    ))}
                  </select>
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Bupa class */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-550">فئة ومزايا الرعاية (Bupa Care Plus)</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['VIP', 'A', 'B', 'C'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => applyBupaTierTemplate(tier, 'add')}
                      className={`py-1.5 rounded-lg border text-[11px] font-black cursor-pointer transition ${
                        newClass === tier
                          ? 'bg-slate-900 text-gold border-gold/70 shadow-inner'
                          : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
                <span className="text-[8.5px] text-slate-400">تمنح فئة VIP مستويات سقف سداد مطلقة لعيادات النخبة.</span>
              </div>

              {/* cardNo & dependents limit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">رقم بطاقة بوبا (Card No) *</label>
                  <input
                    type="text"
                    required
                    placeholder="BU-123456"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={newCardNo}
                    onChange={(e) => setNewCardNo(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">عدد عائلة الموظف التابعين</label>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={newDependents}
                    onChange={(e) => setNewDependents(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Premium Yearly */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">قسط التأمين السنوي المترتب (ر.س) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={newPremium}
                    onChange={(e) => setNewPremium(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-400 absolute left-3 top-2.5 font-bold">ريال سعودي</span>
                </div>
              </div>

              {/* Start & End Expiry dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-550">بداية التغذية المعتمدة</label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-555">نهاية التغطية (Expiry)</label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* PDF Document Upload */}
              <div className="flex flex-col gap-1.5 border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <label className="text-xs font-bold text-slate-505">مرفق وثيقة التأمين الطبي / كرت بوبا (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleInsuranceFileChange(e, 'new')}
                  className="text-xs text-slate-500 block w-full file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {newFileName && (
                  <span className="text-[10px] text-emerald-600 font-bold">📄 الملف المكتشف: {newFileName}</span>
                )}
              </div>

              {/* Form buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold hover:bg-gold-light text-slate-900 border-none flex-1 py-2.5 px-4 rounded-xl cursor-pointer text-xs font-black shadow-md transition disabled:opacity-45"
                >
                  {isSaving ? 'جار حفظ البطاقة...' : 'تأكيد وإصدار الوثيقة'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-655 border-none px-4 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold"
                >
                  إلغاء التراجع
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING BUPA CARD */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fadein">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-right" dir="rtl">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                  ⚙️ تعديل بطاقة بوبا الطبية
                </h3>
                <p className="text-[9.5px] text-slate-400">تحديث تفاصيل الرعاية والتصنيف التابعة للموظف</p>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                className="text-slate-400 hover:text-white bg-transparent border-none text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              
              {/* Employee name showing readonly */}
              <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-lg border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold">الموظف المؤمن عليه:</span>
                <strong className="text-xs text-slate-700">
                  👤 {employees.find(e => e.id === editingCard.empId)?.name || 'الموظف المحفوظ'}
                </strong>
              </div>

              {/* Bupa class edit options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">تعديل فئة الرعاية الطبية (Bupa Class)</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['VIP', 'A', 'B', 'C'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => applyBupaTierTemplate(tier, 'edit')}
                      className={`py-1.5 rounded-lg border text-[11px] font-black cursor-pointer transition ${
                        editClass === tier
                          ? 'bg-slate-900 text-gold border-gold/70 shadow-inner'
                          : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* cardNo & dependents limit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">رقم عضوية بوبا (Card No) *</label>
                  <input
                    type="text"
                    required
                    placeholder="BU-123456"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={editCardNo}
                    onChange={(e) => setEditCardNo(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">عدد التابعين المسجلين *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={15}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={editDependents}
                    onChange={(e) => setEditDependents(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Premium Yearly */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">القسط السنوي للبوليصة (ر.س) *</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={editPremium}
                    onChange={(e) => setEditPremium(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-400 absolute left-3 top-2.5 font-bold">ريال سعودي</span>
                </div>
              </div>

              {/* Status active or suspended */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">الوضعية والاشتراك بالتأمين</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus('نشط')}
                    className={`py-2 rounded-lg border text-xs font-black cursor-pointer transition ${
                      editStatus === 'نشط'
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-655 border-slate-202 hover:bg-slate-100'
                    }`}
                  >
                    نشط وساري ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus('موقوف')}
                    className={`py-2 rounded-lg border text-xs font-black cursor-pointer transition ${
                      editStatus === 'موقوف'
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-slate-50 text-slate-655 border-slate-202 hover:bg-slate-100'
                    }`}
                  >
                    موقوف مؤقتاً ⏸️
                  </button>
                </div>
              </div>

              {/* Start & End Expiry dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-550">تاريخ بداية التغطية</label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-555">انتهاء الصلاحية</label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-gold bg-slate-50 text-right font-mono"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                  />
                </div>
              </div>

              {/* PDF Document Upload */}
              <div className="flex flex-col gap-1.5 border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <label className="text-xs font-bold text-slate-505">مرفق بوليصة أو بطاقة التأمين الصحي للموظف (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleInsuranceFileChange(e, 'edit')}
                  className="text-xs text-slate-500 block w-full file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {editFileName && (
                  <div className="flex justify-between items-center bg-emerald-50 p-1.5 rounded-md mt-1">
                    <span className="text-[10px] text-emerald-700 font-bold truncate">📄 {editFileName}</span>
                    {editFileData && (
                      <button
                        type="button"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = editFileData;
                          link.download = editFileName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="bg-transparent border-none text-[9px] text-[#0284c7] font-bold cursor-pointer hover:underline"
                      >
                        📥 تحميل المرفق الحالي
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Form buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-gold hover:bg-gold-light text-slate-900 border-none flex-1 py-2.5 px-4 rounded-xl cursor-pointer text-xs font-black shadow-md transition disabled:opacity-45"
                >
                  {isSaving ? 'جاري الحفظ بالتعديل...' : 'مزامنة وحفظ التعديلات'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-655 border-none px-4 py-2.5 rounded-xl cursor-pointer text-xs font-extrabold"
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
