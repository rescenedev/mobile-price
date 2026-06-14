'use client';

import { useEffect, useState } from 'react';
import type { Plan } from '@/entities/plan';
import { parsePlanList } from '@/entities/plan';
import { PLANS_DATA_URL } from './constants';

interface IPlansSource {
  readonly plans: readonly Plan[];
  readonly loaded: boolean;
}

/**
 * 팔레트 검색 소스 — 정적 에셋 `/data/plans.json`을 1회 fetch + Zod 경계검증.
 * 실패는 graceful: plans=[] 유지(검색 그룹만 비고 이동/필터는 정상 동작).
 * 클라 정적 에셋(cf-cache) 직접 fetch이므로 trackFetch(서버 전용) 대상 아님.
 */
export const usePlansSource = (enabled: boolean): IPlansSource => {
  const [plans, setPlans] = useState<readonly Plan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;

    const load = async (): Promise<void> => {
      try {
        const res = await fetch(PLANS_DATA_URL, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`plans.json ${res.status}`);
        const raw: unknown = await res.json();
        const parsed = parsePlanList(raw);
        if (!cancelled) setPlans(parsed);
      } catch {
        // graceful degrade — 검색 그룹만 빈 채로 두고 이동/필터는 동작.
        if (!cancelled) setPlans([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, loaded]);

  return { plans, loaded };
};
