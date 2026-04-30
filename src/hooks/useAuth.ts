import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
  getInitialSession,
  onAuthStateChange,
  signInWithEmail as svcSignInWithEmail,
  signUpWithEmail as svcSignUpWithEmail,
  signInWithGoogle as svcSignInWithGoogle,
  setSessionFromTokens,
  signOut as svcSignOut,
} from '../services/supabaseClient';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export type UseAuthReturn = {
  user: User | null;
  status: AuthStatus;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
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
    const { error } = await svcSignUpWithEmail(email, password);
    if (error) throw new Error(error.message);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'hyperfit',
      path: 'auth/callback',
    });

    const { data, error } = await svcSignInWithGoogle(redirectUrl);
    if (error) throw new Error(error.message);
    if (!data?.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    if (result.type !== 'success') return;

    const url = new URL(result.url);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');
    if (!accessToken || !refreshToken) return;

    const { error: sessionError } = await setSessionFromTokens(accessToken, refreshToken);
    if (sessionError) throw new Error(sessionError.message);
  }, []);

  const signOut = useCallback(async () => {
    await svcSignOut();
  }, []);

  return { user, status, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut };
};
