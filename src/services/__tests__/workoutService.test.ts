/**
 * Unit tests for workoutService — the boundary between Supabase and the
 * camelCase shapes the rest of the app reads. Especially important to lock
 * the snake_case → camelCase mapping in fetchUserWorkoutPlans, since a
 * regression there shows up as silent "No Active Plan" UI bugs.
 */

jest.mock('../supabase', () => ({ supabase: {} as any }));

import { supabase } from '../supabase';
import {
  fetchExercises,
  fetchUserWorkoutPlans,
  deactivateUserWorkoutPlans,
  setPlanReviewStatus,
  fetchWorkoutSessions,
  fetchUserWorkoutDates,
  logWorkoutSession,
} from '../workoutService';

type AnyMock = jest.Mock<any, any>;

/**
 * Build a chainable query stub. Each call to one of the listed methods
 * returns `this` so you can fluently `.eq().eq().order()`. The terminal
 * call (`single`, `maybeSingle`, or thenable) returns the supplied result.
 *
 * If `result` is a function it gets called with the recorded `calls` array.
 */
const makeChain = (terminal: { data?: any; error?: any } | ((calls: any[]) => any) = { data: null, error: null }) => {
  const calls: { method: string; args: any[] }[] = [];
  const chain: any = {};

  const passthrough = [
    'select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'limit', 'rpc',
  ];
  passthrough.forEach((m) => {
    chain[m] = jest.fn((...args: any[]) => {
      calls.push({ method: m, args });
      return chain;
    });
  });

  // Terminal — when callers `await chain` directly, the chain is "thenable".
  const settle = () => (typeof terminal === 'function' ? terminal(calls) : terminal);
  chain.single = jest.fn(() => Promise.resolve(settle()));
  chain.maybeSingle = jest.fn(() => Promise.resolve(settle()));
  chain.then = (onFulfilled: any) => Promise.resolve(settle()).then(onFulfilled);

  return { chain, calls };
};

const setupFrom = (table: string, terminal: any) => {
  const { chain, calls } = makeChain(terminal);
  (supabase as any).from = jest.fn((t: string) => {
    expect(t).toBe(table);
    return chain;
  });
  return { chain, calls };
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('fetchExercises', () => {
  it('selects all exercises ordered by name', async () => {
    const { calls } = setupFrom('exercises', { data: [{ id: 'e1', name: 'Bench' }], error: null });
    const out = await fetchExercises();
    expect(out).toEqual([{ id: 'e1', name: 'Bench' }]);
    const methods = calls.map(c => c.method);
    expect(methods).toEqual(['select', 'order']);
    expect(calls[0].args[0]).toBe('*');
    expect(calls[1].args[0]).toBe('name');
  });
  it('throws on error', async () => {
    setupFrom('exercises', { data: null, error: new Error('boom') });
    await expect(fetchExercises()).rejects.toThrow('boom');
  });
});

describe('fetchUserWorkoutPlans', () => {
  it('maps snake_case rows to camelCase UserWorkoutPlan', async () => {
    setupFrom('user_workout_plans', {
      data: [
        {
          id: 'up1',
          user_id: 'u1',
          plan_id: 'p1',
          plan: { id: 'p1', name: 'Plan A' },
          custom_name: 'My Plan',
          started_at: '2026-04-01',
          ends_at: null,
          is_active: true,
          created_at: '2026-04-01',
          updated_at: null,
        },
      ],
      error: null,
    });

    const out = await fetchUserWorkoutPlans('u1');
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      id: 'up1',
      userId: 'u1',
      planId: 'p1',
      planData: { id: 'p1', name: 'Plan A' },
      customName: 'My Plan',
      startedAt: '2026-04-01',
      endsAt: undefined,
      isActive: true,
      createdAt: '2026-04-01',
      updatedAt: undefined,
    });
  });
  it('coerces is_active to boolean (regression guard)', async () => {
    setupFrom('user_workout_plans', {
      data: [
        { id: 'a', user_id: 'u', plan_id: 'p', plan: null, started_at: 's', is_active: false, created_at: 'c' },
        { id: 'b', user_id: 'u', plan_id: 'q', plan: null, started_at: 's', is_active: true, created_at: 'c' },
      ],
      error: null,
    });
    const out = await fetchUserWorkoutPlans('u');
    expect(out.find(p => p.isActive)?.id).toBe('b');
    expect(out.find(p => !p.isActive)?.id).toBe('a');
  });
  it('returns empty array when data is null', async () => {
    setupFrom('user_workout_plans', { data: null, error: null });
    expect(await fetchUserWorkoutPlans('u')).toEqual([]);
  });
  it('throws on error', async () => {
    setupFrom('user_workout_plans', { data: null, error: new Error('rls denied') });
    await expect(fetchUserWorkoutPlans('u')).rejects.toThrow('rls denied');
  });
});

