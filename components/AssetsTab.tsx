/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useHR } from '../context/HRContext';
import { EmployeeAsset, AssetHistory } from '../types';
import { processAttachedFile } from '../utils/fileUtils';
import { 
  Package, 
  Plus, 
  Trash2, 
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
  ChevronDown, 
  ChevronUp, 
  FileCheck,
  Building,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface AssetsTabProps {
  employeeId: string;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ employeeId }) => {
  const {
    assets,
    assetHistory,
    addAsset,
    updateAsset,
    updateAssetStatus,
    deleteAsset,
    hasPermission,
    currentUser,
    employees
  } = useHR();

  // Dialog & Active asset details states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Status Change Dialog State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAssetId, setStatusAssetId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<EmployeeAsset['status']>('Assigned');
  const [statusNotes, setStatusNotes] = useState('');

  // Add Asset Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState('أجهزة كمبيوتر');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EmployeeAsset['status']>('Assigned');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [assignedBy, setAssignedBy] = useState(currentUser?.fullName || 'إدارة الموارد البشرية');

  // File states (Base64 representation)
  const [agreementName, setAgreementName] = useState('');
  const [agreementData, setAgreementData] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageData, setImageData] = useState('');

  // Drag-and-drop visual states
  const [isDragOverAgreement, setIsDragOverAgreement] = useState(false);
  const [isDragOverImage, setIsDragOverImage] = useState(false);

  const categories = [
    'أجهزة كمبيوتر', 
    'هواتف محمولة', 
    'أجهزة مكتبية', 
    'سيارات وباصات', 
    'بطاقات دخول وبطاقات ذكية', 
    'أدوات ومستلزمات مهنية', 
    'أخرى'
  ];

  // Map state to human-readable Arabic label & styling
  const getStatusMeta = (status: EmployeeAsset['status']) => {
    switch (status) {
      case 'Assigned':
        return { label: 'مُسلّم (قيد العهدة)', color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: <CheckCircle className="w-3.5 h-3.5" /> };
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

  // Filter assets to this employee
  const employeeAssets = useMemo(() => {
    return assets.filter(a => a.empId === employeeId);
  }, [assets, employeeId]);

  // Current assigned / active assets (Assigned, Under Maintenance, Damaged)
  const currentAssignedAssets = useMemo(() => {
    return employeeAssets.filter(a => ['Assigned', 'Under Maintenance', 'Damaged'].includes(a.status));
  }, [employeeAssets]);

  // Returned history assets (Returned, Lost)
  const returnedAssetsHistory = useMemo(() => {
    return employeeAssets.filter(a => ['Returned', 'Lost'].includes(a.status));
  }, [employeeAssets]);

  // Get selected asset details
  const selectedAsset = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId);
  }, [assets, selectedAssetId]);

  // Filter history logs for this employee's active assets
  const filteredHistory = useMemo(() => {
    return assetHistory
      .filter(h => h.empId === employeeId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [assetHistory, employeeId]);

  // Handlers for File Readers with image compression and document safety size limits
  const handleAgreementUploadFile = (file: File) => {
    setErrorMsg('');
    processAttachedFile(
      file,
      (base64) => {
        setAgreementName(file.name);
        setAgreementData(base64);
      },
      (error) => {
        setErrorMsg(error);
        setAgreementName('');
        setAgreementData('');
      }
    );
  };

  const handleImageUploadFile = (file: File) => {
    setErrorMsg('');
    processAttachedFile(
      file,
      (base64) => {
        setImageName(file.name);
        setImageData(base64);
      },
      (error) => {
        setErrorMsg(error);
        setImageName('');
        setImageData('');
      }
    );
  };

  // Drag-and-drop event preventers
  const onDragOverAgreement = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverAgreement(true);
  };

  const onDragLeaveAgreement = () => {
    setIsDragOverAgreement(false);
  };

  const onDropAgreement = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverAgreement(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAgreementUploadFile(file);
    }
  };

  const onDragOverImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverImage(true);
  };

  const onDragLeaveImage = () => {
    setIsDragOverImage(false);
  };

  const onDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUploadFile(file);
    }
  };

  // Submit new asset assignment
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setErrorMsg('الرجاء تعبئة اسم وتفاصيل الأصل العيني بشكل كامل.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await addAsset({
        empId: employeeId,
        name: name.trim(),
        category,
        description: description.trim(),
        status,
        assignDate,
        notes: notes.trim() || undefined,
        assignedBy: assignedBy.trim(),
        agreementName: agreementName || undefined,
        agreementData: agreementData || undefined,
        imageName: imageName || undefined,
        imageData: imageData || undefined
      });

      // Clear Form & close modal
      setName('');
      setDescription('');
      setStatus('Assigned');
      setNotes('');
      setAgreementName('');
      setAgreementData('');
      setImageName('');
      setImageData('');
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشلت عملية إنشاء وتسجيل العهدة بقاعدة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status/Return Change handler
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusAssetId) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await updateAssetStatus(statusAssetId, newStatus, statusNotes.trim());
      setShowStatusModal(false);
      setStatusNotes('');
      setStatusAssetId(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'فشل في تحديث حالة الأصل بقاعدة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action under Permission Guard
  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('هل أنت متأكد تماماً من رغبتك في حذف وإلغاء هذه العهدة من السجل التاريخي للموظف؟')) {
      try {
        await deleteAsset(id);
        if (selectedAssetId === id) setSelectedAssetId(null);
      } catch (err: any) {
        alert(err.message || 'فشل حذف العهدة.');
      }
    }
  };

  // Download File utility
  const downloadAttachedFile = (name: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top action block with stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">إدارة الأصول العينية والعهد الوظيفية</h3>
          <p className="text-xs text-slate-400 mt-1">تتبع كافة ممتلكات وأصول الشركة المسلمة بعهدة الموظف ووثائق تسلمها وإقرارات العمل الخاصة بالمنظومة</p>
        </div>
        
        {hasPermission('create_asset') && (
          <button
            onClick={() => {
              setErrorMsg('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 bg-gold hover:bg-gold-light text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-none shadow-sm"
          >
            <Plus className="w-4 h-4" />
            تحويل وإسناد عهدة جديدة
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500" />
          {errorMsg}
        </div>
      )}

      {/* Main Grid Layout containing items and detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Row 1: Left 2 cols of list cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Currently Assigned Assets */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider flex items-center gap-2 uppercase">
              <Package className="w-4 h-4 text-emerald-500 shrink-0" />
              العهد النشطة الحالية ({currentAssignedAssets.length})
            </h4>

            {currentAssignedAssets.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-2">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Package className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-400">لا يوجد أية عهد أو أصول عينية نشطة بعهدة هذا الموظف حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAssignedAssets.map(asset => {
                  const meta = getStatusMeta(asset.status);
                  const isSelected = selectedAssetId === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAssetId(isSelected ? null : asset.id)}
                      className={`bg-white border-2 rounded-xl p-4 transition-all cursor-pointer select-none space-y-3 relative group ${
                        isSelected 
                          ? 'border-gold shadow-md bg-gold-bg/5' 
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                          {asset.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${meta.color}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-gold transition-colors">{asset.name}</h5>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 h-7">{asset.description}</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-50 pt-2.5">
                        <span className="font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          تسلم في: {asset.assignDate}
                        </span>
                        <span className="font-semibold text-slate-700">
                          بواسطة: {asset.assignedBy}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 2: Returned/Closed Custody History */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider flex items-center gap-2 uppercase">
              <History className="w-4 h-4 text-slate-500 shrink-0" />
              أرشيف العهد والمسترجعات التاريخية ({returnedAssetsHistory.length})
            </h4>

            {returnedAssetsHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">سجل أرشيف مسترجعات العهد فارغ تماماً.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-bold bg-slate-50">
                      <th className="p-2">الأصل العيني</th>
                      <th className="p-2">التصنيف</th>
                      <th className="p-2">تاريخ الصرف</th>
                      <th className="p-2">تاريخ الاسترجاع</th>
                      <th className="p-2">الحالة النهائية</th>
                      <th className="p-2">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnedAssetsHistory.map(asset => {
                      const meta = getStatusMeta(asset.status);
                      return (
                        <tr 
                          key={asset.id} 
                          onClick={() => setSelectedAssetId(asset.id)}
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="p-2.5 font-bold text-slate-800">{asset.name}</td>
                          <td className="p-2.5 text-slate-500">{asset.category}</td>
                          <td className="p-2.5 font-mono text-slate-500">{asset.assignDate}</td>
                          <td className="p-2.5 font-mono text-slate-500">{asset.returnDate || '—'}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${meta.color}`}>
                              {meta.icon}
                              {meta.label}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAssetId(asset.id);
                              }}
                              className="text-gold font-bold hover:underline bg-transparent border-none cursor-pointer"
                            >
                              عرض السجل
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 3: Live Audit History Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider flex items-center gap-2 uppercase">
              <History className="w-4 h-4 text-amber-500 shrink-0" />
              سجل العمليات والرقابة الحية للعهد الموظف (Audit History)
            </h4>

            {filteredHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">لا توجد حركات تدقيق تاريخية مسجلة بعد.</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {filteredHistory.map((log) => {
                  const targetAsset = assets.find(a => a.id === log.assetId);
                  return (
                    <div key={log.id} className="border-r-4 border-gold-dim bg-slate-50 rounded-lg p-3 text-xs flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800">
                            {targetAsset ? targetAsset.name : 'أصل عيني مجهول'}
                          </span>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-bold border ${getStatusMeta(log.newStatus).color}`}>
                            {getStatusMeta(log.newStatus).label}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          {log.notes || 'تحديث تلقائي على حالة عينات العهد'}
                        </p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-3">
                          <span>بواسطة: <strong className="text-slate-600">{log.changedBy}</strong></span>
                          <span>المستلم/الحامي: <strong className="text-slate-600">{log.empName}</strong></span>
                        </div>
                      </div>

                      <div className="text-left font-mono text-[9px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('ar-SA')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Column 2: Right Detail viewer panel */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
            <h4 className="text-xs font-bold text-slate-700 pb-3 border-b border-slate-100 flex items-center gap-2">
              🔍 نافذة تفاصيل ومعاينة السجل العيني
            </h4>

            {!selectedAsset ? (
              <div className="text-center py-12 space-y-3">
                <Package className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">الرجاء النقر على أي أصل عيني من القوالب لعرض التفاصيل الخاصة بمواصفاته والمستندات المرفقة.</p>
              </div>
            ) : (
              <div className="space-y-5 animate-slideup">
                
                {/* Image preview */}
                {selectedAsset.imageData ? (
                  <div className="rounded-xl overflow-hidden border border-slate-100 h-40 bg-slate-50 relative group">
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
                  <div className="rounded-xl border border-dashed border-slate-200 h-28 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span className="text-[10px] text-slate-400 font-semibold">لا تتوفر صورة للأصل</span>
                  </div>
                )}

                <div className="space-y-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">اسم العاتق والأصل العيني</span>
                    <h5 className="text-sm font-extrabold text-slate-800">{selectedAsset.name}</h5>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">التصنيف العيني</span>
                      <strong className="text-xs text-slate-755 block">{selectedAsset.category}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">رقم مصل العينة</span>
                      <code className="text-xs text-gold font-mono font-bold block">{selectedAsset.id.slice(0, 8).toUpperCase()}</code>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">وصف الأصل وغرضه الاستعمالي</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                      {selectedAsset.description}
                    </p>
                  </div>

                  {selectedAsset.notes && (
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الملاحظات والقيود الإضافية</span>
                      <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-2 mb-1 rounded border border-amber-100 leading-relaxed">
                        {selectedAsset.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3.5">
                  <span className="text-[10px] text-slate-400 font-bold block">مستندات وإقرارات العهدة الموثقة</span>
                  
                  {selectedAsset.agreementData ? (
                    <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50/30 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="truncate text-right">
                          <span className="text-xs font-bold text-slate-800 block truncate" title={selectedAsset.agreementName}>
                            {selectedAsset.agreementName}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">● وثيقة إقرار سارية وموقعة</span>
                        </div>
                      </div>
                      <button
                        onClick={() => downloadAttachedFile(selectedAsset.agreementName || 'agreement.pdf', selectedAsset.agreementData!)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg cursor-pointer border-none shadow transition-colors shrink-0"
                        title="تحميل وثيقة تسليم العهدة"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 border border-dashed border-slate-200 p-2.5 rounded-xl bg-slate-50">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-[11px] text-slate-500 font-semibold">لم يرفع إقرار العهدة المالي بعد.</span>
                    </div>
                  )}
                </div>

                {/* Status operations buttons for managers */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  {(hasPermission('return_asset') || hasPermission('edit_asset')) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setStatusAssetId(selectedAsset.id);
                          setNewStatus('Returned');
                          setStatusNotes('');
                          setShowStatusModal(true);
                        }}
                        className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-xs py-2 rounded-xl font-bold cursor-pointer transition-colors border-none"
                      >
                        📥 تأكيد استرجاع الأصل
                      </button>
                      <button
                        onClick={() => {
                          setStatusAssetId(selectedAsset.id);
                          setNewStatus(selectedAsset.status);
                          setStatusNotes('');
                          setShowStatusModal(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl font-bold cursor-pointer transition-colors border-none"
                      >
                        ⚙️ تغيير الحالة
                      </button>
                    </div>
                  )}

                  {hasPermission('edit_asset') && (
                    <button
                      onClick={() => handleDeleteAsset(selectedAsset.id)}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs py-2 rounded-xl font-bold cursor-pointer transition-colors border-none flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      إتلاف أو حذف سجل العهدة تماماً
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* MODAL 1: Assignment Asset Form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scaleup">
            
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800">إقرار وتسجيل عهدة عينية جديدة</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable inputs body */}
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">اسم ووصف الأصل العيني <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    placeholder="مثال: لابتوب ديل خط إنتاجي لعام 2026"
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">التصنيف العيني للأصل <span className="text-rose-500">*</span></label>
                  <select
                    className="border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">وصف دقيق للأصل والحالة الفنية <span className="text-rose-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="شركة لابتوب ديل لخطوط البرمجة الخاصة، بحالة ممتازة وخالٍ من الخدوش."
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold leading-relaxed resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">حالة الإسناد الحالية <span className="text-rose-500">*</span></label>
                  <select
                    className="border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-xs outline-none focus:border-gold font-bold"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="Assigned">مُسلّم (نشط)</option>
                    <option value="Under Maintenance">تحت الصيانة المعملية</option>
                    <option value="Damaged">تالف أو بحاجة لإصلاح</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">تاريخ تسليم العهدة <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs outline-none focus:border-gold"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-600">المسؤول عن تسليم وصرف العهدة <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold"
                    value={assignedBy}
                    onChange={(e) => setAssignedBy(e.target.value)}
                  />
                </div>

              </div>

              {/* Upload block 1: Custody Agreement Document Upload */}
              <div className="space-y-1.5Col">
                <span className="text-xs font-bold text-slate-600 block">وثيقة إقرار تسليم واستلام العهدة الموقعة (مستند PDF / صورة)</span>
                <div 
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDragOverAgreement 
                      ? 'border-gold bg-gold-bg/10' 
                      : agreementData 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
                  }`}
                  onDragOver={onDragOverAgreement}
                  onDragLeave={onDragLeaveAgreement}
                  onDrop={onDropAgreement}
                  onClick={() => document.getElementById('add-agreement-file-picker')?.click()}
                >
                  <input
                    id="add-agreement-file-picker"
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAgreementUploadFile(file);
                    }}
                  />
                  
                  {agreementName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      <FileCheck className="w-6 h-6 shrink-0" />
                      <div className="text-right text-xs">
                        <strong className="block truncate max-w-md">{agreementName}</strong>
                        <span className="text-[10px] text-emerald-600 block">تم تحميل وتشفير الإقرار المالي بنجاح</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <Upload className="w-7 h-7 mx-auto stroke-[1.5]" />
                      <p className="text-xs font-bold">اسحب وثيقة الإقرار وأفلتها هنا أو انقر للتصفح وتحميلها</p>
                      <span className="text-[10px] text-slate-400 block font-medium">يقبل ملفات بصيغة PDF أو صور بحد أقصى</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload block 2: Asset image (Optional) */}
              <div className="space-y-1.5Col">
                <span className="text-xs font-bold text-slate-600 block">صورة حقيقية للأصل والعهد العينية (اختياري)</span>
                <div 
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    isDragOverImage 
                      ? 'border-gold bg-gold-bg/10' 
                      : imageData 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
                  }`}
                  onDragOver={onDragOverImage}
                  onDragLeave={onDragLeaveImage}
                  onDrop={onDropImage}
                  onClick={() => document.getElementById('add-image-file-picker')?.click()}
                >
                  <input
                    id="add-image-file-picker"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUploadFile(file);
                    }}
                  />
                  
                  {imageName ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      <ImageIcon className="w-6 h-6 shrink-0" />
                      <div className="text-right text-xs">
                        <strong className="block truncate max-w-md">{imageName}</strong>
                        <span className="text-[10px] text-emerald-600 block">تم تحميل صورة الأصل العيني بنجاح</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-400">
                      <ImageIcon className="w-7 h-7 mx-auto stroke-[1.5]" />
                      <p className="text-xs font-bold">اسحب صورة للأصل العيني وأفلتها هنا أو انقر للتصفح</p>
                      <span className="text-[10px] text-slate-400 block font-medium">الصور تضيف طابعاً توثيقياً لمظهر العهد وتجنب الجحود</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">ملاحظات وقيود إضافية على تسليم العهدة</label>
                <input
                  type="text"
                  placeholder="مثال: يلتزم الموظف بعدم تسليم الجهاز لأي شخص خارج فرق التطوير والشركة."
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-gold"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Error logs inside modal */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                  {errorMsg}
                </div>
              )}

              {/* Buttons footer inside form for perfect flow */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold hover:bg-gold-light text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الصرف والتوليف بمحضر العينات...' : 'إصدار العهدة وصرفها'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none"
                >
                  إلغاء وإهمال الطلب
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: Status / Return Form */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-150 w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-scaleup">
            
            {/* Header */}
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-extrabold text-slate-800">✍️ تعديل حالة عهدة الموظف</h3>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleStatusSubmit} className="p-5 space-y-4 text-right">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">حالة العهدة الجديدة</label>
                <select
                  className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-gold"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                >
                  <option value="Assigned">مُسلّم (قيد الاستخدام)</option>
                  <option value="Returned">مُسترجع وإغلاق العهدة (مكتمل)</option>
                  <option value="Under Maintenance">تحت الصيانة والمعمل</option>
                  <option value="Damaged">تالف أو تعرض لحادث</option>
                  <option value="Lost">مفقود وضائع بالكامل</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500">ملاحظات وتقرير التدقيق التاريخي</label>
                <textarea
                  rows={3}
                  required
                  placeholder="أدخل مبرر تغيير الحالة أو تقرير حالة الجهاز المستلم بدقة..."
                  className="border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gold resize-none leading-relaxed h-20"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>

              {/* Action buttons inside form */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gold hover:bg-gold-light text-slate-950 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border-none disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري تحديث السجل...' : 'حفظ التحديث'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-none"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
