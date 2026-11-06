import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import i18n from '@/i18n';
import { deviceLanguage, isRTL, type Language } from '@/i18n/languages';

export type ThemeMode = 'system' | 'light' | 'dark';

type StoredSettings = {
  language: Language;
  themeMode: ThemeMode;
  /** Always use on-device inference, even when online. */
  offlineMode: boolean;
  onboarded: boolean;
};

type SettingsContext = StoredSettings & {
  hydrated: boolean;
  isRTL: boolean;
  update: (patch: Partial<StoredSettings>) => void;
};

const STORAGE_KEY = 'baghbaan.settings.v1';

const defaults = (): StoredSettings => ({
  language: deviceLanguage(),
  themeMode: 'system',
  offlineMode: false,
  onboarded: false,
});

const Context = createContext<SettingsContext | null>(null);

/** User preferences, persisted to AsyncStorage. Also keeps i18next on the chosen language. */
export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<StoredSettings>(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setSettings((s) => ({ ...s, ...(JSON.parse(raw) as Partial<StoredSettings>) })))
      .catch(() => undefined) // corrupt or unavailable storage: keep defaults
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    i18n.changeLanguage(settings.language);
  }, [settings.language]);

  const update = useCallback((patch: Partial<StoredSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ ...settings, hydrated, isRTL: isRTL(settings.language), update }),
    [settings, hydrated, update],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSettings(): SettingsContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
