import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { useAuth } from '@/state/auth';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { StatusChip } from './StatusChip';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Settings account card: guest prompt, or the signed-in profile with log out. */
export function AccountCard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auth = useAuth();

  if (auth.status === 'loading') return null;

  if (auth.status === 'signedOut') {
    return (
      <Card>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceContainer }]}>
            <Icon name="person-outline" size={28} color={colors.onSurfaceVariant} />
          </View>
          <View style={styles.flex}>
            <AppText variant="titleMd">{t('auth.guestTitle')}</AppText>
            <AppText variant="labelSm" color={colors.onSurfaceVariant}>
              {t('auth.guestBody')}
            </AppText>
          </View>
        </View>
        <Button label={t('auth.signIn')} icon="login" onPress={() => router.push('/sign-in')} />
        <Button variant="secondary" label={t('auth.signUp')} icon="person-add" onPress={() => router.push('/sign-up')} />
      </Card>
    );
  }

  const { user } = auth;
  const confirmSignOut = () =>
    Alert.alert(t('auth.signOutTitle'), t('auth.signOutBody'), [
      { text: t('history.cancel'), style: 'cancel' },
      { text: t('auth.signOut'), style: 'destructive', onPress: () => auth.signOut() },
    ]);

  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
          <AppText variant="titleMd" script="en" color="#ffffff">
            {initials(user.name)}
          </AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="titleMd">{user.name}</AppText>
          <AppText variant="bodyMd" script="en" color={colors.onSurfaceVariant}>
            {user.phone}
          </AppText>
        </View>
      </View>
      <StatusChip compact tone="healthy" label={t(`auth.roles.${user.role}`)} />
      <Button variant="secondary" label={t('auth.signOut')} icon="logout" onPress={confirmSignOut} />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
