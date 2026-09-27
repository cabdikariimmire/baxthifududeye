import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { defaultCMS } from '../services/cmsDefaults';

/**
 * Universal locale resolution helper
 * Fallback order: Selected Language -> Arabic ('ar') -> English ('en') -> Somali ('so') -> First available string
 *
 * @param {string|object} field - Multi-language field { ar, so, en } or legacy string
 * @param {string} lang - Active language code ('ar', 'so', 'en')
 * @returns {string} - Resolved localized string
 */
export const resolveLocale = (field, lang = 'ar') => {
  if (field === null || field === undefined) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'number') return String(field);
  if (typeof field === 'object') {
    if (field[lang] !== undefined && field[lang] !== null && String(field[lang]).trim() !== '') {
      return field[lang];
    }
    if (field.ar !== undefined && field.ar !== null && String(field.ar).trim() !== '') {
      return field.ar;
    }
    if (field.en !== undefined && field.en !== null && String(field.en).trim() !== '') {
      return field.en;
    }
    if (field.so !== undefined && field.so !== null && String(field.so).trim() !== '') {
      return field.so;
    }
    const firstVal = Object.values(field).find(v => typeof v === 'string' && v.trim() !== '');
    return firstVal || '';
  }
  return String(field);
};

/**
 * Custom React hook to fetch published CMS page content
 * Features instant zero-layout-shift default rendering + dynamic live synchronization
 *
 * @param {string} slug - Page slug ('home', 'features', 'how-it-works', 'about', 'video', 'navigation', 'footer', 'seo')
 * @returns {{ content: object, loading: boolean, error: string|null, refresh: Function, tField: Function }}
 */
export const useCMSContent = (slug) => {
  const { i18n } = useTranslation();
  const currentLang = i18n?.language || 'ar';
  const fallback = defaultCMS[slug] || {};
  const [content, setContent] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/public/cms/${slug}`);
      if (res.data?.success && res.data.data?.content) {
        setContent({
          ...fallback,
          ...res.data.data.content
        });
        setError(null);
      }
    } catch (err) {
      // Graceful fallback to default values
      console.warn(`[CMS] Using local default fallback for "${slug}":`, err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Helper function bound to current language
  const tField = useCallback((field) => resolveLocale(field, currentLang), [currentLang]);

  return {
    content,
    loading,
    error,
    refresh: fetchContent,
    tField,
    lang: currentLang
  };
};

/**
 * Custom React hook to fetch general Site Settings & Branding
 */
export const useSiteSettings = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n?.language || 'ar';

  const defaultSettings = {
    siteName: { ar: 'مساعد البحث الأكاديمي', so: 'Kaaliyaha Cilmi-baarista', en: 'Academic Research Assistant' },
    siteTagline: { ar: 'من الفكرة إلى البحث المتكامل', so: 'Laga bilaabo Fikirka ilaa Cilmi-baaris Dhameystiran', en: 'From Concept to Completed Thesis' },
    primaryColor: '#0F8F83',
    secondaryColor: '#102A43',
    contactEmail: 'info@baxthi.com',
    contactPhone: '+966 50 000 0000',
    allowRegistrations: true,
    maintenanceMode: false
  };

  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/public/settings');
      if (res.data?.success && res.data.data?.settings) {
        setSettings({
          ...defaultSettings,
          ...res.data.data.settings
        });
      }
    } catch (err) {
      console.warn('[CMS] Using local default site settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const tField = useCallback((field) => resolveLocale(field, currentLang), [currentLang]);

  return {
    settings,
    loading,
    refresh: fetchSettings,
    tField,
    lang: currentLang
  };
};
