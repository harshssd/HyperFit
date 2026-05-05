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

There is no test runner or linter wired up yet. A `__tests__/` folder exists under `src/services/` and `src/features/workout/` for ad-hoc Jest specs, but they're not run in CI.

Database:
- Migrations live in `supabase/migrations/` and are applied via the Supabase CLI or SQL editor.
- Seed data: `supabase/seeds/initial_data.sql` (exercises, muscle groups), `supabase/seeds/starter_plans.sql` (4 standard public plans).

## Architecture

`App.tsx` mounts `GestureHandlerRootView` → `SafeAreaProvider` → `AuthProvider` → `RootNavigator`. Navigation is react-navigation v7 (auth stack + onboarding stack + bottom tabs + modal stack — see `src/navigation/`).

`RootNavigator` gates between three trees on the auth state:
1. **Auth stack** — `LoginScreen` for signed-out users.
2. **Onboarding stack** — first-signup flow when `auth.user.user_metadata.onboarded_at` is missing. `StarterPlanScreen` writes `onboarded_at` on completion; the auth listener flips state and the navigator swaps in Main automatically.
3. **Main + modals** — `MainTabs` (Home / Plans / Nutrition / History) plus a transparentModal stack for `ActiveWorkout` and `PlanBuilder`, and a standard modal stack for `SessionDetail`, `SharedPlan`, `Calendar`, `Profile`.

Auth and data flow:
1. `useAuth` (in `src/hooks/useAuth.ts`) owns user state, the Supabase auth listener, and the Google OAuth dance via `expo-auth-session` + `expo-web-browser`. It exposes `{ user, status, signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, signOut }`. Apple sign-in is on the pre-launch backlog (App Store guideline 4.8).
2. `useUserData` (in `src/hooks/useUserData.ts`) loads the persisted slice of `UserData` for the signed-in user. It hydrates plan-related fields (`userWorkoutPlans`, `workoutPlans`) and `gymLogs` (distinct workout dates from `session_summary_view`). Other `UserData` fields still live only in memory.
3. `UserProvider` (in `src/contexts/UserContext.tsx`) re-exposes the current `User` to deep components that don't get props.
4. `WorkoutSessionProvider` (in `src/contexts/WorkoutSessionContext.tsx`) owns the in-flight workout session so `ActiveWorkout` (transparentModal) and the underlying Plans tab share state.
5. `AppDataProvider` (`src/contexts/AppDataContext.tsx`) wraps `UserData` with a setter so deep components can mutate without prop-drilling.

Realtime sync is intentionally **not** wired up. When realtime is needed, subscribe per table (`workout_sessions`, `user_workout_plans`, `nutrition_entries`) rather than to a monolithic user blob.

## Data model

The base schema is `20260430000000_initial_schema.sql`. Subsequent migrations are additive (no destructive rewrites). When the type definitions in `src/types/supabase.ts` get out of sync, regenerate with `supabase gen types typescript`.

The plan world:
- `workout_plans` — blueprint catalog (own + public). Standard plans live here as seed rows with `is_public=true` and `user_id=null` (NOT a separate table). Same UI codepath for standard and user plans; "edit" on a standard plan offers "duplicate to my plans" instead of in-place edit.
- `plan_sessions` — sessions inside a plan, owned outright (no template coupling).
- `plan_exercises` — exercises in a plan_session, FK to master `exercises`.
- `plan_schedule` — which session(s) on which day-of-week.
- `user_workout_plans` — instance: which plan a user is on. At most one `is_active` row per user (unique partial index `user_workout_plans_active_unique`). Multi-active was deferred — don't propose it without an explicit ask.
- **Plan share** (`20260502_plan_share`): owners toggle `is_shareable=true` to mint a `share_code`. Public read via `get_plan_by_share_code(code)` RPC; revoke via toggling the flag; rotate via `rotate_plan_share_code(plan_id)`. The receiver lands on `SharedPlanScreen`.
- **Plan moderation** (`20260501_plan_moderation`): public plans run through report/flag tables before showing in browse.

