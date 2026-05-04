/**
 * Map Supabase auth errors to human copy.
 *
 * Supabase exposes a `code` field on AuthApiError (e.g. `invalid_credentials`,
 * `email_not_confirmed`) when available, and falls back to the raw `message`
 * string for older clients and provider errors. We match on both so we keep
 * working as the SDK evolves.
 */

const codeMap: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect.',
  email_not_confirmed: 'Check your email to confirm your account first.',
  user_already_exists: 'An account with this email already exists. Try signing in.',
  user_not_found: 'No account found for that email.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a minute and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
  weak_password: 'Password is too weak. Use at least 6 characters.',
  same_password: "That's already your current password.",
  signup_disabled: 'Sign-ups are temporarily disabled.',
  email_address_invalid: 'That email address looks invalid.',
};

const messageContains: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'Email or password is incorrect.'],
  [/email not confirmed/i, 'Check your email to confirm your account first.'],
  [/already registered|user already exists/i, 'An account with this email already exists. Try signing in.'],
  [/rate limit|too many requests/i, 'Too many attempts. Wait a minute and try again.'],
  [/password should be at least/i, 'Password must be at least 6 characters.'],
  [/signups? (are )?(not allowed|disabled)/i, 'Sign-ups are temporarily disabled.'],
  [/network|fetch failed|failed to fetch/i, 'Network issue. Check your connection and try again.'],
  [/invalid email|valid email/i, 'That email address looks invalid.'],
];

export const friendlyAuthError = (err: unknown, fallback = 'Something went wrong. Try again.'): string => {
  if (!err) return fallback;
  const e = err as { code?: string; message?: string };
  if (e.code && codeMap[e.code]) return codeMap[e.code];
  if (e.message) {
    for (const [pattern, copy] of messageContains) {
      if (pattern.test(e.message)) return copy;
    }
    return e.message;
  }
  return fallback;
};
