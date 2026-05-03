/**
 * WORKOUT SERVICE
 * =================
 * All interactions with the normalized workout tables. Schema lives in
 * supabase/migrations/20260430000000_initial_schema.sql.
 *
 * Split by domain:
 *   - exercises          master library + per-user free-text entries
 *   - plans              workout_plans + plan_sessions + plan_exercises CRUD
 *   - userPlans          user_workout_plans (which plan a user is on)
 *   - sessionTemplates   reusable plan-session blueprints (kind=plan_session)
 *   - planSharing        review_status, share codes, import RPCs
 *   - sessions           workout_sessions + workout_sets logging + History
 *
 * Quick templates (kind=quick) live in `services/templates.ts`, not here.
 */

export * from './exercises';
export * from './plans';
export * from './userPlans';
export * from './sessionTemplates';
export * from './planSharing';
export * from './sessions';
