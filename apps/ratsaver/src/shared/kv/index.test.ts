import { describe, it, expect, vi } from 'vitest';
import { kvGetJson, kvSetJson, kvDelete } from './index';

interface IStored {
  value: string;
  expirationTtl?: number;
}

/** 인메모리 가짜 KVNamespace — get(key, 'json') 형태만 지원하면 충분. */
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

interface IUser {
  id: string;
  name: string;
}

describe('kvGetJson', () => {
  it('returns null on miss', async () => {
    const { kv } = createFakeKv();
    expect(await kvGetJson<IUser>(kv, 'missing')).toBeNull();
  });

  it('roundtrips a set value', async () => {
    const { kv } = createFakeKv();
    await kvSetJson(kv, 'u:1', { id: '1', name: 'Ada' });
    expect(await kvGetJson<IUser>(kv, 'u:1')).toEqual({ id: '1', name: 'Ada' });
  });
});

describe('kvSetJson', () => {
  it('passes ttl through to put', async () => {
    const { kv, store, spies } = createFakeKv();
    await kvSetJson(kv, 'u:2', { id: '2', name: 'Bob' }, 60);
    expect(spies.put).toHaveBeenCalledWith('u:2', JSON.stringify({ id: '2', name: 'Bob' }), {
      expirationTtl: 60,
    });
    expect(store.get('u:2')?.expirationTtl).toBe(60);
  });

  it('omits ttl when not provided', async () => {
    const { kv, spies } = createFakeKv();
    await kvSetJson(kv, 'u:3', { id: '3', name: 'Cid' });
    expect(spies.put).toHaveBeenCalledWith('u:3', JSON.stringify({ id: '3', name: 'Cid' }), undefined);
  });
});

describe('kvDelete', () => {
  it('removes a stored key', async () => {
    const { kv } = createFakeKv();
    await kvSetJson(kv, 'u:4', { id: '4', name: 'Dot' });
    await kvDelete(kv, 'u:4');
    expect(await kvGetJson<IUser>(kv, 'u:4')).toBeNull();
  });
});
