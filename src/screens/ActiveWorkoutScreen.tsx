import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GymView } from '../features/workout';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import { useActiveWorkoutSession } from '../contexts/WorkoutSessionContext';
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
  const { session } = useActiveWorkoutSession();

  // If the user dismisses via the swipe-down gesture while the session is in
  // the "finished" state, treat it as the same Close action FinishedSessionView
  // would fire — clear the finished snapshot so the planner doesn't get stuck
  // showing the Resume CTA over a stale finished session.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (session.isSessionFinished) {
        session.startNewSession();
      }
    });
    return unsubscribe;
  }, [navigation, session]);

  return (
    <ScreenLayout scroll={false} errorLabel="Error in workout">
      <GymView
        data={data}
        updateData={setData}
        user={user}
        mode="session"
        onDismissSession={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // Defensive: a deep link to ActiveWorkout would have no back stack.
            // No deep link to this screen exists today — keep the navigator
            // honest if one's added later.
            navigation.reset({ index: 0, routes: [{ name: 'Main' as never }] });
          }
        }}
      />
    </ScreenLayout>
  );
};
