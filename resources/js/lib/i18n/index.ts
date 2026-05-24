import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { runtimeConfig } from '@/config';
import { en } from './locales/en';
import { it } from './locales/it';

// IT default, EN fallback (TEMPLATE §7). Numbers/dates use Intl with the active locale.
void i18n.use(initReactI18next).init({
  resources: {
    it: { common: it },
    en: { common: en },
  },
  lng: runtimeConfig.locale === 'en' ? 'en' : 'it',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
