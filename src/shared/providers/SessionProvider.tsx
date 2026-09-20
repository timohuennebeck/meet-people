import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { supabase } from '@shared/lib/supabase/client';

/** Where the user has got to, which decides what the router lets them reach. */
export interface SessionState {
  /** Signed in with an account. */
  isAuthenticated: boolean;
  /** Finished the onboarding steps after account creation. */
  hasOnboarded: boolean;
  /** Holds the verification badge. */
  isVerified: boolean;
  /** Has an active Nearby Plus entitlement. */
  isSubscribed: boolean;
}

interface SessionContextValue extends SessionState {
  /** False until the persisted session has been read back. */
  isReady: boolean;
  signIn: () => void;
  signOut: () => void;
  completeOnboarding: () => void;
  setVerified: (verified: boolean) => void;
  setSubscribed: (subscribed: boolean) => void;
}

const STORAGE_KEY = 'treff.session';

const INITIAL: SessionState = {
  isAuthenticated: false,
  hasOnboarded: false,
  isVerified: false,
  isSubscribed: false,
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the flags the router's `Protected` guards read.
 *
 * State is mirrored to AsyncStorage so a reload lands the user back where they
 * were. Once Supabase is configured, `isAuthenticated` follows its auth state;
 * the rest will move to the user's row as those columns land.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(INITIAL);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && stored) setState({ ...INITIAL, ...JSON.parse(stored) });
      } catch (error) {
        console.warn('[session] Could not restore session:', error);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // Follow Supabase auth once it is configured.
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((previous) => ({ ...previous, isAuthenticated: Boolean(session) }));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const persist = useCallback((next: SessionState) => {
    setState(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) =>
      console.warn('[session] Could not persist session:', error),
    );
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      isReady,
      signIn: () => persist({ ...state, isAuthenticated: true }),
      signOut: () => {
        void supabase?.auth.signOut();
        persist(INITIAL);
      },
      completeOnboarding: () => persist({ ...state, hasOnboarded: true }),
      setVerified: (isVerified) => persist({ ...state, isVerified }),
      setSubscribed: (isSubscribed) => persist({ ...state, isSubscribed }),
    }),
    [state, isReady, persist],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside a SessionProvider');
  return context;
}
