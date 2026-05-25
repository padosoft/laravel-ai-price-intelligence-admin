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

// Keep <html lang> in sync with the active locale (initial + on every switch) so assistive
// tech and the browser announce content in the correct language.
function syncDocumentLang(lng: string): void {
  // Mirror the init rule: only 'en' is English; everything else resolves to Italian.
  if (typeof document !== 'undefined') document.documentElement.lang = lng === 'en' ? 'en' : 'it';
}
syncDocumentLang(i18n.language);
i18n.on('languageChanged', syncDocumentLang);

export default i18n;
