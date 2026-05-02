import {
  isExerciseEmpty,
  renameExercise,
  updateSetValue,
  addSetToExercise,
  deleteExerciseFromWorkout,
  moveExerciseInWorkout,
  calculateTotalVolume,
  calculateXP,
  getRank,
  getRankProgress,
  templateToPlan,
  planToWorkout,
  templateToWorkout,
  workoutToSession,
  sessionToCompletedWorkout,
  validatePlan,
  calculateWorkoutProgress,
  getWorkoutForDate,
  getNextScheduledWorkout,
} from '../helpers';
import type { WorkoutExercise, WorkoutPlan, Template, UserWorkoutPlan } from '../../../types/workout';

const makeExercise = (id: number, overrides: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
  id,
  name: `Exercise ${id}`,
  sets: [
    { id: id * 10 + 1, weight: '', reps: '', completed: false },
    { id: id * 10 + 2, weight: '', reps: '', completed: false },
  ],
  archived: false,
  ...overrides,
});

describe('isExerciseEmpty', () => {
  it('returns true when there are no sets', () => {
    expect(isExerciseEmpty({ id: 1, name: 'x', sets: [], archived: false })).toBe(true);
  });
  it('returns true when all sets are blank', () => {
    expect(isExerciseEmpty(makeExercise(1))).toBe(true);
  });
  it('returns false when any set is completed', () => {
    const ex = makeExercise(1);
    ex.sets[0].completed = true;
    expect(isExerciseEmpty(ex)).toBe(false);
  });
  it('returns false when any set has weight', () => {
    const ex = makeExercise(1);
    ex.sets[0].weight = '100';
    expect(isExerciseEmpty(ex)).toBe(false);
  });
  it('returns false when any set has reps', () => {
    const ex = makeExercise(1);
    ex.sets[0].reps = '10';
    expect(isExerciseEmpty(ex)).toBe(false);
  });
  it('returns true for null/undefined exercise', () => {
    expect(isExerciseEmpty(undefined as any)).toBe(true);
  });
});

describe('renameExercise', () => {
  it('renames a target exercise', () => {
    const result = renameExercise([makeExercise(1), makeExercise(2)], 2, 'Bench');
    expect(result[1].name).toBe('Bench');
    expect(result[0].name).toBe('Exercise 1');
  });
  it('returns original list when id missing', () => {
    const list = [makeExercise(1)];
    expect(renameExercise(list, 99, 'x')).toBe(list);
  });
});

describe('updateSetValue', () => {
  it('updates a single field in a single set', () => {
    const list = [makeExercise(1)];
    const out = updateSetValue(list, 1, 0, 'weight', '135');
    expect(out[0].sets[0].weight).toBe('135');
    expect(out[0].sets[1].weight).toBe('');
    // immutability
    expect(out).not.toBe(list);
    expect(out[0]).not.toBe(list[0]);
    expect(out[0].sets[0]).not.toBe(list[0].sets[0]);
  });
  it('returns original on missing exercise', () => {
    const list = [makeExercise(1)];
    expect(updateSetValue(list, 999, 0, 'weight', '1')).toBe(list);
  });
  it('returns original on missing set index', () => {
    const list = [makeExercise(1)];
    expect(updateSetValue(list, 1, 99, 'weight', '1')).toBe(list);
  });
});

describe('addSetToExercise', () => {
  it('adds a new set seeded with previous weight', () => {
    const list = [makeExercise(1)];
    list[0].sets[1].weight = '100';
    const out = addSetToExercise(list, 1);
    expect(out[0].sets).toHaveLength(3);
    expect(out[0].sets[2].weight).toBe('100');
    expect(out[0].sets[2].reps).toBe('');
    expect(out[0].sets[2].completed).toBe(false);
  });
  it('returns original on missing exercise', () => {
    const list = [makeExercise(1)];
    expect(addSetToExercise(list, 999)).toBe(list);
  });
});

describe('deleteExerciseFromWorkout', () => {
  it('removes the matching exercise', () => {
    const list = [makeExercise(1), makeExercise(2)];
    expect(deleteExerciseFromWorkout(list, 1)).toEqual([list[1]]);
  });
});

