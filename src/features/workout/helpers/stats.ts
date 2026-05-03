import { WorkoutExercise } from '../../../types/workout';

/**
 * Aggregates and rank/XP math. Pure functions — no React, no I/O. Used by
 * Home/Stats/Header readouts and the Finished session screen.
 */

const RANKS = [
  { level: 1, title: "INITIATE", minXp: 0, color: "#94a3b8" },
  { level: 5, title: "KINETIC", minXp: 5000, color: "#fb923c" },
  { level: 10, title: "VOLTAGE", minXp: 15000, color: "#fbbf24" },
  { level: 20, title: "OVERDRIVE", minXp: 50000, color: "#fb7185" },
  { level: 50, title: "TITAN", minXp: 200000, color: "#34d399" },
  { level: 100, title: "HYPER GOD", minXp: 1000000, color: "#22d3ee" },
];

export const calculateTotalVolume = (workout: WorkoutExercise[]) => {
  return workout.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sAcc, s) => {
        // parseInt('') / parseInt('  ') return NaN. Previously masked by
        // the s.completed gate; now we have to guard explicitly so a
        // half-typed input doesn't NaN-poison the entire session total.
        const weight = s.weight ? parseInt(String(s.weight), 10) : 0;
        const reps = s.reps ? parseInt(String(s.reps), 10) : 0;
        const v = weight * reps;
        return sAcc + (Number.isFinite(v) ? v : 0);
      }, 0)
    );
  }, 0);
};

/**
 * 100 XP per workout day. To layer in a volume bonus, pass it as an
 * optional second arg derived from `session_summary_view.volume_load` so
 * this helper stays pure.
 */
export const calculateXP = (data: { gymLogs?: unknown[] } | null | undefined) => {
  if (!data) return 0;
  return (data.gymLogs?.length || 0) * 100;
};

export const getRank = (xp: number) => {
  const safeXp = xp || 0;
  return [...RANKS].reverse().find(r => safeXp >= r.minXp) || RANKS[0];
};

export const getRankProgress = (xp: number) => {
  const current = getRank(xp);
  const next = RANKS.find(r => r.minXp > current.minXp) || null;
  const range = next ? next.minXp - current.minXp : 1;
  const progress = next ? ((xp - current.minXp) / range) * 100 : 100;
  return { current, next, progress: Math.max(0, Math.min(100, progress)) };
};

/**
 * Completion progress for a workout session. A set is considered "done" if
 * either weight or reps has been entered (the `completed` flag is no longer
 * gated — it was unreliable when users tapped through quickly).
 */
export const calculateWorkoutProgress = (exercises: WorkoutExercise[]) => {
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) =>
    acc + ex.sets.filter(set => {
      const w = Number(set.weight);
      const r = Number(set.reps);
      return (Number.isFinite(w) && w > 0) || (Number.isFinite(r) && r > 0);
    }).length, 0
  );

  return {
    totalSets,
    completedSets,
    progressPercentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    isComplete: totalSets > 0 && completedSets === totalSets
  };
};
