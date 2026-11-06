import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Switch, View } from 'react-native';

import { fetchHealth } from '@/api/client';
import { AccountCard } from '@/components/AccountCard';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ExpertNote } from '@/components/ExpertNote';
import { LanguageOption } from '@/components/LanguageOption';
import { Screen } from '@/components/Screen';
import { SegmentedToggle } from '@/components/SegmentedToggle';
import { SettingRow } from '@/components/SettingRow';
import { API_URL } from '@/config';
import { LANGUAGES } from '@/i18n/languages';
import { useScans } from '@/state/scans';
import { useSettings, type ThemeMode } from '@/state/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

type ServerState = 'checking' | 'ok' | 'down';

function useServerStatus(): ServerState {
  const [state, setState] = useState<ServerState>('checking');
  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((h) => active && setState(h.model_loaded ? 'ok' : 'down'))
      .catch(() => active && setState('down'));
    return () => {
      active = false;
    };
  }, []);
  return state;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      <AppText variant="labelLg" color={colors.onSurfaceVariant}>
        {title}
      </AppText>
      <Card>{children}</Card>
    </View>
  );
}

export default function Settings() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { language, themeMode, offlineMode, update } = useSettings();
  const { scans, clearScans } = useScans();
  const server = useServerStatus();
  const serverColor = { checking: colors.onSurfaceVariant, ok: colors.secondary, down: colors.status.warning.accent }[server];
  const serverLabel = { checking: t('settings.serverChecking'), ok: t('settings.serverOk'), down: t('settings.serverDown') }[server];

  const confirmClear = () =>
    Alert.alert(t('settings.clearTitle'), t('settings.clearBody'), [
      { text: t('history.cancel'), style: 'cancel' },
      { text: t('settings.clear'), style: 'destructive', onPress: clearScans },
    ]);

  return (
    <Screen edges={['top']}>
      <AppText variant="headlineLg" accessibilityRole="header" style={styles.title}>
        {t('settings.title')}
      </AppText>

      <View style={styles.group}>
        <AppText variant="labelLg" color={colors.onSurfaceVariant}>
          {t('auth.account')}
        </AppText>
        <AccountCard />
      </View>

      <Group title={t('settings.preferences')}>
        <AppText variant="labelLg">{t('settings.language')}</AppText>
        <View accessibilityRole="radiogroup" style={styles.languages}>
          {LANGUAGES.map((lang) => (
            <LanguageOption key={lang} language={lang} selected={lang === language} onSelect={(l) => update({ language: l })} />
          ))}
        </View>
        <AppText variant="labelLg" style={styles.spaced}>
          {t('settings.theme')}
        </AppText>
        <SegmentedToggle<ThemeMode>
          value={themeMode}
          onChange={(mode) => update({ themeMode: mode })}
          options={[
            { value: 'system', label: t('settings.themes.system'), icon: 'brightness-auto' },
            { value: 'light', label: t('settings.themes.light'), icon: 'light-mode' },
            { value: 'dark', label: t('settings.themes.dark'), icon: 'dark-mode' },
          ]}
        />
      </Group>

      <Group title={t('settings.offlineSection')}>
        <SettingRow
          icon="offline-bolt"
          title={t('settings.offlineMode')}
          subtitle={t('settings.offlineModeBody')}
          // The whole row toggles: a big target for gloved hands, not just the small switch.
          onPress={() => update({ offlineMode: !offlineMode })}
          trailing={
            <Switch
              value={offlineMode}
              onValueChange={(v) => update({ offlineMode: v })}
              trackColor={{ true: colors.primaryContainer, false: colors.surfaceContainerHighest }}
              thumbColor="#ffffff"
              accessibilityLabel={t('settings.offlineMode')}
            />
          }
        />
        <SettingRow
          icon="dns"
          title={t('settings.server')}
          subtitle={API_URL}
          trailing={
            <AppText variant="labelMd" color={serverColor}>
              {serverLabel}
            </AppText>
          }
        />
        <SettingRow
          icon="photo-library"
          title={t('settings.savedScans')}
          trailing={<AppText variant="labelLg">{scans.length}</AppText>}
        />
        {scans.length > 0 && (
          <SettingRow icon="delete-outline" title={t('settings.clearHistory')} onPress={confirmClear} destructive />
        )}
      </Group>

      <Group title={t('settings.support')}>
        <SettingRow icon="psychology" title={t('settings.about')} onPress={() => router.push('/about')} />
        <ExpertNote />
      </Group>

      <AppText variant="labelSm" color={colors.onSurfaceVariant} align="center">
        {t('settings.version', { version: Constants.expoConfig?.version ?? '' })}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.md },
  group: { gap: spacing.sm },
  languages: { gap: spacing.sm },
  spaced: { marginTop: spacing.sm },
});
