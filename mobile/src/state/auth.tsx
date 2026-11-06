import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError, fetchMe, logIn, signUp, type Role, type Session, type User } from '@/api/client';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signedOut'; user: null }
  | { status: 'signedIn'; user: User; token: string };

type AuthContext = AuthState & {
  signIn: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; password: string; role: Role }) => Promise<void>;
  signOut: () => Promise<void>;
};

// Keychain (iOS) / Keystore (Android): the token never sits in plain AsyncStorage.
const STORAGE_KEY = 'baghbaan.session.v1';

const Context = createContext<AuthContext | null>(null);

/**
 * Optional accounts. Scanning works signed out (guest mode); signing in stores a JWT session.
 * On start-up the saved session is re-checked with /auth/me; when offline it is trusted until
 * its expiry so field users are not logged out in the orchard.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  const save = useCallback(async (session: Session) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
    setState({ status: 'signedIn', user: session.user, token: session.access_token });
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
    setState({ status: 'signedOut', user: null });
  }, []);

  useEffect(() => {
    (async () => {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null);
      const session = raw ? (JSON.parse(raw) as Session) : null;
      if (!session || new Date(session.expires_at) <= new Date()) {
        await signOut();
        return;
      }
      setState({ status: 'signedIn', user: session.user, token: session.access_token });
      try {
        const user = await fetchMe(session.access_token);
        await save({ ...session, user }); // pick up profile changes
      } catch (err) {
        if (err instanceof ApiError && err.kind === 'unauthorized') await signOut();
        // Network errors: keep the cached session.
      }
    })();
  }, [save, signOut]);

  const signIn = useCallback(
    async (phone: string, password: string) => save(await logIn({ phone, password })),
    [save],
  );

  const register = useCallback(
    async (data: { name: string; phone: string; password: string; role: Role }) => save(await signUp(data)),
    [save],
  );

  const value = useMemo(() => ({ ...state, signIn, register, signOut }), [state, signIn, register, signOut]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAuth(): AuthContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
