# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Development (Expo SDK 54, React Native 0.81, React 19):
- `npm start` — Expo dev server
- `npm run ios` / `npm run android` / `npm run web` — start on a specific platform

Production builds use EAS:
- `eas build --platform ios --profile production`
- `eas submit --platform ios --profile production`
- (same with `--platform android`)

- `npm run typecheck` — `tsc --noEmit`. Runs in CI on every PR (`.github/workflows/ci.yml`); keep it green.

There is no test runner or linter wired up yet.

Database:
- Migrations live in `supabase/migrations/` and are applied via the Supabase CLI or SQL editor.
- Seed data: `supabase/seeds/initial_data.sql`.

## Architecture

`App.tsx` mounts `GestureHandlerRootView` → `SafeAreaProvider` → `AuthProvider` → `RootNavigator`. Navigation is react-navigation v7 (auth stack + bottom tabs + modal stack — see `src/navigation/`). The legacy single-screen `activeTab` shell is gone.

Auth and data flow:
1. `useAuth` (in `src/hooks/useAuth.ts`) owns user state, the Supabase auth listener, and the Google OAuth dance via `expo-auth-session` + `expo-web-browser`. It exposes `{ user, status, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }`.
2. `useUserData` (in `src/hooks/useUserData.ts`) loads the persisted slice of `UserData` for the signed-in user. Today it hydrates plan-related fields (`userWorkoutPlans`, `workoutPlans`) and `gymLogs` (distinct workout dates). Other `UserData` fields still live only in memory.
3. `UserProvider` (in `src/contexts/UserContext.tsx`) re-exposes the current `User` to deep components that don't get props (e.g. `HistoryAnalyticsView`).

Realtime sync is intentionally **not** wired up — the previous `subscribeToUserData` was a no-op. When realtime is needed, subscribe per table (workout_log, user_workout_plans) rather than to a monolithic user blob.

## Data model

Single canonical migration: `20260430000000_initial_schema.sql`. Anything not referenced by source code on 2026-04-30 was dropped (no progress/PR table, no per-day summary table, no dead views) — recreate them as Postgres views the day a feature actually needs them.

The plan world:
- `workout_plans` — blueprint catalog (own + public).
- `plan_sessions` — sessions inside a plan; **owned outright** (no `template_id` coupling).
- `plan_exercises` — exercises in a plan_session, FK to master `exercises`.
- `plan_schedule` — which session(s) on which day-of-week.
- `user_workout_plans` — instance: which plan a user is on. At most one `is_active` row per user (unique partial index).

The session-log world:
- `workout_sessions` — **one row per logged workout** (parent). Holds `workout_date`, `name`, `start_time`, `end_time`, optional `plan_id` / `plan_session_id` linkage.
- `workout_sets` — child rows, FK to `workout_sessions`. Each row is a single set with `set_number`, `weight`, `reps`, `completed`, `order_index`.
- `session_summary_view` — folds sessions+sets into one row per session with `total_sets`, `exercise_count`, `volume_load`, `status`. **Use the view** for History — never re-aggregate in JS.
- `muscle_volume_view` — per-day per-muscle aggregate; powers the heatmap.

Templates:
- One `templates` table with `kind enum('plan_session','quick')` — replaces the prior split between `session_templates` and `workout_templates`.
- `template_exercises` is FK-joined to `exercises.id` (no more `text[]` of names that breaks on rename).
- `template_folders`, `user_template_favorites` unchanged.

`UserData` (in `src/types/workout.ts`) is the in-memory shape held by `App.tsx`. Two plan fields live there with intentionally different meaning:
- `userWorkoutPlans: UserWorkoutPlan[]` — the user's plan **instances** (which plan they're on, with `isActive`, `customName`, `startedAt`).
- `workoutPlans: WorkoutPlan[]` — the **catalog** of plan blueprints they can pick from (own + public). RLS handles visibility.

`gymLogs` is now hydrated from `session_summary_view` on load (see `loadUserData`). The remaining in-memory fields (`workouts`, `customTemplates`, `currentSession`) still reset on reload — migrate them to feature hooks that read on demand from `workout_log` as the relevant features get touched.

## Feature layout

Feature folders under `src/features/` (`workout/`, `history/`, `analytics/`) are the unit of organization. The `workout` feature is by far the largest: `GymView.tsx` is its entry (~1.2k lines — modal split is queued), with `components/`, `hooks/`, and `helpers.ts` (pure state transitions like `finishWorkoutState`, `startNewSessionState`, `updateSetValue`, plus XP/rank math). Workout-session state is owned by `useWorkoutSession`; the rest timer is owned by `useRestTimer` and rendered by the docked `RestTimerBar`. `useLastSessionSets` powers the ghost-value placeholders on set inputs.

Analytics has a body-silhouette muscle heatmap under `src/features/analytics/heatmap/` (`MuscleHeatmap` + `BodySilhouette` + `useMuscleVolume`), embedded in `HistoryAnalyticsView`. `useMuscleVolume` caps `workout_log` reads at 5000 rows.

Rules of thumb:
- **Pure helpers** in `helpers.ts` (no Supabase, no React state).
- **Side-effectful Supabase calls** in `src/services/`.
- **Reusable visual states** (`LoadingState`, `EmptyState`, `ErrorState`) live in `src/components/StateView.tsx` — use them instead of rolling another inline placeholder.

`src/components/` holds shared/cross-feature UI (`GlassCard`, `NeonButton`, `NavBar`, `Header`, `LoginView`, modals, charts). Visual language is a dark "neon/glass" aesthetic via `expo-blur` + `expo-linear-gradient`; design tokens in `src/styles/theme.ts`.

## Conventions

- Supabase URL and anon key come from `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` (see `.env.example`). `src/services/supabase.ts` throws at startup if either is missing.
- `src/types/supabase.ts` is hand-maintained against the migrations. Regenerate with `supabase gen types typescript` after schema changes.
- iOS bundle id and health-data usage strings are configured in `app.json` — keep them in sync with App Store Connect.
- Expo SDK is pinned to 54 (per global preferences) for Expo Go compatibility; do not bump without an explicit ask.
