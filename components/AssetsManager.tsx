/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { EmployeeAsset, AssetHistory, Employee } from '../types';
import { processAttachedFile } from '../utils/fileUtils';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit,
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  FileText, 
  Image as ImageIcon, 
  Download, 
  User, 
  Calendar, 
  History, 
  Upload, 
  X, 
  Search, 
  FileCheck,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';

export const AssetsManager: React.FC = () => {
  const {
    assets,
    assetHistory,
    addAsset,
    updateAsset,
    updateAssetStatus,
    deleteAsset,
    hasPermission,
    currentUser,
    employees,
    loading,
    loadViewData
  } = useHR();

  // Search & Filters states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Modal and Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields State (shared for Add/Edit)
  const [formEmpId, setFormEmpId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('أجهزة كمبيوتر');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<EmployeeAsset['status']>('Assigned');
  const [formAssignDate, setFormAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');
  const [formAssignedBy, setFormAssignedBy] = useState(currentUser?.fullName || 'إدارة الموارد البشرية');

  // File Upload State
  const [formAgreementName, setFormAgreementName] = useState('');
  const [formAgreementData, setFormAgreementData] = useState('');
  const [formImageName, setFormImageName] = useState('');
  const [formImageData, setFormImageData] = useState('');

  // Drag state
  const [isDragOverAgreement, setIsDragOverAgreement] = useState(false);
  const [isDragOverImage, setIsDragOverImage] = useState(false);

  // Status Modal State
  const [statusAssetId, setStatusAssetId] = useState<string | null>(null);
  const [statusNewStatus, setStatusNewStatus] = useState<EmployeeAsset['status']>('Assigned');
  const [statusNotes, setStatusNotes] = useState('');

  const categories = [
    'أجهزة كمبيوتر', 
    'هواتف محمولة', 
    'أجهزة مكتبية', 
    'سيارات وباصات', 
    'بطاقات دخول وبطاقات ذكية', 
    'أدوات ومستلزمات مهنية', 
    'أخرى'
  ];

  // Map state to Arabic labels & styles
  const getStatusMeta = (status: EmployeeAsset['status']) => {
    switch (status) {
      case 'Assigned':
        return { label: 'مُسلّم (نشط)', color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: <CheckCircle className="w-3.5 h-3.5" /> };
      case 'Returned':
        return { label: 'مُسترجع (مغلق)', color: 'text-slate-600 bg-slate-50 border-slate-100', icon: <FileCheck className="w-3.5 h-3.5" /> };
      case 'Lost':
        return { label: 'مفقود (ضائع)', color: 'text-rose-700 bg-rose-50 border-rose-100', icon: <AlertCircle className="w-3.5 h-3.5" /> };
      case 'Damaged':
        return { label: 'تالف (معطوب)', color: 'text-amber-700 bg-amber-50 border-amber-100', icon: <AlertTriangle className="w-3.5 h-3.5" /> };
      case 'Under Maintenance':
        return { label: 'تحت الصيانة', color: 'text-sky-700 bg-sky-50 border-sky-100', icon: <Wrench className="w-3.5 h-3.5" /> };
      default:
        return { label: status, color: 'text-slate-600 bg-slate-50 border-slate-100', icon: <Package className="w-3.5 h-3.5" /> };
    }
  };

  // Resolve Employee name
  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : 'موظف غير معروف';
  };

  // Quick statistics calculation
  const stats = useMemo(() => {
    let active = 0;
    let returned = 0;
    let issues = 0; // Lost, Damaged, Under Maintenance
    
    assets.forEach(asset => {
      if (asset.status === 'Assigned') active++;
      else if (asset.status === 'Returned') returned++;
      else if (['Lost', 'Damaged', 'Under Maintenance'].includes(asset.status)) issues++;
    });

    return {
      total: assets.length,
      active,
      returned,
      issues
    };
  }, [assets]);

  // Filters logic
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const empName = getEmployeeName(asset.empId).toLowerCase();
      const assetName = asset.name.toLowerCase();
      const matchesSearch = empName.includes(searchTerm.toLowerCase()) || assetName.includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
      const matchesEmployee = employeeFilter === 'all' || asset.empId === employeeFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesEmployee;
    });
  }, [assets, searchTerm, statusFilter, categoryFilter, employeeFilter, employees]);

  const selectedAsset = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  // File Upload Handlers (reusing processAttachedFile)
  const handleAgreementUploadFile = (file: File) => {
    setErrorMsg('');
    processAttachedFile(
      file,
      (base64) => {
        setFormAgreementName(file.name);
        setFormAgreementData(base64);
      },
      (error) => {
        setErrorMsg(error);
        setFormAgreementName('');
        setFormAgreementData('');
      }
    );
  };

  const handleImageUploadFile = (file: File) => {
    setErrorMsg('');
    processAttachedFile(
      file,
      (base64) => {
        setFormImageName(file.name);
        setFormImageData(base64);
      },
      (error) => {
        setErrorMsg(error);
        setFormImageName('');
        setFormImageData('');
      }
    );
  };

  // Submission handles
  const handleOpenAddModal = () => {
    setErrorMsg('');
    setFormEmpId(employees[0]?.id || '');
    setFormName('');
    setFormCategory('أجهزة كمبيوتر');
    setFormDescription('');
    setFormStatus('Assigned');
    setFormAssignDate(new Date().toISOString().slice(0, 10));
    setFormNotes('');
    setFormAssignedBy(currentUser?.fullName || 'إدارة الموارد البشرية');
    setFormAgreementName('');
    setFormAgreementData('');
    setFormImageName('');
    setFormImageData('');
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmpId) {
      setErrorMsg('الرجاء اختيار الموظف المستلم للعهدة.');
      return;
    }
    if (!formName.trim() || !formDescription.trim()) {
      setErrorMsg('الرجاء تعبئة اسم وتفاصيل الأصل العيني بشكل كامل.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addAsset({
        empId: formEmpId,
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        status: formStatus,
        assignDate: formAssignDate,
        notes: formNotes.trim() || undefined,
        assignedBy: formAssignedBy.trim(),
        agreementName: formAgreementName || undefined,
        agreementData: formAgreementData || undefined,
        imageName: formImageName || undefined,
        imageData: formImageData || undefined
      });

      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية حفظ العهدة بقاعدة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (asset: EmployeeAsset) => {
    setErrorMsg('');
    setFormEmpId(asset.empId);
    setFormName(asset.name);
    setFormCategory(asset.category);
    setFormDescription(asset.description);
    setFormStatus(asset.status);
    setFormAssignDate(asset.assignDate);
    setFormNotes(asset.notes || '');
    setFormAssignedBy(asset.assignedBy);
    setFormAgreementName(asset.agreementName || '');
    setFormAgreementData(asset.agreementData || '');
    setFormImageName(asset.imageName || '');
    setFormImageData(asset.imageData || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await updateAsset(selectedAssetId, {
        empId: formEmpId,
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        status: formStatus,
        assignDate: formAssignDate,
        notes: formNotes.trim() || undefined,
        assignedBy: formAssignedBy.trim(),
        agreementName: formAgreementName || undefined,
        agreementData: formAgreementData || undefined,
        imageName: formImageName || undefined,
        imageData: formImageData || undefined
      });

      setShowEditModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية تحديث العهدة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenStatusModal = (asset: EmployeeAsset) => {
    setStatusAssetId(asset.id);
    setStatusNewStatus(asset.status);
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusAssetId) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await updateAssetStatus(statusAssetId, statusNewStatus, statusNotes.trim());
      setShowStatusModal(false);
      setStatusNotes('');
      setStatusAssetId(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في تحديث حالة الأصل.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف وإلغاء هذه العهدة من سجلات شؤون الموظفين نهائياً؟')) {
      try {
        await deleteAsset(id);
        if (selectedAssetId === id) setSelectedAssetId(null);
      } catch (err: any) {
        alert(err.message || 'فشل حذف العهدة.');
      }
    }
  };

  const downloadAttachedFile = (name: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Page Title & Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">السجل المركزي العام لعهد الموظفين والأصول</h2>

        </div>

        <div className="flex gap-2">
          {hasPermission('create_asset') && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 bg-gold hover:bg-gold-light text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-none cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              إسناد عهدة جديدة لموظف
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row (Bento Grid Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">إجمالي كافة العهد</span>
          <div className="flex justify-between items-center mt-1">
            <h3 className="text-xl font-black text-slate-800">{stats.total}</h3>
            <span className="p-2 bg-slate-50 text-slate-600 rounded-xl"><Package className="w-4 h-4" /></span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">العهد النشطة (قيد الاستخدام)</span>
          <div className="flex justify-between items-center mt-1">
            <h3 className="text-xl font-black text-emerald-700">{stats.active}</h3>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-4 h-4" /></span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">العهد المسترجعة والمغلقة</span>
          <div className="flex justify-between items-center mt-1">
            <h3 className="text-xl font-black text-slate-550">{stats.returned}</h3>
            <span className="p-2 bg-slate-50 text-slate-500 rounded-xl"><FileCheck className="w-4 h-4" /></span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-4.5 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">مفقودة / تالفة / تحت الصيانة</span>
          <div className="flex justify-between items-center mt-1">
            <h3 className="text-xl font-black text-amber-700">{stats.issues}</h3>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Wrench className="w-4 h-4" /></span>
          </div>
        </div>
      </div>

      {/* Control filters & Search */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-150 space-y-3.5 shadow-xs">
        <div className="flex flex-col lg:flex-row gap-3.5">
          
          {/* Search box */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="البحث باسم العهدة باللغة العربية أو اسم الموظف..."
              className="w-full pl-3.5 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-gold font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 text-slate-400 absolute top-2.5 right-3.5" />
          </div>

          {/* Employee dropdown filter */}
          <div className="w-full lg:w-48 flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3.5 py-1.5">
            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">الموظف:</span>
            <select
              className="w-full border-none bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <option value="all">كل الموظفين</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter dropdown */}
          <div className="w-full lg:w-48 flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3.5 py-1.5">
            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">الحالة:</span>
            <select
              className="w-full border-none bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">كل الحالات</option>
              <option value="Assigned">مُسلّم (نشط)</option>
              <option value="Returned">مُسترجع (مغلق)</option>
              <option value="Under Maintenance">تحت الصيانة</option>
              <option value="Damaged">تالف (معطوب)</option>
              <option value="Lost">مفقود (ضائع)</option>
            </select>
          </div>

          {/* Category filter dropdown */}
          <div className="w-full lg:w-48 flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3.5 py-1.5">
            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">التصنيف:</span>
            <select
              className="w-full border-none bg-transparent outline-none text-xs font-bold text-slate-700 cursor-pointer"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">كل التصنيفات</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Main Grid Layout: List vs Spec Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Assets Table/Grid List */}
        <div className="lg:col-span-2 bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
          
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h4 className="text-xs font-black text-slate-800">قائمة العهد المودعة والمثبتة ({filteredAssets.length})</h4>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-200 mx-auto" />
              <p className="text-xs font-bold text-slate-400">لا توجد عهد أو عينات مطابقة لبحثك في قاعدة البيانات.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-bold bg-slate-50/70">
                    <th className="p-3">اسم الأصل العيني</th>
                    <th className="p-3">المستلم والوصي</th>
                    <th className="p-3">التصنيف</th>
                    <th className="p-3">تاريخ التسليم</th>
                    <th className="p-3">الحالة التنظيمية</th>
                    <th className="p-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => {
                    const statusMeta = getStatusMeta(asset.status);
                    const isSelected = selectedAssetId === asset.id;
                    const matchingEmp = employees.find(e => e.id === asset.empId);
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAssetId(isSelected ? null : asset.id)}
                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-gold-bg/5 font-semibold border-r-4 border-r-gold' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-extrabold text-slate-800 block text-xs">{asset.name}</div>
                          <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{asset.id.slice(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0 text-[10px]">
                              👤
                            </span>
                            <div>
                              <strong className="text-slate-800 block">{matchingEmp ? matchingEmp.name : 'مجهول'}</strong>
                              <span className="text-[9px] text-slate-400 block mt-0.5">{matchingEmp?.job} • {matchingEmp?.dept}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-600 font-medium">{asset.category}</td>
                        <td className="p-3 text-slate-500 font-mono">{asset.assignDate}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border inline-flex items-center gap-1 leading-none ${statusMeta.color}`}>
                            {statusMeta.icon}
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="p-3 text-left" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1.5">
                            
                            <button
                              onClick={() => setSelectedAssetId(isSelected ? null : asset.id)}
                              className="p-1 px-2 text-[10px] bg-slate-100 font-bold rounded-lg hover:bg-slate-200 text-slate-600 border-none cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              معاينة
                            </button>

                            {hasPermission('edit_asset') && (
                              <button
                                onClick={() => handleOpenEditModal(asset)}
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border-none cursor-pointer"
                                title="تعديل المواصفات العينية"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {hasPermission('return_asset') && asset.status !== 'Returned' && (
                              <button
                                onClick={() => handleOpenStatusModal(asset)}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border-none cursor-pointer"
                                title="تسليم / استرجاع"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {hasPermission('edit_asset') && (
                              <button
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border-none cursor-pointer"
                                title="حذف العهدة نهائياً"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

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

        {/* Selected Asset details Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
            <h4 className="text-xs font-bold text-slate-700 pb-3 border-b border-slate-100 flex items-center gap-2">
              🔍 نافذة تفاصيل ومعاينة السجل العيني
            </h4>

            {!selectedAsset ? (
              <div className="text-center py-16 space-y-3">
                <Package className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  الرجاء النقر على أي أصل عيني من القوالب لعرض التفاصيل الخاصة بمواصفاته وعقوده المرفقة.
                </p>
              </div>
            ) : (
              <div className="space-y-4.5 animate-slideup">
                
                {selectedAsset.imageData ? (
                  <div className="rounded-xl overflow-hidden border border-slate-100 h-36 bg-slate-50 relative group">
                    <img 
                      src={selectedAsset.imageData} 
                      alt={selectedAsset.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => downloadAttachedFile(selectedAsset.imageName || 'asset.jpg', selectedAsset.imageData!)}
                        className="bg-white text-slate-800 p-2 rounded-xl text-xs font-bold shadow-md cursor-pointer border-none flex items-center gap-1 hover:bg-slate-100"
                      >
                        <Download className="w-3.5 h-3.5" />
                        حفظ الصورة
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 h-24 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <ImageIcon className="w-7 h-7 text-slate-300" />
                    <span className="text-[10px] text-slate-450 font-semibold">لا تتوفر صورة للأصل</span>
                  </div>
                )}

                <div className="space-y-3.5 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">اسم الأصل والعهد العينية</span>
                    <h5 className="text-sm font-extrabold text-slate-800">{selectedAsset.name}</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">التصنيف العيني</span>
                      <strong className="text-xs text-slate-700 block">{selectedAsset.category}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">رمز المعرف العيني</span>
                      <code className="text-[11px] text-gold font-mono font-bold block">{selectedAsset.id.slice(0, 8).toUpperCase()}</code>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الموظف الحامي للعهدة</span>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                      <span className="text-base">👤</span>
                      <div>
                        <strong className="text-xs text-slate-800 block">{getEmployeeName(selectedAsset.empId)}</strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">رقم المعرف: #{selectedAsset.empId.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">وصف الأصل وغرضه الاستعمالي</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-semibold">
                      {selectedAsset.description}
                    </p>
                  </div>

                  {selectedAsset.notes && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الملاحظات والقيود الإدارية</span>
                      <p className="text-[10.5px] text-slate-500 italic bg-amber-50/40 p-2 rounded border border-amber-100 leading-relaxed">
                        {selectedAsset.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5 pb-2">
                  <span className="text-[10px] text-slate-400 font-bold block">مستندات وإقرارات العهدة الموثقة</span>
                  
                  {selectedAsset.agreementData ? (
                    <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50/30 p-2 rounded-xl">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="truncate text-right">
                          <span className="text-xs font-bold text-slate-800 block truncate" title={selectedAsset.agreementName}>
                            {selectedAsset.agreementName}
                          </span>
                          <span className="text-[9px] text-emerald-650 font-bold">● وثيقة إقرار سارية وموقعة</span>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadAttachedFile(selectedAsset.agreementName || 'agreement.pdf', selectedAsset.agreementData!)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg cursor-pointer border-none shadow transition-colors shrink-0"
                        title="تحميل وثيقة تسليم العهدة"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 border border-dashed border-slate-200 p-2.5 rounded-xl bg-slate-50/50">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-[10px] text-slate-500 font-bold">لم يرفع إقرار العهدة المالي بعد.</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  {hasPermission('return_asset') && selectedAsset.status !== 'Returned' && (
                    <button
                      onClick={() => handleOpenStatusModal(selectedAsset)}
                      className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-xs py-2 rounded-xl font-bold cursor-pointer transition-colors border-none"
                    >
                      📥 استرجاع العهدة
                    </button>
                  )}
                  {hasPermission('edit_asset') && (
                    <button
                      onClick={() => handleOpenEditModal(selectedAsset)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3.5 py-2 rounded-xl font-bold cursor-pointer transition-colors border-none"
                    >
                      تعديل
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* MODAL 1 & 2: Add and Edit Asset Form Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scaleup">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800">
                {showAddModal ? 'إقرار وتسجيل عهدة عينية جديدة' : 'تحديث وتعديل سجل الأصول العينية'}
              </h3>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Employee select field */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">الموظف المعني بالعهدة <span className="text-rose-500">*</span></label>
                  <select
                    className="border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gold font-bold text-slate-700"
                    value={formEmpId}
                    onChange={(e) => setFormEmpId(e.target.value)}
                    required
                  >
                    <option value="">-- اختر الموظف الوصي --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.dept})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">اسم ووصف الأصل العيني <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="مثال: لابتوب ماك بوك برو M3 خط إنتاجي لعام 2026"
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold font-bold"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">التصنيف العيني للأصل <span className="text-rose-500">*</span></label>
                  <select
                    className="border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">المسؤول عن توثيق وصرف العهدة <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold font-bold"
                    value={formAssignedBy}
                    onChange={(e) => setFormAssignedBy(e.target.value)}
                  />
                </div>

              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">وصف دقيق للأصل والحالة الفنية <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="شركة أجهزة متطورة، اللون رمادي فلكي، الحالة ممتازة ومثبت رقم الموديل التسلسلي."
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold leading-relaxed resize-none h-20"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">حالة الإسناد والعهدة الحالية <span className="text-rose-500">*</span></label>
                  <select
                    className="border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gold font-bold text-slate-700"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                  >
                    <option value="Assigned">مُسلّم (نشط)</option>
                    <option value="Under Maintenance">تحت الصيانة المعملية</option>
                    <option value="Damaged">تالف أو به عيب فني</option>
                    <option value="Lost">مفقود أو ضائع</option>
                    <option value="Returned">مُسترجع ومغلق</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">تاريخ تسليم العهدة <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs outline-none focus:border-gold"
                    value={formAssignDate}
                    onChange={(e) => setFormAssignDate(e.target.value)}
                  />
                </div>

              </div>

              {/* Upload block 1: Custody Agreement Document Upload */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 block">وثيقة إقرار تسليم واستلام العهدة الموقعة (مستند PDF / صورة)</span>
                <div 
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDragOverAgreement 
                      ? 'border-gold bg-gold-bg/10' 
                      : formAgreementData 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOverAgreement(true); }}
                  onDragLeave={() => setIsDragOverAgreement(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverAgreement(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleAgreementUploadFile(file);
                  }}
                  onClick={() => document.getElementById('mgr-agreement-file-picker')?.click()}
                >
                  <input
                    id="mgr-agreement-file-picker"
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAgreementUploadFile(file);
                    }}
                  />
                  
                  {formAgreementName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      <FileCheck className="w-6 h-6 shrink-0" />
                      <div className="text-right text-xs">
                        <strong className="block truncate max-w-md">{formAgreementName}</strong>
                        <span className="text-[10px] text-emerald-650 block">تم تحميل وتشفير الإقرار بنجاح</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <Upload className="w-6 h-6 mx-auto stroke-[1.5]" />
                      <p className="text-xs font-bold">اسحب وثيقة الإقرار وأفلتها هنا أو انقر للتصفح وتحميلها</p>
                      <span className="text-[10px] text-slate-400 block font-medium">يقبل ملفات بصيغة PDF أو صور للتوقيعات</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload block 2: Asset image */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 block">صورة حقيقية للأصل والعهد العينية (اختياري)</span>
                <div 
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDragOverImage 
                      ? 'border-gold bg-gold-bg/10' 
                      : formImageData 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOverImage(true); }}
                  onDragLeave={() => setIsDragOverImage(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOverImage(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleImageUploadFile(file);
                  }}
                  onClick={() => document.getElementById('mgr-image-file-picker')?.click()}
                >
                  <input
                    id="mgr-image-file-picker"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUploadFile(file);
                    }}
                  />
                  
                  {formImageName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      <ImageIcon className="w-6 h-6 shrink-0" />
                      <div className="text-right text-xs">
                        <strong className="block truncate max-w-md">{formImageName}</strong>
                        <span className="text-[10px] text-emerald-650 block">تم تحميل صورة الأصل العيني بنجاح</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <ImageIcon className="w-6 h-6 mx-auto stroke-[1.5]" />
                      <p className="text-xs font-bold">اسحب صورة للأصل العيني وأفلتها هنا أو انقر للتصفح</p>
                      <span className="text-[10px] text-slate-400 block font-medium">الصور للمطابقة وتوثيق حالة الأصول</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">قيود إضافية وملاحظات على استلام وتسليم العهدة</label>
                <input
                  type="text"
                  placeholder="مثال: الاستخدام حصري للمهام البرمجية بالشركة ولا يسمح بتثبيت ملحقات غير مرخصة."
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Buttons footer inside form */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 bg-slate-50 p-4 -m-6 mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold hover:bg-gold-light text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ والتسجيل...' : showAddModal ? 'إصدار العهدة وصرفها' : 'تحديث بيانات العهدة'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: Simple Status / Return Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-150 w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-scaleup">
            
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-800">✍️ تعديل حالة عهدة الموظف وتوثيق الاستلام</h3>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="p-5 space-y-4 text-right">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">الحالة المحددة للعهدة</label>
                <select
                  className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-gold"
                  value={statusNewStatus}
                  onChange={(e) => setStatusNewStatus(e.target.value as any)}
                >
                  <option value="Assigned">مُسلّم (قيد الاستخدام)</option>
                  <option value="Returned">مُسترجع وإغلاق سجل العهدة (مكتمل)</option>
                  <option value="Under Maintenance">تحت الصيانة المعملية</option>
                  <option value="Damaged">تالف أو تعرض لحادث</option>
                  <option value="Lost">مفقود وضائع بالكامل</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">تقرير حالة الفحص وملاحظات التسلم</label>
                <textarea
                  rows={3}
                  required
                  placeholder="أدخل مبرر تعديل الحالة أو تقرير الفلسفة الاسترجاعية بدقة..."
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold resize-none leading-relaxed h-20 font-bold"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold hover:bg-gold-light text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري التعديل...' : 'تحديث وحفظ الحالة القانونية'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="bg-slate-150 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border-none"
                >
                  إلغاء التعديل
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