The session-log world:
- `workout_sessions` — one row per logged workout (parent). Holds `workout_date`, `name`, `start_time`, `end_time`, optional `plan_id` / `plan_session_id` linkage.
- `workout_sets` — child rows, FK to `workout_sessions`. Each row is a single set with `set_number`, `weight`, `reps`, `completed`, `order_index`.
- `session_summary_view` — folds sessions+sets into one row per session with `total_sets`, `exercise_count`, `volume_load`, `status`. **Use the view** for History — never re-aggregate in JS.

The muscle-recruitment world (`20260506_muscle_recruitment`):
- The legacy `muscle_volume_view` (even split across muscle_groups) is gone. The new `muscle_volume_v2_view` weights per-set volume by recruitment coefficients on each exercise's primary/secondary muscles. `useMuscleVolume`, `sessionMuscleVolume.ts`, and `monthMuscleVolume.ts` all read v2.
- `plan_muscle_coverage_view` (`20260507`) — analogous aggregate at the plan level, used by `SharePlanSheet` to render the silhouette intensity for a plan.

Exercises:
- `exercises` is the master library (canonical name + muscle mappings). `20260504100000_expand_exercise_library` added 26 staples + a `seed_exercise_library` function (`20260504200000`).
- `user_exercises` (`20260504300000_split_user_exercises`) is a separate per-user table for free-text entries — keeps the master library clean while still persisting whatever the user typed during a workout.

Nutrition (`20260505_nutrition_schema`):
- `user_nutrition_settings` — per-user goals (singleton). Display unit (`ml | oz`) lives here; the DB always stores volumes in ml.
- `nutrition_days` — per-user-per-date parent row with cheat flag, optional per-day target overrides, optional note.
- `nutrition_entries` — meal entries, FK to `nutrition_days`. Has `meal_slot` enum (`breakfast | lunch | dinner | snack`) and a free-text `meal_label` (`20260507_nutrition_meal_label`) for custom labels like "Pre-workout."
- `water_logs` — one row per tap (cup / bottle / custom). Separate from food because the input pattern is fundamentally different.
- `nutrition_day_summary_view` — folds entries+water into one row per day with totals and status. History reads this view.
- All RLS-fenced by `user_id = auth.uid()`.

Templates (legacy):
- `templates` (kind enum `'plan_session' | 'quick'`) and `template_exercises` (FK to `exercises.id`, no text arrays) still exist. New plan creation flows through `SlimPlanCreator`, not templates — leave templates alone unless touching them is the point.

`UserData` (in `src/types/workout.ts`) is the in-memory shape held by `App.tsx`. Two plan fields live there with intentionally different meaning:
- `userWorkoutPlans: UserWorkoutPlan[]` — the user's plan **instances** (which plan they're on, with `isActive`, `customName`, `startedAt`).
- `workoutPlans: WorkoutPlan[]` — the **catalog** of plan blueprints they can pick from (own + public). RLS handles visibility.

## Feature layout

Feature folders under `src/features/` (`workout/`, `history/`, `analytics/`, `nutrition/`, `calendar/`) are the unit of organization.

**`workout/`** is the largest feature. `GymView.tsx` is its entry (~1.2k lines, modal split is queued).
- `components/` houses everything from `RestTimerBar` to the new `SlimPlanCreator`. The plan creator was rebuilt: the old 1.4k-line `WorkoutPlanCreator` is gone; `SlimPlanCreator.tsx` + `components/plan-creator/` (DayPicker, FocusPicker, NumField, PlanBasicInfo, SessionExerciseEditor) replaced it. `PlanBuilderScreen` (transparentModal) hosts it for create / edit / duplicate.
- `hooks/` owns the workout-session state machine: `useWorkoutSession`, `useRestTimer`, `useLastSessionSets` (ghost values), `useSessionPersistence`, `usePlanActions`, `useTemplates`, `useRecentWorkouts`.
- `helpers/` (folder, not a single file) holds pure state transitions like `finishWorkoutState`, `startNewSessionState`, `updateSetValue`, plus XP/rank math.
- The post-session card (`FinishedSessionView`) shows a PR badge fed by `services/sessionPRs.countSessionPRs`.

**`history/`** wraps the `session_summary_view` reader and the per-session detail view. `SessionDetailView` is the body for both an in-tab modal and the deep-linked `SessionDetailScreen` (modal route).

