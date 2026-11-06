import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing } from '@/theme/tokens';

const MINT = '#7efba4';

export default function Preview() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const checks = t('preview.checks', { returnObjects: true }) as string[];

  return (
    <Screen
      header={<Header title={t('preview.title')} />}
      footer={
        <>
          <Button
            label={t('preview.analyse')}
            icon="biotech"
            trailingIcon="arrow-forward"
            onPress={() => router.replace({ pathname: '/analysing', params: { uri } })}
          />
          <Button
            variant="secondary"
            label={t('preview.retake')}
            icon="replay"
            onPress={() => router.replace('/camera')}
          />
        </>
      }
    >
      {/* Square crop: exactly the region the model will see. */}
      <View style={[styles.photoWrap, shadows.raised, { backgroundColor: colors.surfaceContainerHigh }]}>
        <Image source={{ uri }} style={styles.photo} contentFit="cover" accessibilityLabel={t('preview.title')} />
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <View
            key={c}
            style={[
              styles.corner,
              c[0] === 't' ? { top: 12, borderTopWidth: 3 } : { bottom: 12, borderBottomWidth: 3 },
              c[1] === 'l' ? { left: 12, borderLeftWidth: 3 } : { right: 12, borderRightWidth: 3 },
            ]}
          />
        ))}
      </View>
      <AppText color={colors.onSurfaceVariant} align="center">
        {t('preview.body')}
      </AppText>
      <Card tone="muted">
        <AppText variant="titleMd">{t('preview.checklistTitle')}</AppText>
        {checks.map((check) => (
          <View key={check} style={styles.check}>
            <Icon name="check-circle" size={22} color={colors.secondary} />
            <AppText variant="bodyMdMedium" style={styles.flex}>
              {check}
            </AppText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photoWrap: { aspectRatio: 1, borderRadius: radius.xl, overflow: 'hidden' },
  photo: { flex: 1 },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: MINT, borderRadius: 6 },
  check: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
