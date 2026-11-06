import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { BulletList, Collapsible } from '@/components/Collapsible';
import { ExpertNote } from '@/components/ExpertNote';
import { Header, HeaderButton } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { StatusChip } from '@/components/StatusChip';
import {
  CLASS_IDS,
  diseaseName,
  expertNote,
  getDisease,
  lowConfidenceMessage,
  toneFor,
} from '@/content/diseases';
import { analyseOnline } from '@/scan/analyse';
import { useScans, type ScanRecord } from '@/state/scans';
import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';
import { formatDateTime, formatPercent } from '@/utils/format';

type PhotoView = 'photo' | 'heatmap';

function PhotoCard({ scan }: { scan: ScanRecord }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [view, setView] = useState<PhotoView>(scan.heatmapUri ? 'heatmap' : 'photo');
  const uri = view === 'heatmap' && scan.heatmapUri ? scan.heatmapUri : scan.imageUri;
  return (
    <Card>
      <SegmentedToggle<PhotoView>
        value={view}
        onChange={setView}
        options={[
          { value: 'photo', label: t('result.photo'), icon: 'image' },
          { value: 'heatmap', label: t('result.heatmap'), icon: 'blur-on', disabled: !scan.heatmapUri },
        ]}
      />
      <View style={[styles.photoWrap, { backgroundColor: colors.surfaceContainerHigh }]}>
        <Image
          source={{ uri }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
          accessibilityLabel={view === 'heatmap' ? t('result.heatmapCaption') : t('result.photo')}
        />
      </View>
      <AppText variant="labelSm" color={colors.onSurfaceVariant}>
        {scan.heatmapUri ? t('result.heatmapCaption') : t('result.heatmapUnavailable')}
      </AppText>
    </Card>
  );
}

/**
 * Shown on scans analysed on the phone: explains why there is no heatmap and lets the user
 * re-send the saved photo to the server once a connection is back.
 */
function OfflineNotice({ scan }: { scan: ScanRecord }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const { upgradeScan } = useScans();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const warn = colors.status.warning;

  const getHeatmap = async () => {
    setBusy(true);
    setFailed(false);
    try {
      // The saved photo is already square-cropped, so it can be sent as-is.
      await upgradeScan(scan.id, await analyseOnline(scan.imageUri, language));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      AccessibilityInfo.announceForAccessibility(t('result.offlineNotice.updated'));
    } catch {
      setFailed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.notice, { backgroundColor: warn.background, borderColor: warn.border }]}
    >
      <View style={styles.cardTitle}>
        <Icon name={scan.offlineReason === 'setting' ? 'offline-bolt' : 'cloud-off'} color={warn.text} />
        <AppText variant="bodyMdMedium" color={warn.text} style={styles.flex}>
          {t(`result.offlineNotice.${scan.offlineReason === 'setting' ? 'setting' : 'unreachable'}`)}
        </AppText>
      </View>
      {failed && (
        <AppText variant="labelMd" color={colors.status.disease.text} accessibilityRole="alert">
          {t('result.offlineNotice.failed')}
        </AppText>
      )}
      <Button
        variant="secondary"
        icon={busy ? undefined : 'blur-on'}
        label={busy ? t('result.offlineNotice.gettingHeatmap') : t('result.offlineNotice.getHeatmap')}
        onPress={getHeatmap}
        disabled={busy}
      />
    </View>
  );
}

function Probabilities({ scan }: { scan: ScanRecord }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const ranked = [...CLASS_IDS].sort((a, b) => scan.probabilities[b] - scan.probabilities[a]);
  return (
    <Card>
      <View style={styles.cardTitle}>
        <Icon name="stacked-bar-chart" color={colors.primary} />
        <View style={styles.flex}>
          <AppText variant="titleMd">{t('result.probabilities')}</AppText>
          <AppText variant="labelSm" color={colors.onSurfaceVariant}>
            {t('result.probabilitiesSub')}
          </AppText>
        </View>
      </View>
      {ranked.map((id) => {
        const p = scan.probabilities[id];
        const color = colors.status[id === 'healthy' ? 'healthy' : 'disease'].accent;
        return (
          <View key={id} style={styles.prob}>
            <View style={styles.probRow}>
              <AppText variant={id === scan.topClass ? 'labelLg' : 'bodyMd'} style={styles.flex}>
                {diseaseName(id, language)}
              </AppText>
              <AppText variant="labelLg" color={id === scan.topClass ? color : colors.onSurfaceVariant}>
                {formatPercent(p, language)}
              </AppText>
            </View>
            <ProgressBar value={p} color={id === scan.topClass ? color : colors.outline} height={8} />
          </View>
        );
      })}
    </Card>
  );
}

