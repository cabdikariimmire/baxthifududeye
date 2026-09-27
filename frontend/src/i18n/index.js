import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslations from './locales/ar.json';
import soTranslations from './locales/so.json';
import enTranslations from './locales/en.json';

const LANGUAGE_KEY = 'app_language';
const initialLang = localStorage.getItem(LANGUAGE_KEY) || 'ar';

// Ensure HTML attributes match language direction immediately
const updateDocumentDirection = (lang) => {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  document.body.dir = dir;
};

updateDocumentDirection(initialLang);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslations },
      so: { translation: soTranslations },
      en: { translation: enTranslations }
    },
    lng: initialLang,
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
  updateDocumentDirection(lng);
});

export const setAppLanguage = (lang) => {
  if (['ar', 'so', 'en'].includes(lang)) {
    i18n.changeLanguage(lang);
  }
};

export default i18n;
