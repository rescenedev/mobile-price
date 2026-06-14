import type { Plan } from '@/entities/plan';
import { SEARCH_RESULT_LIMIT } from './constants';

/** 검색 정규화 — 소문자·공백 제거(통신사/요금제명 느슨 매칭). */
const normalize = (raw: string): string => raw.toLowerCase().replace(/\s+/g, '');

/**
 * 입력어로 요금제를 name/carrier 매칭해 상위 N개 반환(순수 함수).
 * - 빈/공백 입력 → 빈 배열(검색 그룹 미표시).
 * - name 매칭을 carrier 매칭보다 우선, 그 다음 월요금 오름차순(최저가 먼저).
 */
export const searchPlans = (
  plans: readonly Plan[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): readonly Plan[] => {
  const q = normalize(query);
  if (q.length === 0) return [];

  const scored = plans
    .map((plan) => {
      const inName = normalize(plan.name).includes(q);
      const inCarrier = normalize(plan.carrier).includes(q);
      if (!inName && !inCarrier) return null;
      // name 매칭 우선(rank 0) > carrier-only 매칭(rank 1).
      return { plan, rank: inName ? 0 : 1 } as const;
    })
    .filter((entry): entry is { plan: Plan; rank: 0 | 1 } => entry !== null);

  return scored
    .slice()
    .sort((a, b) => a.rank - b.rank || a.plan.monthlyPrice - b.plan.monthlyPrice)
    .slice(0, limit)
    .map((entry) => entry.plan);
};
