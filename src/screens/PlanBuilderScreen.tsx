import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkoutPlanCreator } from '../features/workout/components/WorkoutPlanner';
import { usePlanActions } from '../features/workout/hooks/usePlanActions';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlanBuilder'>;

/**
 * Modal route that hosts the multi-step plan creator. Plan create + the
 * post-create activation prompt live in usePlanActions so this screen and
 * GymView stay in lockstep.
 *
 * The route is registered with presentation: 'transparentModal' so the inner
 * Modal's own slide animation owns the transition — no doubled animations.
 */
export const PlanBuilderScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useUser();
  const { data, setData } = useAppData();
  const { createPlan } = usePlanActions({ userId: user?.id, data, updateData: setData });

  // Keep the OS back gesture and the Modal close button in sync — both should
  // pop the route.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {});
    return unsub;
  }, [navigation]);

  const close = () => {
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <WorkoutPlanCreator
      visible={true}
      onClose={close}
      onCreatePlan={async (planData) => {
        await createPlan(planData, () => close());
      }}
    />
  );
};
