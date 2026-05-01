import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_REST_SECONDS = 90;
const REST_INCREMENT_SECONDS = 30;

export type UseRestTimerReturn = {
  /** Seconds remaining; null when no rest timer is active. */
  restSeconds: number | null;
  /** Total duration of the active timer in seconds; null when inactive. Includes any +30s extensions. */
  totalSeconds: number | null;
  /** Last "set completed" timestamp (ms epoch); null when no set has been completed. */
  lastCompletedAt: number | null;
  /** Start a rest countdown for `seconds` (defaults to 90). */
  startRest: (seconds?: number) => void;
  /** Clear the timer immediately. */
  skipRest: () => void;
  /** Add `extra` seconds to the current countdown (defaults to +30). */
  extendRest: (extra?: number) => void;
  /**
   * Called when a set is marked complete. Returns the elapsed seconds since
   * the previous set completion, used for analytics / per-set rest tracking.
   */
  onSetCompleted: () => number;
  /** Called when a previously-completed set is unchecked. */
  onSetUncompleted: () => void;
};

/**
 * Owns the rest-timer state machine for a workout session.
 *
 * Decoupled from session state so it can drive multiple UIs (the docked
 * pill, a future full-screen rest view) and so the session reducer doesn't
 * have to deal with `setInterval` cleanup.
 *
 * All callback identities are stable across renders — `lastCompletedAt`
 * lives in a ref instead of state for the part of the API that's used
 * inside other hooks' closures, while a parallel piece of state powers UI.
 */
export const useRestTimer = (): UseRestTimerReturn => {
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState<number | null>(null);
  const [lastCompletedAtState, setLastCompletedAtState] = useState<number | null>(null);
  const lastCompletedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearInterval_ = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const skipRest = useCallback(() => {
    clearInterval_();
    setRestSeconds(null);
    setTotalSeconds(null);
  }, []);

  const startRest = useCallback(
    (seconds: number = DEFAULT_REST_SECONDS) => {
      if (seconds <= 0) {
        skipRest();
        return;
      }
      clearInterval_();
      setRestSeconds(seconds);
      setTotalSeconds(seconds);
      intervalRef.current = setInterval(() => {
        setRestSeconds(prev => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval_();
            setTotalSeconds(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [skipRest]
  );

  const restRef = useRef<number | null>(null);
  restRef.current = restSeconds;

  const extendRest = useCallback(
    (extra: number = REST_INCREMENT_SECONDS) => {
      // Read both flags via refs so each setState updater stays pure
      // and idempotent under React Strict Mode (which double-invokes them).
      if (intervalRef.current === null) {
        startRest((restRef.current ?? 0) + extra);
        return;
      }
      setRestSeconds(prev => (prev ?? 0) + extra);
      setTotalSeconds(prev => (prev ?? 0) + extra);
    },
    [startRest]
  );

  const onSetCompleted = useCallback(() => {
    const now = Date.now();
    const prev = lastCompletedAtRef.current;
    const elapsed = prev ? Math.max(0, Math.round((now - prev) / 1000)) : 0;
    lastCompletedAtRef.current = now;
    setLastCompletedAtState(now);
    startRest();
    return elapsed;
  }, [startRest]);

  const onSetUncompleted = useCallback(() => {
    lastCompletedAtRef.current = null;
    setLastCompletedAtState(null);
    skipRest();
  }, [skipRest]);

  useEffect(
    () => () => {
      clearInterval_();
    },
    []
  );

  return {
    restSeconds,
    totalSeconds,
    lastCompletedAt: lastCompletedAtState,
    startRest,
    skipRest,
    extendRest,
    onSetCompleted,
    onSetUncompleted,
  };
};
