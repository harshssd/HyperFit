import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser } from './UserContext';
import { useAppData } from './AppDataContext';
import { useRestTimer, UseRestTimerReturn } from '../features/workout/hooks/useRestTimer';
import {
  useWorkoutSession,
  UseWorkoutSessionReturn,
} from '../features/workout/hooks/useWorkoutSession';

type WorkoutSessionContextValue = {
  session: UseWorkoutSessionReturn;
  restTimer: UseRestTimerReturn;
};

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | undefined>(undefined);

/**
 * Owns the single instance of the active-workout state machine for the whole
 * app. Mounted once at the navigator level so both the Gym tab (planner /
 * "resume" surfaces) and the upcoming ActiveWorkout modal route share one
 * `useWorkoutSession` rather than instantiating it twice and racing.
 *
 * Sources `userId` from UserContext and `activeUserPlan` from AppDataContext
 * so consumers don't have to thread either prop through manually.
 */
export const WorkoutSessionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const { data } = useAppData();

  const activeUserPlan = useMemo(
    () => (data.userWorkoutPlans || []).find((plan: any) => plan.isActive),
    [data.userWorkoutPlans]
  );

  const restTimer = useRestTimer();
  const session = useWorkoutSession({ userId: user?.id, activeUserPlan, restTimer });

  const value = useMemo(() => ({ session, restTimer }), [session, restTimer]);

  return <WorkoutSessionContext.Provider value={value}>{children}</WorkoutSessionContext.Provider>;
};

export const useActiveWorkoutSession = () => {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) {
    throw new Error('useActiveWorkoutSession must be used within a WorkoutSessionProvider');
  }
  return ctx;
};
