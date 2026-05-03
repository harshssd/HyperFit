import type { NutritionDaySummary } from '../../services/nutritionService';

/**
 * Pure helpers for the Nutrition tab. No Supabase, no React. Mirrors the
 * convention in src/features/workout/helpers.ts (and its split files).
 */

/**
 * A day passes the streak if status='hit' OR is_cheat_day=true.
 *
 * The cheat-day OR is the whole point of the forgiveness model: you still
 * log the pizza (status might be 'over'), but the day counts toward the
 * streak because you used your weekly cheat budget intentionally.
 *
 * 'empty' / 'over' / 'under' all break the streak when not cheat-flagged.
 */
export const passesStreak = (day: NutritionDaySummary): boolean =>
  day.is_cheat_day || day.status === 'hit';

/**
 * Walk back from today through summaries (most-recent first) and count
 * consecutive passing days. Stop at the first non-passing day.
 *
 * Days the user simply hasn't logged yet (no nutrition_days row, so
 * absent from the view) break the streak by exclusion — you can't claim
 * a streak day you didn't log. The caller is responsible for passing
 * summaries ordered DESC by date (matches getRecentSummaries).
 *
 * Returns:
 *   current     — the active streak length in days
 *   bestInWindow — the longest run found within the supplied window
 *                  (useful as a stat readout; may extend further back)
 */
export type StreakResult = {
  current: number;
  bestInWindow: number;
};

export const computeStreak = (
  summariesDescByDate: NutritionDaySummary[],
): StreakResult => {
  let current = 0;
  let stillCounting = true;
  let bestInWindow = 0;
  let run = 0;

  for (const day of summariesDescByDate) {
    const passed = passesStreak(day);
    if (passed) {
      run += 1;
      if (stillCounting) current = run;
      if (run > bestInWindow) bestInWindow = run;
    } else {
      stillCounting = false;
      run = 0;
    }
  }

  return { current, bestInWindow };
};

// -- Display helpers --------------------------------------------------------

/**
 * Convert ml to the user's display unit. ml is the canonical storage unit
 * (DB never sees oz); display flips happen at the render boundary only.
 *
 * 1 fl oz (US) = 29.5735 ml. Rounds to whole oz for display because oz
 * fractions ("8.4 oz") look more wrong than rounded ("8 oz").
 */
export const formatVolume = (ml: number, unit: 'ml' | 'oz'): string => {
  if (unit === 'oz') return `${Math.round(ml / 29.5735)} oz`;
  return `${ml.toLocaleString()} ml`;
};

/**
 * Big-number display for the kcal hero. Uses toLocaleString so 1840 reads
 * as "1,840" — easier to scan than the unformatted "1840".
 */
export const formatKcal = (kcal: number): string => kcal.toLocaleString();

/**
 * Eyebrow text for the hero. Distills (status, cheat) into the one line
 * that sits at the top of the day card.
 */
export const heroEyebrow = (
  status: NutritionDaySummary['status'],
  isCheat: boolean,
  hasGoal: boolean,
): string => {
  if (!hasGoal) return 'TODAY · NO GOAL SET';
  if (isCheat) return 'TODAY · CHEAT DAY · STREAK SAFE';
  switch (status) {
    case 'hit':   return 'TODAY · ON TRACK';
    case 'over':  return 'TODAY · OVER';
    case 'under': return 'TODAY · UNDER';
    case 'empty': return 'TODAY · NO MEALS YET';
  }
};
