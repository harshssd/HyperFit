import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  createUserWorkoutPlan,
  createWorkoutPlan,
  deactivateUserWorkoutPlans,
  findUserWorkoutPlan,
  fetchWorkoutPlanDetails,
  rotatePlanShareCode,
  setPlanReviewStatus,
  setPlanShareable,
  updateUserWorkoutPlan,
  updateWorkoutPlan,
} from '../../../services/workoutService';
import { showError, showSuccess } from '../../../utils/alerts';
import type { UserData, WorkoutPlan } from '../../../types/workout';

type Args = {
  userId?: string;
  data: UserData;
  updateData: (next: UserData) => void;
};

/**
 * Shared plan create / activate flow used by GymView and PlanBuilderScreen.
 * Encapsulates the database-shape transform, post-create activation prompt,
 * and the local state reconciliation that keeps `userWorkoutPlans` in sync
 * with the active plan rule (at most one is_active per user).
 *
 * `data` and `updateData` are read through refs so the activation alert
 * fired from `createPlan` (after PlanBuilderScreen has already unmounted
 * itself) still operates on the *current* UserData rather than the
 * snapshot captured when create was kicked off.
 */
export const usePlanActions = ({ userId, data, updateData }: Args) => {
  const dataRef = useRef(data);
  const updateDataRef = useRef(updateData);
  useEffect(() => {
    dataRef.current = data;
    updateDataRef.current = updateData;
  });

  const activatePlan = useCallback(
    async (planId: string) => {
      if (!userId) {
        showError('You must be signed in to activate a plan.');
        return;
      }

      // Read latest UserData via ref — this callback can fire from an alert
      // raised after the calling screen unmounted (see hook docstring).
      const latestData = dataRef.current;
      const userPlans = latestData.userWorkoutPlans || [];
      const targetPlan = userPlans.find((p) => p.planId === planId);

      try {
        let planDetails: WorkoutPlan | undefined = targetPlan?.planData;
        if (!planDetails || !planDetails.sessions) {
          planDetails = await fetchWorkoutPlanDetails(planId);
        }

        // Always clear the active slot first, then look up the existing
        // (user, plan) row from the DB — local state can be stale or even
        // missing the row entirely, which is what makes naive insert
        // collide with the unique partial index.
        await deactivateUserWorkoutPlans(userId);

        const existing = await findUserWorkoutPlan(userId, planId);
        let activePlanRecordId: string | undefined = existing?.id;
        if (existing?.id) {
          await updateUserWorkoutPlan(existing.id, { is_active: true });
        } else {
          const newUserPlan = await createUserWorkoutPlan({
            user_id: userId,
            plan_id: planId,
            is_active: true,
            started_at: new Date().toISOString(),
          });
          activePlanRecordId = newUserPlan.id;
        }

        const updated = userPlans.map((p) =>
          p.planId === planId
            ? {
                ...p,
                id: activePlanRecordId ?? p.id,
                isActive: true,
                planData: planDetails!,
              }
            : { ...p, isActive: false }
        );

        if (!targetPlan && activePlanRecordId && planDetails) {
          updated.push({
            id: activePlanRecordId,
            userId,
            planId,
            planData: planDetails,
            startedAt: new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
            customName: planDetails.name,
          });
        }

        updateDataRef.current({ ...latestData, userWorkoutPlans: updated, activePlanId: planId });

        const active = updated.find((p) => p.isActive);
        showSuccess(`${active?.customName || active?.planData?.name || 'Plan'} activated!`);
      } catch (error) {
        console.error('Error activating plan:', error);
        showError('Failed to activate plan. Please try again.');
      }
    },
    [userId]
  );

  const createPlan = useCallback(
    async (
      planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'isTemplate'>,
      onAfterCreate?: (plan: WorkoutPlan) => void
    ) => {
      if (!userId) {
        showError('You must be signed in to create a plan.');
        return;
      }

      try {
        const planForDb = {
          name: planData.name,
          description: planData.description,
          frequency: planData.frequency,
          equipment: planData.equipment,
          // schema column is `text`; in-memory shape is a number ("weeks").
          duration: planData.duration != null ? String(planData.duration) : null,
          difficulty: planData.difficulty,
          tags: planData.tags || [],
          is_public: false,
          user_id: userId,
        };

        const sessionsForDb = planData.sessions.map((session, index) => ({
          session: {
            id: session.id,
            name: session.name,
            description: session.description || '',
            focus: session.focus as string,
            order_index: index + 1,
            original_session_id: (session as any).originalSessionId || null,
          } as any,
          exercises: session.exercises.map((exercise) => ({
            exercise_id: exercise.id,
            sets: exercise.sets,
            reps_min: exercise.repRange.min,
            reps_max: exercise.repRange.max,
            rest_seconds: exercise.restSeconds || 60,
            order_index: exercise.order,
          } as any)),
        })) as any;

        const scheduleForDb = Object.entries(planData.schedule || {}).flatMap(
          ([day, sessions]) =>
            (sessions || []).map((session) => ({
              session_id: session.sessionId,
              day_of_week: day,
            } as any))
        );

        const savedPlan = await createWorkoutPlan(planForDb, sessionsForDb, scheduleForDb);
        const completePlan = await fetchWorkoutPlanDetails(savedPlan.id);

        const latestData = dataRef.current;
        const updatedPlans = [...(latestData.workoutPlans || []), completePlan];
        updateDataRef.current({ ...latestData, workoutPlans: updatedPlans });

        showSuccess(`Plan "${completePlan.name}" created successfully!`);
        onAfterCreate?.(completePlan);

        // Activation prompt — defer so the success alert + any modal-dismiss
        // animations don't fight the system Alert.
        setTimeout(() => {
          Alert.alert('Plan Created', 'Would you like to activate this plan now?', [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Activate', onPress: () => activatePlan(savedPlan.id) },
          ]);
        }, 500);
      } catch (error) {
        console.error('Error creating plan:', error);
        showError('Failed to create plan. Please try again.');
      }
    },
    [activatePlan, userId]
  );

  const updatePlan = useCallback(
    async (
      planId: string,
      planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'isTemplate'>,
    ) => {
      if (!userId) {
        showError('You must be signed in to update a plan.');
        return;
      }
      try {
        const planForDb = {
          name: planData.name,
          description: planData.description,
          frequency: planData.frequency,
          equipment: planData.equipment,
          duration: planData.duration != null ? String(planData.duration) : null,
          difficulty: planData.difficulty,
          tags: planData.tags || [],
        };

        const sessionsForDb = planData.sessions.map((session, index) => ({
          session: {
            id: session.id,
            name: session.name,
            description: session.description || '',
            focus: session.focus as string,
            order_index: index + 1,
          } as any,
          exercises: session.exercises.map((exercise) => ({
            exercise_id: exercise.id,
            sets: exercise.sets,
            reps_min: exercise.repRange.min,
            reps_max: exercise.repRange.max,
            rest_seconds: exercise.restSeconds || 60,
            order_index: exercise.order,
          } as any)),
        })) as any;

        const scheduleForDb = Object.entries(planData.schedule || {}).flatMap(
          ([day, sessions]) =>
            (sessions || []).map((session) => ({
              session_id: session.sessionId,
              day_of_week: day,
            } as any)),
        );

        const updated = await updateWorkoutPlan(planId, planForDb, sessionsForDb, scheduleForDb);

        const latestData = dataRef.current;
        const nextPlans = (latestData.workoutPlans || []).map((p) =>
          p.id === planId ? updated : p,
        );
        const nextUserPlans = (latestData.userWorkoutPlans || []).map((up: any) =>
          up.planData?.id === planId ? { ...up, planData: updated } : up,
        );
        updateDataRef.current({
          ...latestData,
          workoutPlans: nextPlans,
          userWorkoutPlans: nextUserPlans,
        });

        showSuccess(`Plan "${updated.name}" updated.`);
      } catch (e: any) {
        console.error('updatePlan', e);
        showError(e?.message || 'Could not update plan.');
      }
    },
    [userId],
  );

  // Patch review_status (and review_notes / reviewed_* if returned) on the
  // matching plan in `data.workoutPlans` AND inside any active-plan instance
  // that embeds the same plan in `data.userWorkoutPlans[].planData` — both
  // surfaces are read by the library / "My Plans" UI and would drift if we
  // updated only one.
  const patchLocalPlan = useCallback((updated: any) => {
    const latest = dataRef.current;
    const apply = (p: any) => ({
      ...p,
      review_status: updated.review_status,
      reviewed_at: updated.reviewed_at,
      reviewed_by: updated.reviewed_by,
      review_notes: updated.review_notes,
      is_public: updated.is_public,
    });
    const nextWorkoutPlans = (latest.workoutPlans || []).map((p) =>
      p.id === updated.id ? apply(p) : p
    );
    const nextUserWorkoutPlans = (latest.userWorkoutPlans || []).map((up: any) =>
      up.planData?.id === updated.id
        ? { ...up, planData: apply(up.planData) }
        : up
    );
    updateDataRef.current({
      ...latest,
      workoutPlans: nextWorkoutPlans,
      userWorkoutPlans: nextUserWorkoutPlans,
    });
  }, []);

  // PostgREST returns "JSON object requested, multiple (or no) rows" when
  // RLS denies the update or the row was deleted between fetch and tap.
  // Translate to a useful message at the boundary.
  const friendlyError = (e: any, fallback: string): string => {
    const msg = e?.message || '';
    if (e?.code === 'PGRST116' || msg.includes('multiple (or no) rows')) {
      return 'This plan no longer exists or you don\'t own it.';
    }
    return msg || fallback;
  };

  const submitForReview = useCallback(
    async (planId: string) => {
      try {
        const updated = await setPlanReviewStatus(planId, 'pending_review');
        patchLocalPlan(updated);
        showSuccess('Submitted for review. We\'ll publish it once approved.');
      } catch (e: any) {
        console.error('submitForReview', e);
        showError(friendlyError(e, 'Could not submit plan for review.'));
      }
    },
    [patchLocalPlan]
  );

  const withdrawFromReview = useCallback(
    async (planId: string) => {
      try {
        const updated = await setPlanReviewStatus(planId, 'private');
        patchLocalPlan(updated);
        showSuccess('Withdrawn — your plan is private again.');
      } catch (e: any) {
        console.error('withdrawFromReview', e);
        showError(friendlyError(e, 'Could not withdraw plan.'));
      }
    },
    [patchLocalPlan]
  );

  // ---- Sharing -------------------------------------------------------------

  const patchLocalShareFields = useCallback(
    (planId: string, patch: { is_shareable?: boolean; share_code?: string }) => {
      const latest = dataRef.current;
      const next = (latest.workoutPlans || []).map((p) =>
        p.id === planId ? { ...p, ...patch } : p
      );
      updateDataRef.current({ ...latest, workoutPlans: next });
    },
    []
  );

  const setShareable = useCallback(
    async (planId: string, value: boolean): Promise<{ is_shareable: boolean; share_code: string } | null> => {
      try {
        const updated = await setPlanShareable(planId, value);
        const fields = { is_shareable: !!updated.is_shareable, share_code: updated.share_code };
        patchLocalShareFields(planId, fields);
        return fields;
      } catch (e: any) {
        console.error('setShareable', e);
        showError(friendlyError(e, 'Could not update sharing.'));
        return null;
      }
    },
    [patchLocalShareFields]
  );

  const rotateShareCode = useCallback(
    async (planId: string): Promise<string | null> => {
      try {
        const code = await rotatePlanShareCode(planId);
        patchLocalShareFields(planId, { share_code: code });
        showSuccess('Old link revoked. New link is ready to share.');
        return code;
      } catch (e: any) {
        console.error('rotateShareCode', e);
        showError(friendlyError(e, 'Could not rotate share link.'));
        return null;
      }
    },
    [patchLocalShareFields]
  );

  return {
    createPlan,
    updatePlan,
    activatePlan,
    submitForReview,
    withdrawFromReview,
    setShareable,
    rotateShareCode,
  };
};
