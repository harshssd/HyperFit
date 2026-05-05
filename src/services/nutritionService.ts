import { supabase } from './supabase';
import type { Database, MealSlot, NutritionIngredient } from '../types/supabase';

/**
 * Nutrition service — all Supabase reads/writes for the Nutrition tab.
 *
 * Surfaces:
 *   * settings        — user_nutrition_settings (singleton per user)
 *   * day             — nutrition_days (one parent row per user-date)
 *   * entries         — nutrition_entries (FK day_id, meal_slot enum)
 *   * water           — water_logs (one row per tap)
 *   * summary view    — nutrition_day_summary_view (folded totals + status)
 *
 * Lives separate from workoutService for the same reason historyService
 * does: clear feature-scoped seam, no surface area bleed into shared
 * types. Mirrors the per-domain split convention.
 */

export type NutritionSettings =
  Database['public']['Tables']['user_nutrition_settings']['Row'];
export type NutritionDay =
  Database['public']['Tables']['nutrition_days']['Row'];
export type NutritionEntry =
  Database['public']['Tables']['nutrition_entries']['Row'];
export type WaterLog =
  Database['public']['Tables']['water_logs']['Row'];
export type NutritionDaySummary =
  Database['public']['Views']['nutrition_day_summary_view']['Row'];

// Local-date string in YYYY-MM-DD. Used for the date column on
// nutrition_days and water_logs so timezone shifts don't split a meal
// across two calendar days. Caller is responsible for passing the
// device-local date — UTC would land "today" on a 2am meal log incorrectly.
export const todayLocalISO = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// -- Settings ----------------------------------------------------------------

