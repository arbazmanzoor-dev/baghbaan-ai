import { Platform, Text, type TextProps } from 'react-native';

import { isRTL as isRTLScript, type Language } from '@/i18n/languages';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFor, LINE_HEIGHT_FACTOR } from '@/theme/fonts';
import { typeScale, type TypeVariant } from '@/theme/tokens';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: string;
  /** Font weight override (fonts are per-weight files, so this picks the file). */
  weight?: 400 | 500 | 600 | 700;
  /** Script of the text when it differs from the UI language (e.g. "हिंदी" in an English UI). */
  script?: Language;
  align?: 'start' | 'center' | 'end';
};

/**
 * All app text goes through here: it picks the design type scale, the right font for the
 * script, and aligns to the reading direction (RN's textAlign has no start/end values).
 */
export function AppText({
  variant = 'bodyMd',
  color,
  weight,
  script,
  align = 'start',
  style,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const { language, isRTL } = useSettings();
  const t = typeScale[variant];
  const textScript = script ?? language;
  // Native swaps left/right inside an RTL layout, so 'left' already means "start" there;
  // react-native-web does not swap, so flip it ourselves.
  const flip = isRTL && Platform.OS === 'web';
  const textAlign =
    align === 'center' ? 'center' : (align === 'start') !== flip ? 'left' : 'right';

  return (
    <Text
      maxFontSizeMultiplier={1.6}
      style={[
        {
          fontFamily: fontFor(textScript, t.role, weight ?? t.weight),
          fontSize: t.size,
          lineHeight: Math.round(t.lineHeight * LINE_HEIGHT_FACTOR[textScript]),
          letterSpacing: textScript === 'en' ? t.letterSpacing : 0,
          color: color ?? colors.onSurface,
          textAlign,
          // Latin text inside an Urdu UI keeps LTR shaping/truncation; alignment follows the UI.
          writingDirection: isRTLScript(textScript) ? 'rtl' : 'ltr',
        },
        style,
      ]}
      {...rest}
    />
  );
}
