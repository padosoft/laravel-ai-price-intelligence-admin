import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { runtimeConfig } from '@/config';
import { en } from './locales/en';
import { it } from './locales/it';

// Active locale comes from the host-injected runtimeConfig.locale (en* → English, else
// Italian); EN is the fallback. Numbers/dates use Intl with the active locale.
void i18n.use(initReactI18next).init({
  resources: {
    it: { common: it },
    en: { common: en },
  },
  lng: runtimeConfig.locale.startsWith('en') ? 'en' : 'it',
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

// Keep <html lang> in sync with the active locale (initial + on every switch) so assistive
// tech and the browser announce content in the correct language.
function syncDocumentLang(lng: string): void {
  // Mirror the init rule: any en* locale is English; everything else resolves to Italian.
  if (typeof document !== 'undefined') document.documentElement.lang = lng.startsWith('en') ? 'en' : 'it';
}
syncDocumentLang(i18n.language);
i18n.on('languageChanged', syncDocumentLang);

export default i18n;
