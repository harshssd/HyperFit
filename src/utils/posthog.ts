import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = 'https://us.i.posthog.com';

let posthog: PostHog | null = null;

// Identifies this app within a shared PostHog project.
// Filter dashboards by this property to separate apps.
const APP_NAME = 'hyperfit';

export async function initAnalytics(): Promise<void> {
  if (!POSTHOG_API_KEY) return;
  // Idempotent: dev hot-reloads call this every fast-refresh, no need to
  // recreate the SDK or rebind the global error handler.
  if (posthog) return;
  try {
    posthog = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_HOST,
      // Batch events and flush every 30s to avoid excessive network calls
      flushInterval: 30000,
      flushAt: 20,
    });
    // Super properties — automatically attached to every event so dashboards
    // can slice by app and by version without each capture call respecifying.
    posthog.register({
      app_name: APP_NAME,
      app_version: Constants.expoConfig?.version ?? 'unknown',
    });
    installGlobalErrorHandler();
  } catch {
    // Analytics init failure must never crash the app
    posthog = null;
  }
}

export function trackEvent(
  event: string,
  properties?: Record<string, string | number | boolean>,
): void {
  try {
    posthog?.capture(event, properties);
  } catch {
    // Silent failure — analytics must never block the user
  }
}

/** Associate subsequent events + flag evaluations with a specific user id.
 *  Only call this AFTER the user signs in. Anonymous distinct id is the default. */
export function identifyUser(
  userId: string,
  properties?: Record<string, string | number | boolean>,
): void {
  try {
    posthog?.identify(userId, properties);
  } catch {
    // identify must never throw
  }
}

/** Reset the distinct id back to anonymous. Call on sign-out so the next user
 *  doesn't inherit the previous user's identity. */
export function resetAnalytics(): void {
  try {
    posthog?.reset();
  } catch {
    // reset must never throw
  }
}

export function captureException(
  error: unknown,
  context?: Record<string, string | number | boolean>,
): void {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    posthog?.captureException(err, context);
  } catch {
    // Capturing exceptions must never throw
  }
}

// Hook React Native's global JS error handler so uncaught errors reach PostHog.
// ErrorUtils is a React Native global; we chain to any previous handler so we
// don't break the yellow/red-box dev behavior.
function installGlobalErrorHandler(): void {
  const RN_ErrorUtils = (
    globalThis as {
      ErrorUtils?: {
        getGlobalHandler?: () => ((e: Error, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (h: (e: Error, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;
  if (!RN_ErrorUtils?.setGlobalHandler || !RN_ErrorUtils.getGlobalHandler) return;
  const previous = RN_ErrorUtils.getGlobalHandler();
  RN_ErrorUtils.setGlobalHandler((error, isFatal) => {
    captureException(error, { source: 'global_handler', is_fatal: Boolean(isFatal) });
    previous?.(error, isFatal);
  });
}

// Event name constants — single source of truth for analytics event names.
export const AnalyticsEvents = {
  APP_OPENED: 'app_opened',
  SCREEN_VIEW: 'screen_view',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',
  WORKOUT_STARTED: 'workout_started',
  WORKOUT_FINISHED: 'workout_finished',
  MEAL_LOGGED: 'meal_logged',
  WATER_LOGGED: 'water_logged',
  GOAL_SET: 'goal_set',
  // Onboarding funnel — drives launch-traffic activation analysis.
  // Each step fires `viewed` on mount and `completed`/`skipped` on exit so
  // PostHog dashboards can chart the drop-off between every step.
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_STEP_SKIPPED: 'onboarding_step_skipped',
  ONBOARDING_FINISHED: 'onboarding_finished',
} as const;
