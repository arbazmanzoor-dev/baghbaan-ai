import { useFonts } from 'expo-font';
import { LocaleProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { warmUpOnDeviceModel } from '@/scan/onDevice';
import { AuthProvider } from '@/state/auth';
import { ScansProvider } from '@/state/scans';
import { SettingsProvider, useSettings } from '@/state/settings';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { fontAssets } from '@/theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AuthProvider>
          <ScansProvider>
            <ThemeProvider>
              <AppShell>
                <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="preview" />
                  <Stack.Screen name="analysing" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="result/[id]" />
                  <Stack.Screen name="disease/[id]" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="sign-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="sign-up" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
                </Stack>
              </AppShell>
            </ThemeProvider>
          </ScansProvider>
        </AuthProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

/**
 * Holds the native splash until fonts and saved settings are ready, then applies the reading
 * direction. Direction is set on the root view (Yoga `direction`) and the router's
 * LocaleProvider, so switching to Urdu flips the layout instantly, without an app reload.
 */
function AppShell({ children }: PropsWithChildren) {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { hydrated, isRTL } = useSettings();
  const { colors, isDark } = useTheme();
  const ready = (fontsLoaded || fontError) && hydrated;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
      warmUpOnDeviceModel();
    }
  }, [ready]);

  if (!ready) return null;
  const direction = isRTL ? 'rtl' : 'ltr';
  return (
    <LocaleProvider direction={direction}>
      <View style={{ flex: 1, direction, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {children}
      </View>
    </LocaleProvider>
  );
}
