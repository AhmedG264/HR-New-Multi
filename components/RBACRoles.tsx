import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { RBACRole } from '../types';
import { 
  ShieldAlert, 
  Copy, 
  Plus, 
  Check, 
  Trash2, 
  Edit2, 
  Lock,
  Compass, 
  Settings, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

export const RBACRoles: React.FC = () => {
  const { 
    rbacRoles, 
    rbacPermissions, 
    addRBACRole, 
    updateRBACRole, 
    deleteRBACRole,
    hasPermission 
  } = useHR();

  const [activeRoleId, setActiveRoleId] = useState<string>(rbacRoles[0]?.id || '');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'copy'>('create');
  
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedRole = rbacRoles.find(r => r.id === activeRoleId) || rbacRoles[0];
  const canManage = hasPermission('view_rbac');

  // Trigger clone/copy role structure
  const handleCopyRole = (role: RBACRole) => {
    if (!canManage) return;
    setRoleName(`${role.name} - نسخة كربونية`);
    setRoleDesc(role.description || '');
    setModalType('copy');
    setErrorMsg('');
    setShowRoleModal(true);
  };

  const handleCreateOpen = () => {
    if (!canManage) return;
    setRoleName('');
    setRoleDesc('');
    setModalType('create');
    setErrorMsg('');
    setShowRoleModal(true);
  };

  const handleEditOpen = (role: RBACRole) => {
    if (!canManage) return;
    setRoleName(role.name);
    setRoleDesc(role.description || '');
    setModalType('edit');
    setErrorMsg('');
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) {
      setErrorMsg('فضلاً تعبئة اسم الدور');
      return;
    }

    try {
      if (modalType === 'create') {
        const exists = rbacRoles.some(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (exists) {
          setErrorMsg('هذا المسمى مسجل مسبقاً بالنظام');
          return;
        }
        await addRBACRole({
          name: roleName,
          description: roleDesc,
          permissionIds: ['view_dashboard'] // Default startup permission
        });
      } else if (modalType === 'edit' && selectedRole) {
        await updateRBACRole(selectedRole.id, {
          name: roleName,
          description: roleDesc
        });
      } else if (modalType === 'copy' && selectedRole) {
        // Copy selectedRole's permission array to new role
        await addRBACRole({
          name: roleName,
          description: roleDesc,
          permissionIds: [...selectedRole.permissionIds]
        });
      }

      setShowRoleModal(false);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في معالجة العملية');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!canManage) return;
    if (roleId === 'role_admin') {
      alert('لا يمكن حذف دور مدير النظام الأساسي لضمان حماية التشغيل والولوج!');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف دور الصلاحيات هذا نهائياً من النظام؟ قد يفقد مستخدمو هذا الدور صلاحيات الدخول.')) {
      await deleteRBACRole(roleId);
      setActiveRoleId(rbacRoles[0]?.id || '');
    }
  };

  // Toggle checklist permission on active selected role
  const handleTogglePermission = async (permissionId: string) => {
    if (!canManage || !selectedRole) return;
    if (selectedRole.id === 'role_admin') {
      alert('لا ينصح بالتعديل على صلاحيات Admin (مدير النظام) الأساسي لتجنب كسر وظائف التحكم!');
      return;
    }

    let updatedPermIds = [...selectedRole.permissionIds];
    if (updatedPermIds.includes(permissionId)) {
      // Remove unless it is 'view_dashboard'
      if (permissionId === 'view_dashboard') {
        alert('يجب أن يمتلك كافّة مستخدمي الأداة صلاحية عرض لوحة التحكم الرئيسية كواجهة دنيا للولوج!');
        return;
      }
      updatedPermIds = updatedPermIds.filter(pid => pid !== permissionId);
    } else {
      updatedPermIds.push(permissionId);
    }

    await updateRBACRole(selectedRole.id, {
      permissionIds: updatedPermIds
    });
  };

  // Group permissions by category
  const categories = Array.from(new Set(rbacPermissions.map(p => p.category)));

  return (
    <div id="rbac_roles_container" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة مصفوفة الصلاحيات (الأدوار)</h1>
          <p className="text-sm text-slate-500 mt-1">
            بناء أدوار مخصصة وربطها بصلاحيات الأمان لقفل وحوكمة صفحات المنظومة وقوائم العمليات والتقارير.
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleCreateOpen}
            className="flex items-center gap-2 bg-[#00875A] hover:bg-[#006e49] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            إنشاء دور صلاحية جديد
          </button>
        )}
      </div>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-850 text-xs">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
          <p>
            <strong>صلاحية حوكمة محدودة:</strong> أنت لا تمتلك صلاحية تعديل الإعدادات الأمنية أو تعيين الصلاحيات للأدوار في الوقت الحالي. يمكنك استعراض الهيكليات فقط.
          </p>
        </div>
      )}

      {/* Main Roles Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Roles list */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-100 space-y-3">
          <div className="border-b border-slate-50 pb-2.5">
            <h3 className="font-bold text-sm text-slate-850">قائمة الأدوار المتاحة بالسيستم</h3>
            <p className="text-[10px] text-slate-400">انقر على المسمى الوظيفي لعرض وتعديل مصفوفة صلاحياته.</p>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {rbacRoles.map((role) => {
              const worksAsActive = selectedRole && selectedRole.id === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setActiveRoleId(role.id)}
                  className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-right flex flex-col justify-between space-y-2 ${
                    worksAsActive
                      ? 'border-[#00875A] bg-[#00875A]/5'
                      : 'border-slate-150 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className={`font-semibold text-xs ${worksAsActive ? 'text-[#00875A]' : 'text-slate-800'}`}>
                        {role.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {role.description || 'لا يوجد وصف تعريفي مضاف لهذا الدور.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions for each role inside panel */}
                  <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-50/50">
                    {canManage && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyRole(role);
                          }}
                          title="نسخ ومضاعفة دور الصلاحية"
                          className="p-1 px-2 text-[10px] items-center gap-1 flex border border-slate-100 hover:bg-slate-100 rounded-md text-slate-500 transition"
                        >
                          <Copy className="w-3 h-3" />
                          نسخ
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOpen(role);
                          }}
                          className="p-1 text-slate-400 hover:text-sky-600 rounded-md transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {role.id !== 'role_admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Matrix Checklist */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-xs border border-slate-100 space-y-6">
          {selectedRole ? (
            <>
              {/* Selected Role Meta */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#00875A]/10 text-[#00875A]">
                      <Lock className="w-4 h-4" />
                    </span>
                    <h2 className="font-bold text-slate-800 text-sm">مصفوفة صلاحيات: {selectedRole.name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedRole.description || 'لم يتم إضافة وصف كافي للدور.'}
                  </p>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-150 text-center">
                  <div className="text-[11px] text-slate-400 font-bold">إجمالي التدابير المفتوحة</div>
                  <div className="text-sm font-extrabold text-[#00875A] font-mono mt-0.5">
                    {selectedRole.permissionIds.length} / {rbacPermissions.length}
                  </div>
                </div>
              </div>

              {/* Grouped Checklist */}
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryPerms = rbacPermissions.filter(p => p.category === category);
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                        {category === 'صفحات' ? (
                          <Compass className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Settings className="w-4 h-4 text-sky-600" />
                        )}
                        <h3 className="font-bold text-xs text-slate-700">صلاحيات الـ {category}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPerms.map((perm) => {
                          const isChecked = selectedRole.permissionIds.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => handleTogglePermission(perm.id)}
                              className={`p-3 rounded-xl border flex items-center gap-3 select-none transition-all duration-150 ${
                                canManage ? 'cursor-pointer' : 'pointer-events-none'
                              } ${
                                isChecked
                                  ? 'border-[#00875A]/40 bg-[#00875A]/2'
                                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                                isChecked 
                                  ? 'bg-[#00875A] border-[#00875A] text-white' 
                                  : 'border-slate-300 bg-white'
                              }`}>
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="text-right">
                                <span className={`text-[11px] block font-bold leading-tight ${
                                  isChecked ? 'text-slate-800' : 'text-slate-600'
                                }`}>
                                  {perm.name}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">{perm.id}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">لم يتم تحميل أي دور صلاحيات بالسيستم.</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Manager Modal (Create, Edit, Clone) */}
      {showRoleModal && (
        <div id="rbac_role_form_modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-550 animate-in zoom-in-95 duration-150 text-right">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-800">
                {modalType === 'create' && 'إنشاء دور صلاحية جديد'}
                {modalType === 'edit' && 'تعديل اسم ووصف الدور'}
                {modalType === 'copy' && 'نسخ واستنساخ دور صلاحيات'}
              </h3>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-lg text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block text-right">المسمى الإداري للدور *</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="مثال: HR Assistant (مساعد موارد بشرية)"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block text-right">الوصف الوظيفي والمسؤوليات</label>
                <textarea
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="اكتب وصفاً موجزاً للمسؤوليات المنوطة بهذا الدور لتنظيم العمل والامتثال للسياسات..."
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden leading-relaxed"
                />
              </div>

              {modalType === 'copy' && (
                <div className="bg-[#00875A]/5 border border-[#00875A]/10 p-3 rounded-lg text-xs text-slate-600">
                  سيقوم النظام بنقل ونسخ كامل إعدادات وصلاحيات الدور <strong>{selectedRole?.name}</strong> تلقائياً إلى الدور الجديد لتمكين التحرير لاحقاً.
                </div>
              )}

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="w-1/2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs px-4 py-2.5 rounded-xl transition font-medium"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-[#00875A] hover:bg-[#006e49] text-white text-xs px-4 py-2.5 rounded-xl transition font-semibold"
                >
                  {modalType === 'copy' ? 'إتمام النسخ' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
