import React from 'react';
import { Type } from 'lucide-react';
import { RESEARCH_FONTS, DEFAULT_FONT_ID } from '../../utils/researchFonts';

/**
 * Clean Academic Research Font Selector
 * Allows selection of one of the four supported academic fonts:
 * 1. الخط الافتراضي للموقع (Amiri)
 * 2. Times New Roman
 * 3. Arial
 * 4. Simplified Arabic
 * 
 * Applies from 'المقدمة والخطة' onward and strictly excludes the Cover.
 */
const FontSelector = ({
  value = DEFAULT_FONT_ID,
  onChange,
  className = '',
  disabled = false,
  showDescription = true
}) => {
  const currentFontId = value || DEFAULT_FONT_ID;

  return (
    <div className={`space-y-2.5 ${className}`} dir="rtl">
      <label
        htmlFor="research-font-select"
        className="form-label font-bold text-slate-800 flex items-center gap-2 text-base"
      >
        <Type className="w-5 h-5 text-teal-700" />
        <span>نوع خط متن البحث الأكاديمي</span>
      </label>

      <select
        id="research-font-select"
        name="fontFamily"
        value={currentFontId}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="input-field font-bold text-base text-slate-900 bg-slate-50 border-slate-300 focus:bg-white cursor-pointer py-2.5 px-3 w-full transition-all"
        style={{ direction: 'rtl' }}
      >
        {RESEARCH_FONTS.map((font) => (
          <option key={font.id} value={font.id}>
            {font.name} {font.isDefault ? '(الافتراضي)' : ''}
          </option>
        ))}
      </select>

      {showDescription && (
        <p className="text-xs text-slate-500 font-amiri leading-relaxed">
          * يبدأ تطبيق نوع الخط المختار من <span className="font-bold text-slate-700">المقدمة والخطة</span> مروراً بكافة فصول ومطالب البحث والخاتمة والمصادر والفهرس، مع الإبقاء على تصميم صفحة الغلاف دون أي تغيير.
        </p>
      )}
    </div>
  );
};

export default FontSelector;
