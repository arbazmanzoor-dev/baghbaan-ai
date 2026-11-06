import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { LeafMark } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useGoBack } from '@/hooks/useGoBack';
import { useAuth } from '@/state/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touch } from '@/theme/tokens';
import { authErrorKey } from '@/utils/authErrors';
import { normalisePhone } from '@/utils/phone';

export default function SignIn() {
  const router = useRouter();
  const goBack = useGoBack();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const normalised = normalisePhone(phone);
    setPhoneError(normalised ? null : t('auth.errors.phone'));
    setFormError(null);
    if (!normalised || !password) return;
    setBusy(true);
    try {
      await signIn(normalised, password);
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
        header={<Header title={t('auth.signInTitle')} />}
        footer={
          <>
            <Button label={t('auth.signIn')} icon="login" onPress={submit} disabled={busy} />
            <Pressable accessibilityRole="link" onPress={() => router.replace('/sign-up')} style={styles.link}>
              <AppText variant="labelLg" color={colors.primary} align="center">
                {t('auth.noAccount')}
              </AppText>
            </Pressable>
          </>
        }
      >
        <View style={styles.intro}>
          <LeafMark size={48} />
          <AppText color={colors.onSurfaceVariant}>{t('auth.signInSubtitle')}</AppText>
        </View>
        <TextField
          label={t('auth.phone')}
          icon="phone-iphone"
          prefix="+91"
          ltr
          value={phone}
          onChangeText={setPhone}
          error={phoneError}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={14}
          returnKeyType="next"
        />
        <TextField
          label={t('auth.password')}
          icon="lock-outline"
          password
          ltr
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
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
  intro: { gap: spacing.sm, paddingVertical: spacing.sm },
  link: { minHeight: touch.min, justifyContent: 'center' },
});
