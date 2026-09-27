import React, { useState, useEffect, useRef } from 'react';
import A4Page from '../../../components/common/A4Page';
import A4ScaleWrapper from '../../../components/common/A4ScaleWrapper';
import { Palette, CheckCircle2, ArrowLeft, Upload, Trash2, Image, RotateCcw, Sparkles, Move } from 'lucide-react';
import api from '../../../services/api';
import { BORDERS_LIST, getBorderById } from '../../../utils/borders';
import FontSelector from '../../../components/common/FontSelector';
import { buildDefaultCoverLayout, mergeCoverDataWithLayout } from '../../../utils/coverLayout';
import { resolveLogoUrl, isCustomLogo, DEFAULT_LOGO_URL } from '../../../utils/logoResolver';

const Step1Cover = ({ research, onSave, onNext }) => {
  const [formData, setFormData] = useState({
    country: research?.cover?.country || '',
    university: research?.cover?.university || '',
    college: research?.cover?.college || '',
    subject: research?.cover?.subject || '',
    title: research?.cover?.title || research?.title || '',
    studentName: research?.cover?.studentName || '',
    level: research?.cover?.level || '',
    supervisor: research?.cover?.supervisor || '',
    semester: research?.cover?.semester || '',
    academicYear: research?.cover?.academicYear || '',
    gregorianYear: research?.cover?.gregorianYear || '',
    badgeColor: research?.cover?.badgeColor || '#38761d',
    borderId: research?.borderId || 'none',
    fontFamily: research?.fontFamily || 'default',
    logoUrl: resolveLogoUrl(research?.cover?.logoUrl)
  });

  const [coverLayout, setCoverLayout] = useState(() => {
    if (research?.cover?.coverLayout) {
      return mergeCoverDataWithLayout(research.cover.coverLayout, research?.cover || {});
    }
    return buildDefaultCoverLayout(research?.cover || {});
  });

  const [selectedElementId, setSelectedElementId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBorderSelect = (borderId) => {
    setFormData((prev) => ({ ...prev, borderId }));
  };

  const handleFontSelect = (fontFamily) => {
    setFormData((prev) => ({ ...prev, fontFamily }));
    onSave && onSave({ fontFamily });
  };

  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant client preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target.result;
      setFormData((prev) => ({ ...prev, logoUrl: base64Url }));

      if (research?._id && research._id !== 'new') {
        setUploadingLogo(true);
        try {
          const formPayload = new FormData();
          formPayload.append('logo', file);
          const res = await api.post(`/researches/${research._id}/logo`, formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (res.data?.success && res.data.data?.logoUrl) {
            setFormData((prev) => ({ ...prev, logoUrl: res.data.data.logoUrl }));
          }
        } catch (err) {
          console.warn('Server logo upload fallback to base64:', err);
        } finally {
          setUploadingLogo(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    setFormData((prev) => ({ ...prev, logoUrl: DEFAULT_LOGO_URL }));
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (research?._id && research._id !== 'new') {
      try {
        await api.post(`/researches/${research._id}/logo`, { action: 'remove' });
      } catch (err) {
        console.warn('Error removing logo on server:', err);
      }
    }
  };

  const handleResetCoverLayout = () => {
    const defaultLayout = buildDefaultCoverLayout(formData);
    setCoverLayout(defaultLayout);
    setSelectedElementId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: formData.title,
        borderId: formData.borderId,
        fontFamily: formData.fontFamily || 'default',
        cover: {
          country: formData.country,
          university: formData.university,
          college: formData.college,
          subject: formData.subject,
          title: formData.title,
          studentName: formData.studentName,
          level: formData.level,
          supervisor: formData.supervisor,
          semester: formData.semester,
          academicYear: formData.academicYear,
          gregorianYear: formData.gregorianYear,
          badgeColor: formData.badgeColor,
          logoUrl: isCustomLogo(formData.logoUrl) ? formData.logoUrl : '',
          coverLayout
        },
        currentStep: 2
      };

      await onSave(payload);
      if (onNext) onNext();
    } finally {
      setSaving(false);
    }
  };

  const activeBorderObj = getBorderById(formData.borderId);

  // Live cover page model for immediate rendering with full drag & drop support
  const liveCoverPage = {
    pageNumber: 1,
    pageNumberAr: '١',
    pageType: 'cover',
    title: 'الغلاف',
    isEditable: true,
    selectedElementId,
    onSelectElement: setSelectedElementId,
    onLayoutChange: setCoverLayout,
    data: {
      ...formData,
      coverLayout
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* ═══════ EDITOR / FORM CONTROLS (TOP) ═══════ */}
      <div className="space-y-6 max-w-4xl mx-auto w-full">
        {/* Academic Document Formatting & Settings (Border Art & Font Selection) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label htmlFor="borderId-select" className="form-label font-bold text-slate-800 flex items-center gap-2 text-base">
                <Palette className="w-5 h-5 text-teal-700" />
                <span>اختيار إطار الصفحة الأكاديمي</span>
              </label>

              <select
                id="borderId-select"
                name="borderId"
                value={formData.borderId || 'none'}
                onChange={(e) => handleBorderSelect(e.target.value)}
                className="input-field font-amiri font-bold text-base text-slate-900 bg-slate-50 border-slate-300 focus:bg-white cursor-pointer py-2.5 px-3 w-full"
              >
                {BORDERS_LIST.map((b) => (
                  <option key={b.borderId} value={b.borderId}>
                    {b.nameAr}
                  </option>
                ))}
              </select>

              <p className="text-xs text-slate-500 font-amiri">
                * الإطار المحدد يُطبق فوراً على المعاينة الحية لصفحات البحث ومخرجات الطباعة.
              </p>
            </div>

            <div>
              <FontSelector
                value={formData.fontFamily || 'default'}
                onChange={handleFontSelect}
              />
            </div>
          </div>
        </div>

        {/* Cover Data Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-900 font-cairo border-b border-slate-100 pb-3">
            بيانات صفحة الغلاف الأكاديمي (الخط القياسي: 20pt Amiri)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">الدولة</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="أدخل اسم الدولة..."
                required
              />
            </div>

            <div>
              <label className="form-label">اسم الجامعة</label>
              <input
                type="text"
                name="university"
                value={formData.university}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="أدخل اسم الجامعة..."
                required
              />
            </div>

            <div>
              <label className="form-label">اسم الكلية</label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className="input-field"
                placeholder="أدخل اسم الكلية..."
                required
              />
            </div>

            <div>
              <label className="form-label">المادة / المقرر</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="input-field"
                placeholder="أدخل اسم المادة أو المقرر..."
                required
              />
            </div>
          </div>

          {/* University Logo Upload Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="form-label font-bold text-slate-800 flex items-center gap-1.5 mb-0">
                <Image className="w-4 h-4 text-teal-700" />
                <span>شعار الجامعة {isCustomLogo(formData.logoUrl) ? '(شعار مخصص)' : '(الشعار الافتراضي)'}</span>
              </label>
              {isCustomLogo(formData.logoUrl) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-bold font-cairo transition-colors"
                  title="استعادة الشعار الافتراضي للجامعة"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>استعادة الشعار الافتراضي</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-white border border-slate-300 rounded-lg p-1 flex items-center justify-center overflow-hidden shadow-xs">
                <img
                  src={resolveLogoUrl(formData.logoUrl)}
                  alt="شعار الجامعة"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = DEFAULT_LOGO_URL;
                  }}
                />
              </div>

              <div className="flex-1 space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/svg+xml"
                  onChange={handleLogoFileChange}
                  className="hidden"
                  id="university-logo-file"
                />
                <label
                  htmlFor="university-logo-file"
                  className="btn btn-secondary cursor-pointer inline-flex items-center gap-2 text-xs py-1.5 px-3"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isCustomLogo(formData.logoUrl) ? 'استبدال الشعار المخصص' : 'استبدال الشعار الافتراضي (PNG, JPG, SVG)'}</span>
                </label>
                <p className="text-[11px] text-slate-500 font-amiri">
                  {isCustomLogo(formData.logoUrl)
                    ? 'تم تعيين شعار مخصص لهذا البحث. يظهر في المعاينة ومستندات الطباعة A4 و PDF و Word.'
                    : 'يستخدم البحث حالياً شعار الجامعة الافتراضي. يمكنك رفع شعار مخصص لاستبداله في أي وقت.'}
                </p>
              </div>
            </div>
          </div>

          {/* Research Title & Highlight Color */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="form-label font-bold text-teal-950">عنوان البحث الأكاديمي (20pt)</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input-field font-bold text-base border-teal-600 focus:border-teal-700 text-teal-900"
                placeholder="أدخل عنوان البحث الأكاديمي..."
                required
              />
            </div>

            <div className="sm:col-span-4">
              <label className="form-label">لون شريط العنوان</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="badgeColor"
                  value={formData.badgeColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5"
                />
                <input
                  type="text"
                  name="badgeColor"
                  value={formData.badgeColor}
                  onChange={handleChange}
                  className="input-field uppercase font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Authorship and Academic Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">إعداد الطالب / الباحث</label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="أدخل اسم الطالب أو الباحث..."
                required
              />
            </div>

            <div>
              <label className="form-label">المستوى الأكاديمي</label>
              <input
                type="text"
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="مثال: المستوى الثاني / الماجستير..."
                required
              />
            </div>

            <div>
              <label className="form-label">إشراف الدكتور / المشرف العلمي</label>
              <input
                type="text"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="أدخل اسم المشرف العلمي..."
                required
              />
            </div>

            <div>
              <label className="form-label">الفصل الدراسي (اختياري)</label>
              <input
                type="text"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="مثال: الفصل الدراسي الثاني..."
              />
            </div>

            <div>
              <label className="form-label">العام الدراسي الهجري</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="مثال: 1447–1448هـ..."
                required
              />
            </div>

            <div>
              <label className="form-label">الموافق الميلادي</label>
              <input
                type="text"
                name="gregorianYear"
                value={formData.gregorianYear}
                onChange={handleChange}
                className="input-field font-semibold"
                placeholder="مثال: 2025–2026م..."
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-8 py-3 text-base shadow-md shadow-teal-700/20"
            >
              <span>{saving ? 'جاري الحفظ...' : 'حفظ ومتابعة للمقدمة'}</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* ═══════ A4 DOCUMENT PREVIEW (BOTTOM) ═══════ */}
      <div className="w-full space-y-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 font-cairo flex items-center gap-1.5">
              <Move className="w-4 h-4 text-teal-700" />
              <span>لوحة تصميم الغلاف (A4 Canvas)</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetCoverLayout}
            className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 text-slate-700 hover:text-teal-800 border-slate-300 font-cairo"
            title="إعادة موضع وحجم العناصر إلى التوزيع الأكاديمي الافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط الغلاف</span>
          </button>
        </div>

        <div className="max-w-4xl mx-auto mb-2.5 px-3 py-1.5 bg-teal-50/80 border border-teal-200/80 rounded-lg text-[11px] text-teal-900 font-amiri flex items-center justify-between">
          <span>💡 انقر على أي عنصر واسحبه بحرية لتغيير موضعه، أو اسحب زوايا الشعار لتكبيره.</span>
          <span className="badge badge-success text-[10px] font-bold py-0.5">تعديل مباشر</span>
        </div>

        <A4ScaleWrapper>
          <A4Page
            page={liveCoverPage}
            borderSvg={activeBorderObj?.svgPattern}
            borderId={formData.borderId}
            fontFamily={formData.fontFamily}
          />
        </A4ScaleWrapper>
      </div>
    </div>
  );
};

export default Step1Cover;
