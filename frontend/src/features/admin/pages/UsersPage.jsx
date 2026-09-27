import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Clock,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const UsersPage = () => {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'roles' ? 'roles' : 'all';

  // Data states
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals
  const [selectedUser, setSelectedUser] = useState(null);
  const [userResearches, setUserResearches] = useState([]);
  const [researchesLoading, setResearchesLoading] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleModalError, setRoleModalError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        q: searchQuery.trim(),
        role: currentTab === 'roles' ? (roleFilter || undefined) : (roleFilter || undefined),
        status: statusFilter || undefined
      };

      const res = await api.get('/admin/users', { params });
      if (res.data?.success) {
        let fetchedUsers = res.data.data.users || [];
        if (currentTab === 'roles') {
          // If in roles tab without a specific role filter, filter to elevated roles only
          if (!roleFilter) {
            fetchedUsers = fetchedUsers.filter((u) => ['super_admin', 'admin', 'editor'].includes(u.role));
          }
        }
        setUsers(fetchedUsers);
        setTotal(res.data.data.total || 0);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showNotification('error', err.friendlyMessage || 'تعذر تحميل قائمة المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, roleFilter, statusFilter, currentTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setPage(1);
    setRoleFilter('');
  };

  // View User Details & their research projects
  const handleOpenUserDetails = async (user) => {
    setSelectedUser(user);
    setUserResearches([]);
    setResearchesLoading(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/researches`);
      if (res.data?.success) {
        setUserResearches(res.data.data.researches || []);
      }
    } catch (err) {
      console.error('Failed to load user researches:', err);
    } finally {
      setResearchesLoading(false);
    }
  };

  // Toggle user active / suspended status
  const handleToggleStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = newStatus === 'suspended'
      ? `هل أنت متأكد من تجميد حساب المستخدم (${targetUser.name})؟ لن يتمكن من تسجيل الدخول.`
      : `هل أنت متأكد من إعادة تنشيط حساب المستخدم (${targetUser.name})؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.patch(`/admin/users/${targetUser._id}/status`, { status: newStatus });
      if (res.data?.success) {
        showNotification('success', `تم ${newStatus === 'active' ? 'تنشيط' : 'تجميد'} حساب المستخدم بنجاح`);
        fetchUsers();
      }
    } catch (err) {
      showNotification('error', err.friendlyMessage || 'فشل تحديث حالة المستخدم');
    }
  };

  // Submit role update
  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    setRoleSubmitting(true);
    setRoleModalError(null);

    try {
      const res = await api.patch(`/admin/users/${roleModalUser._id}/role`, { role: newRole });
      if (res.data?.success) {
        showNotification('success', `تم تغيير دور (${roleModalUser.name}) إلى (${getRoleBadge(newRole).label}) بنجاح`);
        setRoleModalUser(null);
        fetchUsers();
      }
    } catch (err) {
      setRoleModalError(err.friendlyMessage || 'تعذر تغيير الدور. تأكد من امتلاك الصلاحيات الكافية.');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return { label: 'مدير عام', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'admin':
        return { label: 'مسؤول', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'editor':
        return { label: 'محرر', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'باحث (مستخدم)', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">إدارة المستخدمين</h1>
          <p className="text-slate-500 text-sm font-tajawal mt-1">
            إدارة حسابات الباحثين، ضبط الصلاحيات، ومتابعة الأنشطة وفق قواعد الأمان الخادمي
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
          <button
            onClick={() => handleTabChange('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>جميع المستخدمين</span>
          </button>
          <button
            onClick={() => handleTabChange('roles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'roles'
                ? 'bg-white text-[#0F8F83] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>الأدوار والصلاحيات</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 shadow-sm transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Area B: Roles & Permissions Top Info Cards (Shown when in 'roles' tab) */}
      {currentTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">مدير عام (Super Admin)</h3>
            </div>
            <p className="text-xs text-slate-500 font-tajawal leading-relaxed">
              يمتلك أعلى سلطة إدارية: تفعيل وضع الصيانة، ترقية وخفض رتب المسؤولين، وضبط إعدادات النظام الحساسة.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-teal-100 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">مسؤول (Admin)</h3>
            </div>
            <p className="text-xs text-slate-500 font-tajawal leading-relaxed">
              إدارة حسابات الباحثين وتجميدها، استعراض الأبحاث، وتعديل محتوى وإعدادات الموقع العادية.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">محرر (Editor)</h3>
            </div>
            <p className="text-xs text-slate-500 font-tajawal leading-relaxed">
              إدارة وتحرير نصوص صفحات الموقع، الإعلانات، ومكتبة الوسائط والصور دون المساس بحسابات المستخدمين.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0F8F83] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#0F8F83]"
          >
            <option value="">كافة الأدوار</option>
            {currentTab === 'all' && <option value="user">باحث عادي</option>}
            <option value="editor">محرر</option>
            <option value="admin">مسؤول</option>
            <option value="super_admin">مدير عام</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#0F8F83]"
          >
            <option value="">كافة الحالات</option>
            <option value="active">نشط</option>
            <option value="suspended">موقوف</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">المستخدم</th>
                <th className="py-3.5 px-4">البريد الإلكتروني</th>
                <th className="py-3.5 px-4">الدور</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">الأبحاث</th>
                <th className="py-3.5 px-4">تاريخ التسجيل</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0F8F83]" />
                      <span>جاري تحميل بيانات المستخدمين...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-tajawal">
                    لم يتم العثور على مستخدمين يطابقون شروط البحث.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const isCurrent = currentUser?.id === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.name ? u.name.slice(0, 2) : 'ب'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] text-teal-600 font-bold font-tajawal">(أنت)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-tajawal">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${roleBadge.bg}`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {u.status === 'active' ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 font-tajawal">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          {u.researchCount ?? 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-tajawal text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA') : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => handleOpenUserDetails(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="عرض تفاصيل المستخدم وأبحاثه"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Change Role Button (authorized for admins) */}
                          <button
                            onClick={() => {
                              setRoleModalUser(u);
                              setNewRole(u.role || 'user');
                              setRoleModalError(null);
                            }}
                            className="p-1.5 rounded-lg text-teal-600 hover:text-teal-800 hover:bg-teal-50 transition-colors"
                            title="تعديل الدور والصلاحيات"
                          >
                            <Shield className="w-4 h-4" />
                          </button>

                          {/* Toggle active / suspended */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed'
                                : u.status === 'active'
                                  ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                                  : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={u.status === 'active' ? 'تجميد الحساب' : 'تنشيط الحساب'}
                          >
                            {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-tajawal">
          <div>
            إجمالي السجلات: <span className="font-bold text-slate-900">{total}</span> مستخدم (الصفحة {page} من {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>السابق</span>
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-slate-700"
            >
              <span>التالي</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal 1: User Profile & Researches Details */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-cairo">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-[#0F8F83] flex items-center justify-center font-extrabold text-lg">
                  {selectedUser.name ? selectedUser.name.slice(0, 2) : 'ب'}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">{selectedUser.name}</h3>
                  <span className="text-xs text-slate-400 font-tajawal">{selectedUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Meta Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">الرتبة / الدور</span>
                <span className="font-bold text-slate-800">{getRoleBadge(selectedUser.role).label}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">حالة الحساب</span>
                <span className={`font-bold ${selectedUser.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedUser.status === 'active' ? 'نشط' : 'موقوف'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-1">تاريخ الانضمام</span>
                <span className="font-bold text-slate-800 font-tajawal">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('ar-SA') : '—'}
                </span>
              </div>
            </div>

            {/* User Researches List */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#0F8F83]" />
                <span>أبحاث الباحث ({userResearches.length})</span>
              </h4>

              {researchesLoading ? (
                <div className="py-8 text-center text-xs text-slate-400 font-tajawal">جاري تحميل أبحاث المستخدم...</div>
              ) : userResearches.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-tajawal bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  لم يقم هذا الباحث بإنشاء أبحاث بعد.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userResearches.map((res) => (
                    <div key={res._id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-slate-900 block truncate">{res.title || 'بحث بدون عنوان'}</span>
                        <span className="text-[11px] text-slate-400 font-tajawal">
                          الخطوة: {res.currentStep || 1} • {res.cover?.university || 'جامعة غير محددة'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold shrink-0 mr-2">
                        {res.status || 'مسودة'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-left">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Change Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-cairo">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F8F83]" />
                <h3 className="font-black text-base text-slate-900">تعديل دور وصلاحيات المستخدم</h3>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-tajawal mb-4">
              تعديل رتبة المستخدم: <span className="font-bold text-slate-900">{roleModalUser.name}</span> ({roleModalUser.email})
            </p>

            {roleModalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{roleModalError}</span>
              </div>
            )}

            {/* Role Options */}
            <div className="space-y-2 mb-6 text-xs">
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                newRole === 'user' ? 'bg-teal-50/50 border-[#0F8F83]' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={newRole === 'user'}
                  onChange={() => setNewRole('user')}
                  className="mt-0.5 text-[#0F8F83]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">باحث (مستخدم عادي)</span>
                  <span className="text-[11px] text-slate-500 font-tajawal">إنشاء وإدارة وتصدير أبحاثه الشخصية فقط.</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                newRole === 'editor' ? 'bg-teal-50/50 border-[#0F8F83]' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="editor"
                  checked={newRole === 'editor'}
                  onChange={() => setNewRole('editor')}
                  className="mt-0.5 text-[#0F8F83]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">محرر (Editor)</span>
                  <span className="text-[11px] text-slate-500 font-tajawal">إدارة محتوى الموقع والوسائط دون المساس بالحسابات.</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                newRole === 'admin' ? 'bg-teal-50/50 border-[#0F8F83]' : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={newRole === 'admin'}
                  onChange={() => setNewRole('admin')}
                  className="mt-0.5 text-[#0F8F83]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">مسؤول (Admin)</span>
                  <span className="text-[11px] text-slate-500 font-tajawal">صلاحيات إدارة المستخدمين والأبحاث والإعدادات.</span>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                newRole === 'super_admin' ? 'bg-teal-50/50 border-[#0F8F83]' : 'border-slate-200 hover:bg-slate-50'
              } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="super_admin"
                  checked={newRole === 'super_admin'}
                  onChange={() => isSuperAdmin && setNewRole('super_admin')}
                  disabled={!isSuperAdmin}
                  className="mt-0.5 text-[#0F8F83]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">مدير عام (Super Admin)</span>
                  <span className="text-[11px] text-slate-500 font-tajawal">
                    صلاحيات عليا مطلقة. {!isSuperAdmin && '(يتطلب صلاحية مدير عام)'}
                  </span>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveRole}
                disabled={roleSubmitting || newRole === roleModalUser.role}
                className="px-5 py-2 rounded-xl bg-[#0F8F83] hover:bg-[#0d7b70] text-white font-bold text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {roleSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>حفظ الدور الجديد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