export const getSettings = async (
  userId: string,
): Promise<NutritionSettings | null> => {
  const { data, error } = await supabase
    .from('user_nutrition_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const upsertSettings = async (
  userId: string,
  patch: Partial<NutritionSettings>,
): Promise<NutritionSettings> => {
  const { data, error } = await supabase
    .from('user_nutrition_settings')
    .upsert(
      { user_id: userId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

// -- Day --------------------------------------------------------------------
// Get-or-create: the day card shouldn't render gated on the parent row
// existing. First entry / first water tap / first cheat-toggle creates it.
//
// Race-safe: uses upsert against the (user_id, date) unique constraint
// instead of check-then-insert. A naive SELECT-then-INSERT would race when
// two actions fire concurrently (e.g., user double-taps save on the first
// meal, or logs water on one device while the meal-save round-trip is in
// flight on another) — both selects return null, both inserts fire, the
// second hits the unique violation and surfaces a confusing error.

export const getOrCreateDay = async (
  userId: string,
  date: string,
): Promise<NutritionDay> => {
  const { data, error } = await supabase
    .from('nutrition_days')
    .upsert(
      { user_id: userId, date },
      { onConflict: 'user_id,date', ignoreDuplicates: false },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const toggleCheatDay = async (
  userId: string,
  date: string,
  isCheat: boolean,
): Promise<NutritionDay> => {
  const day = await getOrCreateDay(userId, date);
  const { data, error } = await supabase
    .from('nutrition_days')
    .update({ is_cheat_day: isCheat, updated_at: new Date().toISOString() })
    .eq('id', day.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// -- Entries ----------------------------------------------------------------

export const getEntries = async (
  userId: string,
  dayId: string,
): Promise<NutritionEntry[]> => {
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('day_id', dayId)
    .order('meal_slot', { ascending: true })
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export type AddEntryInput = {
  userId: string;
  dayId: string;
  mealSlot: MealSlot;
  /** Optional free-text label (e.g. "Pre-workout"). Empty string is
   *  coerced to null so the DB CHECK constraint stays happy. */
  mealLabel?: string | null;
  /** Optional free-text portion (e.g. "3 eggs", "200 g"). Display-only;
   *  kcal/macros remain the source of truth for daily totals. */
  quantityLabel?: string | null;
  /** Optional structured ingredient breakdown. Display-only for now;
   *  per-ingredient macros are populated by the future estimator. */
  ingredients?: NutritionIngredient[] | null;
  name?: string;
  kcal?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  fiber_g?: number;
};

export const addEntry = async (
  input: AddEntryInput,
): Promise<NutritionEntry> => {
  const trimmedLabel = input.mealLabel?.trim();
  const trimmedQty = input.quantityLabel?.trim();
  // Drop ingredients with no name AND no quantity — partial half-rows are
  // user noise. A row with name OR quantity gets through (the future
  // estimator works fine on partial input).
  const cleanedIngredients = (input.ingredients ?? [])
    .map(i => ({
      ...i,
      quantity_label: i.quantity_label?.trim() ?? '',
      name: i.name?.trim() ?? '',
    }))
    .filter(i => i.quantity_label || i.name);
  const { data, error } = await supabase
    .from('nutrition_entries')
    .insert({
      user_id: input.userId,
      day_id: input.dayId,
      meal_slot: input.mealSlot,
      meal_label: trimmedLabel ? trimmedLabel : null,
      quantity_label: trimmedQty ? trimmedQty : null,
      ingredients: cleanedIngredients.length > 0 ? cleanedIngredients : null,
      name: input.name ?? null,
      kcal: input.kcal ?? 0,
      protein_g: input.protein_g ?? 0,
      carb_g: input.carb_g ?? 0,
      fat_g: input.fat_g ?? 0,
      fiber_g: input.fiber_g ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteEntry = async (entryId: string): Promise<void> => {
  const { error } = await supabase
    .from('nutrition_entries')
    .delete()
    .eq('id', entryId);
  if (error) throw error;
};

// Recents: last N distinct named entries for a meal_slot, most recent first.
// Distinctness is by (name + macros) — re-typing the same banana shouldn't
// pollute the scroller. Cap at 10 so the horizontal list stays glanceable.
export const getRecents = async (
  userId: string,
  mealSlot: MealSlot,
  limit = 10,
): Promise<NutritionEntry[]> => {
  const { data, error } = await supabase
    .from('nutrition_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('meal_slot', mealSlot)
    .not('name', 'is', null)
    .order('logged_at', { ascending: false })
    .limit(limit * 4); // overfetch — dedup happens client-side below
  if (error) throw error;

  const seen = new Set<string>();
  const unique: NutritionEntry[] = [];
  for (const row of data ?? []) {
    const key = `${row.name}|${row.kcal}|${row.protein_g}|${row.carb_g}|${row.fat_g}|${row.fiber_g}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
    if (unique.length >= limit) break;
  }
  return unique;
};

// Resolve the entries for an arbitrary date (read-only path used by the
// History day-detail modal). Returns [] when no nutrition_days row exists
// — the caller should treat that as "no log for this day."
export const getEntriesByDate = async (
  userId: string,
  date: string,
): Promise<NutritionEntry[]> => {
  const { data: dayRow, error: dayErr } = await supabase
    .from('nutrition_days')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (dayErr) throw dayErr;
  if (!dayRow) return [];
  return getEntries(userId, dayRow.id);
};

// -- Water ------------------------------------------------------------------

export const getWaterLogs = async (
  userId: string,
  date: string,
): Promise<WaterLog[]> => {
  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('logged_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const addWater = async (
  userId: string,
  date: string,
  ml: number,
): Promise<WaterLog> => {
  const { data, error } = await supabase
    .from('water_logs')
    .insert({ user_id: userId, date, ml })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Undo = delete the last (most recent) tap for the day. View recomputes
// total_ml on next read. Returns null when there's nothing to undo so
// the caller can show a "no taps yet" affordance instead of erroring.
export const undoLastWater = async (
  userId: string,
  date: string,
): Promise<WaterLog | null> => {
  const { data: latest, error: readErr } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (readErr) throw readErr;
  if (!latest) return null;

  const { error: delErr } = await supabase
    .from('water_logs')
    .delete()
    .eq('id', latest.id);
  if (delErr) throw delErr;
  return latest;
};

// -- Summary view -----------------------------------------------------------
// Folded totals + status. Read this for the day card and history rows;
// never re-aggregate in JS. Returns null for days with no nutrition_days
// row (the view joins on it) — the caller should treat null as "empty
// day, render placeholder."

export const getDaySummary = async (
  userId: string,
  date: string,
): Promise<NutritionDaySummary | null> => {
  const { data, error } = await supabase
    .from('nutrition_day_summary_view')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Paginated history reader. Returns `{ rows, totalCount }`. Rows are
// most-recent first. Used by the History modal's NUTRITION segment.
export const getNutritionHistoryPage = async (
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ rows: NutritionDaySummary[]; totalCount: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('nutrition_day_summary_view')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { rows: data ?? [], totalCount: count ?? 0 };
};

// Last N days for streak math. Ordered most-recent first.
export const getRecentSummaries = async (
  userId: string,
  days = 30,
): Promise<NutritionDaySummary[]> => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('nutrition_day_summary_view')
    .select('*')
    .eq('user_id', userId)
    .gte('date', sinceISO)
    .order('date', { ascending: false });
  if (error) throw error;
  return data ?? [];
};
