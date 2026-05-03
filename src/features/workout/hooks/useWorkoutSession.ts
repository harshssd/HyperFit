import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ensureExercise, fetchExercises, logWorkoutSession } from '../../../services/workoutService';
import {
  addSetToExercise,
  calculateTotalVolume,
  deleteExerciseFromWorkout,
  moveExerciseInWorkout,
  renameExercise,
  updateSetValue,
} from '../helpers';
import { showError, showSuccess } from '../../../utils/alerts';
import { PlanSession, SessionExercise, UserWorkoutPlan, WorkoutExercise, WorkoutPlan } from '../../../types/workout';
import type { UseRestTimerReturn } from './useRestTimer';

type HapticsModule = {
  impactAsync?: (style: unknown) => Promise<void>;
  ImpactFeedbackStyle?: { Medium: unknown };
};
let Haptics: HapticsModule | null = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Optional native module — gracefully degrade if missing in Expo Go etc.
}

// Module-scoped so we don't reallocate on every render.
// Names MUST match the master `exercises` table verbatim (singular form,
// no hyphens) — buildExercises looks up exerciseId by lowercased name. A
// mismatch silently drops the row at persist time
// (workoutService.logWorkoutSession skips exercises without exercise_id).
const QUICK_TEMPLATES: Record<string, string[]> = {
  push: ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Tricep Dips', 'Lateral Raises'],
  pull: ['Deadlift', 'Pull Up', 'Barbell Row', 'Face Pulls', 'Bicep Curl'],
  legs: ['Squat', 'Romanian Deadlift', 'Leg Press', 'Calf Raises', 'Leg Curl'],
  fullbody: ['Bench Press', 'Squat', 'Pull Up', 'Overhead Press', 'Barbell Row'],
};
const AI_SEED = ['Bench Press', 'Squat', 'Pull Up', 'Overhead Press', 'Plank'];

export type SessionContext = {
  type: 'active_plan' | 'alternate_plan' | 'manual' | 'scheduled';
  planName?: string;
  sessionName?: string;
  customName?: string;
  planSessionId?: string;
};

type UseWorkoutSessionArgs = {
  userId?: string | null;
  /** The user's currently active plan instance, used for finish-time logging context. */
  activeUserPlan?: UserWorkoutPlan | null;
  /** Rest timer hook — set-completion drives the timer. */
  restTimer: UseRestTimerReturn;
};

export type UseWorkoutSessionReturn = {
  // State
  sessionExercises: WorkoutExercise[];
  sessionStartTime: string | null;
  isSessionFinished: boolean;
  sessionContext: SessionContext;
  /** Map of lowercased exercise name -> master exercise id (for resolving manual adds). */
  exerciseCache: Map<string, string>;

  // Mutators
  setSessionContext: (ctx: SessionContext) => void;
  addExercise: (name: string, position?: 'top' | 'bottom') => void;
  /** Append a list of exercises onto the active session (used by templates). */
  appendExercises: (exercises: WorkoutExercise[]) => void;
  renameExerciseById: (id: number, name: string) => void;
  moveExercise: (id: number, direction: 'up' | 'down') => void;
  deleteExercise: (id: number) => void;
  addSet: (id: number) => void;
  /** Mid-session set-update: handles haptics, rest timer side effects, and per-set rest tracking. */
  updateSet: (exerciseId: number, setIndex: number, field: string, value: unknown) => void;
  finishWorkout: () => Promise<void>;
  undoFinish: () => void;
  startNewSession: () => void;
  abortSession: () => void;
  /** Replace the whole session with the exercises from a plan session. */
  startSessionFromPlan: (
    planData: WorkoutPlan,
    sessionId: string,
    contextType?: 'active_plan' | 'alternate_plan' | 'scheduled'
  ) => void;
  /** Replace the whole session with one of a few hardcoded quick templates (push/pull/legs/fullbody). */
  startQuickWorkout: (type: 'push' | 'pull' | 'legs' | 'fullbody') => void;
  /** Replace the whole session with a balanced AI-suggested list (currently a static seed). */
  startAISuggestion: () => void;
  /**
   * Restore a session from a persisted snapshot (AsyncStorage). Sets all
   * three session fields atomically and suppresses the manual-name prompt.
   */
  hydrateFromSnapshot: (
    exercises: WorkoutExercise[],
    startTime: string | null,
    context: SessionContext
  ) => void;
};

