import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IdentityScreen } from './IdentityScreen';
import { GoalScreen } from './GoalScreen';
import { StarterPlanScreen } from './StarterPlanScreen';
import type { OnboardingStackParamList } from '../../navigation/types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

/**
 * Onboarding flow for first signup. Forward-only — every screen has its
 * own SKIP affordance; mistakes get fixed later from Profile. Once the
 * StarterPlanScreen calls `markOnboarded()`, the auth listener flips
 * `user.user_metadata.onboarded_at` and RootNavigator swaps in `Main`.
 */
export const OnboardingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      gestureEnabled: false,
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="Identity" component={IdentityScreen} />
    <Stack.Screen name="Goal" component={GoalScreen} />
    <Stack.Screen name="StarterPlan" component={StarterPlanScreen} />
  </Stack.Navigator>
);
