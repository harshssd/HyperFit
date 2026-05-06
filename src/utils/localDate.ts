/**
 * Pure local-date helpers. Extracted out of nutritionService so tests
 * can import them without dragging the Supabase client (and therefore
 * AsyncStorage) into the jest sandbox.
 */

/**
 * Local-date string in YYYY-MM-DD. Used for the date column on
 * nutrition_days and water_logs so timezone shifts don't split a meal
 * across two calendar days. UTC would land "today" on a 2am meal log
 * incorrectly — this reads device-local Y/M/D and pads.
 */
export const todayLocalISO = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
