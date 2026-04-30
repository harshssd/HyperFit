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

There is no test runner, linter, or type-check script wired into `package.json`. To type-check manually: `npx tsc --noEmit`.

Database:
- Migrations live in `supabase/migrations/` (currently consolidated into `20250101000000_clean_initial_schema.sql`). Apply via the Supabase SQL editor or CLI.
- Seed data: `supabase/seeds/initial_data.sql`.
- Apply migrations via the Supabase CLI or SQL editor.

## Architecture

Single-screen Expo app — there is no navigation library. `App.tsx` is the shell: it owns auth state, the loaded `UserData` blob, and a `activeTab` string (`home` | `gym` | `challenges` | `history`) that switches between top-level views. New top-level screens are added by extending the switch in `renderContent()` and the `NAV_ITEMS` constant.

Auth and data flow:
1. `App.tsx` calls `getInitialSession()` / `onAuthStateChange()` from `src/services/supabaseClient.ts` to track the Supabase user.
2. On user change, it calls `loadUserData(user.id, DEFAULT_DATA)` and subscribes via `subscribeToUserData()` for realtime updates.
3. Google OAuth is handled inline in `App.tsx` using `expo-auth-session` + `expo-web-browser` with the `hyperfit://auth/callback` redirect, then `setSessionFromTokens()` finalizes the Supabase session.
4. `UserProvider` (`src/contexts/UserContext.tsx`) wraps the authenticated tree so deeper components can read the current user without prop-drilling.

Two coexisting persistence models — be aware of this when editing:
- **Legacy monolithic blob**: `App.tsx` holds a single `UserData` object (`DEFAULT_DATA` shape from `src/constants/appConstants.ts`) and originally `upsertUserData` wrote the whole thing back. That call is now commented out (`// Deprecated: Monolithic save…`). `saveData` only updates local state.
- **Normalized tables (current direction)**: `src/services/workoutService.ts` talks to normalized Supabase tables (`exercises`, `workout_plans`, `plan_sessions`, `plan_schedule`, workout logs, etc.) typed via `src/types/supabase.ts`. New features should go through this service, not the monolithic blob. RLS policies do the user/public filtering — service queries rely on `auth.uid()`-based policies rather than explicit `.eq('user_id', …)` filters in many places.

Feature folders under `src/features/` (`workout/`, `history/`, `analytics/`) are the unit of organization. The `workout` feature is the most developed: `GymView.tsx` is its entry, with `components/`, `hooks/`, `helpers.ts` (pure state transitions like `finishWorkoutState`, `startNewSessionState`, `updateSetValue`, plus XP/rank math), and `workoutConfig.ts`. Pure helpers live in `helpers.ts`; side-effectful Supabase calls live in `src/services/`. Keep that split.

`src/components/` holds shared/cross-feature UI (`GlassCard`, `NeonButton`, `NavBar`, `Header`, `LoginView`, modals, charts). The visual language is a dark "neon/glass" aesthetic backed by `expo-blur` and `expo-linear-gradient`; styles are centralized in `src/styles/`.

## Conventions specific to this repo

- Supabase URL and anon key are read from `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` (see `.env.example`). `src/services/supabase.ts` throws at startup if either is missing.
- `src/types/supabase.ts` is the generated DB type surface; regenerate after schema changes rather than hand-editing.
- iOS bundle id and health-data usage strings are configured in `app.json` — keep those in sync with App Store Connect.
- Expo SDK is pinned to 54 deliberately (per global preferences) for Expo Go compatibility; do not bump to a newer SDK without an explicit ask.
