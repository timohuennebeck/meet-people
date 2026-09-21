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
  /**
   * Holds Nearby Plus. Nothing on the server decides this yet — the store
   * integration is not wired — so it lives for the life of the session and
   * starts false.
   */
  isSubscribed: boolean;
}

interface SessionContextValue extends SessionState {
  /** The account's e-mail, for the screens that name it back. Null when signed out. */
  email: string | null;
  /** False until the first answer about the stored session has arrived. */
  isReady: boolean;
  signIn: () => void;
  signOut: () => void;
  completeOnboarding: () => void;
  setVerified: (verified: boolean) => void;
  setSubscribed: (subscribed: boolean) => void;
}

/** What the database decides about one account, as opposed to what the session holds. */
type ServerFlags = Pick<SessionState, 'hasOnboarded' | 'isVerified'>;

const SIGNED_OUT: ServerFlags = { hasOnboarded: false, isVerified: false };

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Reads the derived flags for one account.
 *
 * Each is a row the database will only hand over to its owner, so what comes
 * back is the answer rather than a claim the client made about itself. A query
 * that errors resolves to `false` rather than throwing: a network blip must not
 * leave the app with no session state at all, and the next read corrects it.
 */
async function readFlags(profileId: string): Promise<ServerFlags> {
  if (!supabase) return { hasOnboarded: false, isVerified: false };

  const [profile, verification] = await Promise.all([
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
  ]);

  return {
    hasOnboarded: Boolean(profile.data?.onboarding_completed_at),
    isVerified: verification.data?.outcome === 'verified',
  };
}

/**
 * Holds the flags the router's `Protected` guards read.
 *
 * `isAuthenticated` is whether Supabase has a session, and `hasOnboarded` and
 * `isVerified` are rows read back under row-level security, so they say what
 * the database says and not what a previous run of the app decided.
 * `isSubscribed` is the one exception, and only until billing is wired: no
 * table answers it, so the paywall sets it for the session.
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
  const [flags, setFlags] = useState<ServerFlags>(SIGNED_OUT);
  /**
   * The account the paywall last granted Plus to, for as long as this session
   * lasts. Holding the id rather than a boolean is what stops the grant
   * following a sign-out into the next account.
   */
  const [subscribedFor, setSubscribedFor] = useState<string | null>(null);
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
  const derived = userId !== null && flagsFor === userId ? flags : SIGNED_OUT;

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
   * The success screen lands before the reviewer has written anything, so this
   * moves the badge ahead of the row that decides it. The next read puts the
   * truth back, so it cannot hold the flag open on its own.
   */
  const setVerified = useCallback(
    (isVerified: boolean) => setFlags((previous) => ({ ...previous, isVerified })),
    [],
  );
  /**
   * What the paywall's trial button does. With no store integration there is
   * nothing behind it: the grant lasts as long as the session and no longer.
   */
  const setSubscribed = useCallback(
    (isSubscribed: boolean) => setSubscribedFor(isSubscribed ? userId : null),
    [userId],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      ...derived,
      // An unconfigured build has no session and is not pretended into one:
      // every read past the welcome screen would throw for want of a client.
      isAuthenticated: Boolean(session),
      isSubscribed: userId !== null && subscribedFor === userId,
      email: session?.user.email ?? null,
      isReady,
      signIn,
      signOut,
      completeOnboarding,
      setVerified,
      setSubscribed,
    }),
    [
      derived,
      session,
      userId,
      subscribedFor,
      isReady,
      signIn,
      signOut,
      completeOnboarding,
      setVerified,
      setSubscribed,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside a SessionProvider');
  return context;
}
