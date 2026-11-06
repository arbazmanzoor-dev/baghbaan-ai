import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { expertNote } from '@/content/diseases';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon } from './Icon';

/** Always-visible safety note: consult an officer / SKUAST-Kashmir expert before spraying. */
export function ExpertNote({ title }: { title?: string }) {
  const { colors } = useTheme();
  const { language } = useSettings();
  const { t } = useTranslation();
  const c = colors.status.disease;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.box, { backgroundColor: c.background, borderColor: c.border }]}
    >
      <View style={[styles.icon, { backgroundColor: c.accent }]}>
        <Icon name="support-agent" size={22} color="#ffffff" />
      </View>
      <View style={styles.text}>
        <AppText variant="labelMd" color={c.text}>
          {title ?? t('result.expertTitle')}
        </AppText>
        <AppText variant="bodyMdMedium" color={c.text}>
          {expertNote(language)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
