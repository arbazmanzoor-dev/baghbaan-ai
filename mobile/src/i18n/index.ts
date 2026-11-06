import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import hi from './locales/hi';
import ur from './locales/ur';

const i18n = createInstance();

// Resources are bundled (offline-first); the active language is set from saved settings.
i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi }, ur: { translation: ur } },
  lng: 'en',
  fallbackLng: 'en',
  returnObjects: true,
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
