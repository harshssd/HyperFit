import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep-link configuration.
 *
 * Note: hyperfit://auth/callback is intentionally NOT mapped here. The
 * Google OAuth dance in useAuth.signInWithGoogle uses
 * WebBrowser.openAuthSessionAsync, which intercepts the redirect inline
 * and parses tokens directly. If the OS were to deliver that URL through
 * the navigator (cold start, dismissed sheet) we'd want it to no-op
 * rather than route to a screen and silently drop the tokens.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Plans: 'plans',
          History: 'history',
          Calendar: 'calendar',
        },
      },
      ActiveWorkout: 'session/active',
      PlanBuilder: 'plan/builder',
      SessionDetail: 'session/:sessionId',
      SharedPlan: 'plan/share/:code',
    },
  },
};
