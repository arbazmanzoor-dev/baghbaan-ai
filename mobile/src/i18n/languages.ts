import { getLocales } from 'expo-localization';

export const LANGUAGES = ['en', 'hi', 'ur'] as const;
export type Language = (typeof LANGUAGES)[number];

export const RTL_LANGUAGES: readonly Language[] = ['ur'];

export const isRTL = (lang: Language) => RTL_LANGUAGES.includes(lang);

/** Native names, shown in the language picker regardless of the current UI language. */
export const LANGUAGE_META: Record<Language, { nativeName: string; badge: string }> = {
  en: { nativeName: 'English', badge: 'EN' },
  hi: { nativeName: 'हिंदी', badge: 'हिं' },
  ur: { nativeName: 'اردو', badge: 'اردو' },
};

/** First supported device language, else English. */
export function deviceLanguage(): Language {
  for (const locale of getLocales()) {
    const code = locale.languageCode as Language | null;
    if (code && LANGUAGES.includes(code)) return code;
  }
  return 'en';
}
