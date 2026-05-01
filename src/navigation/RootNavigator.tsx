import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoadingScreen from '../components/LoadingScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuthContext } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { UserProvider } from '../contexts/UserContext';
import { AppDataProvider } from '../contexts/AppDataContext';
import { WorkoutSessionProvider } from '../contexts/WorkoutSessionContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { ActiveWorkoutScreen } from '../screens/ActiveWorkoutScreen';
import { linking } from './linking';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level navigator. NavigationContainer is mounted unconditionally — it
 * survives auth flips and userData refreshes, so we don't lose nav state
 * (e.g. a half-typed plan in PlanBuilder) when the data layer reloads.
 *
 * Modal screens are placeholders for now — they'll be populated when the
 * GymView split lands. In dev we throw on accidental navigation so they
 * never ship as dead screens.
 */
export const RootNavigator = () => {
  const auth = useAuthContext();
  const userData = useUserData(auth.user);

  // Only block on the initial auth check — userData refreshes must not
  // unmount the navigator.
  if (auth.status === 'loading') {
    return <LoadingScreen message="INITIALIZING SYSTEM..." />;
  }

  return (
    <NavigationContainer linking={linking} fallback={<LoadingScreen message="LOADING..." />}>
      <ErrorBoundary fallbackLabel="The app hit an error">
        <UserProvider user={auth.user}>
          <AppDataProvider
            value={{
              data: userData.data,
              setData: userData.setData,
              refresh: userData.refresh,
              signOut: auth.signOut,
            }}
          >
            {/* Key on user id so signing out and back in as a different user
                discards any in-memory session, preventing cross-user log bleed. */}
            <WorkoutSessionProvider key={auth.user?.id ?? 'anon'}>
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                {auth.user ? (
                  <Stack.Group>
                    <Stack.Screen name="Main" component={MainTabs} />
                    {/* ActiveWorkout uses transparentModal so the underlying
                        tab bar stays mounted/visible (per design decision). */}
                    <Stack.Screen
                      name="ActiveWorkout"
                      component={ActiveWorkoutScreen}
                      options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
                    />
                    <Stack.Group screenOptions={{ presentation: 'modal' }}>
                      <Stack.Screen name="PlanBuilder" component={PlaceholderModal} />
                      <Stack.Screen name="ExercisePicker" component={PlaceholderModal} />
                      <Stack.Screen name="SessionDetail" component={PlaceholderModal} />
                    </Stack.Group>
                  </Stack.Group>
                ) : (
                  <Stack.Screen name="Auth" component={AuthStack} />
                )}
              </Stack.Navigator>
            </WorkoutSessionProvider>
          </AppDataProvider>
        </UserProvider>
      </ErrorBoundary>
    </NavigationContainer>
  );
};

const PlaceholderModal = () => {
  if (__DEV__) {
    throw new Error(
      'A modal screen is registered but not implemented. Either implement it in the GymView-split PR or remove the call site.'
    );
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
      <Text style={{ color: '#f8fafc' }}>Coming soon</Text>
    </View>
  );
};
