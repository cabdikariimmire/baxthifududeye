import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  Server,
  FileCode,
  Palette,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  RefreshCw,
  Eye,
  EyeOff,
  Cpu,
  Database
} from 'lucide-react';
import api from '../../../services/api';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('ai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [aiSettings, setAiSettings] = useState({
    provider: 'openrouter',
    model: '',
    temperature: 0.1,
    systemInstructions: '',
    customApiKey: ''
  });
  const [hasCustomApiKey, setHasCustomApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [activeTemplate, setActiveTemplate] = useState(null);
  const [bordersCount, setBordersCount] = useState(0);
  const [systemInfo, setSystemInfo] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/settings');
      if (res.data?.success) {
        const { aiSettings: fetchedAI, activeTemplate: tmpl, bordersCount: bCount, systemInfo: sys } = res.data.data;
        if (fetchedAI) {
          setAiSettings({
            provider: fetchedAI.provider || 'openrouter',
            model: fetchedAI.model || '',
            temperature: fetchedAI.temperature ?? 0.1,
            systemInstructions: fetchedAI.systemInstructions || '',
            customApiKey: fetchedAI.customApiKey || ''
          });
          setHasCustomApiKey(fetchedAI.hasCustomApiKey || false);
        }
        setActiveTemplate(tmpl);
        setBordersCount(bCount || 0);
        setSystemInfo(sys);
      } else {
        throw new Error(res.data?.message || 'فشل تحميل إعدادات النظام');
      }
    } catch (err) {
      console.error('Error loading admin settings:', err);
      setError(err.response?.data?.message || err.message || 'تعذر تحميل إعدادات النظام');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveAISettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.patch('/admin/settings', aiSettings);
      if (res.data?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        fetchSettings();
      } else {
        throw new Error(res.data?.message || 'فشل حفظ الإعدادات');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAIConnection = async () => {
    setTestingAI(true);
    setTestResult(null);
    try {
      const res = await api.post('/admin/ai-settings/test');
      if (res.data?.success) {
        setTestResult({
          success: true,
          message: res.data.message || 'الاتصال يعمل بكفاءة عالية'
        });
      } else {
        throw new Error(res.data?.message || 'فشل اختبار الاتصال');
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'تعذر الاتصال بمزود الذكاء الاصطناعي'
      });
    } finally {
      setTestingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 font-cairo space-y-3">
        <div className="w-8 h-8 border-3 border-teal-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs">جاري تحميل إعدادات النظام المعتمدة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 bg-white rounded-2xl border border-rose-200 text-center space-y-3 max-w-lg mx-auto shadow-sm">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <p className="text-sm font-bold text-slate-900 font-cairo">{error}</p>
        <button
          type="button"
          onClick={fetchSettings}
          className="btn btn-secondary text-xs inline-flex items-center gap-1.5 mt-2 rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Segmented Navigation Tabs */}
      <div className="bg-slate-200/60 p-1.5 rounded-2xl inline-flex gap-1 overflow-x-auto border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-cairo transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'ai'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-teal-700" />
          <span>إعدادات الذكاء الاصطناعي</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-cairo transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'system'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Server className="w-4 h-4 text-teal-700" />
          <span>حالة النظام والبيئة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-cairo transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <FileCode className="w-4 h-4 text-teal-700" />
          <span>القوالب والإطارات</span>
        </button>
      </div>

      {/* Tab 1: AI Settings */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAISettings} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-900 font-cairo">تكوين مزود الذكاء الاصطناعي الأكاديمي</h3>
              <p className="text-xs text-slate-500 font-cairo mt-1">
                تحديد النموذج ومفتاح API والمعاملات الحسابية لتوليد الهيكلية والمقدمة والمراجع
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">مزود الخدمة (Provider)</label>
                <select
                  value={aiSettings.provider}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, provider: e.target.value }))}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 font-cairo focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
                >
                  <option value="openrouter">OpenRouter (المعتمد)</option>
                  <option value="nvidia">NVIDIA NIM</option>
                  <option value="custom">مخصص (Custom Endpoint)</option>
                </select>
              </div>

              <div>
                <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">اسم الموديل المعتمد (Model)</label>
                <input
                  type="text"
                  value={aiSettings.model}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g. nvidia/llama-3.1-nemotron-70b-instruct:free"
                  className="w-full text-xs font-mono text-slate-800 dir-ltr text-left bg-slate-50/80 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label text-xs font-bold text-slate-700 mb-0">
                    مفتاح API الخاص (Custom API Key)
                  </label>
                  {hasCustomApiKey && (
                    <span className="text-[11px] text-emerald-700 font-bold font-cairo">
                      ✓ تم تعيين مفتاح خاص مسبقاً
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiSettings.customApiKey}
                    onChange={(e) => setAiSettings((prev) => ({ ...prev, customApiKey: e.target.value }))}
                    placeholder={hasCustomApiKey ? 'اتركه فارغاً للاحتفاظ بالمفتاح الحالي المحفوظ بأمان' : 'أدخل مفتاح OpenRouter أو NVIDIA API...'}
                    className="w-full text-xs font-mono dir-ltr text-left pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((prev) => !prev)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    title={showApiKey ? 'إخفاء' : 'إظهار'}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-amiri mt-1.5">
                  * يتم حفظ المفتاح بشكل مشفر ولا يتم كشفه مطلقاً بنص صريح. إذا تركت الحقل فارغاً فسيتم استخدام المفتاح الافتراضي في متغيرات البيئة.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label text-xs font-bold text-slate-700 mb-0">درجة الحرارة (Temperature)</label>
                  <span className="text-xs font-bold text-teal-800 font-mono bg-teal-50 px-2 py-0.5 rounded border border-teal-100">{aiSettings.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={aiSettings.temperature}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-teal-700 cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-cairo mt-1">
                  <span>0.0 (دقة أكاديمية صارمة)</span>
                  <span>1.0 (إبداعي)</span>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="form-label text-xs font-bold text-slate-700 mb-1.5 block">التوجيه الأكاديمي العام (System Instructions)</label>
                <textarea
                  rows="3"
                  value={aiSettings.systemInstructions}
                  onChange={(e) => setAiSettings((prev) => ({ ...prev, systemInstructions: e.target.value }))}
                  className="w-full text-xs font-amiri leading-relaxed bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all shadow-2xs"
                  placeholder="أدخل التوجيهات القياسية المعتمدة للنماذج..."
                ></textarea>
              </div>
            </div>

            {/* Actions & AI Test */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestAIConnection}
                disabled={testingAI}
                className="btn btn-secondary text-xs inline-flex items-center gap-2 py-2.5 px-4 w-full sm:w-auto rounded-xl shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 text-slate-500" />
                <span>{testingAI ? 'جاري فحص الاتصال بالموديل...' : 'فحص الاتصال بالموديل'}</span>
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {saveSuccess && (
                  <span className="text-xs text-emerald-700 font-bold font-cairo flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>تم الحفظ بنجاح!</span>
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary text-xs inline-flex items-center gap-2 py-2.5 px-5 w-full sm:w-auto rounded-xl shadow-2xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ إعدادات الذكاء الاصطناعي'}</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-cairo shadow-2xs ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="font-bold flex items-center gap-2">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Tab 2: System Health */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 font-cairo">المؤشرات الفنية والبيئة التشغيلية</h3>
            <p className="text-xs text-slate-500 font-cairo mt-1">
              بيانات الخادم وقاعدة بيانات MongoDB الحقيقية المسترجعة لحظياً
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-cairo text-xs">
            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">حالة قاعدة البيانات</span>
              <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>{systemInfo?.databaseStatus || 'متصل'}</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">بيئة التشغيل (Environment)</span>
              <div className="font-black text-slate-900 text-sm font-mono">
                {systemInfo?.environment || 'development'}
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">إصدار Node.js</span>
              <div className="font-black text-slate-900 text-sm font-mono flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-700" />
                <span>{systemInfo?.nodeVersion || 'v20'}</span>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">مدة تشغيل الخادم المستمرة</span>
              <div className="font-black text-slate-900 text-sm">
                {systemInfo?.uptimeSeconds ? `${Math.floor(systemInfo.uptimeSeconds / 60)} دقيقة` : '—'}
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">استهلاك الذاكرة التقريبي</span>
              <div className="font-black text-slate-900 text-sm font-mono">
                {systemInfo?.memoryUsageMb ? `${systemInfo.memoryUsageMb} MB` : '—'}
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-1.5 shadow-2xs">
              <span className="text-slate-400 block text-[11px]">نظام التشغيل المنفذ</span>
              <div className="font-black text-slate-900 text-sm font-mono">
                {systemInfo?.platform || 'win32'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Templates & Borders */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4 font-cairo">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">القالب الأكاديمي المرجعي الافتراضي</h3>
              <p className="text-xs text-slate-500 mt-0.5">القالب الحاكم لقياسات الصفحات والهوامش A4 الموحدة</p>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50/70 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 text-sm">{activeTemplate?.nameAr || 'القالب الأكاديمي القياسي A4'}</div>
                <div className="text-slate-400 font-mono text-[11px]">{activeTemplate?.templateId || 'template-default-a4'}</div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-bold text-xs shadow-2xs">
                مفعل افتراضياً
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4 font-cairo">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">إطارات الصفحات وزخارف الحدود</h3>
                <p className="text-xs text-slate-500 mt-0.5">عدد الإطارات المتاحة للباحثين لاختيارها في صفحة الغلاف</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs border border-slate-200/60 shadow-2xs">
                {bordersCount} إطارات معتمدة
              </span>
            </div>
            <p className="text-xs text-slate-600 font-amiri leading-relaxed">
              تتضمن المنصة خيار «بدون إطار» الافتراضي، بالإضافة إلى إطارات هندسية وإسلامية مخصصة ومطابقة لأبعاد الطباعة A4.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
