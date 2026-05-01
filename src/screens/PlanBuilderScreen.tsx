import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutPlanCreator } from '../features/workout/components/WorkoutPlanner';
import { usePlanActions } from '../features/workout/hooks/usePlanActions';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlanBuilder'>;

// Match the Modal slide-out duration so the route doesn't pop until the
// inner Modal has finished animating away.
const DISMISS_ANIMATION_MS = 250;

/**
 * Modal route that hosts the multi-step plan creator. Plan create + the
 * post-create activation prompt live in usePlanActions so this screen and
 * GymView stay in lockstep.
 *
 * The route is registered with presentation: 'transparentModal' so the inner
 * Modal's own slide animation owns the transition. We hold a local `visible`
 * flag so close() can animate the Modal out before popping the route — going
 * straight to navigation.goBack() would unmount mid-animation and snap.
 */
export const PlanBuilderScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { data, setData } = useAppData();
  const { createPlan } = usePlanActions({ userId: user?.id, data, updateData: setData });
  const [visible, setVisible] = useState(true);

  const close = () => {
    setVisible(false);
    setTimeout(() => {
      if (navigation.canGoBack()) navigation.goBack();
    }, DISMISS_ANIMATION_MS);
  };

  return (
    <WorkoutPlanCreator
      visible={visible}
      onClose={close}
      onCreatePlan={async (planData) => {
        await createPlan(planData, () => close());
      }}
    />
  );
};