describe('deactivateUserWorkoutPlans', () => {
  it('updates is_active=false for the user where currently active', async () => {
    const { calls } = setupFrom('user_workout_plans', { data: null, error: null });
    await deactivateUserWorkoutPlans('u1');

    const update = calls.find(c => c.method === 'update');
    expect(update?.args[0]).toEqual({ is_active: false });
    const eqs = calls.filter(c => c.method === 'eq');
    expect(eqs).toHaveLength(2);
    expect(eqs[0].args).toEqual(['user_id', 'u1']);
    expect(eqs[1].args).toEqual(['is_active', true]);
  });
  it('throws when supabase returns an error', async () => {
    setupFrom('user_workout_plans', { data: null, error: new Error('nope') });
    await expect(deactivateUserWorkoutPlans('u1')).rejects.toThrow('nope');
  });
});

describe('setPlanReviewStatus', () => {
  it('rejects an invalid status without calling supabase', async () => {
    (supabase as any).from = jest.fn();
    await expect(setPlanReviewStatus('p1', 'bogus' as any)).rejects.toThrow(/invalid status/);
    expect((supabase as any).from).not.toHaveBeenCalled();
  });
  it('updates review_status on the plan row', async () => {
    const { calls } = setupFrom('workout_plans', { data: { id: 'p1', review_status: 'pending_review' }, error: null });
    const out = await setPlanReviewStatus('p1', 'pending_review');
    expect(out.review_status).toBe('pending_review');
    const update = calls.find(c => c.method === 'update');
    expect(update?.args[0]).toEqual({ review_status: 'pending_review' });
  });
});

describe('fetchWorkoutSessions', () => {
  it('maps session_summary_view rows into the History shape', async () => {
    setupFrom('session_summary_view', {
      data: [
        {
          id: 'ws1',
          user_id: 'u1',
          workout_date: '2026-04-30',
          session_name: 'Push',
          start_time: '2026-04-30T10:00:00Z',
          end_time: '2026-04-30T11:00:00Z',
          plan_id: 'p1',
          plan_session_id: 'ps1',
          total_sets: 9,
          exercise_count: 3,
          volume_load: '4500',
          duration_seconds: 3600,
          status: 'completed',
          notes: null,
        },
      ],
      error: null,
    });
    const out = await fetchWorkoutSessions('u1');
    expect(out[0]).toMatchObject({
      id: 'ws1',
      date: '2026-04-30',
      name: 'Push',
      total_sets: 9,
      exercise_count: 3,
      volume_load: 4500, // coerced to Number
      status: 'completed',
    });
  });
  it('returns [] when data is null', async () => {
    setupFrom('session_summary_view', { data: null, error: null });
    expect(await fetchWorkoutSessions('u1')).toEqual([]);
  });
});

