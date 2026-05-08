import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { supabase } from '../services/supabase';
import {
  getInitialSession,
  onAuthStateChange,
  signInWithEmail as svcSignInWithEmail,
  signUpWithEmail as svcSignUpWithEmail,
  signInWithGoogle as svcSignInWithGoogle,
  signInWithAppleIdToken as svcSignInWithAppleIdToken,
  resetPasswordForEmail as svcResetPasswordForEmail,
  signOut as svcSignOut,
} from '../services/supabaseClient';
import { friendlyAuthError } from '../utils/authErrors';
import {
  identifyUser,
  resetAnalytics,
  trackEvent,
  AnalyticsEvents,
} from '../utils/posthog';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type UseAuthReturn = {
  user: User | null;
  status: AuthStatus;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean; alreadyExists: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;
    // Track previous user id so we can distinguish a fresh sign-in (fire
    // identify + sign_in event once) from auth state ticks where the same
    // session refreshes its access token.
    let prevUserId: string | null = null;

    getInitialSession().then(({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'authenticated' : 'unauthenticated');
      if (session?.user) {
        identifyUser(session.user.id);
        prevUserId = session.user.id;
      }
    });

    const unsubscribe = onAuthStateChange(session => {
      if (!active) return;
      const nextUserId = session?.user?.id ?? null;
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'authenticated' : 'unauthenticated');

      if (nextUserId && nextUserId !== prevUserId) {
        identifyUser(nextUserId);
        trackEvent(AnalyticsEvents.SIGN_IN);
      } else if (!nextUserId && prevUserId) {
        trackEvent(AnalyticsEvents.SIGN_OUT);
        resetAnalytics();
      }
      prevUserId = nextUserId;
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await svcSignInWithEmail(email, password);
    if (error) throw new Error(friendlyAuthError(error));
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await svcSignUpWithEmail(email, password);
    if (error) throw new Error(friendlyAuthError(error));
    // Anti-enumeration tell: Supabase returns a synthetic user with empty
    // identities (and no session, no error) when the email already exists.
    const alreadyExists =
      !!data?.user && (!data.user.identities || data.user.identities.length === 0);
    // Otherwise: no session means email confirmation is pending.
    return { needsConfirmation: !data?.session && !alreadyExists, alreadyExists };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Expo Go doesn't register custom URI schemes — fall back to exp:// in Expo Go,
    // and use the hyperfit:// scheme in dev/standalone builds.
    const isExpoGo = Constants.appOwnership === 'expo';
    const redirectUrl = AuthSession.makeRedirectUri(
      isExpoGo ? undefined : { scheme: 'hyperfit' },
    );

    const { data, error } = await svcSignInWithGoogle(redirectUrl);
    if (error) throw new Error(friendlyAuthError(error));
    if (!data?.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type !== 'success') return;

    // PKCE flow: ?code=... → exchange for session.
    // Implicit flow (legacy): #access_token=... → set session directly.
    const url = result.url;
    const queryStart = url.indexOf('?');
    if (queryStart !== -1) {
      const queryStr = url.slice(queryStart + 1).split('#')[0];
      const code = new URLSearchParams(queryStr).get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw new Error(friendlyAuthError(exchangeError));
        return;
      }
    }
    const hashPart = url.split('#')[1];
    if (hashPart) {
      const params = new URLSearchParams(hashPart);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw new Error(friendlyAuthError(sessionError));
      }
    }
  }, []);

  // Apple sign-in (iOS native flow). App Store guideline 4.8 requires this
  // since we ship Google OAuth. Throws on platform mismatch so callers can
  // hide the button entirely on non-iOS rather than silently swallowing.
  //
  // Nonce handshake:
  //   1. Generate a 32-byte random `rawNonce` and SHA-256 hash it.
  //   2. Pass the hashed nonce to AppleAuthentication.signInAsync — Apple
  //      embeds it in the issued identity_token.
  //   3. Hand the rawNonce + identity_token to Supabase. Supabase re-hashes
  //      the rawNonce server-side and verifies it matches the token claim.
  // Skipping the nonce here would let an attacker replay a captured token.
  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple sign-in is iOS only');
    }
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple sign-in is not available on this device');
    }

    const rawNonce = Array.from(Crypto.getRandomBytes(32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce,
    );

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
    } catch (err: any) {
      // User-cancelled is not an error path — return silently.
      if (err?.code === 'ERR_REQUEST_CANCELED') return;
      throw new Error(err?.message || 'Apple sign-in failed');
    }

    const idToken = credential.identityToken;
    if (!idToken) {
      throw new Error('Apple did not return an identity token');
    }

    const { error } = await svcSignInWithAppleIdToken(idToken, rawNonce);
    if (error) throw new Error(friendlyAuthError(error));
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    // No deep-link handler yet — Supabase's hosted reset page handles the
    // new-password form. When we add an in-app reset screen, pass redirectTo
    // here pointing at hyperfit:// + that route.
    const { error } = await svcResetPasswordForEmail(email);
    if (error) throw new Error(friendlyAuthError(error));
  }, []);

  const signOut = useCallback(async () => {
    await svcSignOut();
  }, []);

  return {
    user,
    status,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    signOut,
  };
};
