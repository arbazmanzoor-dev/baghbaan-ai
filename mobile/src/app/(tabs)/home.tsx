import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { initials } from '@/components/AccountCard';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ExpertNote } from '@/components/ExpertNote';
import { Icon, type IconName } from '@/components/Icon';
import { LeafMark } from '@/components/Logo';
import { ScanListItem } from '@/components/ScanListItem';
import { Screen } from '@/components/Screen';
import { useOnline } from '@/hooks/useOnline';
import { LANGUAGE_META, LANGUAGES } from '@/i18n/languages';
import { useGalleryPicker } from '@/scan/pickImage';
import { useAuth } from '@/state/auth';
import { useScans } from '@/state/scans';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing, touch } from '@/theme/tokens';

const RECENT_COUNT = 3;

function LanguagePill() {
  const { colors } = useTheme();
  const { language, update } = useSettings();
  const next = LANGUAGES[(LANGUAGES.indexOf(language) + 1) % LANGUAGES.length];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={LANGUAGE_META[next].nativeName}
      onPress={() => update({ language: next })}
      style={[styles.langPill, { backgroundColor: colors.surfaceContainer }]}
    >
      <Icon name="translate" size={18} color={colors.primary} />
      <AppText variant="labelMd" script={language} color={colors.primary}>
        {LANGUAGE_META[language].badge}
      </AppText>
    </Pressable>
  );
}

/** Signed in: initials (opens Settings). Signed out: person icon (opens Sign in). */
function ProfileButton() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auth = useAuth();
  const signedIn = auth.status === 'signedIn';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={signedIn ? t('auth.profile') : t('auth.signIn')}
      onPress={() => router.push(signedIn ? '/settings' : '/sign-in')}
      style={[styles.profile, { backgroundColor: signedIn ? colors.primaryContainer : colors.surfaceContainer }]}
    >
      {signedIn ? (
        <AppText variant="labelLg" script="en" color="#ffffff" align="center">
          {initials(auth.user.name)}
        </AppText>
      ) : (
        <Icon name="person-outline" color={colors.primary} />
      )}
    </Pressable>
  );
}

function Tip({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tip}>
      <View style={[styles.tipIcon, { backgroundColor: colors.surfaceContainer }]}>
        <Icon name={icon} size={18} color={colors.secondary} />
      </View>
      <AppText variant="bodyMdMedium" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const online = useOnline();
  const { scans } = useScans();
  const tips = t('onboarding.step1.tips', { returnObjects: true }) as string[];

  const gallery = useGalleryPicker();

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <LeafMark size={32} />
          <View>
            <AppText variant="headlineSm" script="en" color={colors.primary}>
              BaghBaan AI
            </AppText>
            <AppText variant="labelSm" color={colors.onSurfaceVariant}>
              {t('common.tagline')}
            </AppText>
          </View>
        </View>
        <View style={styles.headerActions}>
          <LanguagePill />
          <ProfileButton />
        </View>
      </View>

      <Animated.View entering={FadeInDown.duration(400)}>
        <Card tone="muted">
          <View style={styles.statusRow}>
            <View
              style={[
                styles.netChip,
                { backgroundColor: online ? colors.secondaryFixed : colors.status.warning.background },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: online ? colors.secondary : colors.status.warning.accent }]} />
              <AppText
                variant="labelSm"
                weight={700}
                color={online ? colors.onSecondaryFixedVariant : colors.status.warning.text}
              >
                {online ? t('home.online') : t('home.offline')}
              </AppText>
            </View>
          </View>
          <AppText variant="headlineLg" accessibilityRole="header">
            {t('home.greeting')}
          </AppText>
          <AppText color={colors.onSurfaceVariant}>{t('home.intro')}</AppText>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.scanCta')}
          onPress={() => router.push('/camera')}
          style={({ pressed }) => [
            styles.scanCta,
            shadows.raised,
            { backgroundColor: pressed ? colors.primary : colors.primaryContainer },
          ]}
        >
          <View style={[styles.scanIcon, { backgroundColor: colors.primary }]}>
            <Icon name="photo-camera" size={28} color="#ffffff" />
          </View>
          <View style={styles.flex}>
            <AppText variant="headlineSm" color="#ffffff">
              {t('home.scanCta')}
            </AppText>
            <AppText variant="labelSm" color={colors.onPrimaryContainer}>
              {t('home.scanSub')}
            </AppText>
          </View>
          <Icon name="arrow-forward" color="#ffffff" directional />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: gallery.picking }}
          disabled={gallery.picking}
          onPress={gallery.pick}
          style={({ pressed }) => [
            styles.galleryCta,
            shadows.card,
            { backgroundColor: pressed ? colors.surfaceContainer : colors.surfaceContainerLowest },
          ]}
        >
          {gallery.picking ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Icon name="add-photo-alternate" color={colors.primary} />
          )}
          <AppText variant="labelLg" color={colors.primary}>
            {t('home.gallery')}
          </AppText>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)}>
        <ExpertNote title={t('home.expertTitle')} />
      </Animated.View>

      <Card tone="muted">
        <View style={styles.cardTitle}>
          <Icon name="verified" size={22} color={colors.primary} />
          <AppText variant="titleMd">{t('home.tipsTitle')}</AppText>
        </View>
        <Tip icon="light-mode" text={tips[0]} />
        <Tip icon="filter-center-focus" text={tips[1]} />
        <Tip icon="pan-tool" text={tips[2]} />
      </Card>

      <View style={styles.recentHeader}>
        <AppText variant="titleMd">{t('home.recentTitle')}</AppText>
        {scans.length > 0 && (
          <Pressable accessibilityRole="link" onPress={() => router.push('/history')} style={styles.seeAll}>
            <AppText variant="labelMd" color={colors.primary}>
              {t('home.seeAll')}
            </AppText>
            <Icon name="chevron-right" size={18} color={colors.primary} directional />
          </Pressable>
        )}
      </View>
      {scans.length === 0 ? (
        <Card tone="muted" style={styles.empty}>
          <Icon name="eco" size={32} color={colors.outline} />
          <AppText color={colors.onSurfaceVariant} align="center">
            {t('home.emptyRecent')}
          </AppText>
        </Card>
      ) : (
        scans.slice(0, RECENT_COUNT).map((scan) => <ScanListItem key={scan.id} scan={scan} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profile: { width: touch.min, height: touch.min, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touch.min,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  statusRow: { flexDirection: 'row' },
  netChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  actions: { gap: spacing.sm },
  scanCta: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  scanIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  galleryCta: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
  },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tipIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  seeAll: { flexDirection: 'row', alignItems: 'center', minHeight: touch.min },
  empty: { alignItems: 'center', paddingVertical: spacing.lg },
});
