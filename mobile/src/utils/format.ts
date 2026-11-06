import type { Language } from '@/i18n/languages';

// Kashmir convention: Hindi/Urdu text with Western digits keeps numbers easy to read in the field.
const LOCALES: Record<Language, string> = { en: 'en-IN', hi: 'hi-IN', ur: 'ur-IN' };

export const formatPercent = (value: number, lang: Language) =>
  new Intl.NumberFormat(LOCALES[lang], {
    style: 'percent',
    maximumFractionDigits: 1,
    numberingSystem: 'latn',
  } as Intl.NumberFormatOptions).format(value);

export const formatDateTime = (iso: string, lang: Language) =>
  new Intl.DateTimeFormat(LOCALES[lang], {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    numberingSystem: 'latn',
  } as Intl.DateTimeFormatOptions).format(new Date(iso));
