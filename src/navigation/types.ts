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
  Plans: undefined; // formerly "Gym" — list of user's plans
  Challenges: undefined;
  History: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  ActiveWorkout: { sessionId?: string } | undefined;
  PlanBuilder: { planId?: string } | undefined;
  // ExercisePicker uses an event-bus pattern (TBD) instead of a callback
  // route param — function params break deep-link serialization and
  // navigation state persistence.
  ExercisePicker: { context?: string } | undefined;
  SessionDetail: { sessionId: string };
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // Make typed useNavigation/useRoute hooks pick up these types globally.
    interface RootParamList extends RootStackParamList {}
  }
}
