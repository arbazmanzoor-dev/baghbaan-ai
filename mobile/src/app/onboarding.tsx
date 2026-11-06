import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { LanguageOption } from '@/components/LanguageOption';
import { LeafMark } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { LANGUAGES } from '@/i18n/languages';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing, touch } from '@/theme/tokens';

const STEPS = 3;

function Bullet({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bullet}>
      <View style={[styles.bulletIcon, { backgroundColor: colors.surfaceContainer }]}>
        <Icon name={icon} size={20} color={colors.secondary} />
      </View>
      <AppText variant="bodyMdMedium" style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

function StepOne() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tips = t('onboarding.step1.tips', { returnObjects: true }) as string[];
  return (
    <View style={[styles.card, shadows.card, { backgroundColor: colors.surfaceContainerLowest }]}>
      {/* Framing-guide illustration: the leaf inside the camera's scan frame. */}
      <View style={[styles.illustration, { backgroundColor: colors.surfaceContainerLow }]}>
        <View style={[styles.frame, { borderColor: colors.primaryContainer }]}>
          <LeafMark size={84} />
        </View>
        <View style={[styles.illustrationBadge, { backgroundColor: colors.primaryContainer }]}>
          <Icon name="photo-camera" size={22} color="#ffffff" />
        </View>
      </View>
      <AppText variant="headlineSm" accessibilityRole="header">
        {t('onboarding.step1.title')}
      </AppText>
      <AppText color={colors.onSurfaceVariant}>{t('onboarding.step1.body')}</AppText>
      <View style={styles.list}>
        <Bullet icon="light-mode" text={tips[0]} />
        <Bullet icon="filter-center-focus" text={tips[1]} />
        <Bullet icon="pan-tool" text={tips[2]} />
      </View>
    </View>
  );
}

function StepTwo() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const points = t('onboarding.step2.points', { returnObjects: true }) as string[];
  const warn = colors.status.warning;
  return (
    <View style={[styles.card, shadows.card, { backgroundColor: colors.surfaceContainerLowest }]}>
      <View style={[styles.heroIcon, { backgroundColor: colors.primaryFixed }]}>
        <Icon name="biotech" size={36} color={colors.primary} />
      </View>
      <AppText variant="headlineSm" accessibilityRole="header">
        {t('onboarding.step2.title')}
      </AppText>
      <AppText color={colors.onSurfaceVariant}>{t('onboarding.step2.body')}</AppText>
      <View style={styles.list}>
        <Bullet icon="wifi-off" text={points[0]} />
        <Bullet icon="blur-on" text={points[1]} />
        <Bullet icon="translate" text={points[2]} />
      </View>
      <View style={[styles.note, { backgroundColor: warn.background, borderColor: warn.border }]}>
        <Icon name="support-agent" color={warn.text} />
        <AppText variant="bodyMdMedium" color={warn.text} style={styles.flex}>
          {t('onboarding.step2.expert')}
        </AppText>
      </View>
    </View>
  );
}

function MiniStepCard({ n, icon, label }: { n: number; icon: IconName; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.mini, { backgroundColor: colors.surfaceContainer }]}>
      <View style={styles.miniTop}>
        <View style={[styles.miniNumber, { backgroundColor: colors.surfaceContainerHighest }]}>
          <AppText variant="labelSm" weight={700} align="center">
            {n}
          </AppText>
        </View>
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <AppText variant="labelMd" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

