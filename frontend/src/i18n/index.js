import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

export const SUPPORTED_LANGUAGES = ['fr', 'en'];

const VISITOR_LANGUAGE_KEY = 'nestmates.language';

export function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

export function detectBrowserLanguage() {
  const browserLanguage = typeof navigator === 'undefined' ? '' : navigator.language;
  return browserLanguage?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function readVisitorLanguage() {
  try {
    const stored = window.localStorage.getItem(VISITOR_LANGUAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

/** Language used before login: the visitor's FR / EN choice, otherwise the browser language. */
export function getVisitorLanguage() {
  return readVisitorLanguage() ?? detectBrowserLanguage();
}

export function setVisitorLanguage(language) {
  if (!isSupportedLanguage(language)) return;
  try {
    window.localStorage.setItem(VISITOR_LANGUAGE_KEY, language);
  } catch {
    // Storage can be unavailable (private mode); the switch still applies to this session.
  }
  i18n.changeLanguage(language);
}

export function applyLanguage(language) {
  if (isSupportedLanguage(language) && i18n.language !== language) {
    i18n.changeLanguage(language);
  }
}

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: getVisitorLanguage(),
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
});

document.documentElement.lang = i18n.language;

export default i18n;
