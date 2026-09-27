import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Settings,
  Palette,
  FileText,
  Image as ImageIcon,
  Mail,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Upload,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
  Eye,
  ShieldAlert
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'branding';

  const [settings, setSettings] = useState(null);
  const [contentHome, setContentHome] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Maintenance state
  const [maintenanceTitle, setMaintenanceTitle] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceToggling, setMaintenanceToggling] = useState(false);

  // Upload state
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const fetchAllSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, contentRes, mediaRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/content/home'),
        api.get('/admin/media')
      ]);

      if (settingsRes.data?.success) {
        const s = settingsRes.data.data.settings;
        setSettings(s);
        setMaintenanceTitle(s.system?.maintenanceTitle || 'الموقع قيد الصيانة حالياً');
        setMaintenanceMessage(s.system?.maintenanceMessage || 'نعمل حالياً على إجراء بعض التحسينات والإصلاحات لنقدم لكم تجربة بحث أكاديمي أفضل. يرجى الانتظار حتى انتهاء أعمال الصيانة.');
      }

      if (contentRes.data?.success) {
        setContentHome(contentRes.data.data.content || {});
      }

      if (mediaRes.data?.success) {
        setMediaList(mediaRes.data.data.media || []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      showNotification('error', err.friendlyMessage || 'تعذر تحميل الإعدادات من الخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // 1. Save Branding & General Settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', settings);
      if (res.data?.success) {
        setSettings(res.data.data.settings);
        showNotification('success', 'تم حفظ إعدادات الموقع بنجاح');
      }
    } catch (err) {
      showNotification('error', err.friendlyMessage || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  // 2. Save Homepage Content
  const handleSaveContent = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/content/home', {
        title: 'الصفحة الرئيسية',
        content: contentHome,
        publishNow: true
      });
      if (res.data?.success) {
        showNotification('success', 'تم حفظ ونشر محتوى الموقع بنجاح');
      }
    } catch (err) {
      showNotification('error', err.friendlyMessage || 'فشل حفظ المحتوى');
    } finally {
      setSaving(false);
    }
  };

  // 3. Maintenance Toggle
  const handleToggleMaintenance = async (newState) => {
    const confirmPrompt = newState
      ? 'هل أنت متأكد من تفعيل وضع الصيانة؟ سيتلقى كافة الزوار العاديين صفحة الصيانة بينما يمكنك أنت الإدارة بشكل طبيعي.'
      : 'هل تريد إنهاء وضع الصيانة وإتاحة الموقع لكافة الباحثين والزوار؟';

    if (!window.confirm(confirmPrompt)) return;

    setMaintenanceToggling(true);
    try {
      const res = await api.post('/admin/settings/maintenance', {
        enabled: newState,
        title: maintenanceTitle,
        message: maintenanceMessage
      });

      if (res.data?.success) {
        setSettings(res.data.data.settings);
        showNotification('success', newState ? 'تم تفعيل وضع الصيانة بنجاح' : 'تم تعطيل وضع الصيانة واستعادة العمل الطبيعي');
      }
    } catch (err) {
      showNotification('error', err.friendlyMessage || 'فشل تغيير حالة وضع الصيانة');
    } finally {
      setMaintenanceToggling(false);
    }
  };

  // 4. Media Upload
  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'الحد الأقصى لحجم الصورة هو 5 ميجابايت');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploadingMedia(true);
    try {
      const res = await api.post('/admin/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        showNotification('success', 'تم رفع الصورة إلى مكتبة الوسائط بنجاح');
        fetchAllSettings();
      }
    } catch (err) {
      showNotification('error', err.friendlyMessage || 'فشل رفع الصورة');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // 5. Delete Media
  const handleDeleteMedia = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) return;
    try {
      const res = await api.delete(`/admin/media/${id}`);
      if (res.data?.success) {
        showNotification('success', 'تم حذف الصورة بنجاح');
        fetchAllSettings();
      }
    } catch (err) {
      showNotification('error', err.friendlyMessage || 'فشل حذف الصورة');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification('success', 'تم نسخ الرابط إلى الحافظة');
  };

  const isMaintenanceActive = settings?.system?.maintenanceMode === true;

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 font-cairo">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#0F8F83]" />
        <span>جاري تحميل إعدادات النظام...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn font-cairo" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">إعدادات المنصة والمحتوى</h1>
          <p className="text-slate-500 text-sm font-tajawal mt-1">
            المركز الموحد لإدارة الهوية البصرية، نصوص الموقع، الوسائط، والتكوين العام
          </p>
        </div>

        {/* Global Action Button */}
        {activeTab !== 'images' && (
          <button
            onClick={activeTab === 'content' ? handleSaveContent : handleSaveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F8F83] hover:bg-[#0d7b70] text-white font-bold text-xs shadow-md shadow-[#0F8F83]/20 disabled:opacity-50 cursor-pointer transition-all"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ التعديلات</span>
          </button>
        )}
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 shadow-sm transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs">
        <button
          onClick={() => handleTabChange('branding')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-[#0F8F83] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>الهوية والعلامة التجارية</span>
        </button>

        <button
          onClick={() => handleTabChange('content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'content'
              ? 'bg-[#0F8F83] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>محتوى الموقع</span>
        </button>

        <button
          onClick={() => handleTabChange('images')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'images'
              ? 'bg-[#0F8F83] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>إدارة الصور والوسائط</span>
        </button>

        <button
          onClick={() => handleTabChange('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-[#0F8F83] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>التواصل والتذييل</span>
        </button>

        <button
          onClick={() => handleTabChange('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[#0F8F83] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>إعدادات النظام</span>
        </button>

        <button
          onClick={() => handleTabChange('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'maintenance'
              ? 'bg-amber-500 text-slate-900 shadow-xs'
              : isMaintenanceActive
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>وضع الصيانة</span>
          {isMaintenanceActive && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Tab 1: Website / Branding */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-900">الهوية البصرية والعلامة التجارية</h3>
            <p className="text-xs text-slate-500 font-tajawal">تخصيص اسم الموقع، الألوان الأساسية، والشعار الرسمي</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الموقع الرسمي</label>
              <input
                type="text"
                value={settings?.websiteName || ''}
                onChange={(e) => setSettings({ ...settings, websiteName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal text-slate-900 focus:bg-white focus:border-[#0F8F83]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الشعار اللفظي (الوصف التعريفي)</label>
              <input
                type="text"
                value={settings?.websiteSubtitle || ''}
                onChange={(e) => setSettings({ ...settings, websiteSubtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal text-slate-900 focus:bg-white focus:border-[#0F8F83]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اللون الأساسي (Primary Color)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings?.brand?.primaryColor || '#0F8F83'}
                  onChange={(e) => setSettings({
                    ...settings,
                    brand: { ...settings.brand, primaryColor: e.target.value }
                  })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={settings?.brand?.primaryColor || '#0F8F83'}
                  onChange={(e) => setSettings({
                    ...settings,
                    brand: { ...settings.brand, primaryColor: e.target.value }
                  })}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">اللون الثانوي (Secondary Color)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings?.brand?.secondaryColor || '#0F2747'}
                  onChange={(e) => setSettings({
                    ...settings,
                    brand: { ...settings.brand, secondaryColor: e.target.value }
                  })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                />
                <input
                  type="text"
                  value={settings?.brand?.secondaryColor || '#0F2747'}
                  onChange={(e) => setSettings({
                    ...settings,
                    brand: { ...settings.brand, secondaryColor: e.target.value }
                  })}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Website Content */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-900">محتوى ونصوص الموقع القابلة للتحرير</h3>
            <p className="text-xs text-slate-500 font-tajawal">تحرير العناوين الرئيسية، الوصف، وأزرار الحث على اتخاذ إجراء بالصفحة الرئيسية</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الواجهة الرئيسي (Hero Title)</label>
              <input
                type="text"
                value={contentHome?.hero?.title || 'أعد بحثك الأكاديمي المتكامل بأعلى معايير الرصانة العلمية'}
                onChange={(e) => setContentHome({
                  ...contentHome,
                  hero: { ...contentHome?.hero, title: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الوصف التعريفي للواجهة (Hero Description)</label>
              <textarea
                rows={3}
                value={contentHome?.hero?.subtitle || 'مساعدك الذكي لإعداد خطط ومطالب ومحتوى الأبحاث الجامعية وتنسيق الهوامش تلقائياً وفق أدق الضوابط الأكاديمية.'}
                onChange={(e) => setContentHome({
                  ...contentHome,
                  hero: { ...contentHome?.hero, subtitle: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal text-slate-900 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نص زر الإجراء الرئيسي (Primary CTA)</label>
                <input
                  type="text"
                  value={contentHome?.hero?.ctaText || 'ابدأ إعداد بحثك الآن مجاناً'}
                  onChange={(e) => setContentHome({
                    ...contentHome,
                    hero: { ...contentHome?.hero, ctaText: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نص الزر الثانوي (Secondary CTA)</label>
                <input
                  type="text"
                  value={contentHome?.hero?.secondaryCtaText || 'تعرف على كيفية العمل'}
                  onChange={(e) => setContentHome({
                    ...contentHome,
                    hero: { ...contentHome?.hero, secondaryCtaText: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Images & Media */}
      {activeTab === 'images' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">مكتبة الصور والوسائط</h3>
              <p className="text-xs text-slate-500 font-tajawal">رفع وإدارة صور الموقع الرسمي وشعارات الجامعات بشكل آمن</p>
            </div>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F8F83] hover:bg-[#0d7b70] text-white text-xs font-bold cursor-pointer transition-all shadow-xs">
              <Upload className="w-4 h-4" />
              <span>{uploadingMedia ? 'جاري الرفع...' : 'رفع صورة جديدة'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleMediaUpload}
                disabled={uploadingMedia}
                className="hidden"
              />
            </label>
          </div>

          {mediaList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-tajawal bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span>لا توجد صور مرفوعة في المكتبة بعد. يمكنك رفع الصور لاستخدامها في الموقع.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaList.map((item) => (
                <div key={item._id} className="group relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="h-36 bg-slate-100 flex items-center justify-center p-2 overflow-hidden">
                    <img
                      src={item.url}
                      alt={item.originalName}
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 bg-white border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-900 block truncate" title={item.originalName}>
                      {item.originalName}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-tajawal mt-1">
                      <span>{(item.size / 1024).toFixed(1)} KB</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(item.url)}
                          className="p-1 hover:text-slate-900 hover:bg-slate-100 rounded-sm"
                          title="نسخ الرابط"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(item._id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-sm"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Contact / Footer */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-900">بيانات التواصل وروابط التذييل</h3>
            <p className="text-xs text-slate-500 font-tajawal">تحديث بريد الدعم الفني، أرقام الهواتف، وروابط شبكات التواصل</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">البريد الإلكتروني للدعم</label>
              <input
                type="email"
                value={settings?.contact?.email || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  contact: { ...settings.contact, email: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">رقم الهاتف / الواتساب</label>
              <input
                type="text"
                value={settings?.contact?.phone || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  contact: { ...settings.contact, phone: e.target.value }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">رابط تويتر / X</label>
              <input
                type="text"
                value={settings?.contact?.socialLinks?.twitter || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  contact: {
                    ...settings.contact,
                    socialLinks: { ...settings.contact?.socialLinks, twitter: e.target.value }
                  }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">رابط لينكد إن (LinkedIn)</label>
              <input
                type="text"
                value={settings?.contact?.socialLinks?.linkedin || ''}
                onChange={(e) => setSettings({
                  ...settings,
                  contact: {
                    ...settings.contact,
                    socialLinks: { ...settings.contact?.socialLinks, linkedin: e.target.value }
                  }
                })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: System Settings */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-base text-slate-900">إعدادات النظام والتشغيل</h3>
            <p className="text-xs text-slate-500 font-tajawal">خيارات تسجيل الحسابات والاتصال بقاعدة البيانات</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">إتاحة تسجيل الباحثين الجدد</span>
                <span className="text-[11px] text-slate-500 font-tajawal">السماح للمستخدمين الجدد بإنشاء حسابات على المنصة</span>
              </div>
              <input
                type="checkbox"
                checked={settings?.system?.registrationEnabled ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  system: { ...settings.system, registrationEnabled: e.target.checked }
                })}
                className="w-5 h-5 rounded-md text-[#0F8F83] focus:ring-[#0F8F83] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="font-bold text-xs text-slate-900 block">تفعيل الواجهة العامة للزوار</span>
                <span className="text-[11px] text-slate-500 font-tajawal">إتاحة استعراض الموقع التعريفي ومميزات المنصة</span>
              </div>
              <input
                type="checkbox"
                checked={settings?.system?.publicWebsiteEnabled ?? true}
                onChange={(e) => setSettings({
                  ...settings,
                  system: { ...settings.system, publicWebsiteEnabled: e.target.checked }
                })}
                className="w-5 h-5 rounded-md text-[#0F8F83] focus:ring-[#0F8F83] cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Maintenance Mode */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-100 pb-5">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                isMaintenanceActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${isMaintenanceActive ? 'animate-bounce text-amber-600' : ''}`} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">نظام وضع الصيانة (Maintenance Mode)</h3>
                <p className="text-xs text-slate-500 font-tajawal">
                  نظام حماية خادمي فوري يُغلق الموقع العام أمام الزوار العاديين مع إبقاء صلاحيات الإدارة للمسؤولين
                </p>
              </div>
            </div>

            {/* Status indicator badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border ${
              isMaintenanceActive
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isMaintenanceActive ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
              <span>{isMaintenanceActive ? 'وضع الصيانة مفعّل (الموقع مغلق أمام الزوار)' : 'الموقع يعمل بشكل طبيعي'}</span>
            </div>
          </div>

          {/* Toggle Switch Card */}
          <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 mb-1">التحكم في تشغيل وضع الصيانة</h4>
              <p className="text-xs text-slate-600 font-tajawal leading-relaxed">
                عند التفعيل، يحصل الزوار والباحثون العاديون على استجابة 503 وصفحة الصيانة المخصصة. بينما يستمر المسؤول في العمل بكامل الصلاحيات.
              </p>
            </div>

            <button
              onClick={() => handleToggleMaintenance(!isMaintenanceActive)}
              disabled={maintenanceToggling}
              className={`px-6 py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isMaintenanceActive
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {maintenanceToggling && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>{isMaintenanceActive ? 'تعطيل الصيانة والعودة للعمل الطبيعي' : 'تفعيل وضع الصيانة الآن'}</span>
            </button>
          </div>

          {/* Customizable Maintenance Messages */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان صفحة الصيانة (Title)</label>
              <input
                type="text"
                value={maintenanceTitle}
                onChange={(e) => setMaintenanceTitle(e.target.value)}
                placeholder="الموقع قيد الصيانة حالياً"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رسالة الشرح والتوضيح للزوار (Message)</label>
              <textarea
                rows={3}
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="نعمل حالياً على إجراء بعض التحسينات والإصلاحات..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-tajawal text-slate-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Audit trail information */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 font-tajawal">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>
                آخر تحديث: {settings?.system?.maintenanceLastUpdatedByName ? (
                  <strong className="text-slate-700">{settings.system.maintenanceLastUpdatedByName}</strong>
                ) : 'النظام'}
                {settings?.system?.maintenanceLastUpdatedAt && (
                  <> في {new Date(settings.system.maintenanceLastUpdatedAt).toLocaleString('ar-SA')}</>
                )}
              </span>
            </div>
            <a
              href="/maintenance"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#0F8F83] hover:underline"
            >
              <span>معاينة صفحة الصيانة المخصصة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