describe('moveExerciseInWorkout', () => {
  it('moves up', () => {
    const list = [makeExercise(1), makeExercise(2), makeExercise(3)];
    const out = moveExerciseInWorkout(list, 2, 'up');
    expect(out.map(e => e.id)).toEqual([2, 1, 3]);
  });
  it('moves down', () => {
    const list = [makeExercise(1), makeExercise(2), makeExercise(3)];
    const out = moveExerciseInWorkout(list, 2, 'down');
    expect(out.map(e => e.id)).toEqual([1, 3, 2]);
  });
  it('no-op when already first and direction up', () => {
    const list = [makeExercise(1), makeExercise(2)];
    const out = moveExerciseInWorkout(list, 1, 'up');
    expect(out.map(e => e.id)).toEqual([1, 2]);
  });
  it('no-op when already last and direction down', () => {
    const list = [makeExercise(1), makeExercise(2)];
    const out = moveExerciseInWorkout(list, 2, 'down');
    expect(out.map(e => e.id)).toEqual([1, 2]);
  });
  it('returns original on unknown id', () => {
    const list = [makeExercise(1)];
    expect(moveExerciseInWorkout(list, 99, 'up')).toBe(list);
  });
});

describe('calculateTotalVolume', () => {
  it('sums weight*reps only for completed sets', () => {
    const ex = makeExercise(1);
    ex.sets = [
      { id: 1, weight: '100', reps: '5', completed: true },
      { id: 2, weight: '100', reps: '5', completed: false },
      { id: 3, weight: '50', reps: '10', completed: true },
    ];
    expect(calculateTotalVolume([ex])).toBe(500 + 500);
  });
  it('handles empty/undefined values gracefully', () => {
    const ex = makeExercise(1);
    ex.sets = [{ id: 1, weight: '', reps: '', completed: true }];
    expect(calculateTotalVolume([ex])).toBe(0);
  });
});

describe('calculateXP', () => {
  it('returns 0 for null/undefined/missing logs', () => {
    expect(calculateXP(null)).toBe(0);
    expect(calculateXP(undefined)).toBe(0);
    expect(calculateXP({})).toBe(0);
  });
  it('returns 100 XP per gym log', () => {
    expect(calculateXP({ gymLogs: ['2026-01-01', '2026-01-02', '2026-01-03'] })).toBe(300);
  });
});

describe('getRank', () => {
  it('returns INITIATE for 0 xp', () => {
    expect(getRank(0).title).toBe('INITIATE');
  });
  it('returns INITIATE for negative-ish (falsy) xp', () => {
    expect(getRank(undefined as any).title).toBe('INITIATE');
  });
  it('returns KINETIC at 5000 xp', () => {
    expect(getRank(5000).title).toBe('KINETIC');
  });
  it('returns VOLTAGE at 15000 xp', () => {
    expect(getRank(15000).title).toBe('VOLTAGE');
  });
  it('returns OVERDRIVE at 50000 xp', () => {
    expect(getRank(50000).title).toBe('OVERDRIVE');
  });
  it('returns TITAN at 200000 xp', () => {
    expect(getRank(200000).title).toBe('TITAN');
  });
  it('returns HYPER GOD at 1M xp', () => {
    expect(getRank(1_000_000).title).toBe('HYPER GOD');
  });
  it('does not exceed top rank for huge xp', () => {
    expect(getRank(99_999_999).title).toBe('HYPER GOD');
  });
});

describe('getRankProgress', () => {
  it('halfway between INITIATE (0) and KINETIC (5000) is 50%', () => {
    const p = getRankProgress(2500);
    expect(p.current.title).toBe('INITIATE');
    expect(p.next?.title).toBe('KINETIC');
    expect(p.progress).toBe(50);
  });
  it('at top rank, no next and progress is 100', () => {
    const p = getRankProgress(2_000_000);
    expect(p.next).toBeNull();
    expect(p.progress).toBe(100);
  });
  it('clamps progress between 0 and 100', () => {
    const p = getRankProgress(0);
    expect(p.progress).toBe(0);
  });
});

