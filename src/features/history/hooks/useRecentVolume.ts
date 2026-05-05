import { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';

export type RecentVolume = {
  /** Daily volume_load totals, oldest → newest. Always `days` long; days
   *  with no session render as 0 so the sparkline stays continuous. */
  points: number[];
  /** Sum over the most recent 7 days. */
  thisWeek: number;
  /** Sum over the prior 7 days (days 8..14). */
  priorWeek: number;
  /** thisWeek vs priorWeek as a fraction (e.g. +0.12 = 12% up). null when
   *  prior week is zero (no baseline → can't compute a meaningful delta). */
  deltaPct: number | null;
  /** 'up' | 'flat' | 'down' — derived from deltaPct with a ±2% dead-zone
   *  so jitter doesn't flicker the trend glyph. 'none' until first session. */
  trend: 'up' | 'flat' | 'down' | 'none';
  loading: boolean;
  error: Error | null;
};

const EMPTY: RecentVolume = {
  points: [],
  thisWeek: 0,
  priorWeek: 0,
  deltaPct: null,
  trend: 'none',
  loading: false,
  error: null,
};

const localISO = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * useRecentVolume — last `days` of session volume_load, bucketed per local
 * day. Drives the Home hero sparkline + week-over-week delta.
 *
 * Reads `session_summary_view` directly (folded view; no client aggregation).
 * Multiple sessions on the same day are summed. Days with no session emit 0
 * so the sparkline doesn't shift indices when sessions are sparse.
 *
 * Caller passes `days` (default 14 — two weeks for week-over-week math).
 */
export const useRecentVolume = (
  userId: string | null | undefined,
  days: number = 14,
): RecentVolume => {
  const [state, setState] = useState<RecentVolume>(EMPTY);

  useEffect(() => {
    if (!userId) {
      setState(EMPTY);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const since = new Date();
        since.setDate(since.getDate() - (days - 1));
        const sinceISO = localISO(since);

        const { data: rows, error } = await supabase
          .from('session_summary_view')
          .select('workout_date, volume_load')
          .eq('user_id', userId)
          .gte('workout_date', sinceISO);

        if (error) throw error;
        if (cancelled) return;

        const byDate = new Map<string, number>();
        for (const row of rows ?? []) {
          const d = row.workout_date as string;
          const v = Number(row.volume_load) || 0;
          byDate.set(d, (byDate.get(d) ?? 0) + v);
        }

        const points: number[] = [];
        const today = new Date();
        for (let i = days - 1; i >= 0; i -= 1) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          points.push(byDate.get(localISO(d)) ?? 0);
        }

        const thisWeek = points.slice(-7).reduce((a, b) => a + b, 0);
        const priorWeek = points.slice(-14, -7).reduce((a, b) => a + b, 0);
        const hasAny = points.some(p => p > 0);

        let deltaPct: number | null = null;
        let trend: RecentVolume['trend'] = 'none';
        if (priorWeek > 0) {
          deltaPct = (thisWeek - priorWeek) / priorWeek;
          // ±2% dead-zone — sub-2% week swings are noise, not signal.
          trend = deltaPct > 0.02 ? 'up' : deltaPct < -0.02 ? 'down' : 'flat';
        } else if (hasAny) {
          // No prior baseline but we have sessions — call it up (any > none).
          trend = 'up';
        }

        setState({ points, thisWeek, priorWeek, deltaPct, trend, loading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        setState(s => ({
          ...s,
          loading: false,
          error: e instanceof Error ? e : new Error(String(e)),
        }));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, days]);

  return state;
};
