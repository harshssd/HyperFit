import * as Linking from 'expo-linking';
import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep-link configuration. Routes hyperfit://auth/callback (used by the
 * Google OAuth dance in useAuth) and other deep links into the navigator.
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), 'hyperfit://'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'auth/callback',
        },
      },
      Main: {
        screens: {
          Home: 'home',
          Plans: 'plans',
          History: 'history',
          Challenges: 'challenges',
        },
      },
      ActiveWorkout: 'session/active',
      PlanBuilder: 'plan/builder',
      SessionDetail: 'session/:sessionId',
    },
  },
};