describe('templateToPlan', () => {
  const tpl: Template = {
    id: 't1',
    name: 'Push Day',
    description: 'Upper push focus',
    exercises: ['Bench Press', 'Overhead Press'],
    folder_id: null,
    tags: [],
    is_public: false,
  } as any;
  it('builds a plan with default frequency 3 and the right schedule keys', () => {
    const plan = templateToPlan(tpl);
    expect(plan.name).toBe('Push Day');
    expect(plan.sessions).toHaveLength(1);
    expect(plan.sessions[0].exercises).toHaveLength(2);
    expect(Object.keys(plan.schedule).sort()).toEqual(['friday', 'monday', 'wednesday']);
    expect(plan.frequency).toBe(3);
    expect(plan.duration).toBe(4);
  });
  it('respects custom frequency and duration', () => {
    const plan = templateToPlan(tpl, 5, 8);
    expect(plan.frequency).toBe(5);
    expect(plan.duration).toBe(8);
    expect(Object.keys(plan.schedule).length).toBe(5);
  });
});

describe('planToWorkout', () => {
  const plan: WorkoutPlan = {
    id: 'p1',
    name: 'Sample',
    description: 'd',
    frequency: 3,
    equipment: 'mixed',
    duration: 4,
    isTemplate: false,
    sessions: [
      {
        id: 'sess-1',
        name: 'Push',
        focus: 'push',
        exercises: [
          { id: 'e1', name: 'Bench', primaryMuscleGroup: 'chest', sets: 3, repRange: { min: 8, max: 12 }, restSeconds: 90, order: 1 } as any,
        ],
      } as any,
    ],
    schedule: {
      monday: [{ sessionId: 'sess-1', order: 1, isOptional: false }],
    },
  } as any;
  it('returns scheduled exercises for the day-of-week', () => {
    const out = planToWorkout(plan, '2026-05-04', 1); // Monday
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Bench');
    expect(out[0].sets).toHaveLength(3);
  });
  it('returns empty for a day with no schedule', () => {
    expect(planToWorkout(plan, '2026-05-05', 2)).toEqual([]);
  });
});

describe('templateToWorkout', () => {
  it('makes one set per exercise', () => {
    const tpl: Template = { id: 't1', name: 'X', exercises: ['A', 'B'] } as any;
    const out = templateToWorkout(tpl);
    expect(out).toHaveLength(2);
    expect(out[0].sets).toHaveLength(1);
    expect(out[0].name).toBe('A');
  });
});

describe('workoutToSession + sessionToCompletedWorkout', () => {
  it('round-trips through session into a completed workout with totalVolume', () => {
    const ex: WorkoutExercise = {
      id: 1,
      name: 'Bench',
      sets: [{ id: 1, weight: '100', reps: '5', completed: true }],
      archived: false,
    };
    const session = workoutToSession([ex], '2026-05-01', 'plan-1', 'tpl-1');
    expect(session.isActive).toBe(true);
    expect(session.planId).toBe('plan-1');
    expect(session.templateId).toBe('tpl-1');

    const completed = sessionToCompletedWorkout(session);
    expect(completed.totalVolume).toBe(500);
    expect(completed.planId).toBe('plan-1');
    expect(completed.completedAt).toBeTruthy();
  });
});

describe('validatePlan', () => {
  const goodPlan: WorkoutPlan = {
    id: 'p',
    name: 'Plan',
    description: 'd',
    frequency: 3,
    equipment: 'mixed',
    duration: 4,
    sessions: [],
    schedule: {
      monday: [{ sessionId: 's1', order: 1, isOptional: false }],
      wednesday: [{ sessionId: 's1', order: 1, isOptional: false }],
      friday: [{ sessionId: 's1', order: 1, isOptional: false }],
    },
    isTemplate: false,
  } as any;
  it('passes for a valid plan', () => {
    expect(validatePlan(goodPlan)).toEqual({ isValid: true, errors: [] });
  });
  it('flags missing name', () => {
    const r = validatePlan({ ...goodPlan, name: '' });
    expect(r.isValid).toBe(false);
    expect(r.errors).toContain('Plan must have a name');
  });
  it('flags out-of-range frequency', () => {
    const r = validatePlan({ ...goodPlan, frequency: 0 });
    expect(r.isValid).toBe(false);
  });
  it('flags zero scheduled days', () => {
    const r = validatePlan({ ...goodPlan, schedule: {} });
    expect(r.errors).toContain('Plan must have at least one scheduled workout day');
  });
  it('flags scheduled days exceeding frequency', () => {
    const r = validatePlan({ ...goodPlan, frequency: 1 });
    expect(r.isValid).toBe(false);
  });
});

