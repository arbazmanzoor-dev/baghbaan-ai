import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import type { Role } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FilterChips } from '@/components/FilterChips';
import { Header } from '@/components/Header';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useGoBack } from '@/hooks/useGoBack';
import { useAuth } from '@/state/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touch } from '@/theme/tokens';
import { authErrorKey } from '@/utils/authErrors';
import { normalisePhone } from '@/utils/phone';

const MIN_PASSWORD = 8;

export default function SignUp() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('farmer');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const normalised = normalisePhone(phone);
    const next = {
      name: name.trim().length >= 2 ? undefined : t('auth.errors.name'),
      phone: normalised ? undefined : t('auth.errors.phone'),
      password: password.length >= MIN_PASSWORD ? undefined : t('auth.errors.password'),
    };
    setErrors(next);
    setFormError(null);
    if (next.name || next.phone || next.password || !normalised) return;
    setBusy(true);
    try {
      await register({ name: name.trim(), phone: normalised, password, role });
      goBack();
    } catch (err) {
      setFormError(t(authErrorKey(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        header={<Header title={t('auth.signUpTitle')} />}
        footer={
          <>
            <Button label={t('auth.signUp')} icon="person-add" onPress={submit} disabled={busy} />
            <Pressable accessibilityRole="link" onPress={() => router.replace('/sign-in')} style={styles.link}>
              <AppText variant="labelLg" color={colors.primary} align="center">
                {t('auth.haveAccount')}
              </AppText>
            </Pressable>
          </>
        }
      >
        <AppText color={colors.onSurfaceVariant} style={styles.intro}>
          {t('auth.signUpSubtitle')}
        </AppText>
        <TextField
          label={t('auth.name')}
          icon="person-outline"
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          maxLength={80}
        />
        <TextField
          label={t('auth.phone')}
          icon="phone-iphone"
          prefix="+91"
          ltr
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          hint={t('auth.phoneHint')}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={14}
        />
        <TextField
          label={t('auth.password')}
          icon="lock-outline"
          password
          ltr
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          hint={t('auth.passwordHint')}
          // Not "newPassword": iOS would push an Apple-generated strong password that a
          // farmer cannot read back or type on another phone.
          autoComplete="password"
          textContentType="password"
          maxLength={72}
        />
        <View style={styles.role}>
          <AppText variant="labelLg">{t('auth.role')}</AppText>
          <FilterChips<Role>
            value={role}
            onChange={setRole}
            chips={(['farmer', 'officer'] as const).map((r) => ({ value: r, label: t(`auth.roles.${r}`) }))}
          />
        </View>
        {formError && (
          <AppText color={colors.status.disease.text} accessibilityRole="alert">
            {formError}
          </AppText>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { paddingVertical: spacing.sm },
  role: { gap: spacing.xs },
  link: { minHeight: touch.min, justifyContent: 'center' },
});
