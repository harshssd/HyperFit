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

## Done
- _None_

## How to use
- List: `node scripts/backlog.js list`
- Move status: `node scripts/backlog.js move BL-1 in_progress` (statuses: `todo`, `in_progress`, `done`)
- Add item: `node scripts/backlog.js add "Title here" --category product --notes "short note"`
- Regenerate this file is automatic after any command.

