import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import HomeView from '../components/HomeView';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { useActiveWorkoutSession } from '../contexts/WorkoutSessionContext';
import { calculateXP } from '../features/workout/helpers';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const tabIdToRoute: Record<string, keyof MainTabParamList> = {
  home: 'Home',
  gym: 'Plans',
  nutrition: 'Nutrition',
  history: 'History',
  stats: 'History',
};

export const HomeScreen = () => {
  const { data } = useAppData();
  const navigation = useNavigation<Nav>();
  const { session, activeUserPlan } = useActiveWorkoutSession();

  // Open the Plans tab with `intent: 'manual'` — Plans surfaces the empty
  // workout overview + exercise picker on focus. Routing through Plans
  // keeps the manual-build UX in one place (it's the same surface as
  // tapping LOG MANUAL WORKOUT manually) without duplicating the picker
  // inside the ActiveWorkout modal.
  const handleStartCustom = () => {
    navigation.navigate('Plans', { intent: 'manual' });
  };

  // Start the next planned session from the active plan. Mirrors the
  // planner's START [DAY]'S WORKOUT path: load the session into state,
  // tagged 'scheduled', then push ActiveWorkout.
  const handleStartUpcoming = (planSessionId: string) => {
    if (!activeUserPlan?.planData) return;
    session.startSessionFromPlan(activeUserPlan.planData, planSessionId, 'scheduled');
    navigation.navigate('ActiveWorkout');
  };

  // Open the Plans tab with a one-shot route param asking the library to
  // surface in session-pick mode. Lets the user start any session from
  // any plan ad-hoc, without committing to it as their active plan.
  const handlePickFromLibrary = () => {
    navigation.navigate('Plans', { intent: 'pick' });
  };

  // Land on Nutrition with intent: 'add-meal' so the modal pops on focus.
  // Same one-shot pattern as Plans → 'pick' / 'manual'.
  const handleLogMeal = () => {
    navigation.navigate('Nutrition', { intent: 'add-meal' });
  };
  // Water has always-visible +CUP / +BOTTLE on the Nutrition tab — just
  // navigate; no modal/intent needed.
  const handleLogWater = () => {
    navigation.navigate('Nutrition');
  };

  // HomeView owns its own ScrollView; opt out of the layout wrapper so we
  // don't nest scroll surfaces (matches Plans and History).
  return (
    <ScreenLayout scroll={false} errorLabel="Error in Home">
      <HomeView
        data={data}
        streak={data.gymLogs.length}
        xp={calculateXP(data)}
        onChangeView={view => {
          if (view === 'calendar') {
            navigation.navigate('Calendar');
            return;
          }
          const route = tabIdToRoute[view];
          if (route) navigation.navigate(route as never);
        }}
        onStartCustom={handleStartCustom}
        onStartUpcoming={handleStartUpcoming}
        onPickFromLibrary={handlePickFromLibrary}
        onLogMeal={handleLogMeal}
        onLogWater={handleLogWater}
      />
    </ScreenLayout>
  );
};
