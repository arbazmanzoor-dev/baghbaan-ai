import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';

type Props = PropsWithChildren<{ tone?: 'card' | 'muted'; style?: StyleProp<ViewStyle> }>;

/** Design card: white with hairline border and ambient shadow, or a muted sand well. */
export function Card({ tone = 'card', style, children }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        tone === 'card'
          ? [{ backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder }, shadows.card]
          : { backgroundColor: colors.surfaceContainerLow, borderColor: 'transparent' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
});
