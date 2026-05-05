import type { MealSlot } from '../../types/supabase';
import type {
  NutritionDaySummary,
  NutritionEntry,
} from '../../services/nutritionService';
import type {
  ShareMealPayload,
  ShareNutritionDayPayload,
} from '../../components/share/ShareableSummaryCard';

const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'BFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'SNACK',
};

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

const dayDate = (iso: string) => new Date(`${iso}T00:00:00`);

/** "FRI · MAY 02" — for the card title. */
export const formatShareDayTitle = (iso: string): string => {
  const d = dayDate(iso);
  const day = DAY_NAMES[d.getDay()];
  const mon = MONTH_NAMES[d.getMonth()];
  const dom = String(d.getDate()).padStart(2, '0');
  return `${day} · ${mon} ${dom}`;
};

/** "MAY 02 2026" — for the brand row. */
export const formatShareBrandDate = (iso: string): string => {
  const d = dayDate(iso);
  const mon = MONTH_NAMES[d.getMonth()];
  const dom = String(d.getDate()).padStart(2, '0');
  return `${mon} ${dom} ${d.getFullYear()}`;
};

const slotLabel = (entry: NutritionEntry): string => {
  if (entry.meal_label?.trim()) return entry.meal_label.toUpperCase();
  if (entry.meal_slot) return SLOT_LABELS[entry.meal_slot as MealSlot] ?? 'MEAL';
  return 'MEAL';
};

const timeOfDay = (iso?: string | null): string | null => {
  if (!iso) return null;
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  const hh = t.getHours();
  const mm = String(t.getMinutes()).padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${mm} ${ampm}`;
};

export const buildMealPayload = (
  entry: NutritionEntry,
  dateISO: string,
  isCheatDay: boolean,
): ShareMealPayload => ({
  kind: 'meal',
  title: entry.name?.trim() || 'Meal',
  date: formatShareBrandDate(dateISO),
  slotLabel: slotLabel(entry),
  timeLabel: timeOfDay(entry.logged_at),
  quantityLabel: entry.quantity_label?.trim() || null,
  kcal: entry.kcal ?? 0,
  protein_g: entry.protein_g ?? 0,
  carb_g: entry.carb_g ?? 0,
  fat_g: entry.fat_g ?? 0,
  fiber_g: entry.fiber_g ?? 0,
  cheat: isCheatDay,
});

type DayInputs = {
  dateISO: string;
  summary: NutritionDaySummary | null;
  entries: NutritionEntry[];
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  fiberTarget: number;
  waterTarget: number;
  kcalTarget: number;
};

/** Picks the top-N entries by kcal for the share card. Falls back to logged_at order. */
const pickTopEntries = (entries: NutritionEntry[]) =>
  [...entries]
    .sort((a, b) => (b.kcal ?? 0) - (a.kcal ?? 0))
    .slice(0, 6)
    .map(e => ({
      name: e.name?.trim() || 'Meal',
      kcal: e.kcal ?? 0,
      slotLabel: slotLabel(e),
    }));

export const buildDayPayload = ({
  dateISO,
  summary,
  entries,
  proteinTarget,
  carbTarget,
  fatTarget,
  fiberTarget,
  waterTarget,
  kcalTarget,
}: DayInputs): ShareNutritionDayPayload => ({
  kind: 'nutrition-day',
  title: formatShareDayTitle(dateISO),
  date: formatShareBrandDate(dateISO),
  kcal_total: summary?.kcal_total ?? 0,
  kcal_target: summary?.kcal_target ?? kcalTarget,
  protein_total_g: summary?.protein_total_g ?? 0,
  protein_target_g: proteinTarget,
  carb_total_g: summary?.carb_total_g ?? 0,
  carb_target_g: carbTarget,
  fat_total_g: summary?.fat_total_g ?? 0,
  fat_target_g: fatTarget,
  fiber_total_g: summary?.fiber_total_g ?? 0,
  fiber_target_g: fiberTarget,
  water_total_ml: summary?.water_total_ml ?? 0,
  water_target_ml: waterTarget,
  status: (summary?.status as 'hit' | 'over' | 'under' | 'empty') ?? 'empty',
  is_cheat_day: summary?.is_cheat_day ?? false,
  entries: pickTopEntries(entries),
});
