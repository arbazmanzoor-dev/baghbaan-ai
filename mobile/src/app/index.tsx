import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { LeafMark } from '@/components/Logo';
import { useSettings } from '@/state/settings';
import { shadows, spacing } from '@/theme/tokens';

// The splash keeps its brand palette in both light and dark mode, as in the design.
const GREEN = '#2f5d3a';
const GREEN_DEEP = '#1f4229';
const MINT = '#7efba4';
const CREAM = '#fbf9f4';
const MINT_TEXT = '#a1d4a8';
const RETURNING_USER_DELAY_MS = 1800;

function StatusPill({ icon, label }: { icon?: IconName; label: string }) {
  return (
    <View style={styles.pill}>
      {icon ? <Icon name={icon} size={16} color={MINT} /> : <View style={styles.dot} />}
      <AppText variant="labelSm" color={CREAM} weight={600}>
        {label}
      </AppText>
    </View>
  );
}

export default function Splash() {
  const router = useRouter();
  const { t } = useTranslation();
  const { onboarded } = useSettings();
  const glow = useSharedValue(0.6);
  const version = Constants.expoConfig?.version ?? '';

  const enter = () => router.replace(onboarded ? '/home' : '/onboarding');

  useEffect(() => {
    glow.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [glow]);

  // Returning users skip straight in after the brand moment; first-timers tap the CTA.
  useEffect(() => {
    if (!onboarded) return;
    const timer = setTimeout(() => router.replace('/home'), RETURNING_USER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onboarded, router]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.5,
    transform: [{ scale: 1.1 + glow.value * 0.2 }],
  }));

  return (
    <LinearGradient colors={[GREEN, GREEN_DEEP]} style={styles.root}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.topRow}>
          <StatusPill label={t('splash.offlineReady')} />
          <StatusPill icon="sensors" label={t('splash.onDeviceAi')} />
        </Animated.View>

        <View style={styles.center}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.badgeWrap}>
            <Animated.View style={[styles.glow, glowStyle]} />
            <View style={[styles.badge, shadows.raised]}>
              <View style={styles.badgeInner}>
                <LeafMark size={60} />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.titles}>
            <AppText
              variant="displayLg"
              script="en"
              color={CREAM}
              align="center"
              accessibilityRole="header"
              style={styles.title}
            >
              BaghBaan <AppText variant="displayLg" script="en" color={MINT} style={styles.title}>AI</AppText>
            </AppText>
            <AppText variant="headlineSm" script="ur" color={CREAM} align="center">
              باغبان اے آئی
            </AppText>
            <AppText variant="titleMd" color={MINT_TEXT} align="center" weight={500}>
              {t('common.tagline')}
            </AppText>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.cta}>
            <Button variant="inverse" label={t('splash.enter')} icon="eco" trailingIcon="arrow-forward" onPress={enter} />
          </Animated.View>
        </View>

        <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.footer}>
          <View style={styles.divider} />
          <AppText variant="labelSm" color="#e4e2dd" align="center">
            {t('splash.developedFor')}
          </AppText>
          <AppText variant="labelSm" color={MINT_TEXT} align="center">
            {t('splash.version', { version })}
          </AppText>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(187, 239, 193, 0.08)' },
  blobTop: { width: 320, height: 320, top: -100, left: -90 },
  blobBottom: { width: 380, height: 380, bottom: -130, right: -110 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: MINT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  badgeWrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 112, height: 112, borderRadius: 56, backgroundColor: 'rgba(187, 239, 193, 0.35)' },
  badge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#ffffff',
    padding: 12,
  },
  badgeInner: { flex: 1, borderRadius: 44, backgroundColor: '#f5f3ee', alignItems: 'center', justifyContent: 'center' },
  titles: { alignItems: 'center', gap: spacing.xs },
  title: { letterSpacing: -0.6 },
  cta: { alignSelf: 'stretch', paddingHorizontal: spacing.lg },
  footer: { gap: spacing.xs, alignItems: 'center' },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(251, 249, 244, 0.35)',
  },
});
