import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useUser } from '../../../contexts/UserContext';
import {
  addEntry as svcAddEntry,
  addWater as svcAddWater,
  deleteEntry as svcDeleteEntry,
  getDaySummary,
  getEntries,
  getOrCreateDay,
  getRecentSummaries,
  getSettings,
  toggleCheatDay as svcToggleCheatDay,
  todayLocalISO,
  undoLastWater as svcUndoLastWater,
  updateEntry as svcUpdateEntry,
  upsertSettings,
  type AddEntryInput,
  type NutritionDay,
  type NutritionDaySummary,
  type NutritionEntry,
  type NutritionSettings,
  type UpdateEntryPatch,
} from '../../../services/nutritionService';
import { cheatsInWeek, computeStreak } from '../helpers';

/**
 * useNutritionDay — owns today's full nutrition state.
 *
 * Returns settings + today's parent row + today's entries + folded summary
 * + streak math, plus the action functions the view components call. All
 * actions refresh the affected slices so the UI re-renders without manual
 * cache plumbing. Optimistic updates are intentionally NOT used yet:
 *
 *   * Nutrition writes are infrequent (a few taps a day, not per-set logging).
 *   * The view recomputes status server-side; faking it client-side risks
 *     the eyebrow flickering between "ON TRACK" and "OVER" if the local
 *     calculation drifts from the view's CASE.
 *
 * If logging UX feels laggy after dogfooding, optimistic-update the local
 * `entries` array first and reconcile from the view on next refresh.
 *
 * The hook is exported for callers that need an isolated copy. Most call
 * sites should use `useNutritionDayContext()` (provided by
 * `NutritionDayProvider`) so Home and Nutrition tabs share one source of
 * truth — otherwise logging on one surface leaves the other stale until
 * its own refresh fires.
 */

export type UseNutritionDayReturn = {
  /** YYYY-MM-DD (local). Stable across the hook's lifetime. */
  date: string;
  /** Loading on first mount; false once initial fetch lands. */
  loading: boolean;
  /** Last fetch error (settings/summary/entries). null when healthy. */
  error: Error | null;
  /** Null until the user opens GoalSetupSheet for the first time. */
  settings: NutritionSettings | null;
  /** Null when the user hasn't logged anything today yet. */
  day: NutritionDay | null;
  /** Folded view row. Null when day is null. */
  summary: NutritionDaySummary | null;
  /** Today's entries, ordered by meal_slot then order_index. */
  entries: NutritionEntry[];
  /** Active streak (counting back from today). */
  streak: number;
  /** True iff the user has saved settings at least once. */
  hasGoal: boolean;
  /** Folded summaries for the last 30 days (DESC by date). Drives the
   *  "this week" rows and the cheat-day planner strip. */
  recentSummaries: NutritionDaySummary[];
  /** Cheat days used in the current calendar week (Mon–Sun, inclusive
   *  of planned future cheats within the same week). */
  cheatsUsedThisWeek: number;
  /** True when cheatsUsedThisWeek >= cheat_days_per_week budget. The
   *  toggle uses this to disable + show "USED N / N". */
  cheatBudgetExhausted: boolean;

  refresh: () => Promise<void>;
  saveSettings: (patch: Partial<NutritionSettings>) => Promise<void>;
  addEntry: (input: Omit<AddEntryInput, 'userId' | 'dayId'>) => Promise<void>;
  updateEntry: (entryId: string, patch: UpdateEntryPatch) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  addWater: (ml: number) => Promise<void>;
  undoLastWater: () => Promise<void>;
  toggleCheatDay: (next: boolean) => Promise<void>;
  /** Plan a cheat for an arbitrary date (today or future). Future-only
   *  is enforced by the planner UI; the action itself accepts any ISO
   *  so the same path can flip today off from the planner strip too. */
  planCheatDay: (iso: string, on: boolean) => Promise<void>;
};

