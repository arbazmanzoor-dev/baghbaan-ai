import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { useSettings } from '@/state/settings';

import { darkColors, lightColors, type ColorScheme } from './tokens';

type Theme = { colors: ColorScheme; isDark: boolean };

const ThemeContext = createContext<Theme>({ colors: lightColors, isDark: false });

/** Resolves the user's theme setting (system / light / dark) to a colour scheme. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const { themeMode } = useSettings();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && system === 'dark');
  const value = useMemo(() => ({ colors: isDark ? darkColors : lightColors, isDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
