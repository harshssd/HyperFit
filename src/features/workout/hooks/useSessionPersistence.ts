import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutExercise } from '../../../types/workout';
import { SessionContext, UseWorkoutSessionReturn } from './useWorkoutSession';

const STORAGE_KEY = (userId: string) => `hyperfit:active-session:${userId}`;
const SCHEMA_VERSION = 1;
const DEBOUNCE_MS = 500;

type Snapshot = {
  v: number;
  exercises: WorkoutExercise[];
  startTime: string | null;
  context: SessionContext;
  savedAt: number;
};

/**
 * Mirrors the in-memory active session to AsyncStorage and rehydrates on
 * cold start so that force-quitting the app mid-workout doesn't lose
 * logged sets. Mounted once inside WorkoutSessionProvider.
 *
 * Behavior:
 * - Cold start with a stored snapshot for this user → call session.hydrateFromSnapshot.
 * - Every change to exercises / startTime / context (debounced 500ms) → write snapshot.
 * - Empty session OR finished session → clear snapshot.
 * - Snapshots are user-keyed so user A's session never bleeds into user B.
 */
export const useSessionPersistence = (
  userId: string | null | undefined,
  session: UseWorkoutSessionReturn
) => {
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Hydrate on mount / userId change.
  useEffect(() => {
    if (!userId) {
      setHydrated(true);
      return;
    }
    let cancelled = false;
    setHydrated(false);

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY(userId));
        if (cancelled) return;
        if (raw) {
          const snap = JSON.parse(raw) as Snapshot;
          if (
            snap?.v === SCHEMA_VERSION &&
            Array.isArray(snap.exercises) &&
            snap.exercises.length > 0
          ) {
            sessionRef.current.hydrateFromSnapshot(
              snap.exercises,
              snap.startTime ?? null,
              snap.context ?? { type: 'manual' }
            );
          }
        }
      } catch (e) {
        console.warn('[session-persistence] hydrate failed', e);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // hydrateFromSnapshot is read via ref so we don't need it in deps.
  }, [userId]);

  // Persist on change (after hydration). Debounced so rapid set toggles don't
  // hammer the disk.
  useEffect(() => {
    if (!userId || !hydrated) return;

    // Clear on finish — the user committed; the next reopen should land on a
    // clean planner, not a "resume finished session" state.
    if (session.isSessionFinished) {
      AsyncStorage.removeItem(STORAGE_KEY(userId)).catch(() => {});
      return;
    }

    // Empty session → nothing to persist.
    if (session.sessionExercises.length === 0) {
      AsyncStorage.removeItem(STORAGE_KEY(userId)).catch(() => {});
      return;
    }

    const handle = setTimeout(() => {
      const snap: Snapshot = {
        v: SCHEMA_VERSION,
        exercises: session.sessionExercises,
        startTime: session.sessionStartTime,
        context: session.sessionContext,
        savedAt: Date.now(),
      };
      AsyncStorage.setItem(STORAGE_KEY(userId), JSON.stringify(snap)).catch(e =>
        console.warn('[session-persistence] write failed', e)
      );
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [
    userId,
    hydrated,
    session.sessionExercises,
    session.sessionStartTime,
    session.sessionContext,
    session.isSessionFinished,
  ]);

  return { hydrated };
};
