import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  BookOpen,
  Calendar,
  Mail,
  RefreshCw,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';
import api from '../../../services/api';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { RoleBadge, UserStatusBadge, ResearchStatusBadge, ResearchStepBadge } from '../components/StatusBadge';
import Modal from '../components/Modal';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 10;

  // Selected User for details & researches
  const [selectedUser, setSelectedUser] = useState(null);
  const [userResearches, setUserResearches] = useState([]);
  const [loadingResearches, setLoadingResearches] = useState(false);

  // Role modification confirmation modal state
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [targetRole, setTargetRole] = useState('user');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [roleError, setRoleError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
      });
      if (search) params.append('q', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalRecords(res.data.data.total || 0);
      } else {
        throw new Error(res.data?.message || 'فشل استرجاع قائمة المستخدمين');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || err.message || 'تعذر تحميل بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter, statusFilter]);

  const handleOpenUserDetails = async (user) => {
    setSelectedUser(user);
    setLoadingResearches(true);
    try {
      const res = await api.get(`/admin/users/${user._id}/researches`);
      if (res.data?.success) {
        setUserResearches(res.data.data.researches || []);
      }
    } catch (err) {
      console.error('Error fetching user researches:', err);
    } finally {
      setLoadingResearches(false);
    }
  };

  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setTargetRole(user.role === 'admin' ? 'user' : 'admin');
    setRoleError(null);
  };

  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    setUpdatingRole(true);
    setRoleError(null);
    try {
      const res = await api.patch(`/admin/users/${roleModalUser._id}/role`, {
        role: targetRole
      });
      if (res.data?.success) {
        setRoleModalUser(null);
        fetchUsers();
      } else {
        throw new Error(res.data?.message || 'فشل تعديل الدور');
      }
    } catch (err) {
      setRoleError(err.response?.data?.message || err.message || 'حدث خطأ أثناء تعديل دور المستخدم');
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      newStatus === 'suspended'
        ? `هل أنت متأكد من تجميد حساب المستخدم (${user.email})؟`
        : `هل أنت متأكد من إعادة تفعيل حساب المستخدم (${user.email})؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.patch(`/admin/users/${user._id}/status`, {
        status: newStatus
      });
      if (res.data?.success) {
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'تعذر تغيير حالة الحساب');
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls: Search, Filter, Refresh */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto flex-1 flex flex-col sm:flex-row items-center gap-3">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="بحث بالاسم أو البريد الإلكتروني..."
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 font-cairo text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
            >
              <option value="">جميع الأدوار</option>
              <option value="admin">مسؤول نظام</option>
              <option value="user">باحث / مستخدم</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 font-cairo text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
            >
              <option value="">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="suspended">معلّق</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          className="btn btn-secondary inline-flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl self-end md:self-auto shadow-2xs hover:bg-slate-100 transition-all"
          title="تحديث البيانات"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>تحديث</span>
        </button>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-16 text-center text-slate-500 font-cairo space-y-3">
            <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">جاري تحميل بيانات المستخدمين...</p>
          </div>
        ) : error ? (
          <div className="p-16 text-center text-rose-600 font-cairo space-y-3">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="btn btn-secondary text-xs inline-flex items-center gap-1.5 mt-2 rounded-xl"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-cairo space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">لا يوجد مستخدمون مطابقون لمعايير البحث</p>
            <p className="text-xs text-slate-400">حاول تعديل شروط البحث أو مسح الفلاتر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/70 text-slate-500 border-b border-slate-200/80 font-cairo">
                  <th className="py-3.5 px-5 font-bold">المستخدم</th>
                  <th className="py-3.5 px-5 font-bold">البريد الإلكتروني</th>
                  <th className="py-3.5 px-5 font-bold">الدور</th>
                  <th className="py-3.5 px-5 font-bold">عدد الأبحاث</th>
                  <th className="py-3.5 px-5 font-bold">تاريخ التسجيل</th>
                  <th className="py-3.5 px-5 font-bold">الحالة</th>
                  <th className="py-3.5 px-5 font-bold text-center">إجراءات الإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-cairo">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {u.name ? u.name.charAt(0) : 'U'}
                        </div>
                        <span className="truncate max-w-[150px]">{u.name || 'مستخدم بدون اسم'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-amiri text-sm">{u.email}</td>
                    <td className="py-3.5 px-5">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      <span className="inline-block px-2.5 py-0.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200/60">
                        {(u.researchCount || 0).toLocaleString('ar-EG')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-amiri">
                      {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="py-3.5 px-5">
                      <UserStatusBadge status={u.status} />
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenUserDetails(u)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          title="عرض الأبحاث والتفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRoleModal(u)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          title="تعديل الصلاحية والدور"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.status === 'active'
                              ? 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'active' ? 'تجميد الحساب' : 'تفعيل الحساب'}
                        >
                          {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={(newPage) => setPage(newPage)}
          limit={limit}
        />
      </div>

      {/* Modal: View User Researches */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={`الملف الأكاديمي: ${selectedUser?.name || ''}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-cairo">
            <div>
              <span className="text-slate-400 block mb-1">البريد الإلكتروني</span>
              <span className="font-bold text-slate-800 font-amiri text-sm">{selectedUser?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">الدور والحالة</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <RoleBadge role={selectedUser?.role} />
                <UserStatusBadge status={selectedUser?.status} />
              </div>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">تاريخ الانضمام</span>
              <span className="font-bold text-slate-800 font-amiri">
                {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('ar-EG') : '—'}
              </span>
            </div>
          </div>

          {/* Researches List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 font-cairo flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-teal-700" />
              <span>مشاريع أبحاث هذا المستخدم ({userResearches.length.toLocaleString('ar-EG')})</span>
            </h4>

            {loadingResearches ? (
              <div className="py-8 text-center text-xs text-slate-400 font-cairo">
                جاري تحميل قائمة الأبحاث...
              </div>
            ) : userResearches.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-cairo border border-dashed border-slate-200 rounded-2xl">
                لم يقم هذا المستخدم بإنشاء أي أبحاث حتى الآن.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden max-h-72 overflow-y-auto bg-white shadow-2xs">
                {userResearches.map((r) => (
                  <div key={r._id} className="p-3.5 bg-white hover:bg-slate-50/70 flex items-center justify-between gap-3 text-xs font-cairo transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {r.title || r.cover?.title || 'مشروع بحث غير معنون'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-amiri flex items-center gap-3">
                        <span>الجامعة: {r.cover?.university || '—'}</span>
                        <span>آخر تحديث: {new Date(r.updatedAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ResearchStepBadge step={r.currentStep} />
                      <ResearchStatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal: Change User Role */}
      <Modal
        isOpen={Boolean(roleModalUser)}
        onClose={() => setRoleModalUser(null)}
        title="تعديل صلاحية ودور المستخدم"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-right">
          <p className="text-xs text-slate-600 font-cairo leading-relaxed">
            أنت على وشك تعديل دور المستخدم <strong className="text-slate-900">{roleModalUser?.email}</strong>.
          </p>

          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5">
            <label className="text-xs font-bold text-slate-700 font-cairo block">
              اختر الدور الجديد:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTargetRole('user')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold font-cairo border transition-all ${
                  targetRole === 'user'
                    ? 'bg-white border-teal-700 text-teal-900 shadow-2xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                مستخدم / باحث
              </button>
              <button
                type="button"
                onClick={() => setTargetRole('admin')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold font-cairo border transition-all ${
                  targetRole === 'admin'
                    ? 'bg-white border-amber-600 text-amber-900 shadow-2xs'
                    : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                مسؤول نظام (Admin)
              </button>
            </div>
          </div>

          {targetRole === 'admin' && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 font-cairo leading-relaxed">
              ⚠️ تنبيه: منح دور المسؤول يتيح للمستخدم الوصول الكامل إلى لوحة الإدارة وإدارة كافة المستخدمين والإعدادات.
            </div>
          )}

          {roleError && (
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200/80 text-xs text-rose-700 font-cairo">
              {roleError}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRoleModalUser(null)}
              className="btn btn-secondary text-xs py-2 px-3.5 rounded-xl"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirmRoleChange}
              disabled={updatingRole || targetRole === roleModalUser?.role}
              className="btn btn-primary text-xs py-2 px-4 rounded-xl disabled:opacity-50 shadow-2xs"
            >
              {updatingRole ? 'جاري الحفظ...' : 'تأكيد التغيير'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
