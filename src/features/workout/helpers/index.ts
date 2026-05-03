/**
 * Barrel for the workout helpers. The split is by concern:
 *
 *   mutations.ts       — pure transforms over WorkoutExercise[]
 *   stats.ts           — volume / XP / rank / progress math
 *   transforms.ts      — Template ↔ Plan ↔ Workout ↔ Session conversions
 *   scheduling.ts      — "what's planned for this date / next?" lookups
 *   exerciseConfig.ts  — per-exercise UI labels (depends on lucide icons)
 *
 * Callers should keep importing from `'../helpers'` — the path resolves to
 * this barrel — so the split stays an implementation detail.
 */

export * from './mutations';
export * from './stats';
export * from './transforms';
export * from './scheduling';
export * from './exerciseConfig';
