import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { FilterChips } from '@/components/FilterChips';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SettingRow } from '@/components/SettingRow';
import { StateView } from '@/components/StateView';
import { StatusChip } from '@/components/StatusChip';
import { allDiseases, matchesQuery, severityTone, type Disease } from '@/content/diseases';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing, touch } from '@/theme/tokens';

type Filter = 'all' | 'disease' | 'healthy';

const ICONS = { apple_scab: 'coronavirus', black_rot: 'blur-circular', cedar_apple_rust: 'grain', healthy: 'eco' } as const;

function DiseaseCard({ disease, index }: { disease: Disease; index: number }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tone = severityTone(disease.severity);
  const c = colors.status[tone];
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(350)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={disease.text.name}
        onPress={() => router.push({ pathname: '/disease/[id]', params: { id: disease.id } })}
        style={({ pressed }) => [
          styles.card,
          shadows.card,
          { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.band, { backgroundColor: c.accent }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.cardIcon, { backgroundColor: c.background }]}>
              <Icon name={ICONS[disease.id]} color={c.accent} />
            </View>
            <View style={styles.flex}>
              <AppText variant="headlineSm">{disease.text.name}</AppText>
              <AppText variant="labelSm" script="en" color={colors.onSurfaceVariant}>
                {disease.scientificName}
              </AppText>
            </View>
            <Icon name="chevron-right" color={colors.onSurfaceVariant} directional />
          </View>
          <StatusChip compact tone={tone} label={t(`library.severity.${disease.severity}`)} />
          <AppText variant="bodyMd" color={colors.onSurfaceVariant} numberOfLines={3}>
            {disease.text.summary}
          </AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function Library() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, isRTL } = useSettings();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const diseases = allDiseases(language).filter(
    (d) =>
      matchesQuery(d.id, query) &&
      (filter === 'all' || (filter === 'healthy') === (d.id === 'healthy')),
  );

  return (
    <Screen edges={['top']}>
      <View style={styles.title}>
        <AppText variant="headlineLg" accessibilityRole="header">
          {t('library.title')}
        </AppText>
        <AppText variant="labelMd" color={colors.onSurfaceVariant}>
          {t('library.subtitle')}
        </AppText>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder }]}>
        <Icon name="search" color={colors.onSurfaceVariant} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('library.search')}
          placeholderTextColor={colors.onSurfaceVariant}
          accessibilityLabel={t('library.search')}
          returnKeyType="search"
          style={[styles.input, { color: colors.onSurface, textAlign: isRTL && Platform.OS === 'web' ? 'right' : 'left' }]}
        />
        {query.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.clearSearch')} onPress={() => setQuery('')}>
            <Icon name="close" color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      <FilterChips<Filter>
        value={filter}
        onChange={setFilter}
        chips={(['all', 'disease', 'healthy'] as const).map((f) => ({ value: f, label: t(`library.filters.${f}`) }))}
      />

      {diseases.length === 0 ? (
        <StateView icon="search-off" title={t('library.noResults')} />
      ) : (
        diseases.map((d, i) => <DiseaseCard key={d.id} disease={d} index={i} />)
      )}

      <View style={[styles.aboutCard, { backgroundColor: colors.surfaceContainerLow }]}>
        <SettingRow
          icon="psychology"
          title={t('library.howItWorks')}
          subtitle={t('library.howItWorksSub')}
          onPress={() => router.push('/about')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { paddingTop: spacing.md, gap: 2 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 16, minHeight: touch.min },
  card: { flexDirection: 'row', borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  band: { width: 6 },
  cardBody: { flex: 1, padding: spacing.md, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  aboutCard: { borderRadius: radius.lg, paddingHorizontal: spacing.md },
});
