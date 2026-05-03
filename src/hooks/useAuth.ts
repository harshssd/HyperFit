import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { supabase } from '../services/supabase';
import {
  getInitialSession,
  onAuthStateChange,
  signInWithEmail as svcSignInWithEmail,
  signUpWithEmail as svcSignUpWithEmail,
  signInWithGoogle as svcSignInWithGoogle,
  signOut as svcSignOut,
} from '../services/supabaseClient';

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
  signOut: () => Promise<void>;
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    getInitialSession().then(({ data: { session } }) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'authenticated' : 'unauthenticated');
    });

    const unsubscribe = onAuthStateChange(session => {
      if (!active) return;
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await svcSignInWithEmail(email, password);
    if (error) throw new Error(error.message);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await svcSignUpWithEmail(email, password);
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
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
        if (exchangeError) throw new Error(exchangeError.message);
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
        if (sessionError) throw new Error(sessionError.message);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await svcSignOut();
  }, []);

  return { user, status, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut };
};
