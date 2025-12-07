import 'react-native-url-polyfill/auto';
import { createClient, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseConfig } from '../../supabase.config';

export const supabase = createClient(
  supabaseConfig.supabaseUrl,
  supabaseConfig.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export const getInitialSession = () => supabase.auth.getSession();

export const onAuthStateChange = (callback: (session: Session | null) => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
};

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signInWithGoogle = (redirectTo: string) =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
    },
  });

export const setSessionFromTokens = (access_token: string, refresh_token: string) =>
  supabase.auth.setSession({ access_token, refresh_token });

export const signOut = () => supabase.auth.signOut();

export const loadUserData = async (userId: string, defaultData: any) => {
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data?.data) {
    return data.data;
  }

  const { error: insertError } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        data: defaultData,
      },
      { onConflict: 'user_id' }
    );

  if (insertError) {
    throw insertError;
  }

  return defaultData;
};

export const upsertUserData = async (userId: string, newData: any) => {
  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        data: newData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    // Fallback to update if upsert fails (e.g., constraint issues)
    const { error: updateError } = await supabase
      .from('user_data')
      .update({
        data: newData,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }
  }
};

export const subscribeToUserData = (
  userId: string,
  handler: (data: any) => void
) => {
  const channel = supabase
    .channel(`user_data:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_data',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newRecord: any = (payload as any).new;
        if (newRecord && newRecord.data) {
          handler(newRecord.data);
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

