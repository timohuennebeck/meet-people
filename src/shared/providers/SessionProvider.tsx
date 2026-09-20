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

/** The flags are four booleans, so a field-by-field compare is the whole story. */
function isSameSession(a: SessionState, b: SessionState): boolean {
  return (
    a.isAuthenticated === b.isAuthenticated &&
    a.hasOnboarded === b.hasOnboarded &&
    a.isVerified === b.isVerified &&
    a.isSubscribed === b.isSubscribed
  );
}

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

  // Mirror every settled change back to storage. Held until the restore has run
  // so the initial flags cannot overwrite what was read back.
  useEffect(() => {
    if (!isReady) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch((error) =>
      console.warn('[session] Could not persist session:', error),
    );
  }, [state, isReady]);

  /**
   * Merges a patch into the newest state rather than a captured snapshot, so two
   * flags set in the same tick both survive, and returns the previous object
   * unchanged when nothing moved — the setters below stay referentially stable,
   * which keeps `useEffect(() => setVerified(true), [setVerified])` from looping.
   */
  const update = useCallback((patch: Partial<SessionState>) => {
    setState((previous) => {
      const next = { ...previous, ...patch };
      return isSameSession(previous, next) ? previous : next;
    });
  }, []);

  const signIn = useCallback(() => update({ isAuthenticated: true }), [update]);
  const completeOnboarding = useCallback(() => update({ hasOnboarded: true }), [update]);
  const setVerified = useCallback((isVerified: boolean) => update({ isVerified }), [update]);
  const setSubscribed = useCallback((isSubscribed: boolean) => update({ isSubscribed }), [update]);
  const signOut = useCallback(() => {
    void supabase?.auth.signOut();
    setState(INITIAL);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      ...state,
      isReady,
      signIn,
      signOut,
      completeOnboarding,
      setVerified,
      setSubscribed,
    }),
    [state, isReady, signIn, signOut, completeOnboarding, setVerified, setSubscribed],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside a SessionProvider');
  return context;
}
