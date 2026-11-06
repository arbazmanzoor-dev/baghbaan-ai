import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touch } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
};

/** Settings list row: icon badge, title/subtitle, trailing control or chevron. */
export function SettingRow({ icon, title, subtitle, trailing, onPress, destructive }: Props) {
  const { colors } = useTheme();
  const fg = destructive ? colors.status.disease.text : colors.onSurface;
  const body = (
    <>
      <View
        style={[
          styles.icon,
          { backgroundColor: destructive ? colors.status.disease.background : colors.surfaceContainer },
        ]}
      >
        <Icon name={icon} size={20} color={destructive ? colors.status.disease.accent : colors.primary} />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyMdMedium" color={fg}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="labelSm" color={colors.onSurfaceVariant}>
            {subtitle}
          </AppText>
        )}
      </View>
      {trailing ?? (onPress && <Icon name="chevron-right" color={colors.onSurfaceVariant} directional />)}
    </>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceContainerLow }]}
    >
      {body}
    </Pressable>
  ) : (
    <View style={styles.row}>{body}</View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: touch.primary, paddingVertical: spacing.sm },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
