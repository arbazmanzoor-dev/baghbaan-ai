import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ApiError } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { analyse, type AnalyseStep } from '@/scan/analyse';
import { OnDeviceUnavailableError } from '@/scan/onDevice';
import { useScans } from '@/state/scans';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';

const MINT = '#7efba4';

/** The middle step reads "on this phone" when analysis runs offline. */
const stepsFor = (step: AnalyseStep): AnalyseStep[] => [
  'prepare',
  step === 'analyseOffline' ? 'analyseOffline' : 'analyse',
  'save',
];

const errorKind = (err: unknown) =>
  err instanceof ApiError
    ? err.kind
    : err instanceof OnDeviceUnavailableError
      ? 'offline_unavailable'
      : 'unknown';

function ScanLine() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [progress]);
  const style = useAnimatedStyle(() => ({ top: `${4 + progress.value * 92}%` }));
  return <Animated.View style={[styles.scanLine, style]} />;
}

export default function Analysing() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, offlineMode } = useSettings();
  const { addScan } = useScans();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [step, setStep] = useState<AnalyseStep>('prepare');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // One analysis per attempt; Retry bumps `attempt`. State only changes after async work.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await analyse(uri, {
          lang: language,
          offlineMode,
          onStep: (s) => !cancelled && setStep(s),
        });
        if (cancelled) return;
        setStep('save');
        const record = await addScan(result);
        Haptics.notificationAsync(
          result.lowConfidence
            ? Haptics.NotificationFeedbackType.Warning
            : Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
        router.replace({ pathname: '/result/[id]', params: { id: record.id } });
      } catch (err) {
        if (cancelled) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
        setError(errorKind(err));
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-run only on explicit retry; language/router changes must not re-upload the photo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const retry = () => {
    setError(null);
    setStep('prepare');
    setAttempt((a) => a + 1);
  };

  const steps = stepsFor(step);
  const current = steps.indexOf(step);
  const offlineError = error === 'network' || error === 'offline_unavailable';

  return (
    <Screen
      footer={
        error ? (
          <>
            <Button label={t('analysing.retry')} icon="refresh" onPress={retry} />
            <Button variant="secondary" label={t('preview.retake')} icon="replay" onPress={() => router.replace('/camera')} />
          </>
        ) : (
          <Button variant="secondary" label={t('analysing.cancel')} icon="close" onPress={() => router.back()} />
        )
      }
    >
      {error ? (
        <StateView
          icon={offlineError ? 'wifi-off' : 'error-outline'}
          tone={offlineError ? 'warning' : 'disease'}
          title={offlineError ? t('states.offlineTitle') : t('analysing.failedTitle')}
          body={t(`analysing.errors.${error}`)}
        />
      ) : (
        <>
          <View style={[styles.banner, { backgroundColor: colors.primary }]} accessibilityLiveRegion="polite">
            <ActivityIndicator color={MINT} />
            <AppText variant="headlineSm" color="#ffffff" style={styles.flex}>
              {t('analysing.title')}
            </AppText>
          </View>
          <View style={[styles.photoWrap, shadows.raised, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Image source={{ uri }} style={styles.photo} contentFit="cover" />
            <View style={[StyleSheet.absoluteFill, styles.tint]} />
            <ScanLine />
          </View>
          <Card>
            {steps.map((s, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <View key={s} style={styles.step}>
                  <View
                    style={[
                      styles.stepIcon,
                      {
                        backgroundColor: done
                          ? colors.secondary
                          : active
                            ? colors.primaryFixed
                            : colors.surfaceContainerHigh,
                      },
                    ]}
                  >
                    {done ? (
                      <Icon name="check" size={18} color="#ffffff" />
                    ) : active ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <AppText variant="labelSm" align="center">
                        {i + 1}
                      </AppText>
                    )}
                  </View>
                  <AppText
                    variant={active ? 'labelLg' : 'bodyMd'}
                    color={i > current ? colors.onSurfaceVariant : colors.onSurface}
                    style={styles.flex}
                  >
                    {t(`analysing.steps.${s}`)}
                  </AppText>
                </View>
              );
            })}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  photoWrap: { aspectRatio: 1, borderRadius: radius.xl, overflow: 'hidden' },
  photo: { flex: 1 },
  tint: { backgroundColor: 'rgba(22, 69, 37, 0.18)' },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: MINT,
    shadowColor: MINT,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
