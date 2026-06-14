import { describe, it, expect, vi } from 'vitest';
import { cachedJson } from './cached-json';
import type { IPerfSample, IPerfSink } from '@/shared/perf/types';

interface IStored {
  value: string;
  expirationTtl?: number;
}

const createFakeKv = () => {
  const store = new Map<string, IStored>();
  const kv = {
    get: vi.fn(async (key: string, type?: string) => {
      const entry = store.get(key);
      if (entry === undefined) return null;
      return type === 'json' ? JSON.parse(entry.value) : entry.value;
    }),
    put: vi.fn(async (key: string, value: string, opts?: { expirationTtl?: number }) => {
      store.set(key, { value, expirationTtl: opts?.expirationTtl });
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  };
  return { kv: kv as unknown as KVNamespace, store, spies: kv };
};

const createCapturingSink = () => {
  const samples: IPerfSample[] = [];
  const sink: IPerfSink = { record: (s) => samples.push(s) };
  return { sink, samples };
};

interface IPayload {
  n: number;
}

describe('cachedJson', () => {
  it('calls loader once on miss, stores result, records a miss sample', async () => {
    const { kv, store } = createFakeKv();
    const { sink, samples } = createCapturingSink();
    const loader = vi.fn(async (): Promise<IPayload> => ({ n: 42 }));

    const result = await cachedJson<IPayload>({
      kv,
      key: 'k1',
      ttlSec: 60,
      sink,
      route: '/api/x',
      loader,
    });

    expect(result).toEqual({ n: 42 });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(store.get('k1')?.expirationTtl).toBe(60);
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({ route: '/api/x', cache: 'miss', status: 200 });
    expect(samples[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('hits KV on second call, does not call loader, records a hit sample', async () => {
    const { kv } = createFakeKv();
    const { sink, samples } = createCapturingSink();
    const loader = vi.fn(async (): Promise<IPayload> => ({ n: 7 }));

    await cachedJson<IPayload>({ kv, key: 'k2', ttlSec: 60, sink, route: '/api/y', loader });
    const second = await cachedJson<IPayload>({ kv, key: 'k2', ttlSec: 60, sink, route: '/api/y', loader });

    expect(second).toEqual({ n: 7 });
    expect(loader).toHaveBeenCalledTimes(1);
    expect(samples).toHaveLength(2);
    expect(samples[0].cache).toBe('miss');
    expect(samples[1]).toMatchObject({ route: '/api/y', cache: 'hit', status: 200 });
  });

  it('propagates loader error and records a 500 miss sample', async () => {
    const { kv } = createFakeKv();
    const { sink, samples } = createCapturingSink();
    const boom = new Error('upstream down');
    const loader = vi.fn(async (): Promise<IPayload> => {
      throw boom;
    });

    await expect(
      cachedJson<IPayload>({ kv, key: 'k3', ttlSec: 60, sink, route: '/api/z', loader }),
    ).rejects.toThrow('upstream down');

    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({ route: '/api/z', cache: 'miss', status: 500 });
  });
});