describe('calculateWorkoutProgress', () => {
  it('returns zeros for empty workout', () => {
    expect(calculateWorkoutProgress([])).toEqual({
      totalSets: 0,
      completedSets: 0,
      progressPercentage: 0,
      isComplete: false,
    });
  });
  it('rounds percentage and reports complete at 100%', () => {
    const ex = makeExercise(1);
    ex.sets[0].completed = true;
    ex.sets[1].completed = true;
    expect(calculateWorkoutProgress([ex])).toEqual({
      totalSets: 2,
      completedSets: 2,
      progressPercentage: 100,
      isComplete: true,
    });
  });
  it('partial completion is not complete', () => {
    const ex = makeExercise(1);
    ex.sets[0].completed = true;
    expect(calculateWorkoutProgress([ex]).isComplete).toBe(false);
    expect(calculateWorkoutProgress([ex]).progressPercentage).toBe(50);
  });
});

describe('getWorkoutForDate', () => {
  const activePlan: UserWorkoutPlan = {
    id: 'up1',
    userId: 'u1',
    planId: 'p1',
    isActive: true,
    startedAt: '2026-04-01',
    planData: {
      sessions: [{ id: 's1', name: 'Push', focus: 'push', exercises: [{ name: 'Bench' } as any, { name: 'OHP' } as any] }],
      schedule: { monday: [{ sessionId: 's1', order: 1, isOptional: false }] },
    } as any,
  } as any;
  it('returns completed when there is a recentWorkouts hit', () => {
    const date = new Date('2026-04-15T00:00:00Z');
    const res = getWorkoutForDate(date, [{ dateStr: '2026-04-15', name: 'Foo' }], activePlan);
    expect(res?.type).toBe('completed');
  });
  it('returns planned for a future Monday with active plan', () => {
    // Pick a known future Monday: 2026-05-04
    const date = new Date('2026-05-04T12:00:00Z');
    const res = getWorkoutForDate(date, [], activePlan);
    expect(res?.type).toBe('planned');
    expect(res?.name).toBe('Push');
    expect(res?.exercises).toBe(2);
  });
  it('returns null for past date with no completed workout', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    expect(getWorkoutForDate(date, [], activePlan)).toBeNull();
  });
  it('returns null when active plan day has nothing scheduled', () => {
    const date = new Date('2026-05-05T12:00:00Z'); // Tuesday
    expect(getWorkoutForDate(date, [], activePlan)).toBeNull();
  });
});

describe('getNextScheduledWorkout', () => {
  it('returns null without an active plan', () => {
    expect(getNextScheduledWorkout(undefined)).toBeNull();
  });
  it('finds the upcoming planned day within 7 days', () => {
    // build a plan that's scheduled on every day so it always finds today
    const everyDayPlan: UserWorkoutPlan = {
      id: 'up', userId: 'u', planId: 'p', isActive: true, startedAt: '2026-01-01',
      planData: {
        sessions: [{ id: 's1', name: 'Daily', focus: 'full', exercises: [{ name: 'X' } as any] }],
        schedule: {
          monday: [{ sessionId: 's1', order: 1, isOptional: false }],
          tuesday: [{ sessionId: 's1', order: 1, isOptional: false }],
          wednesday: [{ sessionId: 's1', order: 1, isOptional: false }],
          thursday: [{ sessionId: 's1', order: 1, isOptional: false }],
          friday: [{ sessionId: 's1', order: 1, isOptional: false }],
          saturday: [{ sessionId: 's1', order: 1, isOptional: false }],
          sunday: [{ sessionId: 's1', order: 1, isOptional: false }],
        },
      } as any,
    } as any;
    const next = getNextScheduledWorkout(everyDayPlan);
    expect(next).not.toBeNull();
    expect(next?.daysUntil).toBe(0);
    expect(next?.name).toBe('Daily');
  });
});
