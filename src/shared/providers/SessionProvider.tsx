import type { Session } from '@supabase/supabase-js';
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
  /** False until the first answer about the stored session has arrived. */
  isReady: boolean;
  signIn: () => void;
  signOut: () => void;
  completeOnboarding: () => void;
  setVerified: (verified: boolean) => void;
  setSubscribed: (subscribed: boolean) => void;
}

/**
 * The entitlement that unlocks Nearby Plus, and the statuses that count as
 * holding it. `billing_issue` is deliberately not among them: the store has
 * stopped collecting and the grace period has run out, so the subscription is
 * over until it is fixed.
 */
const PLUS = 'plus';
const LIVE_STATUSES = ['active', 'in_trial', 'in_grace'] as const;

const SIGNED_OUT: SessionState = {
  isAuthenticated: false,
  hasOnboarded: false,
  isVerified: false,
  isSubscribed: false,
};

/**
 * What the flags read with no Supabase project configured.
 *
 * `hasSupabase` being false is the app's offline mode: `dataSource` resolves
 * against the fixtures transcribed from the design, and everything renders
 * without a network. Authentication is the one thing that cannot fall back
 * that way — there is no account to sign into — so treating an unconfigured
 * build as signed out made every screen past the welcome step unreachable and
 * the entire fixture source dead code.
 *
 * So an unconfigured build is a signed-in demo: onboarded and verified, since
 * those gate whole areas of the app, and **not** subscribed, because the free
 * tier is what most people see and the paywall states should be the ones on
 * screen by default. Nothing here touches a build that has credentials.
 */
const DEMO: Omit<SessionState, 'isAuthenticated'> = {
  hasOnboarded: true,
  isVerified: true,
  isSubscribed: false,
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Reads the three derived flags for one account.
 *
 * Each is a row the database will only hand over to its owner, so what comes
 * back is the answer rather than a claim the client made about itself. A query
 * that errors resolves to `false` rather than throwing: a network blip must not
 * leave the app with no session state at all, and the next read corrects it.
 */
async function readFlags(profileId: string): Promise<Omit<SessionState, 'isAuthenticated'>> {
  if (!supabase) return { hasOnboarded: false, isVerified: false, isSubscribed: false };

  const [profile, verification, entitlement] = await Promise.all([
    supabase.from('profiles').select('onboarding_completed_at').eq('id', profileId).maybeSingle(),
    // The latest submission decides: an earlier rejection is history once a
    // later one comes back verified.
    supabase
      .from('verification_submissions')
      .select('outcome')
      .eq('profile_id', profileId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // `entitlements` has no write policy at all, so this is the one direction
    // it ever moves: the store's webhook writes it, the app reads it.
    supabase
      .from('entitlements')
      .select('status')
      .eq('profile_id', profileId)
      .eq('entitlement_id', PLUS)
      .maybeSingle(),
  ]);

  return {
    hasOnboarded: Boolean(profile.data?.onboarding_completed_at),
    isVerified: verification.data?.outcome === 'verified',
    isSubscribed: LIVE_STATUSES.some((status) => status === entitlement.data?.status),
  };
}

/**
 * Holds the flags the router's `Protected` guards read.
 *
 * Nothing here is invented any more. `isAuthenticated` is whether Supabase has
 * a session; the other three are rows read back under row-level security, so
 * they say what the database says and not what a previous run of the app
 * decided.
 *
 * There is deliberately no AsyncStorage mirror. The Supabase client already
 * persists the session there, and a second copy of the *derived* flags would
 * only ever be a way for the two to disagree — a lapsed subscription or a
 * withdrawn badge would keep unlocking the app until something happened to
 * overwrite the mirror. The cost is one round trip on a cold start, which
 * `isReady` covers.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [flags, setFlags] = useState<Omit<SessionState, 'isAuthenticated'>>(SIGNED_OUT);
  /**
   * True once the stored session has been read back, however it turned out.
   * With no Supabase project configured there is nothing to read, so the answer
   * is already in: nobody is signed in.
   */
  const [authResolved, setAuthResolved] = useState(() => supabase === null);
  /** The account `flags` was last read for. */
  const [flagsFor, setFlagsFor] = useState<string | null>(null);
  /** Bumped to re-read the flags for the account already signed in. */
  const [nonce, setNonce] = useState(0);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    // Both paths answer: `getSession` reads what is stored, and the listener
    // then carries every later sign-in, sign-out and token refresh.
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!cancelled) setSession(data.session);
      })
      .catch((error: unknown) => console.warn('[session] Could not read the session:', error))
      .finally(() => {
        if (!cancelled) setAuthResolved(true);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthResolved(true);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    void readFlags(userId)
      .then((next) => {
        if (cancelled) return;
        setFlags(next);
        setFlagsFor(userId);
      })
      .catch((error: unknown) => console.warn('[session] Could not read the profile:', error));

    return () => {
      cancelled = true;
    };
  }, [userId, nonce]);

  /**
   * What was read, but only for the account asking. Signing out does not clear
   * `flags` — it does not have to, because a flag only counts while it belongs
   * to the session on screen.
   */
  const derived =
    supabase === null ? DEMO : userId !== null && flagsFor === userId ? flags : SIGNED_OUT;

  /**
   * Holds the tree until the app knows both whether someone is signed in and,
   * if so, how far they got. Flipping on the session alone would show a
   * returning user a frame of onboarding while their profile row was in
   * flight. A re-read for an account already resolved does not take this back,
   * so a refresh never blanks the screen.
   */
  const isReady = authResolved && (userId === null || flagsFor === userId);

  const refresh = useCallback(() => setNonce((current) => current + 1), []);

  /**
   * Re-reads the session rather than granting one. Sign-up and sign-in happen
   * on their own screens, against Supabase; this is what a screen calls when it
   * has done something the flags should follow, and `onAuthStateChange` has
   * usually got there first.
   */
  const signIn = refresh;

  const signOut = useCallback(() => {
    void supabase?.auth
      .signOut()
      .catch((error: unknown) => console.warn('[session] Could not sign out:', error));
    // `onAuthStateChange` clears the rest; this is only so the guards move on
    // the same frame as the tap.
    setSession(null);
  }, []);

  /**
   * Stamps the profile as finished. The flag is not set here — it is re-read
   * from the column that was just written, so what the router sees is what the
   * database holds.
   */
  const completeOnboarding = useCallback(() => {
    const client = supabase;
    if (!client || !userId) return;

    const stamp = async (profileId: string) => {
      const { error } = await client
        .from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', profileId);
      if (error) console.warn('[session] Could not finish onboarding:', error.message);
      refresh();
    };

    void stamp(userId);
  }, [userId, refresh]);

  /**
   * Both of these move the badge and the entitlement ahead of the row that
   * decides them — the success screen and the paywall land before the reviewer
   * and the store webhook have written anything. The next read puts the truth
   * back, so neither can hold a flag open on its own.
   */
  const setVerified = useCallback(
    (isVerified: boolean) => setFlags((previous) => ({ ...previous, isVerified })),
    [],
  );
  const setSubscribed = useCallback(
    (isSubscribed: boolean) => setFlags((previous) => ({ ...previous, isSubscribed })),
    [],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      ...derived,
      // With no project configured there is no session to have, and the
      // fixtures are the whole app — see `DEMO`.
      isAuthenticated: supabase ? Boolean(session) : true,
      isReady,
      signIn,
      signOut,
      completeOnboarding,
      setVerified,
      setSubscribed,
    }),
    [derived, session, isReady, signIn, signOut, completeOnboarding, setVerified, setSubscribed],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside a SessionProvider');
  return context;
}
