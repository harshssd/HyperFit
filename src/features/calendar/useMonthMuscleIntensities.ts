import { useEffect, useState } from 'react';
import {
  fetchMonthMuscleVolume,
  type DayMuscleVolume,
} from '../../services/monthMuscleVolume';

/**
 * Fetches muscle_volume_v2_view rows over the calendar grid's date range
 * and returns a Map keyed by `YYYY-MM-DD` to per-day muscle intensities.
 *
 * Re-runs when month boundaries shift (the parent `days` array changes
 * its start/end iso). `userId` undefined → no-op + empty map.
 */
export const useMonthMuscleIntensities = (
  userId: string | undefined,
  startIso: string | undefined,
  endIso: string | undefined,
) => {
  const [byDay, setByDay] = useState<Map<string, DayMuscleVolume>>(new Map());

  useEffect(() => {
    if (!userId || !startIso || !endIso) {
      setByDay(new Map());
      return;
    }
    let cancelled = false;
    fetchMonthMuscleVolume(userId, startIso, endIso)
      .then(map => {
        if (!cancelled) setByDay(map);
      })
      .catch(() => {
        if (!cancelled) setByDay(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [userId, startIso, endIso]);

  return byDay;
};
