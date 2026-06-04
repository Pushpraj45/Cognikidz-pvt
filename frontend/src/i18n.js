import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Lazy load all JSONs under locales at build-time via webpack context (CRA compatible)
const resources = {};
function importAll(r) {
  r.keys().forEach(key => {
    // key like './en/common.json'
    const parts = key.split('/');
    const lang = parts[1];
    const file = parts[2];
    if (!lang || !file) return;
    const ns = file.replace('.json', '');
    resources[lang] = resources[lang] || {};
    resources[lang][ns] = r(key);
  });
}

try {
  importAll(require.context('./locales', true, /\.json$/));
} catch (e) {
  // Fallback: no locales yet
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [
      'ar',
      'bn',
      'de',
      'en',
      'es',
      'fr',
      'gu',
      'hi',
      'it',
      'ja',
      'kn',
      'ko',
      'ml',
      'mr',
      'pa',
      'pt',
      'ru',
      'ta',
      'te',
      'th',
      'tr',
      'ur',
      'vi',
      'zh',
    ],
    ns: [
      'common',
      'pricing',
      'assessment',
      'dashboard',
      'support',
      'hero',
      'assessmentTools',
      'howItWorks',
      'progressTracking',
      'cta',
      'features',
    ],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
      lookupLocalStorage: 'cognikidz_language',
    },
    returnEmptyString: false,
  });

export default i18n;