export const useNutritionDay = (): UseNutritionDayReturn => {
  const { user } = useUser();
  const userId = user?.id;
  const [date] = useState<string>(() => todayLocalISO());

  const [settings, setSettings] = useState<NutritionSettings | null>(null);
  const [day, setDay] = useState<NutritionDay | null>(null);
  const [summary, setSummary] = useState<NutritionDaySummary | null>(null);
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [recentSummaries, setRecentSummaries] = useState<NutritionDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const [s, summ, recents] = await Promise.all([
        getSettings(userId),
        getDaySummary(userId, date),
        getRecentSummaries(userId, 30),
      ]);
      setSettings(s);
      setSummary(summ);
      setStreak(computeStreak(recents).current);
      setRecentSummaries(recents);

      // entries depend on having a day_id — pull only after summary lands.
      if (summ?.day_id) {
        const e = await getEntries(userId, summ.day_id);
        setEntries(e);
        // Populate `day` shape (subset) from summary for the cheat toggle to
        // act on without a second round-trip. Full row only fetched on demand.
        setDay({
          id: summ.day_id,
          user_id: summ.user_id,
          date: summ.date,
          is_cheat_day: summ.is_cheat_day,
          kcal_target: null,
          protein_target_g: null,
          carb_target_g: null,
          fat_target_g: null,
          fiber_target_g: null,
          note: null,
          created_at: '',
          updated_at: '',
        });
      } else {
        setEntries([]);
        setDay(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // -- Actions ---------------------------------------------------------------
  // Each action persists, then refreshes. Errors propagate so UI can toast.

  const saveSettings = useCallback(
    async (patch: Partial<NutritionSettings>) => {
      if (!userId) return;
      const next = await upsertSettings(userId, patch);
      setSettings(next);
      // Targets may have changed → summary's hit/over/under might flip.
      const summ = await getDaySummary(userId, date);
      setSummary(summ);
    },
    [userId, date],
  );

  const addEntry = useCallback(
    async (input: Omit<AddEntryInput, 'userId' | 'dayId'>) => {
      if (!userId) return;
      const parent = day ?? (await getOrCreateDay(userId, date));
      await svcAddEntry({ ...input, userId, dayId: parent.id });
      await refresh();
    },
    [userId, date, day, refresh],
  );

  const updateEntry = useCallback(
    async (entryId: string, patch: UpdateEntryPatch) => {
      await svcUpdateEntry(entryId, patch);
      await refresh();
    },
    [refresh],
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      await svcDeleteEntry(entryId);
      await refresh();
    },
    [refresh],
  );

  const addWater = useCallback(
    async (ml: number) => {
      if (!userId) return;
      await svcAddWater(userId, date, ml);
      await refresh();
    },
    [userId, date, refresh],
  );

  const undoLastWater = useCallback(async () => {
    if (!userId) return;
    await svcUndoLastWater(userId, date);
    await refresh();
  }, [userId, date, refresh]);

  const toggleCheatDay = useCallback(
    async (next: boolean) => {
      if (!userId) return;
      await svcToggleCheatDay(userId, date, next);
      await refresh();
    },
    [userId, date, refresh],
  );

  const planCheatDay = useCallback(
    async (iso: string, on: boolean) => {
      if (!userId) return;
      await svcToggleCheatDay(userId, iso, on);
      await refresh();
    },
    [userId, refresh],
  );

  const cheatBudget = settings?.cheat_days_per_week ?? 1;
  const cheatsUsedThisWeek = cheatsInWeek(recentSummaries, date);
  const cheatBudgetExhausted = cheatsUsedThisWeek >= cheatBudget;

  return {
    date,
    loading,
    error,
    settings,
    day,
    summary,
    entries,
    streak,
    hasGoal: settings !== null,
    recentSummaries,
    cheatsUsedThisWeek,
    cheatBudgetExhausted,
    refresh,
    saveSettings,
    addEntry,
    updateEntry,
    deleteEntry,
    addWater,
    undoLastWater,
    toggleCheatDay,
    planCheatDay,
  };
};

// -- Provider / context ------------------------------------------------------
// Home and Nutrition both render water/meal controls. Without a shared
// source, each tab keeps its own cache and a log on one tab leaves the
// other stale. The provider mounts the hook once at app level; consumers
// read via context.

const NutritionDayContext = createContext<UseNutritionDayReturn | null>(null);

export const NutritionDayProvider = ({ children }: { children: React.ReactNode }) => {
  const value = useNutritionDay();
  return React.createElement(NutritionDayContext.Provider, { value }, children);
};

export const useNutritionDayContext = (): UseNutritionDayReturn => {
  const ctx = useContext(NutritionDayContext);
  if (!ctx) {
    throw new Error(
      'useNutritionDayContext: missing <NutritionDayProvider>. Wrap MainTabs (or higher) in the provider.',
    );
  }
  return ctx;
};
