import { UserWorkoutPlan, WorkoutPlan } from '../../../types/workout';

/**
 * Plan-schedule lookups: "what's planned for this date?" and "what comes
 * next in the rotation?". Pure functions over an active `UserWorkoutPlan`.
 */

type RecentWorkout = { dateStr: string; [key: string]: unknown };

export type PlannedWorkoutForDate = {
  type: 'planned';
  sessionId: string;
  exercises: number;
  name: string;
  exerciseList: string[];
  dayName: string;
  totalWorkouts: number;
};

export type UpcomingWorkout = PlannedWorkoutForDate & {
  date: Date;
  dateStr: string;
  daysUntil: number;
};

/**
 * Resolve which workout (completed, planned, or none) belongs on a given
 * date. Past dates check `recentWorkouts`; future/today checks the active
 * plan's day-of-week schedule.
 */
export const getWorkoutForDate = (
  date: Date,
  recentWorkouts: RecentWorkout[],
  activePlan?: UserWorkoutPlan,
) => {
  const dateStr = date.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const completedWorkout = recentWorkouts.find(w => w.dateStr === dateStr);
  if (completedWorkout) {
    return { ...completedWorkout, type: 'completed' as const };
  }

  const isFutureOrToday = dateStr >= todayStr;

  if (activePlan && activePlan.planData && activePlan.planData.schedule && activePlan.planData.sessions && isFutureOrToday) {
    const dayOfWeek = date.getDay();
    const dayNames: (keyof WorkoutPlan['schedule'])[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];

    const dailySchedule = activePlan.planData.schedule[dayName] || [];

    if (dailySchedule.length > 0) {
      const scheduledSession = dailySchedule[0];
      const session = activePlan.planData.sessions.find(s => s.id === scheduledSession.sessionId);

      if (session) {
        return {
          type: 'planned' as const,
          // Plan session UUID — needed by callers that want to start the
          // session directly via session.startSessionFromPlan(...).
          sessionId: session.id,
          exercises: session.exercises.length,
          name: session.name,
          exerciseList: session.exercises.map(e => e.name),
          dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          totalWorkouts: dailySchedule.length
        };
      }
    }
  }

  return null;
};

/**
 * Find the next scheduled workout from the active plan.
 * Equivalent to `getUpcomingWorkouts(plan, 1)[0] ?? null`.
 */
export const getNextScheduledWorkout = (activePlan?: UserWorkoutPlan) => {
  return getUpcomingWorkouts(activePlan, 1)[0] ?? null;
};

/**
 * Walk the active plan's schedule forward and return up to `count` upcoming
 * sessions, starting `startOffsetDays` from today (0 = include today).
 *
 * Search window is `count + 14` days so a sparse plan (e.g. 1×/week) still
 * surfaces enough lookahead without unbounded iteration.
 */
export const getUpcomingWorkouts = (
  activePlan: UserWorkoutPlan | undefined,
  count: number,
  startOffsetDays = 0,
) => {
  if (!activePlan || !activePlan.planData?.schedule || count <= 0) {
    return [];
  }

  const today = new Date();
  const window = count + 14;
  const found: UpcomingWorkout[] = [];

  for (let i = startOffsetDays; i < startOffsetDays + window && found.length < count; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const checkDateStr = checkDate.toISOString().split('T')[0];

    const workoutForDate = getWorkoutForDate(checkDate, [], activePlan);
    if (workoutForDate && workoutForDate.type === 'planned') {
      found.push({
        ...workoutForDate,
        date: checkDate,
        dateStr: checkDateStr,
        daysUntil: i,
      });
    }
  }

  return found;
};
