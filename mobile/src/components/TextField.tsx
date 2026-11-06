import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useSettings } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touch } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  icon: IconName;
  hint?: string;
  error?: string | null;
  /** Fixed prefix shown before the input (e.g. "+91"). */
  prefix?: string;
  /** Phone numbers and passwords stay left-to-right even in Urdu. */
  ltr?: boolean;
  password?: boolean;
};

/** Labelled input from DESIGN.md: 52 px, 1.5 px border, green focus ring, inline error. */
export function TextField({ label, icon, hint, error, prefix, ltr, password, ...input }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useSettings();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const border = error ? colors.status.disease.border : focused ? colors.primaryContainer : colors.cardBorder;

  return (
    <View style={styles.root}>
      <AppText variant="labelLg">{label}</AppText>
      <View
        style={[
          styles.field,
          { borderColor: border, backgroundColor: colors.surfaceContainerLowest },
          focused && { shadowColor: colors.primaryContainer, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
          ltr && { direction: 'ltr' },
        ]}
      >
        <Icon name={icon} color={colors.onSurfaceVariant} />
        {prefix && (
          <AppText variant="bodyLg" script="en" color={colors.onSurfaceVariant}>
            {prefix}
          </AppText>
        )}
        <TextInput
          {...input}
          accessibilityLabel={label}
          accessibilityHint={hint}
          secureTextEntry={password && hidden}
          placeholderTextColor={colors.outline}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[
            styles.input,
            // Native already swaps left/right inside an RTL layout (see AppText).
            { color: colors.onSurface, textAlign: !ltr && isRTL && Platform.OS === 'web' ? 'right' : 'left' },
          ]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? t('auth.showPassword') : t('auth.hidePassword')}
            onPress={() => setHidden((h) => !h)}
            style={styles.eye}
          >
            <Icon name={hidden ? 'visibility' : 'visibility-off'} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>
      {error ? (
        <AppText variant="labelMd" color={colors.status.disease.text} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : (
        hint && (
          <AppText variant="labelSm" color={colors.onSurfaceVariant}>
            {hint}
          </AppText>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 18, minHeight: touch.min },
  eye: { width: touch.min, height: touch.min, alignItems: 'center', justifyContent: 'center' },
});
