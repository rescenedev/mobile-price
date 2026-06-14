import { z } from 'zod';
import type { Plan, TNetwork } from '@/entities/plan';
import { networkSchema, firstYearCost } from '@/entities/plan';

/** 정렬 키 — 월요금↑ / 1년총비용↑ / 데이터↓ / 추천(가성비). */
export type TPlanSort = 'price_asc' | 'year_cost_asc' | 'data_desc' | 'recommend';

/** 기본 정렬 — 가장 싼 요금제가 최상단(사용자 피드백: 실제 2,750원 같은 최저가 우선 노출). */
export const DEFAULT_SORT: TPlanSort = 'price_asc';

/**
 * 목록 필터 기준 — `/api/plans` 쿼리 ↔ in-memory 필터.
 * cache-topology 권장: `plans:v1:all` 단일 KV 캐시 후 메모리 필터(키 폭발 방지).
 * 전부 optional. 미지정 필드는 무시.
 */
export interface IPlanCriteria {
  readonly network?: TNetwork;
  readonly mvno?: boolean;
  readonly unlimited?: boolean;
  readonly noContract?: boolean;
  readonly priceMax?: number;
  readonly dataMin?: number;
  readonly sort?: TPlanSort;
}

const matches = (plan: Plan, c: IPlanCriteria): boolean => {
  if (c.network !== undefined && plan.network !== c.network) return false;
  if (c.mvno !== undefined && plan.mvno !== c.mvno) return false;
  if (c.unlimited !== undefined) {
    const isUnlimited = plan.dataUnlimited;
    if (isUnlimited !== c.unlimited) return false;
  }
  if (c.noContract === true && plan.contract !== 'none') return false;
  if (c.priceMax !== undefined && plan.monthlyPrice > c.priceMax) return false;
  if (c.dataMin !== undefined) {
    // 무제한은 dataMin을 항상 만족.
    const effective = plan.dataUnlimited ? Number.POSITIVE_INFINITY : (plan.dataGb ?? 0);
    if (effective < c.dataMin) return false;
  }
  return true;
};

const dataValue = (plan: Plan): number =>
  plan.dataUnlimited ? Number.POSITIVE_INFINITY : (plan.dataGb ?? 0);

/** 가성비 점수(높을수록 추천): 데이터/가격. 무제한은 큰 상수 데이터로 환산. */
const valueScore = (plan: Plan): number => {
  const data = plan.dataUnlimited ? 200 : (plan.dataGb ?? 0.1);
  return data / Math.max(plan.monthlyPrice, 1);
};

const sortPlans = (plans: readonly Plan[], sort: TPlanSort): Plan[] => {
  const copy = [...plans];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
    case 'year_cost_asc':
      return copy.sort((a, b) => firstYearCost(a) - firstYearCost(b));
    case 'data_desc':
      return copy.sort((a, b) => dataValue(b) - dataValue(a));
    case 'recommend':
      return copy.sort((a, b) => valueScore(b) - valueScore(a));
    default:
      return copy;
  }
};

/**
 * 전체 목록에 필터+정렬을 in-memory로 적용한다(N+1 0 — DB는 단일 findAll만 수행).
 * 순수함수: 입력 배열을 변형하지 않는다(immutable).
 */
export const applyCriteria = (plans: readonly Plan[], c: IPlanCriteria): Plan[] => {
  const filtered = plans.filter((p) => matches(p, c));
  // sort 미지정 시 기본은 가장 싼 요금제 최상단(DEFAULT_SORT=price_asc).
  return sortPlans(filtered, c.sort ?? DEFAULT_SORT);
};

const sortValues = ['price_asc', 'year_cost_asc', 'data_desc', 'recommend'] as const;
const boolFlag = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

/**
 * URLSearchParams → IPlanCriteria (HTTP 경계 검증, Zod).
 * 잘못된 값은 무시(undefined)되어 필터에서 빠진다 — 안전한 폴백(전체 목록).
 */
export const parseCriteria = (params: URLSearchParams): IPlanCriteria => {
  const get = (k: string): string | undefined => params.get(k) ?? undefined;
  const num = (k: string): number | undefined => {
    const raw = get(k);
    if (raw === undefined) return undefined;
    const parsed = z.coerce.number().int().nonnegative().safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  };
  const flag = (k: string): boolean | undefined => {
    const raw = get(k);
    if (raw === undefined) return undefined;
    const parsed = boolFlag.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  };

  const network = networkSchema.safeParse(get('network'));
  const sort = z.enum(sortValues).safeParse(get('sort'));

  return {
    network: network.success ? network.data : undefined,
    mvno: flag('mvno'),
    unlimited: flag('unlimited'),
    noContract: flag('no_contract'),
    priceMax: num('price_max'),
    dataMin: num('data_min'),
    sort: sort.success ? sort.data : undefined,
  };
};
