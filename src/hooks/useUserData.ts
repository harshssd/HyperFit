import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { loadUserData } from '../services/supabaseClient';
import { DEFAULT_DATA } from '../constants/appConstants';
import { UserData } from '../types/workout';

export type UseUserDataReturn = {
  data: UserData;
  setData: (data: UserData) => void;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

/**
 * Loads the persisted slice of UserData for the signed-in user.
 *
 * Today this only hydrates plan-related fields; other UserData fields
 * (gymLogs, workouts, customTemplates, currentSession, …) live only in
 * memory and reset on reload. Slice 4 will migrate them to dedicated
 * feature hooks and delete this aggregate.
 */
export const useUserData = (user: User | null): UseUserDataReturn => {
  const [data, setData] = useState<UserData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadUserData(userId, DEFAULT_DATA);
      setData({ ...DEFAULT_DATA, ...loaded });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setData(DEFAULT_DATA);
      return;
    }
    load(user.id);
  }, [user, load]);

  const refresh = useCallback(async () => {
    if (user) await load(user.id);
  }, [user, load]);

  return { data, setData, loading, error, refresh };
};
