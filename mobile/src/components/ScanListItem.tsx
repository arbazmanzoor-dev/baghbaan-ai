import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { diseaseName, toneFor } from '@/content/diseases';
import { useSettings } from '@/state/settings';
import type { ScanRecord } from '@/state/scans';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';
import { formatDateTime, formatPercent } from '@/utils/format';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { StatusChip } from './StatusChip';

/** Recent-scan card from the design: 80 px thumbnail, name, status chip, time and confidence. */
export function ScanListItem({
  scan,
  onLongPress,
  accessibilityHint,
}: {
  scan: ScanRecord;
  onLongPress?: () => void;
  accessibilityHint?: string;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language } = useSettings();
  const tone = toneFor(scan.topClass, scan.lowConfidence);
  const title = scan.lowConfidence ? t('result.status.warning') : diseaseName(scan.topClass, language);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatPercent(scan.confidence, language)}`}
      accessibilityHint={accessibilityHint}
      onPress={() => router.push({ pathname: '/result/[id]', params: { id: scan.id } })}
      onLongPress={onLongPress}
      delayLongPress={450}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Image source={{ uri: scan.imageUri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.body}>
        <AppText variant="headlineSm" numberOfLines={1}>
          {title}
        </AppText>
        <StatusChip compact tone={tone} label={t(`result.status.${tone}`)} />
        <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
          {formatDateTime(scan.createdAt, language)} • {formatPercent(scan.confidence, language)}
        </AppText>
      </View>
      <Icon name="chevron-right" color={colors.onSurfaceVariant} directional />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  thumb: { width: 80, height: 80, borderRadius: radius.md },
  body: { flex: 1, gap: spacing.xs },
});
