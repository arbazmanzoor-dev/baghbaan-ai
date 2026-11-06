/**
 * Font assets and per-script font selection. Plus Jakarta Sans and Inter (from the design) have
 * no Devanagari or Arabic glyphs, so Hindi uses Noto Sans Devanagari and Urdu Noto Naskh Arabic.
 * Naskh is chosen over Nastaliq: it stays legible at small sizes and does not need extreme
 * line heights.
 */
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { NotoNaskhArabic_400Regular } from '@expo-google-fonts/noto-naskh-arabic/400Regular';
import { NotoNaskhArabic_500Medium } from '@expo-google-fonts/noto-naskh-arabic/500Medium';
import { NotoNaskhArabic_600SemiBold } from '@expo-google-fonts/noto-naskh-arabic/600SemiBold';
import { NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic/700Bold';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansDevanagari_500Medium } from '@expo-google-fonts/noto-sans-devanagari/500Medium';
import { NotoSansDevanagari_600SemiBold } from '@expo-google-fonts/noto-sans-devanagari/600SemiBold';
import { NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari/700Bold';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';

import type { Language } from '@/i18n/languages';

export const fontAssets = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
  NotoNaskhArabic_400Regular,
  NotoNaskhArabic_500Medium,
  NotoNaskhArabic_600SemiBold,
  NotoNaskhArabic_700Bold,
};

type FontName = keyof typeof fontAssets;
type Weight = 400 | 500 | 600 | 700;

const BODY: Record<Language, Record<Weight, FontName>> = {
  en: { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold' },
  hi: {
    400: 'NotoSansDevanagari_400Regular',
    500: 'NotoSansDevanagari_500Medium',
    600: 'NotoSansDevanagari_600SemiBold',
    700: 'NotoSansDevanagari_700Bold',
  },
  ur: {
    400: 'NotoNaskhArabic_400Regular',
    500: 'NotoNaskhArabic_500Medium',
    600: 'NotoNaskhArabic_600SemiBold',
    700: 'NotoNaskhArabic_700Bold',
  },
};

/** Devanagari matras and Naskh descenders need taller lines than Latin text. */
export const LINE_HEIGHT_FACTOR: Record<Language, number> = { en: 1, hi: 1.2, ur: 1.3 };

export function fontFor(script: Language, role: 'heading' | 'body', weight: Weight): FontName {
  if (script === 'en' && role === 'heading') {
    return weight >= 700 ? 'PlusJakartaSans_700Bold' : 'PlusJakartaSans_600SemiBold';
  }
  return BODY[script][weight];
}
