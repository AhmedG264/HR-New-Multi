import React, { useState } from 'react';
import { useHR } from '../context/HRContext';
import { RBACUser } from '../types';
import {
  User,
  UserPlus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Lock,
  Search,
  Filter,
  BadgeAlert,
  Info
} from 'lucide-react';

export const RBACUsers: React.FC = () => {
  const {
    rbacUsers,
    rbacRoles,
    employees,
    addRBACUser,
    updateRBACUser,
    deleteRBACUser,
    hasPermission
  } = useHR();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedUser, setSelectedUser] = useState<RBACUser | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [employeeId, setEmployeeId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const canManage = hasPermission('view_rbac');

  // Define available employees for One-to-One selection
  const linkedEmployeeIds = rbacUsers
    .filter(u => modalType === 'edit' && selectedUser ? u.id !== selectedUser.id : true)
    .map(u => u.employeeId)
    .filter(Boolean);

  const availableEmployees = employees.filter(emp => !linkedEmployeeIds.includes(emp.id));

  const openCreateModal = () => {
    if (!canManage) return;
    setModalType('create');
    setFullName('');
    setUsername('');
    setPassword('sahaba123'); // Default password
    setEmpCode('');
    setRoleId(rbacRoles[0]?.id || '');
    setStatus('active');
    setEmployeeId('');
    setErrorMsg('');
    setShowModal(true);
  };

  const openEditModal = (user: RBACUser) => {
    if (!canManage) return;
    setSelectedUser(user);
    setModalType('edit');
    setFullName(user.fullName);
    setUsername(user.username);
    setPassword(user.password || '');
    setEmpCode(user.empCode);
    setRoleId(user.roleId);
    setStatus(user.status);
    setEmployeeId(user.employeeId || '');
    setErrorMsg('');
    setShowModal(true);
  };

  const openViewModal = (user: RBACUser) => {
    setSelectedUser(user);
    setModalType('view');
    setShowModal(true);
  };

  const handleEmployeeChange = (empId: string) => {
    setEmployeeId(empId);
    if (empId) {
      const selectedEmp = employees.find(emp => emp.id === empId);
      if (selectedEmp) {
        setFullName(selectedEmp.name);
        setEmpCode(selectedEmp.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !empCode || !roleId || !password) {
      setErrorMsg('فضلاً قم بتعبئة جميع الحقول المطلوبة (بما في ذلك كلمة المرور)');
      return;
    }

    // Check one-to-one link employee
    if (employeeId) {
      const alreadyLinked = rbacUsers.some(u =>
        u.employeeId === employeeId &&
        (modalType === 'create' ? true : u.id !== selectedUser?.id)
      );
      if (alreadyLinked) {
        setErrorMsg('عذراً، هذا الموظف مرتبط بالفعل بحساب مستخدم آخر. لا يمكن ربط أكثر من مستخدم بنفس الموظف.');
        return;
      }
    }

    try {
      if (modalType === 'create') {
        // Validate unique username
        const exists = rbacUsers.some(u => u.username.toLowerCase() === username.toLowerCase());
        if (exists) {
          setErrorMsg('اسم المستخدم هذا مسجل مسبقاً بالنظام');
          return;
        }

        await addRBACUser({
          fullName,
          username,
          password,
          empCode,
          roleId,
          status,
          employeeId: employeeId || undefined
        });
      } else if (modalType === 'edit' && selectedUser) {
        await updateRBACUser(selectedUser.id, {
          fullName,
          username,
          password,
          empCode,
          roleId,
          status,
          employeeId: employeeId || null
        });
      }
      setShowModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في معالجة العملية');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!canManage) return;
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟')) {
      await deleteRBACUser(userId);
    }
  };

  const toggleStatus = async (user: RBACUser) => {
    if (!canManage) return;
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await updateRBACUser(user.id, { status: newStatus });
  };

  const filteredUsers = rbacUsers.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.empCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? u.roleId === roleFilter : true;
    const matchesStatus = statusFilter ? u.status === statusFilter : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div id="rbac_users_container" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">إدارة المستخدمين وحسابات الولوج</h1>
          <p className="text-sm text-slate-500 mt-1">
            إعداد وتفويض مستخدمي الشركة وتعيين الصلاحيات والمسميات التشغيلية متوافقاً مع ضوابط حوكمة الأعمال.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#00875A] hover:bg-[#006e49] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            إضافة مستخدم جديد
          </button>
        )}
      </div>

      {/* Filters & Actions bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
          <input
            type="text"
            placeholder="البحث بالاسم، كود الموظف، البريد الإلكتروني..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-sm pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-[#00875A] transition-all"
          />
        </div>

        <div className="flex w-full md:w-auto gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-40">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 px-2 py-2 rounded-lg w-full focus:outline-hidden"
            >
              <option value="">تصفية بحسب الدور</option>
              {rbacRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 px-2 py-2 rounded-lg min-w-32 focus:outline-hidden"
          >
            <option value="">تصفية بالحالة</option>
            <option value="active">نشط</option>
            <option value="inactive">معطل</option>
          </select>
        </div>
      </div>

      {/* Access Warning Card if not Admin/View permitted */}
      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-sm">
          <BadgeAlert className="w-5 h-5 flex-shrink-0" />
          <div>
            <strong>تنبيه الأمن السيبراني:</strong> أنت الآن في وضعية القراءة فقط. التعديل والإضافة معطلة لعدم امتلاك دورك الحالي لصلاحية إدارة الصلاحيات والمشرفين (view_rbac).
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => {
          const userRole = rbacRoles.find(r => r.id === user.roleId);
          return (
            <div
              key={user.id}
              className={`bg-white p-5 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between min-h-[12rem] h-auto space-y-4 ${user.status === 'inactive' ? 'border-dashed border-red-200 opacity-75' : 'border-slate-100'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${user.status === 'active' ? 'bg-[#00875A]/10 text-[#00875A]' : 'bg-red-50 text-red-500'
                    }`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{user.fullName}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{user.username}</p>
                    {user.employeeId && (
                      <p className="text-[10px] text-[#00875A] font-semibold mt-1.5 flex items-center gap-1 bg-[#00875A]/5 px-2 py-0.5 rounded-lg border border-[#00875A]/10 w-fit">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00875A]"></span>
                        مرتبط بـ: {employees.find(e => e.id === user.employeeId)?.name || user.employeeId}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleStatus(user)}
                  disabled={!canManage}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-150 ${user.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                >
                  {user.status === 'active' ? 'نشط' : 'معطل'}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3 text-xs">
                <div>
                  <span className="text-slate-400">الدور:</span>{' '}
                  <span className="font-medium text-slate-700">{userRole ? userRole.name : 'بدون دور'}</span>
                </div>
                <div>
                  <span className="text-slate-400">الكود الوظيفي:</span>{' '}
                  <span className="font-mono text-slate-700 font-semibold">{user.empCode}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => openViewModal(user)}
                  className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-medium rounded-lg flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  تفاصيل
                </button>
                {canManage && (
                  <>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1 px-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-medium rounded-lg flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-medium rounded-lg flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 text-sm">لم يعثر على مستخدمين يطابقون خيارات البحث الحالية.</p>
        </div>
      )}

      {/* Create / Edit / View Modal */}
      {showModal && (
        <div id="rbac_user_modal" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 text-base">
                {modalType === 'create' && 'إضافة مستخدم حساب جديد'}
                {modalType === 'edit' && 'تعديل بيانات الحساب والمنصب'}
                {modalType === 'view' && 'عرض تفاصيل الحساب الاستباقي'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {modalType === 'view' && selectedUser ? (
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 block font-bold">الاسم الكامل للمستخدم</label>
                  <p className="text-sm font-semibold text-slate-800">{selectedUser.fullName}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 block font-bold">اسم المستخدم (البريد الإلكتروني للولوج)</label>
                  <p className="text-sm font-semibold font-mono text-slate-800">{selectedUser.username}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 block font-bold">كود التعريف الوظيفي</label>
                    <p className="text-sm font-semibold text-slate-800">{selectedUser.empCode}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 block font-bold">حالة الحساب الحالية</label>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedUser.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                      {selectedUser.status === 'active' ? 'نشط ومصرح' : 'معطل إدارياً'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400 block font-bold">الدور والصلاحيات الهيكلية</label>
                  <p className="text-sm font-semibold text-[#00875A]">
                    {rbacRoles.find(r => r.id === selectedUser.roleId)?.name || 'غير معين لمجموعة صلاحيات'}
                  </p>
                </div>
                {selectedUser.employeeId && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-slate-400 block font-bold">الموظف المرتبط بالحساب</label>
                    <p className="text-sm font-semibold text-[#00875A] flex items-center gap-1">
                      <span>👤</span>
                      <span>{employees.find(e => e.id === selectedUser.employeeId)?.name || selectedUser.employeeId}</span>
                      <span className="text-xs text-slate-400 font-mono">({selectedUser.employeeId})</span>
                    </p>
                  </div>
                )}

                <div className="bg-[#00875A]/5 border border-[#00875A]/10 p-4 rounded-xl text-xs space-y-2 text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-[#00875A]">
                    <Lock className="w-3.5 h-3.5" />
                    تفصيلات الأمن والتحقق
                  </div>
                  <p>
                    هذا الحساب مشفر ويتأثر بالتحكم بالصلاحيات القائمة على الأدوار (RBAC) المسجلة في السحابة.
                  </p>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm px-4 py-2 rounded-xl transition"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: صالح بن حمد"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">اسم المستخدم أو البريد الالكتروني *</label>
                  <input
                    type="email"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username@sahaba.sa"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">كلمة المرور للدخول *</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">الكود الوظيفي (ID) *</label>
                    <input
                      type="text"
                      required
                      value={empCode}
                      onChange={(e) => setEmpCode(e.target.value)}
                      placeholder="EMP-..."
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:border-[#00875A] focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">حالة الحساب الداخلي</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
                    >
                      <option value="active">نشط ومصرح</option>
                      <option value="inactive">معطل ومحجوب</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">ربط بموظف (اختياري)</label>
                  <select
                    value={employeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
                  >
                    <option value="">-- بدون ربط (حساب مستقل) --</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.dept} - {emp.job})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">
                    * حقل اختياري لربط هذا الحساب بملف الموظف لتوفير الخدمات الذاتية (ESS) ومطابقة الهوية.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">تعيين الدور التنظيمي والأدلّة الحركية *</label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-hidden"
                  >
                    {rbacRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/2 bg-slate-50 hover:bg-slate-100/80 text-slate-600 text-xs px-4 py-3 rounded-xl transition font-medium"
                  >
                    إلغاء الأمر
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 bg-[#00875A] hover:bg-[#006e49] text-white text-xs px-4 py-3 rounded-xl transition font-semibold"
                  >
                    {modalType === 'create' ? 'تسجيل الآن' : 'حفظ التغييرات'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
