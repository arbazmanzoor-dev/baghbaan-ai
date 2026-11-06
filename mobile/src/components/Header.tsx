import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useGoBack } from '@/hooks/useGoBack';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touch } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export function HeaderButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? colors.surfaceContainerHigh : 'transparent' }]}
    >
      <Icon name={icon} color={colors.onSurface} directional={icon === 'arrow-back'} />
    </Pressable>
  );
}

/** Screen header from the design: back button, title, optional trailing actions. */
export function Header({ title, actions, onBack }: { title: string; actions?: ReactNode; onBack?: () => void }) {
  const goBack = useGoBack();
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <HeaderButton icon="arrow-back" label={t('common.back')} onPress={onBack ?? goBack} />
      <AppText variant="titleMd" numberOfLines={1} accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: spacing.xs },
  title: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  button: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
