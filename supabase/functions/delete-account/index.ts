// delete-account — wipe the calling user from auth.users.
//
// Authenticated endpoint. The caller's JWT identifies which user to
// delete; we never accept a user_id parameter (would be account-takeover
// via stolen service-role key bait). Auth happens via the standard
// Supabase Authorization header — `verify_jwt = true` in config.toml
// would also work, but we read the JWT explicitly so we get a typed
// User object back from auth.getUser().
//
// What gets deleted: the auth.users row + every row in user-scoped
// tables that FK-cascades on auth.users(id). The cascade map (verified
// 2026-05-06):
//   * workout_sessions, workout_sets (via session)
//   * user_workout_plans
//   * user_exercises
//   * nutrition_days, nutrition_entries (via day), water_logs
//   * user_nutrition_settings
//   * workout_plans where user_id IS NOT NULL (own plans)
//   * templates / template_exercises
// Public seed plans (workout_plans with user_id = NULL) are unaffected.
//
// TODO(phase-2): When users have signed in with Apple, also revoke
// their Apple session via POST https://appleid.apple.com/auth/revoke
// using the stored refresh_token. Required by Apple guideline 5.1.1(v)
// for SIWA users; deferred to v2.3.0 because token capture isn't wired
// into the iOS native flow yet.
//
// Returns 204 on success, 401 if JWT is missing or invalid, 500 if the
// admin call fails. The client signs out locally on any 2xx.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Extract bearer JWT. Supabase Edge Functions strip the `Bearer ` prefix
  // when forwarding via the gateway, but we accept either form.
  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'no_jwt' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // Single service-role client. auth.getUser(jwt) takes the JWT as a
  // parameter, validates the signature server-side, and returns the
  // user. No need for a second client with Authorization headers —
  // the JWT-as-param path doesn't depend on the client's session.
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await adminClient.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'invalid_jwt' }), {
      status: 401,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  const userId = userData.user.id;

  // Hard delete via the admin API. shouldSoftDelete defaults to false.
  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteErr) {
    console.error('delete-account: admin.deleteUser failed', {
      userId,
      message: deleteErr.message,
    });
    return new Response(
      JSON.stringify({ error: 'delete_failed', message: deleteErr.message }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      },
    );
  }

  return new Response(null, { status: 204, headers: CORS_HEADERS });
});
