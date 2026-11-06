import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { ScanListItem } from '@/components/ScanListItem';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { toneFor } from '@/content/diseases';
import { useScans, type ScanRecord } from '@/state/scans';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, type StatusTone } from '@/theme/tokens';

type Filter = 'all' | StatusTone;
type Section = 'today' | 'yesterday' | 'earlier';

function sectionFor(iso: string): Section {
  const day = new Date(iso);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const t = day.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfToday - 86_400_000) return 'yesterday';
  return 'earlier';
}

const toneOf = (s: ScanRecord) => toneFor(s.topClass, s.lowConfidence);

export default function History() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { scans, removeScan } = useScans();
  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: scans.length, disease: 0, healthy: 0, warning: 0 };
    for (const s of scans) c[toneOf(s)] += 1;
    return c;
  }, [scans]);

  const sections = useMemo(() => {
    const visible = filter === 'all' ? scans : scans.filter((s) => toneOf(s) === filter);
    const groups: Record<Section, ScanRecord[]> = { today: [], yesterday: [], earlier: [] };
    for (const s of visible) groups[sectionFor(s.createdAt)].push(s);
    return (Object.keys(groups) as Section[]).filter((k) => groups[k].length).map((k) => ({ key: k, items: groups[k] }));
  }, [scans, filter]);

  const confirmDelete = (scan: ScanRecord) =>
    Alert.alert(t('history.deleteTitle'), t('history.deleteBody'), [
      { text: t('history.cancel'), style: 'cancel' },
      { text: t('history.delete'), style: 'destructive', onPress: () => removeScan(scan.id) },
    ]);

  if (scans.length === 0) {
    return (
      <Screen edges={['top']}>
        <AppText variant="headlineLg" accessibilityRole="header" style={styles.title}>
          {t('history.title')}
        </AppText>
        <StateView
          icon="history"
          title={t('history.emptyTitle')}
          body={t('history.emptyBody')}
          actions={<Button label={t('home.scanCta')} icon="photo-camera" onPress={() => router.push('/camera')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <View style={styles.title}>
        <AppText variant="headlineLg" accessibilityRole="header">
          {t('history.title')}
        </AppText>
        <AppText variant="labelMd" color={colors.onSurfaceVariant}>
          {t('history.summary', { count: scans.length })}
        </AppText>
      </View>

      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        chips={(['all', 'disease', 'healthy', 'warning'] as const).map((f) => ({
          value: f,
          label: t(`history.filters.${f}`),
          count: counts[f],
        }))}
      />

      {sections.length === 0 ? (
        <StateView icon="filter-alt-off" title={t('history.noMatches')} />
      ) : (
        sections.map((section) => (
          <Animated.View key={section.key} layout={LinearTransition} style={styles.section}>
            <AppText variant="labelLg" color={colors.onSurfaceVariant}>
              {t(`history.${section.key}`)}
            </AppText>
            {section.items.map((scan, i) => (
              <Animated.View key={scan.id} entering={FadeInDown.delay(i * 40)} layout={LinearTransition}>
                <ScanListItem
                  scan={scan}
                  onLongPress={() => confirmDelete(scan)}
                  accessibilityHint={t('history.longPressHint')}
                />
              </Animated.View>
            ))}
          </Animated.View>
        ))
      )}
      {sections.length > 0 && (
        <AppText variant="labelSm" color={colors.onSurfaceVariant} align="center">
          {t('history.longPressHint')}
        </AppText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.md, gap: 2 },
  section: { gap: spacing.sm },
});
