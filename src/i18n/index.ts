import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import cs from './locales/cs.json';
import en from './locales/en.json';

const savedLanguage = localStorage.getItem('app-language');
const browserLanguage = navigator.language.split('-')[0];
const defaultLanguage =
  savedLanguage ?? (['cs', 'en'].includes(browserLanguage) ? browserLanguage : 'cs');

i18n.use(initReactI18next).init({
  resources: {
    cs: { translation: cs },
    en: { translation: en },
  },
  lng: defaultLanguage,
  fallbackLng: 'cs',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app-language', lng);
});

export default i18n;
