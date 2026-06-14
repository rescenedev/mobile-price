import 'server-only';
import { eq } from 'drizzle-orm';
import type { Plan } from '@/entities/plan';
import type { TDb } from './client';
import { plans } from './schema';
import { rowToPlan } from './mapper';
import { applyCriteria, type IPlanCriteria } from './criteria';

/**
 * plan repository — D1(Drizzle) 단일 통로.
 * N+1 0: 목록=단일 SELECT, 상세=단건 PK. 루프 안 쿼리 없음.
 * 캐시·계측은 상위(@/shared/cache.cachedJson → trackFetch)에서 담당하므로
 * 여기서는 순수 DB 접근만 한다. DB 클라이언트는 @/shared/env 통로로 만든 것을 주입받는다.
 */
export interface IPlanRepository {
  findAll(): Promise<Plan[]>;
  findById(id: string): Promise<Plan | null>;
  filter(criteria: IPlanCriteria): Promise<Plan[]>;
}

export const createPlanRepository = (db: TDb): IPlanRepository => {
  const findAll = async (): Promise<Plan[]> => {
    const rows = await db.select().from(plans).all(); // 단일 쿼리
    return rows.map(rowToPlan);
  };

  return {
    findAll,

    async findById(id: string): Promise<Plan | null> {
      const rows = await db.select().from(plans).where(eq(plans.id, id)).limit(1).all(); // 단건 PK
      const row = rows[0];
      return row ? rowToPlan(row) : null;
    },

    // 150건 소규모 — 단일 findAll 후 in-memory 필터(cache-topology 권장: plans:v1:all 단일키).
    async filter(criteria: IPlanCriteria): Promise<Plan[]> {
      const all = await findAll();
      return applyCriteria(all, criteria);
    },
  };
};
