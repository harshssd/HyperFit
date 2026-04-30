import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoadingScreen from '../components/LoadingScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuthContext } from '../contexts/AuthContext';
import { useUserData } from '../hooks/useUserData';
import { UserProvider } from '../contexts/UserContext';
import { AppDataProvider } from '../contexts/AppDataContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { linking } from './linking';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level navigator. Switches between Auth and Main based on auth status,
 * and presents Active Workout / Plan Builder / etc. as modals over either.
 *
 * Modal screens are placeholders for now — they'll be populated when the
 * GymView split lands. Keeping them registered up-front means call sites
 * (`navigation.navigate('ActiveWorkout')`) compile today and stop being a
 * later refactor.
 */
export const RootNavigator = () => {
  const auth = useAuthContext();
  const userData = useUserData(auth.user);

  if (auth.status === 'loading' || (auth.status === 'authenticated' && userData.loading)) {
    return <LoadingScreen message="INITIALIZING SYSTEM..." />;
  }

  return (
    <NavigationContainer linking={linking} fallback={<LoadingScreen message="LOADING..." />}>
      <ErrorBoundary fallbackLabel="The app hit an error">
        <UserProvider user={auth.user}>
          <AppDataProvider value={{ data: userData.data, setData: userData.setData, refresh: userData.refresh, signOut: auth.signOut }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {auth.user ? (
                <Stack.Group>
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Group screenOptions={{ presentation: 'modal' }}>
                    {/* Modal routes — implementations land in a follow-up. */}
                    <Stack.Screen name="ActiveWorkout" component={PlaceholderModal} />
                    <Stack.Screen name="PlanBuilder" component={PlaceholderModal} />
                    <Stack.Screen name="ExercisePicker" component={PlaceholderModal} />
                    <Stack.Screen name="SessionDetail" component={PlaceholderModal} />
                  </Stack.Group>
                </Stack.Group>
              ) : (
                <Stack.Screen name="Auth" component={AuthStack} />
              )}
            </Stack.Navigator>
          </AppDataProvider>
        </UserProvider>
      </ErrorBoundary>
    </NavigationContainer>
  );
};

import { View, Text } from 'react-native';
const PlaceholderModal = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
    <Text style={{ color: '#f8fafc' }}>Modal — implementation pending</Text>
  </View>
);
