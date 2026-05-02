# Backlog

Managed via `backlog/backlog.json` + `node scripts/backlog.js`.

## In Progress
- _None_

## Todo
- **BL-1** CI lint/format/type checks + unit/integration tests + E2E smoke — ESLint/Prettier/TypeScript strict; unit/integration around templates/session/sync; Detox/Playwright smoke.
- **BL-2** Data & sync hardening — Supabase constraints/RLS; optimistic updates with rollback; offline queue.
- **BL-3** Performance & UX polish — Virtualize template list, cache + debounce search, skeletons/retry.
- **BL-4** Observability — Logging/analytics for template/session funnels; Sentry/Crashlytics for errors.
- **BL-5** Release hygiene — Dev/stage/prod envs; versioning and release checklist; feature flags for new tabs.
- **BL-6** Security & accounts — Auth hardening, secure storage, privacy/scoping for templates.
- **BL-7** Steps tab MVP — Device pedometer integration; daily summary/history; goals/reminders.
- **BL-8** Challenges tab MVP — Join/leave, progress tracking, streaks, social share.
- **BL-10** Atomic activate-plan via RPC — Currently deactivateUserWorkoutPlans + updateUserWorkoutPlan/createUserWorkoutPlan are two separate round-trips. A parallel client (multi-device) could race between them. Wrap both in a Postgres SECURITY DEFINER function activate_user_workout_plan(plan_id) that runs the deactivate+activate in one transaction. Low priority — single-device users won't hit this.
- **BL-12** Login + Onboarding UI polish — Tighten the login screen to match the honest-mirror design system (anthracite base, mono caps, strava-orange CTA) and add a 2-3 screen onboarding flow for first-time signups. Onboarding: (a) intro/value prop, (b) optional goal pick (strength/hypertrophy/general), (c) jump straight into Browse Plans with the 4 standard plans pre-filtered. Login screen items: Apple sign-in button (iOS), Google button styling once OAuth is enabled in Supabase, password reset flow, helpful errors instead of raw Supabase messages. See feedback_pr_workflow / DESIGN.md for tokens.
- **BL-13** Auth integration automation toolkit — Reduce per-project auth setup to a single command. Today every new app repeats: configure Google/Apple OAuth client in their consoles, add redirect URIs, paste client IDs into Supabase Auth providers, set Supabase Site URL + Redirect allow-list to the app scheme, wire useAuth + expo-auth-session, add Apple sign-in entitlement, handle deep-link callback. Goal: a hyperfit-auth-kit (script + template) that (a) prompts for app scheme + bundle id, (b) generates the useAuth hook + login screen pre-styled per DESIGN.md, (c) writes the correct Supabase URL config via the management API, (d) optionally provisions Google OAuth client via gcloud + Apple service ID via App Store Connect API, (e) writes .env.example entries and app.json scheme/entitlements. Stretch: a doctor command that diagnoses the localhost-redirect class of bugs by reading Supabase config + app.json and reporting mismatches. Reference: this project's hyperfit:// scheme, EXPO_PUBLIC_SUPABASE_* env vars, src/hooks/useAuth.ts.

## Done
- **BL-9** Test runner + unit tests (helpers, services) — Wire jest-expo + @testing-library/react-native, add npm test script + CI step. First batch: pure helpers in src/features/workout/helpers.ts (finishWorkoutState, startNewSessionState, updateSetValue, XP/rank math). Then services. BL-1 covers the broader CI/lint/E2E story; this is the test-runner foundation it depends on.
- **BL-11** Calendar view: past logs + future planned workouts — Single calendar surface that shows: (a) past dates with logged workouts (link to session detail), and (b) upcoming dates with the active plan's scheduled sessions per plan_schedule. Likely a dedicated tab or screen, not a modal — the heatmap on History only shows volume, not a day-by-day workout-name view. Source data: workout_sessions for past, active user_workout_plan + plan_schedule for future. Probably wants month + week views.


## How to use
- List: `node scripts/backlog.js list`
- Move status: `node scripts/backlog.js move BL-1 in_progress` (statuses: `todo`, `in_progress`, `done`)
- Add item: `node scripts/backlog.js add "Title here" --category product --notes "short note"`
- Regenerate this file is automatic after any command
