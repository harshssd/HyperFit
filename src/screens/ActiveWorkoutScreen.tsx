import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GymView } from '../features/workout';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ActiveWorkout'>;

/**
 * Modal route that hosts the active workout UI. Mounts <GymView mode="session">,
 * which gates its rendering to the focus / list / finished surfaces only and
 * skips every planner branch. The session itself lives in WorkoutSessionContext
 * so the underlying Plans tab and this modal share state.
 */
export const ActiveWorkoutScreen = () => {
  const { user } = useUser();
  const { data, setData } = useAppData();
  const navigation = useNavigation<Nav>();

  return (
    <ScreenLayout scroll={false} errorLabel="Error in workout">
      <GymView
        data={data}
        updateData={setData}
        user={user}
        mode="session"
        onDismissSession={() => {
          if (navigation.canGoBack()) navigation.goBack();
        }}
      />
    </ScreenLayout>
  );
};