describe('fetchUserWorkoutDates', () => {
  it('dedupes dates while preserving order', async () => {
    setupFrom('session_summary_view', {
      data: [
        { workout_date: '2026-04-30' },
        { workout_date: '2026-04-30' },
        { workout_date: '2026-04-29' },
        { workout_date: null },
        { workout_date: '2026-04-28' },
      ],
      error: null,
    });
    const out = await fetchUserWorkoutDates('u1');
    expect(out).toEqual(['2026-04-30', '2026-04-29', '2026-04-28']);
  });
});

describe('logWorkoutSession', () => {
  it('returns null when there are no completed sets', async () => {
    (supabase as any).from = jest.fn();
    const out = await logWorkoutSession(
      { user_id: 'u', date: '2026-05-01', name: 'X' },
      [{ exercise: { exercise_id: null, order_index: 0 }, sets: [{ set_number: 1, completed: false }] }],
    );
    expect(out).toBeNull();
    expect((supabase as any).from).not.toHaveBeenCalled();
  });

  it('inserts parent + sets and reports volume', async () => {
    // First .from('workout_sessions') for parent insert, then .from('workout_sets') for child.
    const parentChain = makeChain({ data: { id: 'sess-1', user_id: 'u', workout_date: '2026-05-01', name: 'X', start_time: null, end_time: null, plan_id: null, plan_session_id: null, created_at: '2026-05-01' }, error: null });
    const setsChain = makeChain({ data: null, error: null });

    let fromCallIndex = 0;
    (supabase as any).from = jest.fn((t: string) => {
      fromCallIndex++;
      if (fromCallIndex === 1) {
        expect(t).toBe('workout_sessions');
        return parentChain.chain;
      }
      expect(t).toBe('workout_sets');
      return setsChain.chain;
    });

    const out = await logWorkoutSession(
      { user_id: 'u', date: '2026-05-01', name: 'X' },
      [
        {
          exercise: { exercise_id: 'ex-1', order_index: 0 },
          sets: [
            { set_number: 1, weight: 100, reps: 5, completed: true },
            { set_number: 2, weight: 100, reps: 5, completed: true },
          ],
        },
      ],
    );

    expect(out?.id).toBe('sess-1');
    expect(out?.total_sets).toBe(2);
    expect(out?.volume_load).toBe(1000);

    // Sets insert payload must include session_id linkage.
    const setsInsertCall = setsChain.calls.find(c => c.method === 'insert');
    expect(Array.isArray(setsInsertCall?.args[0])).toBe(true);
    expect(setsInsertCall!.args[0][0].session_id).toBe('sess-1');
  });

  it('rolls back parent when sets insert fails', async () => {
    const parentChain = makeChain({ data: { id: 'sess-bad', user_id: 'u', workout_date: 'd', name: 'X', start_time: null, end_time: null, plan_id: null, plan_session_id: null, created_at: 'c' }, error: null });
    const setsChain = makeChain({ data: null, error: new Error('sets failed') });
    const deleteChain = makeChain({ data: null, error: null });

    let fromCallIndex = 0;
    (supabase as any).from = jest.fn((t: string) => {
      fromCallIndex++;
      if (fromCallIndex === 1) return parentChain.chain;
      if (fromCallIndex === 2) return setsChain.chain;
      // 3rd call: rollback delete on workout_sessions
      expect(t).toBe('workout_sessions');
      return deleteChain.chain;
    });

    await expect(
      logWorkoutSession(
        { user_id: 'u', date: 'd', name: 'X' },
        [{ exercise: { exercise_id: 'e', order_index: 0 }, sets: [{ set_number: 1, weight: 1, reps: 1, completed: true }] }],
      ),
    ).rejects.toThrow('sets failed');

    // Ensure delete was issued on workout_sessions with parent id
    const del = deleteChain.calls.find(c => c.method === 'delete');
    expect(del).toBeTruthy();
    const eq = deleteChain.calls.find(c => c.method === 'eq');
    expect(eq?.args).toEqual(['id', 'sess-bad']);
  });
});