function Diagnosis({ scan }: { scan: ScanRecord }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const disease = getDisease(scan.topClass, language);
  const tone = toneFor(scan.topClass, false);
  const accent = colors.status[tone].accent;
  return (
    <>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Card>
          <StatusChip tone={tone} label={t(`result.status.${tone}`)} />
          <AppText variant="displayLg" accessibilityRole="header">
            {disease.text.name}
          </AppText>
          <AppText variant="bodyMd" script="en" color={colors.onSurfaceVariant} style={styles.italic}>
            {disease.scientificName}
          </AppText>
          <View style={[styles.confidenceBox, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={styles.probRow}>
              <AppText variant="labelLg" style={styles.flex}>
                {t('result.confidence')}
              </AppText>
              <AppText variant="headlineMd" color={accent}>
                {formatPercent(scan.confidence, language)}
              </AppText>
            </View>
            <ProgressBar value={scan.confidence} color={accent} accessibilityLabel={t('result.confidence')} />
          </View>
          <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
            {disease.text.summary}
          </AppText>
        </Card>
      </Animated.View>
      <PhotoCard key={scan.heatmapUri ?? 'photo'} scan={scan} />
      <Probabilities scan={scan} />
      <ExpertNote />
      <Collapsible icon="info" title={t('result.about')} initiallyOpen>
        <AppText>{disease.text.description}</AppText>
      </Collapsible>
      <Collapsible icon="visibility" title={t('result.symptoms')}>
        <BulletList items={disease.text.symptoms} />
      </Collapsible>
      <Collapsible icon="shield" title={t('result.prevention')}>
        <BulletList items={disease.text.prevention} />
      </Collapsible>
      <Collapsible icon="healing" title={t('result.management')}>
        <BulletList items={disease.text.management} />
      </Collapsible>
    </>
  );
}

function LowConfidence({ scan }: { scan: ScanRecord }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const warn = colors.status.warning;
  const reasons = t('lowConfidence.reasons', { returnObjects: true }) as string[];
  return (
    <>
      <Animated.View entering={FadeInDown.duration(400)}>
        <View
          style={[
            styles.lowHero,
            shadows.card,
            { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.lowAccent, { backgroundColor: warn.accent }]} />
          <StatusChip tone="warning" label={t('result.status.warning')} />
          <AppText variant="headlineMd" accessibilityRole="header">
            {t('lowConfidence.title')}
          </AppText>
          <View style={[styles.lowMessage, { backgroundColor: warn.background, borderColor: warn.border }]}>
            <Icon name="help-outline" color={warn.text} />
            <AppText variant="bodyMdMedium" color={warn.text} style={styles.flex}>
              {lowConfidenceMessage(language)}
            </AppText>
          </View>
          <View style={styles.lowSplit}>
            <Image source={{ uri: scan.imageUri }} style={styles.lowThumb} contentFit="cover" />
            <View style={styles.flex}>
              <AppText variant="labelMd" color={colors.onSurfaceVariant}>
                {t('result.confidence')}
              </AppText>
              <AppText variant="headlineLg" color={warn.accent}>
                {formatPercent(scan.confidence, language)}
              </AppText>
              <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                {t('lowConfidence.bestGuess', {
                  name: diseaseName(scan.topClass, language),
                  percent: formatPercent(scan.confidence, language),
                })}
              </AppText>
            </View>
          </View>
        </View>
      </Animated.View>
      <Card tone="muted">
        <AppText variant="titleMd">{t('lowConfidence.reasonsTitle')}</AppText>
        <BulletList items={reasons} />
      </Card>
      <PhotoCard key={scan.heatmapUri ?? 'photo'} scan={scan} />
      <Probabilities scan={scan} />
      <ExpertNote />
      <Card tone="muted">
        <View style={styles.cardTitle}>
          <Icon name="support-agent" color={colors.primary} />
          <AppText style={styles.flex}>{t('lowConfidence.consult')}</AppText>
        </View>
      </Card>
    </>
  );
}

export default function Result() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const { scans, hydrated } = useScans();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scan = scans.find((s) => s.id === id);

  if (!scan) {
    return (
      <Screen header={<Header title={t('result.title')} />}>
        {hydrated && <AppText>{t('result.notFound')}</AppText>}
      </Screen>
    );
  }

  const share = async () => {
    const name = scan.lowConfidence ? t('result.status.warning') : diseaseName(scan.topClass, language);
    const summary = `${t('result.shareTitle')}: ${name} (${formatPercent(scan.confidence, language)})\n${expertNote(language)}`;
    const file = scan.heatmapUri ?? scan.imageUri;
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file, { mimeType: file.endsWith('.png') ? 'image/png' : 'image/jpeg', dialogTitle: summary });
    } else {
      await Share.share({ message: summary });
    }
  };

  return (
    <Screen
      header={
        <Header
          title={t('result.title')}
          actions={<HeaderButton icon="share" label={t('result.share')} onPress={share} />}
        />
      }
      footer={
        <>
          <Button
            label={scan.lowConfidence ? t('lowConfidence.retake') : t('result.scanAnother')}
            icon="photo-camera"
            onPress={() => router.replace('/camera')}
          />
          <Button variant="secondary" label={t('result.share')} icon="share" onPress={share} />
        </>
      }
    >
      <View style={styles.meta}>
        <Icon name={scan.source === 'online' ? 'cloud-done' : 'offline-bolt'} size={16} color={colors.onSurfaceVariant} />
        <AppText variant="labelSm" color={colors.onSurfaceVariant}>
          {scan.source === 'online' ? t('result.analysedOnline') : t('result.analysedOffline')} •{' '}
          {formatDateTime(scan.createdAt, language)}
        </AppText>
      </View>
      {scan.source === 'offline' && <OfflineNotice scan={scan} />}
      {scan.lowConfidence ? <LowConfidence scan={scan} /> : <Diagnosis scan={scan} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  italic: { fontStyle: 'italic' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  notice: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, gap: spacing.sm },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  confidenceBox: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  photoWrap: { aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden' },
  photo: { flex: 1 },
  prob: { gap: 6 },
  probRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lowHero: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, paddingTop: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  lowAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 6 },
  lowMessage: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  lowSplit: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  lowThumb: { width: 104, height: 104, borderRadius: radius.md },
});
