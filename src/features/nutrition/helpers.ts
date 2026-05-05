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

// -- Date math --------------------------------------------------------------

/**
 * ISO date (YYYY-MM-DD) of Monday for the week containing `iso`.
 *
 * Cheat budget enforcement is calendar-week scoped (per D3): the user
 * gets N cheats per Mon–Sun window. Rolling 7d would create the weird
 * case where Sunday's cheat blocks Monday's despite the new week vibe.
 *
 * JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat. We shift Sun to 7 so Mon=1
 * is the smallest, then subtract (day-1) days to land on Mon.
 */
export const weekStartIso = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00`);
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (dow - 1));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Count cheat days in the week containing `iso` (inclusive of any planned
 * future cheats within the same week). Used by CheatDayToggle to show
 * "USED N / N" and disable when the budget is exhausted.
 *
 * Reads from summaries which include `is_cheat_day`. Days the user hasn't
 * touched at all aren't in summaries (the view joins on nutrition_days),
 * so they can't be cheats. Planned future cheats appear in summaries
 * because planning creates a nutrition_days row with is_cheat_day=true.
 */
export const cheatsInWeek = (
  summaries: NutritionDaySummary[],
  iso: string,
): number => {
  const weekStart = weekStartIso(iso);
  // Mon + 6 = Sun
  const sd = new Date(`${weekStart}T00:00:00`);
  sd.setDate(sd.getDate() + 6);
  const yyyy = sd.getFullYear();
  const mm = String(sd.getMonth() + 1).padStart(2, '0');
  const dd = String(sd.getDate()).padStart(2, '0');
  const weekEnd = `${yyyy}-${mm}-${dd}`;

  return summaries.filter(
    s => s.is_cheat_day && s.date >= weekStart && s.date <= weekEnd,
  ).length;
};

/**
 * Generate N consecutive ISO dates starting from `startIso`. Used by
 * WeekRows (offset=-6 for "this week"-up-to-today). Returned ASC.
 */
export const isoDateRange = (startIso: string, count: number): string[] => {
  const out: string[] = [];
  const d = new Date(`${startIso}T00:00:00`);
  for (let i = 0; i < count; i++) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
};

/**
 * Subtract N days from an ISO date.
 */
export const isoDateMinus = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
