import React, { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import SlimPlanCreator from '../features/workout/components/SlimPlanCreator';
import { usePlanActions } from '../features/workout/hooks/usePlanActions';
import { useAppData } from '../contexts/AppDataContext';
import { useUser } from '../contexts/UserContext';
import { fetchWorkoutPlanDetails } from '../services/workoutService';
import type { WorkoutPlan } from '../types/workout';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlanBuilder'>;
type PlanBuilderRoute = RouteProp<RootStackParamList, 'PlanBuilder'>;

// Match the Modal slide-out duration so the route doesn't pop until the
// inner Modal has finished animating away.
const DISMISS_ANIMATION_MS = 250;

/**
 * Modal route hosting the slim plan creator. Drives create / edit / duplicate
 * via route params:
 *   - { } or undefined → create
 *   - { mode: 'edit', planId }      → edit existing user-owned plan
 *   - { mode: 'duplicate', planId } → prefill from any plan, save as new
 *
 * Plan create + the post-create activation prompt live in usePlanActions so
 * this screen and GymView stay in lockstep.
 */
export const PlanBuilderScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<PlanBuilderRoute>();
  const { user } = useUser();
  const { data, setData } = useAppData();
  const { createPlan, updatePlan } = usePlanActions({
    userId: user?.id,
    data,
    updateData: setData,
  });

  const mode = route.params?.mode || 'create';
  const planId = route.params?.planId;

  const [visible, setVisible] = useState(true);
  const [initialPlan, setInitialPlan] = useState<WorkoutPlan | undefined>(undefined);
  const [hydrating, setHydrating] = useState(mode !== 'create' && !!planId);

  // Hydrate the initial plan for edit / duplicate. Local cache might be
  // missing exercises / schedule — always fetch fresh details.
  useEffect(() => {
    let cancelled = false;
    if (mode === 'create' || !planId) { setHydrating(false); return; }
    setHydrating(true);
    fetchWorkoutPlanDetails(planId)
      .then((p) => { if (!cancelled) setInitialPlan(p); })
      .catch(() => { /* user sees an empty form; better than crashing */ })
      .finally(() => { if (!cancelled) setHydrating(false); });
    return () => { cancelled = true; };
  }, [mode, planId]);

  const close = () => {
    setVisible(false);
    setTimeout(() => {
      if (navigation.canGoBack()) navigation.goBack();
    }, DISMISS_ANIMATION_MS);
  };

  // Don't open the form before the plan is hydrated for edit/duplicate —
  // otherwise the user sees the blank "create" state for a frame, then it
  // snaps to the prefill.
  if (hydrating) return null;

  return (
    <SlimPlanCreator
      visible={visible}
      onClose={close}
      userId={user?.id}
      mode={mode}
      initialPlan={initialPlan}
      onCreatePlan={async (planData) => {
        await createPlan(planData, () => close());
      }}
      onUpdatePlan={async (id, planData) => {
        await updatePlan(id, planData);
        close();
      }}
    />
  );
};
