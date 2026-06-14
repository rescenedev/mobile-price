import { describe, it, expect, vi } from 'vitest';
import type { TPlanRow, TDb } from '@/shared/db';
import { createPlanRepository } from './repository';

// Drizzle row 형태(boolean 컬럼은 이미 boolean으로 변환된 상태) 픽스처.
const row = (over: Partial<TPlanRow>): TPlanRow => ({
  id: 'a',
  carrier: '헬로모바일',
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

/**
 * 단일 쿼리(N+1 0)를 검증하는 페이크 Drizzle db.
 * select().from().all() 과 select().from().where().limit().all() 체인을 지원하고
 * 호출 횟수를 카운트한다.
 */
const createFakeDb = (rows: TPlanRow[]) => {
  let queryCount = 0;
  const db = {
    select: () => ({
      from: () => {
        const builder = {
          all: async () => {
            queryCount += 1;
            return rows;
          },
          where: (predicate: (r: TPlanRow) => boolean) => ({
            limit: () => ({
              all: async () => {
                queryCount += 1;
                return rows.filter(predicate).slice(0, 1);
              },
            }),
          }),
        };
        return builder;
      },
    }),
  };
  return { db: db as unknown as TDb, getQueryCount: () => queryCount };
};

// drizzle eq를 페이크에서 predicate로 치환.
vi.mock('drizzle-orm', () => ({
  eq: (_col: unknown, value: unknown) => (r: TPlanRow) => r.id === value,
}));

describe('createPlanRepository', () => {
  it('findAll runs a single query and maps rows to Plan', async () => {
    const { db, getQueryCount } = createFakeDb([row({ id: 'a' }), row({ id: 'b' })]);
    const repo = createPlanRepository(db);
    const all = await repo.findAll();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe('a');
    expect(getQueryCount()).toBe(1); // N+1 0
  });

  it('findById runs a single PK query', async () => {
    const { db, getQueryCount } = createFakeDb([row({ id: 'a' }), row({ id: 'b' })]);
    const repo = createPlanRepository(db);
    const found = await repo.findById('b');
    expect(found?.id).toBe('b');
    expect(getQueryCount()).toBe(1);
  });

  it('findById returns null for unknown id', async () => {
    const { db } = createFakeDb([row({ id: 'a' })]);
    const repo = createPlanRepository(db);
    expect(await repo.findById('zzz')).toBeNull();
  });

  it('filter runs a single findAll then in-memory criteria (N+1 0)', async () => {
    const { db, getQueryCount } = createFakeDb([
      row({ id: 'a', network: 'KT', monthlyPrice: 10000 }),
      row({ id: 'b', network: 'SKT', monthlyPrice: 30000 }),
      row({ id: 'c', network: 'KT', monthlyPrice: 25000 }),
    ]);
    const repo = createPlanRepository(db);
    const res = await repo.filter({ network: 'KT', sort: 'price_asc' });
    expect(res.map((p) => p.id)).toEqual(['a', 'c']);
    expect(getQueryCount()).toBe(1); // 단일 쿼리만
  });
});
