import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, type StatusTone } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const ICONS: Record<StatusTone, IconName> = { healthy: 'check-circle', disease: 'warning', warning: 'help' };

/** Pill badge from DESIGN.md: healthy (green), disease (red), low confidence (amber). */
export function StatusChip({ tone, label, compact }: { tone: StatusTone; label: string; compact?: boolean }) {
  const { colors } = useTheme();
  const c = colors.status[tone];
  return (
    <View
      style={[
        styles.chip,
        compact && styles.compact,
        { backgroundColor: c.background, borderColor: c.border },
      ]}
    >
      <Icon name={ICONS[tone]} size={compact ? 14 : 18} color={c.text} />
      <AppText variant={compact ? 'labelSm' : 'labelMd'} color={c.text} weight={700}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  compact: { minHeight: 24, paddingHorizontal: spacing.sm },
});