function StepThree() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, update } = useSettings();
  return (
    <View style={styles.stepThree}>
      <View style={styles.miniRow}>
        <MiniStepCard n={1} icon="photo-camera" label={t('onboarding.step1.label')} />
        <MiniStepCard n={2} icon="bolt" label={t('onboarding.step2.label')} />
      </View>
      <View style={[styles.card, shadows.card, { backgroundColor: colors.surfaceContainerLowest }]}>
        <View style={[styles.chip, { backgroundColor: colors.secondaryContainer }]}>
          <Icon name="translate" size={16} color={colors.onSecondaryContainer} />
          <AppText variant="labelSm" weight={600} color={colors.onSecondaryContainer}>
            {t('onboarding.step3.badge')}
          </AppText>
        </View>
        <AppText variant="headlineSm" accessibilityRole="header">
          {t('onboarding.step3.title')}
        </AppText>
        <AppText color={colors.onSurfaceVariant}>{t('onboarding.step3.body')}</AppText>
        <View accessibilityRole="radiogroup" style={styles.list}>
          {LANGUAGES.map((lang) => (
            <LanguageOption
              key={lang}
              language={lang}
              selected={lang === language}
              onSelect={(l) => update({ language: l })}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const STEP_VIEWS = [StepOne, StepTwo, StepThree];
const STEP_LABEL_KEYS = ['onboarding.step1.label', 'onboarding.step2.label', 'onboarding.step3.label'];

export default function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { update, isRTL } = useSettings();
  const [step, setStep] = useState(0);
  const [forward, setForward] = useState(true);
  const StepView = STEP_VIEWS[step];
  const last = step === STEPS - 1;

  const finish = () => {
    update({ onboarded: true });
    router.replace('/home');
  };
  const go = (delta: number) => {
    setForward(delta > 0);
    setStep((s) => s + delta);
  };
  // New content slides in from the reading direction's "next" side.
  const entering = (forward !== isRTL ? FadeInRight : FadeInLeft).duration(280);

  return (
    <Screen
      footer={
        <>
          <Button
            label={last ? t('onboarding.start') : t('common.next')}
            icon={last ? 'agriculture' : undefined}
            trailingIcon="arrow-forward"
            onPress={last ? finish : () => go(1)}
          />
          {step === 0 && (
            <AppText variant="labelSm" color={colors.onSurfaceVariant} align="center">
              {t('onboarding.footnote')}
            </AppText>
          )}
        </>
      }
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          {step > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              onPress={() => go(-1)}
              style={[styles.backButton, { backgroundColor: colors.surfaceContainer }]}
            >
              <Icon name="arrow-back" color={colors.primary} directional />
            </Pressable>
          ) : (
            <LeafMark size={28} />
          )}
          <AppText variant="titleMd" script="en" color={colors.primary}>
            BaghBaan AI
          </AppText>
        </View>
        {!last && (
          <Pressable
            accessibilityRole="button"
            onPress={() => go(STEPS - 1 - step)}
            style={[styles.skip, { backgroundColor: colors.surfaceContainer }]}
          >
            <AppText variant="labelMd" color={colors.onSurfaceVariant}>
              {t('common.skip')}
            </AppText>
          </Pressable>
        )}
      </View>

      <View style={styles.progress}>
        <View style={styles.progressLabels}>
          <AppText variant="labelMd" color={colors.primary}>
            {t('onboarding.stepOf', { step: step + 1, total: STEPS })}
          </AppText>
          <AppText variant="labelSm" color={colors.onSurfaceVariant}>
            {t(STEP_LABEL_KEYS[step])}
          </AppText>
        </View>
        <View
          style={styles.bars}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: STEPS, now: step + 1 }}
        >
          {STEP_VIEWS.map((_, i) => (
            <View
              key={i}
              style={[styles.bar, { backgroundColor: i <= step ? colors.primary : colors.surfaceContainerHighest }]}
            />
          ))}
        </View>
      </View>

      <Animated.View key={step} entering={entering}>
        <StepView />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    minHeight: touch.min,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  skip: {
    minHeight: touch.min,
    minWidth: 72,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: { gap: spacing.sm },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bars: { flexDirection: 'row', gap: spacing.xs },
  bar: { flex: 1, height: 6, borderRadius: 3 },
  card: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  list: { gap: spacing.sm, marginTop: spacing.xs },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bulletIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  illustration: {
    height: 180,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  frame: {
    width: 132,
    height: 132,
    borderRadius: radius.xl,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBadge: {
    position: 'absolute',
    bottom: 16,
    end: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  stepThree: { gap: spacing.md },
  miniRow: { flexDirection: 'row', gap: spacing.sm },
  mini: { flex: 1, minHeight: 104, borderRadius: radius.lg, padding: spacing.md, justifyContent: 'space-between', gap: spacing.sm },
  miniTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  backButton: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
