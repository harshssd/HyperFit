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
- **BL-9** Test runner + unit tests (helpers, services) — Wire jest-expo + @testing-library/react-native, add npm test script + CI step. First batch: pure helpers in src/features/workout/helpers.ts (finishWorkoutState, startNewSessionState, updateSetValue, XP/rank math). Then services. BL-1 covers the broader CI/lint/E2E story; this is the test-runner foundation it depends on.
- **BL-10** Atomic activate-plan via RPC — Currently deactivateUserWorkoutPlans + updateUserWorkoutPlan/createUserWorkoutPlan are two separate round-trips. A parallel client (multi-device) could race between them. Wrap both in a Postgres SECURITY DEFINER function activate_user_workout_plan(plan_id) that runs the deactivate+activate in one transaction. Low priority — single-device users won't hit this.

## Done
- **BL-11** Calendar view: past logs + future planned workouts — Single calendar surface that shows: (a) past dates with logged workouts (link to session detail), and (b) upcoming dates with the active plan's scheduled sessions per plan_schedule. Likely a dedicated tab or screen, not a modal — the heatmap on History only shows volume, not a day-by-day workout-name view. Source data: workout_sessions for past, active user_workout_plan + plan_schedule for future. Probably wants month + week views.


## How to use
- List: `node scripts/backlog.js list`
- Move status: `node scripts/backlog.js move BL-1 in_progress` (statuses: `todo`, `in_progress`, `done`)
- Add item: `node scripts/backlog.js add "Title here" --category product --notes "short note"`
- Regenerate this file is automatic after any command
