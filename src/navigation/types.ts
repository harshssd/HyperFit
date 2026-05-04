import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Navigation param lists. Keep these in one file so screens can pull
 * `RouteProp<RootStackParamList, 'Foo'>` without circular imports.
 *
 * Structure:
 *   Root (native stack)
 *   ├── Auth — only mounted when unauthenticated
 *   ├── Main — tab navigator, mounted when authenticated
 *   ├── ActiveWorkout — modal over Main
 *   ├── PlanBuilder — modal
 *   ├── ExercisePicker — modal
 *   └── SessionDetail — modal
 */

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  /** formerly "Gym" — list of user's plans. `intent` is a one-shot:
   *  - 'pick'   → open the plan library in session-pick mode
   *  - 'manual' → open the empty-workout overview with the exercise picker
   *  Cleared after consumed so a manual revisit doesn't re-trigger. */
  Plans: { intent?: 'pick' | 'manual' } | undefined;
  /** intent is a one-shot:
   *  - 'add-meal' → land on Nutrition + open AddMealModal
   *  Cleared after consumed so a tab revisit doesn't re-trigger. */
  Nutrition: { intent?: 'add-meal' } | undefined;
  History: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ActiveWorkout: { sessionId?: string } | undefined;
  /** mode + planId together drive create / edit / duplicate. Omit both for create. */
  PlanBuilder: { planId?: string; mode?: 'create' | 'edit' | 'duplicate' } | undefined;
  // ExercisePicker uses an event-bus pattern (TBD) instead of a callback
  // route param — function params break deep-link serialization and
  // navigation state persistence.
  ExercisePicker: { context?: string } | undefined;
  SessionDetail: { sessionId: string };
  /** Preview + import a plan someone shared with you via a share code. */
  SharedPlan: { code: string };
  /** Full month schedule — formerly the Calendar tab; now a modal from Home. */
  Calendar: undefined;
  /** Profile / account modal. Opened from the avatar in Home's top bar. */
  Profile: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // Make typed useNavigation/useRoute hooks pick up these types globally.
    interface RootParamList extends RootStackParamList {}
  }
}
