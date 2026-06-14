import { describe, it, expect, vi } from 'vitest';
import type { Plan } from '@/entities/plan';
import type { IPerfSample, IPerfSink } from '@/shared/perf/types';
import { getCachedPlans, getCachedPlanById } from './plans';
import { planListKey, planIdKey } from './keys';

const plan = (over: Partial<Plan>): Plan => ({
  id: 'a',
  carrier: 'c',
  network: 'KT',
  tech: 'LTE',
  mvno: true,
  name: 'n',
  dataGb: 11,
  dataUnlimited: false,
  throttleKbps: null,
  callUnlimited: true,
  callMinutes: null,
  smsUnlimited: true,
  smsCount: null,
  monthlyPrice: 19000,
  regularPrice: 19000,
  promoMonths: 0,
  contract: 'none',
  signupType: 'online',
  giftCount: 0,
  notes: null,
  lastVerifiedAt: '2026-06-01',
  ...over,
});

const createFakeKv = () => {
  const store = new Map<string, string>();
  const kv = {
    get: vi.fn(async (key: string, type?: string) => {
      const v = store.get(key);
      if (v === undefined) return null;
      return type === 'json' ? JSON.parse(v) : v;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => store.delete(key)),
  };
  return { kv: kv as unknown as KVNamespace, store };
};

const sinkOf = () => {
  const samples: IPerfSample[] = [];
  const sink: IPerfSink = { record: (s) => samples.push(s) };
  return { sink, samples };
};

describe('getCachedPlans', () => {
  it('miss → loads from D1, stores under plans:v1:all, records miss', async () => {
    const { kv, store } = createFakeKv();
    const { sink, samples } = sinkOf();
    const loadAll = vi.fn(async () => [plan({ id: 'a' }), plan({ id: 'b' })]);

    const res = await getCachedPlans({ kv, sink, loadAll }, '/api/plans');

    expect(res.map((p) => p.id)).toEqual(['a', 'b']);
    expect(loadAll).toHaveBeenCalledTimes(1);
    expect(store.has(planListKey())).toBe(true);
    expect(samples[0]).toMatchObject({ route: '/api/plans', cache: 'miss' });
  });

  it('hit → does not call D1, records hit, returns KV value without Zod re-validation', async () => {
    const { kv } = createFakeKv();
    const { sink, samples } = sinkOf();
    const loadAll = vi.fn(async () => [plan({ id: 'a' })]);

    await getCachedPlans({ kv, sink, loadAll }, '/api/plans');
    const second = await getCachedPlans({ kv, sink, loadAll }, '/api/plans');

    expect(second.map((p) => p.id)).toEqual(['a']);
    expect(loadAll).toHaveBeenCalledTimes(1); // 반복 업스트림 0
    expect(samples[1]).toMatchObject({ cache: 'hit' });
  });
});

describe('getCachedPlanById', () => {
  it('miss → loads by PK, stores under plans:v1:id:{id}', async () => {
    const { kv, store } = createFakeKv();
    const { sink, samples } = sinkOf();
    const loadById = vi.fn(async () => plan({ id: 'x1' }));

    const res = await getCachedPlanById({ kv, sink, loadById }, 'x1', '/api/plans/[id]');

    expect(res?.id).toBe('x1');
    expect(store.has(planIdKey('x1'))).toBe(true);
    expect(samples[0]).toMatchObject({ route: '/api/plans/[id]', cache: 'miss' });
  });

  it('returns null and caches null for unknown id', async () => {
    const { kv } = createFakeKv();
    const { sink } = sinkOf();
    const loadById = vi.fn(async () => null);

    const res = await getCachedPlanById({ kv, sink, loadById }, 'nope', '/api/plans/[id]');
    expect(res).toBeNull();
  });
});
