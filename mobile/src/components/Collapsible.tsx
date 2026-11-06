import { useState, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing, touch } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = PropsWithChildren<{ icon: IconName; title: string; initiallyOpen?: boolean }>;

/** Expandable info card (disease description, symptoms, prevention...). */
export function Collapsible({ icon, title, initiallyOpen = false, children }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View
      style={[
        styles.card,
        shadows.card,
        { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={styles.header}
      >
        <View style={[styles.icon, { backgroundColor: colors.primaryFixed }]}>
          <Icon name={icon} size={20} color={colors.primary} />
        </View>
        <AppText variant="titleMd" style={styles.flex}>
          {title}
        </AppText>
        <Icon name={open ? 'expand-less' : 'expand-more'} color={colors.onSurfaceVariant} />
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.body}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

/** Bulleted list used inside info cards. */
export function BulletList({ items }: { items: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item} style={styles.bullet}>
          <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          <AppText style={styles.flex}>{item}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, minHeight: touch.primary },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  list: { gap: spacing.sm },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 9 },
});
