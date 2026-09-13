import React, { useState, useEffect } from 'react';
import { Shield, Users, BookOpen, Sparkles, Sliders, Palette, FileCode, CheckCircle2, AlertTriangle, RefreshCw, Send, Check } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../features/auth/AuthContext';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  const [statsData, setStatsData] = useState(null);
  const [aiSettings, setAiSettings] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [researchesList, setResearchesList] = useState([]);
  const [bordersList, setBordersList] = useState([]);
  const [templatesList, setTemplatesList] = useState([]);
  const [aiLogs, setAiLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [testingAI, setTestingAI] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const fetchTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const res = await api.get('/admin/stats');
        if (res.data.success) setStatsData(res.data.data);
      } else if (activeTab === 'ai') {
        const res = await api.get('/admin/ai-settings');
        if (res.data.success) setAiSettings(res.data.data.settings);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        if (res.data.success) setUsersList(res.data.data.users);
      } else if (activeTab === 'researches') {
        const res = await api.get('/admin/researches');
        if (res.data.success) setResearchesList(res.data.data.researches);
      } else if (activeTab === 'borders') {
        const res = await api.get('/admin/borders');
        if (res.data.success) setBordersList(res.data.data.borders);
      } else if (activeTab === 'templates') {
        const res = await api.get('/admin/templates');
        if (res.data.success) setTemplatesList(res.data.data.templates);
      } else if (activeTab === 'logs') {
        const res = await api.get('/admin/logs');
        if (res.data.success) setAiLogs(res.data.data.logs);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabContent();
  }, [activeTab]);

  const handleSaveAISettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setStatusMsg(null);
    try {
      const res = await api.patch('/admin/ai-settings', aiSettings);
      if (res.data.success) {
        setStatusMsg('تم حفظ وتحديث إعدادات الذكاء الاصطناعي بنجاح');
      }
    } catch (err) {
      alert('فشل حفظ الإعدادات');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestAI = async () => {
    setTestingAI(true);
    setTestResult(null);
    try {
      const res = await api.post('/admin/ai-settings/test');
      setTestResult({ success: true, message: res.data.message, data: res.data.data });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'فشل الاتصال بمزود الذكاء الاصطناعي'
      });
    } finally {
      setTestingAI(false);
    }
  };

  const handleActivateTemplate = async (templateId) => {
    try {
      await api.patch(`/admin/templates/${templateId}/activate`);
      fetchTabContent();
    } catch (err) {
      alert('حدث خطأ أثناء تفعيل القالب');
    }
  };

  const handleToggleBorder = async (borderId) => {
    try {
      await api.patch(`/admin/borders/${borderId}/toggle`);
      fetchTabContent();
    } catch (err) {
      alert('حدث خطأ');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-6 py-6 animate-fade">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Shield className="w-3.5 h-3.5" />
            <span>لوحة التحكم الإدارية للمنظومة الأكاديمية</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-cairo mt-2 text-white">
            إدارة المنصة، الذكاء الاصطناعي، والقوالب
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-amiri">
            التحكم في معلمات النموذج المرجعي، مزودات الذكاء الاصطناعي، أطر الصفحات، وحسابات المستخدمين
          </p>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        {[
          { id: 'stats', label: 'الإحصائيات العامة', icon: Sliders },
          { id: 'ai', label: 'إعدادات الذكاء الاصطناعي (NVIDIA)', icon: Sparkles },
          { id: 'templates', label: 'القوالب ونموذج المرجع', icon: FileCode },
          { id: 'borders', label: 'إدارة الأطر والزخارف', icon: Palette },
          { id: 'users', label: 'المستخدمين والصلاحيات', icon: Users },
          { id: 'researches', label: 'كافة مشاريع البحوث', icon: BookOpen },
          { id: 'logs', label: 'سجلات الذكاء الاصطناعي (AILogs)', icon: CheckCircle2 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold font-cairo whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Stats */}
      {activeTab === 'stats' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold font-cairo">إجمالي المستخدمين</span>
              <span className="text-3xl font-extrabold text-slate-900 font-cairo">
                {statsData?.stats?.userCount ?? 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold font-cairo">إجمالي مشاريع البحوث</span>
              <span className="text-3xl font-extrabold text-teal-700 font-cairo">
                {statsData?.stats?.researchCount ?? 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold font-cairo">طلبات الذكاء الاصطناعي</span>
              <span className="text-3xl font-extrabold text-amber-600 font-cairo">
                {statsData?.stats?.aiLogsCount ?? 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-1">
              <span className="text-xs text-slate-500 font-bold font-cairo">نسبة نجاح العمليات</span>
              <span className="text-3xl font-extrabold text-emerald-600 font-cairo">
                {statsData?.stats?.successRate ?? 100}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Settings */}
      {activeTab === 'ai' && aiSettings && (
        <div className="max-w-4xl bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-cairo">
                تهيئة وتكوين مزود الذكاء الاصطناعي
              </h2>
              <p className="text-xs text-slate-500 font-amiri mt-0.5">
                النموذج النشط: <b>NVIDIA Model عبر OpenRouter Gateway</b>
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestAI}
              disabled={testingAI}
              className="btn btn-secondary text-xs"
            >
              <Send className={`w-3.5 h-3.5 ${testingAI ? 'animate-spin' : ''}`} />
              <span>{testingAI ? 'جاري الفحص...' : 'اختبار الاتصال بالنموذج'}</span>
            </button>
          </div>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200">
              {statusMsg}
            </div>
          )}

          {testResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${testResult.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}>
              <div className="font-bold mb-1">{testResult.message}</div>
              {testResult.data?.model && <div>النموذج المستجيب: <b>{testResult.data.model}</b></div>}
            </div>
          )}

          <form onSubmit={handleSaveAISettings} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">مزود الخدمة (AI Provider)</label>
                <select
                  value={aiSettings.provider}
                  onChange={(e) => setAiSettings({ ...aiSettings, provider: e.target.value })}
                  className="select-field"
                >
                  <option value="openrouter">OpenRouter (NVIDIA Gateway)</option>
                  <option value="nvidia">NVIDIA Direct API</option>
                  <option value="custom">Custom Adapter</option>
                </select>
              </div>

              <div>
                <label className="form-label">معرف النموذج (AI Model ID)</label>
                <input
                  type="text"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                  className="input-field font-mono text-xs"
                  dir="ltr"
                  placeholder="nvidia/llama-3.1-nemotron-70b-instruct:free"
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">مفتاح API مخصص (اختياري - يترك فارغاً لاستخدام بيئة الخادم)</label>
              <input
                type="password"
                value={aiSettings.customApiKey || ''}
                onChange={(e) => setAiSettings({ ...aiSettings, customApiKey: e.target.value })}
                className="input-field text-left"
                dir="ltr"
                placeholder="sk-or-v1-..."
              />
            </div>

            <div>
              <label className="form-label">درجة الحرارة (Temperature: {aiSettings.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={aiSettings.temperature}
                onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                className="w-full cursor-pointer accent-teal-700"
              />
            </div>

            <div>
              <label className="form-label">تعليمات النظام التوجيهية (System Instructions)</label>
              <textarea
                rows={4}
                value={aiSettings.systemInstructions}
                onChange={(e) => setAiSettings({ ...aiSettings, systemInstructions: e.target.value })}
                className="textarea-field font-amiri text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="btn btn-primary px-8 py-3 text-sm font-bold shadow-md shadow-teal-700/20"
              >
                <span>{savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Templates */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col gap-4">
          <h2 className="text-lg font-bold text-slate-900 font-cairo">
            قوالب ونماذج البحوث الأكاديمية المعتمدة
          </h2>
          <p className="text-xs text-slate-500 font-amiri">
            القالب النشط يمثل النموذج المرجعي الحاكم للهيكل، المقاسات، والهوامش لكافة البحوث المنشأة حديثاً
          </p>

          <div className="flex flex-col gap-3 mt-2">
            {templatesList.map((tpl) => (
              <div
                key={tpl._id}
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  tpl.active ? 'border-teal-700 bg-teal-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 font-cairo">{tpl.nameAr}</span>
                    {tpl.active && <span className="badge badge-success text-[10px]">القالب المعتمد النشط</span>}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">{tpl.name} — الإصدار {tpl.version}</div>
                </div>

                {!tpl.active && (
                  <button
                    onClick={() => handleActivateTemplate(tpl._id)}
                    className="btn btn-secondary text-xs"
                  >
                    <span>تفعيل هذا القالب</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Borders */}
      {activeTab === 'borders' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {bordersList.map((border) => (
            <div key={border._id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 font-cairo">{border.nameAr}</span>
                <span className={`badge ${border.active ? 'badge-success' : 'badge-warning'} text-[10px]`}>
                  {border.active ? 'مفعل' : 'معطل'}
                </span>
              </div>
              <div
                className="h-20 rounded-xl border flex items-center justify-center text-xs font-bold font-cairo"
                style={{ borderColor: border.accentColor, color: border.accentColor }}
              >
                معاينة الإطار
              </div>
              <button
                onClick={() => handleToggleBorder(border._id)}
                className="btn btn-secondary w-full text-xs font-cairo mt-1"
              >
                <span>{border.active ? 'تعطيل الإطار' : 'تفعيل الإطار'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-cairo">
              <tr>
                <th className="p-3.5">الاسم</th>
                <th className="p-3.5">البريد الإلكتروني</th>
                <th className="p-3.5">الدور</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 font-cairo">{u.name}</td>
                  <td className="p-3.5 text-slate-600 font-mono" dir="ltr">{u.email}</td>
                  <td className="p-3.5">
                    <span className={`badge ${u.role === 'admin' ? 'badge-warning font-bold' : 'badge-info'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="badge badge-success">{u.status}</span>
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono">
                    {new Date(u.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Researches */}
      {activeTab === 'researches' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-cairo">
              <tr>
                <th className="p-3.5">عنوان البحث</th>
                <th className="p-3.5">الباحث / المستخدم</th>
                <th className="p-3.5">المرحلة</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">آخر تحديث</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {researchesList.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 font-cairo">{r.title}</td>
                  <td className="p-3.5 text-slate-600">{r.userId?.name || 'مستخدم'}</td>
                  <td className="p-3.5 font-bold text-teal-700">الخطوة {r.currentStep}</td>
                  <td className="p-3.5"><span className="badge badge-primary">{r.status}</span></td>
                  <td className="p-3.5 text-slate-400 font-mono">{new Date(r.updatedAt).toLocaleDateString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 7: AI Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-cairo">
              <tr>
                <th className="p-3.5">العملية (Task)</th>
                <th className="p-3.5">النموذج</th>
                <th className="p-3.5">المدة (ms)</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {aiLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{log.task}</td>
                  <td className="p-3.5 text-slate-600">{log.model}</td>
                  <td className="p-3.5">{log.durationMs}ms</td>
                  <td className="p-3.5">
                    <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-400">{new Date(log.createdAt).toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
