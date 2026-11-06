import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { LANGUAGE_META, type Language } from '@/i18n/languages';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon } from './Icon';

type Props = { language: Language; selected: boolean; onSelect: (lang: Language) => void };

/** Language card from the onboarding design: badge, native name, description, check mark. */
export function LanguageOption({ language, selected, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const meta = LANGUAGE_META[language];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={meta.nativeName}
      onPress={() => {
        Haptics.selectionAsync().catch(() => undefined);
        onSelect(language);
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? colors.surfaceContainerLowest : colors.surfaceContainer,
          borderColor: selected ? colors.primary : 'transparent',
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
        selected && shadows.card,
      ]}
    >
      <View
        style={[
          styles.badge,
          { backgroundColor: selected ? colors.primaryFixed : colors.surfaceContainerHigh },
        ]}
      >
        <AppText variant="labelLg" script={language} color={colors.primary} align="center">
          {meta.badge}
        </AppText>
      </View>
      <View style={styles.text}>
        <AppText variant="titleMd" script={language}>
          {meta.nativeName}
        </AppText>
        <AppText variant="labelSm" script={language} color={colors.onSurfaceVariant} numberOfLines={1}>
          {t(`language.${language}`)}
        </AppText>
      </View>
      <View
        style={[
          styles.check,
          { backgroundColor: selected ? colors.primaryContainer : 'transparent', borderColor: colors.outlineVariant },
          selected && { borderColor: colors.primaryContainer },
        ]}
      >
        {selected && <Icon name="check" size={18} color="#ffffff" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, minWidth: 0 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
