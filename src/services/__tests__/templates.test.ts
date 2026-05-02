/**
 * Tests for the templates (quick-save) service. Covers the user-empty short
 * circuits, the row→Template mapping, and the favorite toggle path.
 */

jest.mock('../supabase', () => ({ supabase: {} as any }));

import { supabase } from '../supabase';
import {
  fetchTemplatesForUser,
  fetchFoldersForUser,
  fetchFavoritesForUser,
  toggleFavoriteTemplate,
} from '../templates';

const makeChain = (terminal: { data?: any; error?: any } = { data: null, error: null }) => {
  const calls: { method: string; args: any[] }[] = [];
  const chain: any = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'in', 'order', 'limit'].forEach((m) => {
    chain[m] = jest.fn((...args: any[]) => { calls.push({ method: m, args }); return chain; });
  });
  chain.single = jest.fn(() => Promise.resolve(terminal));
  chain.maybeSingle = jest.fn(() => Promise.resolve(terminal));
  chain.then = (onFulfilled: any) => Promise.resolve(terminal).then(onFulfilled);
  return { chain, calls };
};

afterEach(() => jest.clearAllMocks());

describe('fetchTemplatesForUser', () => {
  it('short-circuits without a userId', async () => {
    (supabase as any).from = jest.fn();
    expect(await fetchTemplatesForUser(undefined)).toEqual({ templates: [], tags: [] });
    expect((supabase as any).from).not.toHaveBeenCalled();
  });

  it('orders exercises by order_index and aggregates tags', async () => {
    const { chain } = makeChain({
      data: [
        {
          id: 't1',
          user_id: 'u1',
          folder_id: null,
          kind: 'quick',
          name: 'Push',
          description: '2 Exercises',
          icon: '💾',
          tags: ['push', 'upper'],
          is_public: false,
          template_exercises: [
            { order_index: 1, exercise: { name: 'OHP' } },
            { order_index: 0, exercise: { name: 'Bench' } },
          ],
        },
      ],
      error: null,
    });
    (supabase as any).from = jest.fn(() => chain);

    const out = await fetchTemplatesForUser('u1');
    expect(out.templates).toHaveLength(1);
    expect(out.templates[0].exercises).toEqual(['Bench', 'OHP']);
    expect(out.tags).toEqual(['push', 'upper']);
  });
});

describe('fetchFoldersForUser', () => {
  it('returns [] for empty userId', async () => {
    (supabase as any).from = jest.fn();
    expect(await fetchFoldersForUser(undefined)).toEqual([]);
  });
  it('returns folder rows for a user', async () => {
    const { chain } = makeChain({ data: [{ id: 'f1', name: 'A' }], error: null });
    (supabase as any).from = jest.fn(() => chain);
    expect(await fetchFoldersForUser('u1')).toEqual([{ id: 'f1', name: 'A' }]);
  });
});

describe('fetchFavoritesForUser', () => {
  it('returns empty Set without userId', async () => {
    (supabase as any).from = jest.fn();
    expect(await fetchFavoritesForUser(undefined)).toEqual(new Set());
  });
  it('builds a Set of template_ids', async () => {
    const { chain } = makeChain({ data: [{ template_id: 'a' }, { template_id: 'b' }], error: null });
    (supabase as any).from = jest.fn(() => chain);
    const out = await fetchFavoritesForUser('u1');
    expect(out.has('a')).toBe(true);
    expect(out.has('b')).toBe(true);
    expect(out.size).toBe(2);
  });
});

describe('toggleFavoriteTemplate', () => {
  it('throws without a userId', async () => {
    await expect(toggleFavoriteTemplate(undefined, 't1', false)).rejects.toThrow(/No user/);
  });
  it('deletes when currently favorited (returns false)', async () => {
    const { chain, calls } = makeChain({ data: null, error: null });
    (supabase as any).from = jest.fn(() => chain);
    const out = await toggleFavoriteTemplate('u1', 't1', true);
    expect(out).toBe(false);
    expect(calls.find(c => c.method === 'delete')).toBeTruthy();
  });
  it('inserts when not favorited (returns true)', async () => {
    const { chain, calls } = makeChain({ data: null, error: null });
    (supabase as any).from = jest.fn(() => chain);
    const out = await toggleFavoriteTemplate('u1', 't1', false);
    expect(out).toBe(true);
    const insert = calls.find(c => c.method === 'insert');
    expect(insert?.args[0]).toEqual({ user_id: 'u1', template_id: 't1' });
  });
});
