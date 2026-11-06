import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { BulletList } from '@/components/Collapsible';
import { ExpertNote } from '@/components/ExpertNote';
import { Header } from '@/components/Header';
import { Icon, type IconName } from '@/components/Icon';
import { LeafMark } from '@/components/Logo';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { CLASS_IDS, diseaseName } from '@/content/diseases';
import { useMetrics } from '@/hooks/useMetrics';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDateTime, formatPercent } from '@/utils/format';

const STEP_ICONS: IconName[] = ['photo-camera', 'psychology', 'translate'];

function Metric({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.metric, { backgroundColor: colors.surfaceContainerLow }]}>
      <AppText variant="headlineMd" color={colors.primary}>
        {value}
      </AppText>
      <AppText variant="labelSm" color={colors.onSurfaceVariant}>
        {label}
      </AppText>
    </View>
  );
}

function ModelMetrics() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const { metrics, fetchedAt, loading } = useMetrics();

  if (!metrics) {
    return loading ? (
      <ActivityIndicator color={colors.primary} />
    ) : (
      <StateView icon="cloud-off" tone="warning" title={t('states.offlineTitle')} body={t('about.metricsUnavailable')} />
    );
  }
  const testCount = metrics.dataset.per_split.test ?? 0;
  return (
    <Card>
      <AppText variant="titleMd" accessibilityRole="header">
        {t('about.metricsTitle')}
      </AppText>
      <AppText variant="labelSm" color={colors.onSurfaceVariant}>
        {t('about.metricsSub', { count: testCount })}
      </AppText>
      <View style={styles.metricGrid}>
        <Metric label={t('about.accuracy')} value={formatPercent(metrics.test.accuracy, language)} />
        <Metric label={t('about.macroF1')} value={metrics.test.macro_f1.toFixed(2)} />
        <Metric label={t('about.coverage')} value={formatPercent(metrics.confidence.coverage, language)} />
        {metrics.tflite && <Metric label={t('about.offlineSize')} value={`${metrics.tflite.size_mb} MB`} />}
      </View>
      <AppText variant="labelLg">{t('about.perClass')}</AppText>
      {CLASS_IDS.map((id) => {
        const f1 = metrics.test.per_class[id].f1;
        return (
          <View key={id} style={styles.classRow}>
            <View style={styles.classLabel}>
              <AppText variant="bodyMd" style={styles.flex}>
                {diseaseName(id, language)}
              </AppText>
              <AppText variant="labelMd" color={colors.onSurfaceVariant}>
                {f1.toFixed(2)}
              </AppText>
            </View>
            <ProgressBar value={f1} color={colors.secondary} height={8} />
          </View>
        );
      })}
      {fetchedAt && (
        <AppText variant="labelSm" color={colors.onSurfaceVariant}>
          {t('about.cachedNote', { date: formatDateTime(fetchedAt, language) })}
        </AppText>
      )}
    </Card>
  );
}

export default function About() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const steps = t('about.steps', { returnObjects: true }) as { title: string; body: string }[];
  const limitations = t('about.limitations', { returnObjects: true }) as string[];

  return (
    <Screen header={<Header title={t('about.title')} />}>
      <Animated.View entering={FadeInDown.duration(350)}>
        <View style={[styles.mission, { backgroundColor: colors.primaryContainer }]}>
          <LeafMark size={44} />
          <AppText variant="headlineSm" color="#ffffff">
            {t('about.missionTitle')}
          </AppText>
          <AppText color={colors.onPrimaryContainer}>{t('about.missionBody')}</AppText>
        </View>
      </Animated.View>

      <AppText variant="titleMd" accessibilityRole="header">
        {t('about.stepsTitle')}
      </AppText>
      {steps.map((step, i) => (
        <View key={step.title} style={styles.step}>
          <View style={[styles.stepIcon, { backgroundColor: colors.primaryFixed }]}>
            <Icon name={STEP_ICONS[i]} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="labelLg">{`${i + 1}. ${step.title}`}</AppText>
            <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
              {step.body}
            </AppText>
          </View>
        </View>
      ))}

      <Card tone="muted">
        <AppText variant="labelLg">{t('about.detects')}</AppText>
        <View style={styles.tags}>
          {CLASS_IDS.map((id) => (
            <View key={id} style={[styles.tag, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder }]}>
              <AppText variant="labelMd">{diseaseName(id, language)}</AppText>
            </View>
          ))}
        </View>
      </Card>

      <ModelMetrics />

      <Card>
        <View style={styles.step}>
          <Icon name="report" color={colors.status.warning.accent} />
          <AppText variant="titleMd" accessibilityRole="header">
            {t('about.limitationsTitle')}
          </AppText>
        </View>
        <BulletList items={limitations} />
      </Card>
      <ExpertNote />
      <AppText variant="labelSm" color={colors.onSurfaceVariant} align="center">
        {t('about.dataCredit')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mission: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: { flexGrow: 1, flexBasis: '45%', borderRadius: radius.lg, padding: spacing.md, gap: 2 },
  classRow: { gap: 6 },
  classLabel: { flexDirection: 'row', alignItems: 'center' },
});