/**
 * Owns the in-progress workout session: which exercises are on the board,
 * when it started, the naming context for logging, and all the per-set
 * mutators. Drives the rest timer via the `restTimer` arg.
 */
export const useWorkoutSession = ({
  userId,
  activeUserPlan,
  restTimer,
}: UseWorkoutSessionArgs): UseWorkoutSessionReturn => {
  const [sessionExercises, setSessionExercises] = useState<WorkoutExercise[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [sessionContext, setSessionContext] = useState<SessionContext>({ type: 'manual' });
  const [exerciseCache, setExerciseCache] = useState<Map<string, string>>(new Map());

  // Preload the exercise-name -> id cache for manual adds.
  useEffect(() => {
    let cancelled = false;
    fetchExercises()
      .then(rows => {
        if (cancelled) return;
        const cache = new Map<string, string>();
        rows.forEach(ex => cache.set(ex.name.toLowerCase(), ex.id));
        setExerciseCache(cache);
      })
      .catch(e => console.error('Failed to load exercise cache', e));
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSessionExercises = useCallback((exercises: WorkoutExercise[]) => {
    setSessionExercises(exercises);
    // Stamp on first add; clear when the board is emptied so a delete-to-zero
    // followed by a fresh add restarts the clock.
    setSessionStartTime(prev =>
      exercises.length === 0 ? null : prev ?? new Date().toISOString()
    );
  }, []);

  const appendExercises = useCallback((toAppend: WorkoutExercise[]) => {
    if (toAppend.length === 0) return;
    setSessionExercises(prev => [...prev, ...toAppend]);
    setSessionStartTime(prev => prev ?? new Date().toISOString());
  }, []);

  // Tracks whether we've already shown the manual-workout name prompt so
  // delete-to-zero + readd doesn't re-fire it.
  const namePromptedRef = useRef(false);

  const addExercise = useCallback(
    (name: string, position: 'top' | 'bottom' = 'bottom') => {
      let didFirstAdd = false;
      setSessionExercises(prev => {
        const newExercise: WorkoutExercise = {
          id: Date.now() + prev.length,
          name,
          exerciseId: exerciseCache.get(name.toLowerCase()),
          sets: [{ id: Date.now() + prev.length + 1, weight: '', reps: '', completed: false }],
        };
        if (prev.length === 0) didFirstAdd = true;
        const next =
          position === 'top' ? [newExercise, ...prev] : [...prev, newExercise];
        // Inline what updateSessionExercises does, since we need to react to the
        // computed `next.length` rather than re-read state.
        setSessionStartTime(t => (next.length === 0 ? null : t ?? new Date().toISOString()));
        return next;
      });

      if (didFirstAdd && sessionContext.type === 'manual' && !namePromptedRef.current) {
        namePromptedRef.current = true;
        setTimeout(() => {
          Alert.prompt(
            'Name Your Workout',
            'Enter a name for this workout session',
            [
              { text: 'Skip', style: 'cancel' },
              {
                text: 'Save',
                onPress: (customName?: string) => {
                  if (customName?.trim()) {
                    setSessionContext(prev => ({ ...prev, customName: customName.trim() }));
                  }
                },
              },
            ],
            'plain-text',
            sessionContext.customName || 'Custom Workout'
          );
        }, 500);
      }
    },
    [exerciseCache, sessionContext.type, sessionContext.customName]
  );

  const renameExerciseById = useCallback(
    (id: number, name: string) =>
      updateSessionExercises(renameExercise(sessionExercises, id, name)),
    [sessionExercises, updateSessionExercises]
  );

  const moveExercise = useCallback(
    (id: number, direction: 'up' | 'down') =>
      updateSessionExercises(moveExerciseInWorkout(sessionExercises, id, direction)),
    [sessionExercises, updateSessionExercises]
  );

  const deleteExercise = useCallback(
    (id: number) => updateSessionExercises(deleteExerciseFromWorkout(sessionExercises, id)),
    [sessionExercises, updateSessionExercises]
  );

  const addSet = useCallback(
    (id: number) => updateSessionExercises(addSetToExercise(sessionExercises, id)),
    [sessionExercises, updateSessionExercises]
  );

  const updateSet = useCallback(
    (exId: number, setIndex: number, field: string, value: unknown) => {
      setSessionExercises(prev => {
        const next = [...prev];
        const exIdx = next.findIndex(ex => ex.id === exId);
        if (exIdx === -1) return prev;
        const sets = [...next[exIdx].sets];
        if (!sets[setIndex]) return prev;

        const updated: WorkoutExercise['sets'][number] = { ...sets[setIndex], [field]: value };

        if (field === 'completed' && value === true) {
          Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle?.Medium).catch(() => {});
          const elapsed = restTimer.onSetCompleted();
          updated.restSeconds = elapsed;
          updated.completedAt = new Date().toISOString();
        } else if (field === 'completed' && value === false) {
          restTimer.onSetUncompleted();
          updated.restSeconds = undefined;
          updated.completedAt = undefined;
        }

        sets[setIndex] = updated;
        next[exIdx] = { ...next[exIdx], sets };
        return next;
      });
    },
    [restTimer]
  );

  const finishWorkout = useCallback(async () => {
    if (sessionExercises.length === 0) return;

    try {
      const totalVolume = calculateTotalVolume(sessionExercises);

      let sessionName: string;
      switch (sessionContext.type) {
        case 'active_plan':
        case 'alternate_plan':
        case 'scheduled':
          sessionName = sessionContext.sessionName
            ? `${sessionContext.planName} - ${sessionContext.sessionName}`
            : sessionContext.planName || 'Workout';
          break;
        case 'manual':
        default:
          if (sessionContext.customName && sessionContext.customName !== 'Custom Workout') {
            sessionName = sessionContext.customName;
          } else {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            sessionName = `Custom Workout - ${date} ${time}`;
          }
      }

      const sessionPayload = {
        user_id: userId ?? '',
        date: new Date().toISOString().split('T')[0],
        name: sessionName,
        start_time: sessionStartTime ?? undefined,
        end_time: new Date().toISOString(),
        plan_id: activeUserPlan?.planData?.id,
        session_id: sessionContext.planSessionId,
      };

      // "If it's added (with values), it's done." Drop empty rows the user
      // never filled in — those are noise, not "incomplete sets". Persisted
      // sets are always completed=true; the column stays for schema compat
      // until BL-17 drops it.
      //
      // Free-text exercise names that didn't hit the cache get a real id
      // via ensureExercise (creates a user-scoped row in the master
      // exercises table on first sight). Without this backfill,
      // logWorkoutSession's "exercise_id required" guard would silently
      // drop the row and the user's sets would vanish from history.
      const newCacheEntries = new Map<string, string>();
      const exercisesPayloadRaw = await Promise.all(
        sessionExercises.map(async (ex, i) => {
          const validSets = ex.sets
            .filter((s) => {
              const w = Number(s.weight);
              const r = Number(s.reps);
              return (Number.isFinite(w) && w > 0) || (Number.isFinite(r) && r > 0);
            })
            .map((s, si) => ({
              set_number: si + 1,
              weight: Number(s.weight) || 0,
              reps: Number(s.reps) || 0,
              rpe: 0,
              completed: true,
            }));

          let resolvedId = ex.exerciseId ?? null;
          if (!resolvedId && validSets.length > 0 && userId && ex.name) {
            try {
              const row = await ensureExercise(ex.name, userId);
              resolvedId = row.id;
              newCacheEntries.set(row.name.toLowerCase(), row.id);
            } catch (e) {
              console.warn('ensureExercise failed; row will be dropped', ex.name, e);
            }
          }

          return {
            exercise: {
              exercise_id: resolvedId,
              user_id: userId ?? '',
              order_index: i,
              notes: '',
            },
            sets: validSets,
          };
        })
      );
      const exercisesPayload = exercisesPayloadRaw.filter(
        (ex) => ex.sets.length > 0 && ex.exercise.exercise_id,
      );

      // Hot-merge any newly-created exercises into the cache so the
      // next overlay open in the same session sees them in autocomplete.
      if (newCacheEntries.size > 0) {
        setExerciseCache((prev) => {
          const merged = new Map(prev);
          newCacheEntries.forEach((id, name) => merged.set(name, id));
          return merged;
        });
      }

      // unused: keeps callers' total volume API while service computes its own.
      void totalVolume;

      // After filtering, every exercise had zero valid sets. Service would
      // no-op and return null; we'd previously still flip "saved" + show a
      // success toast and create a phantom finished-state UI. Bail with a
      // hint so the user stays in the session and can log something.
      if (exercisesPayload.length === 0) {
        showError('Add at least one set before finishing.');
        return;
      }

      const result = await logWorkoutSession(sessionPayload, exercisesPayload);
      if (!result) {
        showError('Could not save the session.');
        return;
      }
      setIsSessionFinished(true);
      showSuccess('Workout saved!');
    } catch (e) {
      console.error(e);
      showError('Failed to save workout');
    }
  }, [activeUserPlan, sessionContext, sessionExercises, sessionStartTime, userId]);

  const undoFinish = useCallback(() => setIsSessionFinished(false), []);

  const startNewSession = useCallback(() => {
    setSessionExercises([]);
    setSessionStartTime(null);
    setIsSessionFinished(false);
    setSessionContext({ type: 'manual' });
    namePromptedRef.current = false;
  }, []);

  const abortSession = useCallback(() => {
    setSessionExercises([]);
    setSessionStartTime(null);
    setIsSessionFinished(false);
    namePromptedRef.current = false;
  }, []);

  const startSessionFromPlan = useCallback(
    (
      planData: WorkoutPlan,
      sessionId: string,
      contextType: 'active_plan' | 'alternate_plan' | 'scheduled' = 'active_plan'
    ) => {
      const session: PlanSession | undefined = planData?.sessions?.find(s => s.id === sessionId);
      if (!session) return;

      const baseId = Date.now();
      const newExercises: WorkoutExercise[] = session.exercises.map((exercise: SessionExercise, index: number) => ({
        id: baseId + index,
        name: exercise.name,
        exerciseId: exercise.id,
        sets: [{ id: baseId + index * 1000 + 1, weight: '', reps: '', completed: false }],
      }));

      updateSessionExercises(newExercises);
      setSessionContext({
        type: contextType,
        planName: planData.name,
        sessionName: session.name,
        planSessionId: sessionId,
      });
      namePromptedRef.current = true; // not a manual session
      showSuccess(`Started ${session.name}!`);
    },
    [updateSessionExercises]
  );

  const buildExercises = useCallback(
    (names: string[]): WorkoutExercise[] => {
      const baseId = Date.now();
      return names.map((name, i) => ({
        id: baseId + i,
        name,
        exerciseId: exerciseCache.get(name.toLowerCase()),
        sets: [{ id: baseId + i * 1000 + 1, weight: '', reps: '', completed: false }],
      }));
    },
    [exerciseCache]
  );

  const startQuickWorkout = useCallback(
    (type: 'push' | 'pull' | 'legs' | 'fullbody') => {
      updateSessionExercises(buildExercises(QUICK_TEMPLATES[type] ?? []));
      setSessionContext({
        type: 'manual',
        customName: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`,
      });
      namePromptedRef.current = true; // we set the name; don't reprompt
      showSuccess(`${type.toUpperCase()} workout loaded!`);
    },
    [buildExercises, updateSessionExercises]
  );

  const startAISuggestion = useCallback(() => {
    updateSessionExercises(buildExercises(AI_SEED));
    setSessionContext({ type: 'manual', customName: 'AI Suggested Workout' });
    namePromptedRef.current = true;
    showSuccess('AI workout generated based on your progress!');
  }, [buildExercises, updateSessionExercises]);

  const hydrateFromSnapshot = useCallback(
    (exercises: WorkoutExercise[], startTime: string | null, context: SessionContext) => {
      setSessionExercises(exercises);
      setSessionStartTime(startTime);
      setSessionContext(context);
      setIsSessionFinished(false);
      // The user already named (or didn't name) this session before — don't
      // reprompt on resume.
      namePromptedRef.current = true;
    },
    []
  );

  return {
    sessionExercises,
    sessionStartTime,
    isSessionFinished,
    sessionContext,
    exerciseCache,
    setSessionContext,
    addExercise,
    appendExercises,
    renameExerciseById,
    moveExercise,
    deleteExercise,
    addSet,
    updateSet,
    finishWorkout,
    undoFinish,
    startNewSession,
    abortSession,
    startSessionFromPlan,
    startQuickWorkout,
    startAISuggestion,
    hydrateFromSnapshot,
  };
};
