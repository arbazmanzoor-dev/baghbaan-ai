import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadows, spacing, touch } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'inverse';
  icon?: IconName;
  trailingIcon?: IconName;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

/** Design CTA: 56 px primary (orchard green) or 52 px secondary (white with green text). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  disabled,
  accessibilityHint,
  style,
}: Props) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.primaryContainer, pressed: colors.primary, fg: '#ffffff', border: 'transparent' },
    secondary: {
      bg: colors.surfaceContainerLowest,
      pressed: colors.surfaceContainer,
      fg: colors.primary,
      border: colors.primary,
    },
    // White button on green surfaces (splash).
    inverse: { bg: '#fbf9f4', pressed: '#eae8e3', fg: '#164525', border: 'transparent' },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary' ? styles.secondary : styles.primary,
        {
          backgroundColor: pressed ? palette.pressed : palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        variant !== 'secondary' && shadows.card,
        style,
      ]}
    >
      {icon && <Icon name={icon} color={palette.fg} />}
      <View style={styles.label}>
        <AppText variant="labelLg" color={palette.fg} align="center" numberOfLines={2}>
          {label}
        </AppText>
      </View>
      {trailingIcon && <Icon name={trailingIcon} color={palette.fg} directional />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  primary: { minHeight: touch.primary },
  secondary: { minHeight: 52, borderWidth: 1.5 },
  label: { flexShrink: 1 },
});