**`analytics/heatmap/`** owns the body-silhouette muscle heatmap (`MuscleHeatmap`, `BodySilhouette`, `useMuscleVolume`). `useMuscleVolume` reads `muscle_volume_v2_view` and caps reads at 5000 rows.

**`nutrition/`** is the full nutrition vertical:
- `NutritionView.tsx` — orange-hairline focus surface with macro pills, water controls, ADD MEAL CTA, and a flat `EntriesList` (newest-first feed; replaced the four-MealCard layout).
- `components/`: `EntriesList`, `WaterControls` (CUP / BOTTLE preset row + CUSTOM AMOUNT inline input — converts oz→ml at submit since the DB only sees ml), `AddMealModal`, `GoalSetupSheet`, `CheatDayToggle`, `CheatDayPlanner`, `WeekRows`.
- `hooks/useNutritionDay.ts` — fetches today's row, exposes mutations (`addEntry`, `deleteEntry`, `addWater`, etc.).

**`calendar/`** holds `CalendarView` + `useCalendarData` (past logs from `session_summary_view`, future scheduled sessions from the active plan + `plan_schedule`) and `useMonthMuscleIntensities` (month roll-up for the silhouette).

**Onboarding** (`src/screens/onboarding/`):
- `OnboardingChrome` — shared 3-dot progress + skip + continue.
- `IdentityScreen` (name + units), `GoalScreen` (BUILD / CUT / MAINTAIN / JUST TRACK), `StarterPlanScreen` (pick from 4 seed plans).
- Forward-only navigation (`gestureEnabled: false`). Each screen writes to `auth.user.user_metadata` via `services/profile.ts` so a kill mid-flow doesn't lose state. `markOnboarded()` only fires on success or skip-from-S3.

**Share cards** (`src/components/share/`):
- `ShareableSummaryCard` — fixed 1080×1350 React Native view captured by `react-native-view-shot`. Discriminated union `kind: 'workout' | 'plan'` with shared silhouette + TOP EXERCISES section (name + set count, NOT muscle group volume). `prCount` badge on workout cards.
- `useShareCard` — wraps capture + share-sheet plumbing.
- `SharePreviewSheet`, `SharePlanSheet` — bottom-sheet hosts.

Rules of thumb:
- **Pure helpers** in `helpers.ts` / `helpers/` (no Supabase, no React state).
- **Side-effectful Supabase calls** in `src/services/`.
- **Reusable visual states** (`LoadingState`, `EmptyState`, `ErrorState`) live in `src/components/StateView.tsx` — use them instead of rolling another inline placeholder.

`src/components/` holds shared/cross-feature UI (`GlassCard`, `NeonButton`, `Header`, `LoginView`, `ScreenLayout`, share components, modals, charts).

## Design system

Always read `DESIGN.md` before making any visual or UI decision. All color, type, spacing, and aesthetic direction is defined there.

Visual language follows the **"honest mirror" direction**: anthracite base, strava-orange (`accent.lift` / `palette.liftActive`) for active/lift signals, robinhood-green (`accent.sessionUp`) for session-volume improvement and water (the rare metric where "more = better" is uncomplicated), mono numerics with `fontVariant={fonts.tabularNums}` on every readout.

Use `palette.*`, `text.*`, `accent.*` from `src/styles/theme.ts` instead of hardcoded hex values. Set `fontVariant={fonts.tabularNums}` on every numeric `Text` component — it's how stat columns line up.

The global `Header` is wordmark-only (`HYPER` + orange `FIT`, no logo tile). Its top padding floors against `Constants.statusBarHeight` so it renders correctly inside transparentModal screens (where `react-native-screens` returns `insets.top=0` on iOS).

## Conventions

- Supabase URL and anon key come from `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` (see `.env.example`). `src/services/supabase.ts` throws at startup if either is missing.
- `src/types/supabase.ts` is hand-maintained against the migrations. Regenerate with `supabase gen types typescript` after schema changes.
- iOS bundle id is `com.hyperfocused.hyperfit` (portfolio convention `com.hyperfocused.<slug>`); health-data usage strings live in `app.json` — keep both in sync with App Store Connect.
- Expo SDK is pinned to 54 (per global preferences) for Expo Go compatibility; do not bump without an explicit ask.
- Pre-launch backlog: Apple sign-in (App Store guideline 4.8) — required before submission since Google OAuth ships.
