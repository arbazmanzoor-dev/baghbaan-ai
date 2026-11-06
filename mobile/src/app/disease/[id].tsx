import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { BulletList } from '@/components/Collapsible';
import { ExpertNote } from '@/components/ExpertNote';
import { Header } from '@/components/Header';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';
import { StatusChip } from '@/components/StatusChip';
import { CLASS_IDS, getDisease, severityTone, type ClassId } from '@/content/diseases';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

function Section({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={styles.sectionTitle}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.primaryFixed }]}>
          <Icon name={icon} size={20} color={colors.primary} />
        </View>
        <AppText variant="titleMd" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {children}
    </Card>
  );
}

export default function DiseaseDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!CLASS_IDS.includes(id as ClassId)) {
    return (
      <Screen header={<Header title={t('library.title')} />}>
        <StateView icon="search-off" title={t('library.noResults')} />
      </Screen>
    );
  }

  const disease = getDisease(id as ClassId, language);
  const tone = severityTone(disease.severity);
  const c = colors.status[tone];

  return (
    <Screen
      header={<Header title={t('library.title')} />}
      footer={<Button label={t('library.scanCta')} icon="photo-camera" onPress={() => router.push('/camera')} />}
    >
      <Animated.View entering={FadeInDown.duration(350)}>
        <View style={[styles.hero, { backgroundColor: c.background, borderColor: c.border }]}>
          <StatusChip tone={tone} label={t(`library.severity.${disease.severity}`)} />
          <AppText variant="displayLg" accessibilityRole="header">
            {disease.text.name}
          </AppText>
          <AppText variant="bodyMd" script="en" color={colors.onSurfaceVariant}>
            {disease.scientificName}
          </AppText>
          <AppText variant="bodyLg">{disease.text.summary}</AppText>
        </View>
      </Animated.View>
      <Section icon="info" title={t('result.about')}>
        <AppText>{disease.text.description}</AppText>
      </Section>
      <Section icon="visibility" title={t('result.symptoms')}>
        <BulletList items={disease.text.symptoms} />
      </Section>
      <Section icon="shield" title={t('result.prevention')}>
        <BulletList items={disease.text.prevention} />
      </Section>
      <Section icon="healing" title={t('result.management')}>
        <BulletList items={disease.text.management} />
      </Section>
      <ExpertNote />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.xl, borderWidth: 1, padding: spacing.lg, gap: spacing.sm },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
