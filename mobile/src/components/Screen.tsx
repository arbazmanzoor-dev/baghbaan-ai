import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type Props = PropsWithChildren<{
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** Pinned above the scrolling content (screen headers). */
  header?: React.ReactNode;
  footer?: React.ReactNode;
}>;

/** Page shell: safe area, themed background, 16 px margins, optional pinned header/footer. */
export function Screen({
  children,
  scroll = true,
  edges = ['top', 'bottom'],
  contentStyle,
  header,
  footer,
}: Props) {
  const { colors } = useTheme();
  const content = [styles.content, contentStyle];
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      {header && <View style={styles.header}>{header}</View>}
      {scroll ? (
        <ScrollView contentContainerStyle={content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.margin, paddingBottom: spacing.lg, gap: spacing.md },
  header: { paddingHorizontal: spacing.sm },
  footer: { paddingHorizontal: spacing.margin, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm },
});
