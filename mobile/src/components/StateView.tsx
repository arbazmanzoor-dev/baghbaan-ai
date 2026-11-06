import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing, type StatusTone } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  body?: string;
  tone?: StatusTone | 'neutral';
  actions?: ReactNode;
};

/** Empty, offline and error states: large icon badge, title, explanation, actions. */
export function StateView({ icon, title, body, tone = 'neutral', actions }: Props) {
  const { colors } = useTheme();
  const badge = tone === 'neutral' ? colors.primaryFixed : colors.status[tone].background;
  const fg = tone === 'neutral' ? colors.primary : colors.status[tone].text;
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.root} accessibilityLiveRegion="polite">
      <View style={[styles.badge, { backgroundColor: badge }]}>
        <Icon name={icon} size={40} color={fg} />
      </View>
      <AppText variant="headlineSm" align="center" accessibilityRole="header">
        {title}
      </AppText>
      {body && (
        <AppText align="center" color={colors.onSurfaceVariant}>
          {body}
        </AppText>
      )}
      {actions && <View style={styles.actions}>{actions}</View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  badge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },
});
