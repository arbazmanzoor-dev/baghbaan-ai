import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { shadows, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const TAB_ICONS: Record<string, IconName> = {
  home: 'home',
  history: 'history',
  library: 'menu-book',
  settings: 'settings',
};
const TAB_LABEL_KEYS: Record<string, string> = {
  home: 'tabs.home',
  history: 'tabs.history',
  library: 'tabs.library',
  settings: 'tabs.settings',
};

/**
 * Bottom navigation from the design: 68 px bar, five destinations, raised 56 px Scan button
 * in the centre (it opens the camera rather than switching tab).
 */
export function TabBar({ state, navigateToTab, insets }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const half = Math.ceil(state.routes.length / 2);

  const renderTab = (route: (typeof state.routes)[number], index: number) => {
    const focused = state.index === index;
    const color = focused ? colors.primary : colors.onSurfaceVariant;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t(TAB_LABEL_KEYS[route.name])}
        onPress={() => {
          if (!focused) {
            Haptics.selectionAsync().catch(() => undefined);
            navigateToTab(route.key);
          }
        }}
        style={styles.tab}
      >
        <View style={[styles.indicator, { backgroundColor: focused ? colors.secondary : 'transparent' }]} />
        <Icon name={TAB_ICONS[route.name]} color={color} />
        <AppText variant="labelSm" color={color} weight={focused ? 700 : 500} align="center" numberOfLines={1}>
          {t(TAB_LABEL_KEYS[route.name])}
        </AppText>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.surface, paddingBottom: insets.bottom, borderTopColor: colors.cardBorder },
      ]}
    >
      <View style={styles.row}>
        {state.routes.slice(0, half).map((r, i) => renderTab(r, i))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.scan')}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
            router.push('/camera');
          }}
          style={styles.scanSlot}
        >
          {({ pressed }) => (
            <>
              <View
                style={[
                  styles.scanButton,
                  shadows.shutter,
                  {
                    backgroundColor: colors.primaryContainer,
                    borderColor: colors.surface,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                  },
                ]}
              >
                <Icon name="photo-camera" size={28} color="#ffffff" />
              </View>
              <AppText variant="labelSm" color={colors.primary} weight={600} align="center" numberOfLines={1}>
                {t('tabs.scan')}
              </AppText>
            </>
          )}
        </Pressable>
        {state.routes.slice(half).map((r, i) => renderTab(r, i + half))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  indicator: { width: 4, height: 4, borderRadius: 2, marginBottom: 2 },
  scanSlot: { flex: 1, alignItems: 'center', marginTop: -28, gap: 2 },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
