'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Plan } from '@/entities/plan';
import { parsePlanList } from '@/entities/plan';
import {
  applyFilters,
  parseFilters,
  serializeFilters,
  type IFilterState,
} from '@/features/plan-filter';
import { trackEvent, EVENTS } from '@/shared/perf';
import { resultCountBucket } from '@/shared/config';
import { Skeleton } from '@/shared/ui';
import { FilterBar } from '@/widgets/filter-bar/barrel';
import { PlanCard } from '@/widgets/plan-card';
import { EmptyState } from '@/widgets/empty-state';
import { CompareTrayBar } from '@/widgets/compare-tray-bar';
import { INITIAL_PLAN_COUNT } from './constants';

/** IFilterState에서 활성(비기본) 필터축 키 목록 — 값(절대값) 아닌 축 이름만(PII 0). */
const activeFilterKeys = (s: IFilterState): string => {
  const keys: string[] = [];
  if (s.priceMax !== null) keys.push('price');
  if (s.dataMin !== null) keys.push('data');
  if (s.network !== null) keys.push('network');
  if (s.chips.length > 0) keys.push('chips');
  return keys.join(',') || 'none';
};

/**
 * 클라가 마운트 후 비동기 로드하는 전체 목록 — **정적 에셋**(ASSETS 바인딩 직접 서빙).
 * Worker API(/api/plans, ~54ms) 대신 cf-cache되는 정적 JSON(~47ms·Worker 스킵)에서 받는다.
 * 빌드 전 `scripts/sync-static-data.mjs`가 seedPlans 소스를 그대로 복사하므로 데이터 동일.
 */
const FULL_PLANS_ENDPOINT = `/data/plans.json`;

/**
 * 기본(빈 진입) 필터 상태 — searchParams 의존 없이 서버/클라가 동일하게 산출.
 * parseFilters(빈 params)는 DEFAULT_SORT(price_asc)를 적용하므로 깨끗한 진입과 일치.
 * SSR/정적 프리렌더는 이 상태로 initialPlans(price_asc 24개)를 HTML에 그대로 출력한다.
 */
const DEFAULT_FILTER_STATE: IFilterState = parseFilters(new URLSearchParams());

/** 현재 브라우저 URL의 query를 필터 상태로 파싱(클라 전용). 마운트/popstate 시 호출. */
const readFilterFromLocation = (): IFilterState =>
  parseFilters(new URLSearchParams(window.location.search));

interface IPlanListProps {
  /**
   * 서버(ISR)가 공급하는 최저가 상위 INITIAL_PLAN_COUNT개. 초기 렌더(첫 페인트)는 이걸로.
   * 마운트 후 클라가 전체를 fetch해 필터 소스를 교체(서버 재요청은 캐시 히트라 저렴).
   */
  readonly initialPlans: readonly Plan[];
  /**
   * 전체 중 월요금 최저가 plan의 id. 이 id의 카드 1장만 글로우+왕관 뱃지로 강조한다.
   * 정렬/필터로 위치가 바뀌어도 id 기준이라 항상 같은 plan을 가리킨다.
   */
  readonly cheapestId: string;
}

/**
 * PlanList(클라) — 필터 상태를 URL query에 직렬화(공유 URL), in-memory 필터.
 *
 * 렌더링 핵심(SSR 카드 출력): useSearchParams() 훅 의존을 제거한다. 해당 훅은 정적 프리렌더
 * 라우트에서 Suspense 폴백으로 바일아웃 → 카드가 정적 HTML에 들어가지 못한다. 대신 초기 상태는
 * 서버/클라 공통 상수 DEFAULT_FILTER_STATE(price_asc)로 고정해 서버가 initialPlans(24개) 카드를
 * HTML에 직접 출력하고, URL 필터/정렬은 마운트 후 useEffect에서 window.location.search로 읽어
 * 반영한다(딥링크 보존). 뒤로/앞으로가기는 popstate 리스너로 동기화한다.
 *
 * 데이터 소스: 초기엔 initialPlans(24, SSR), 마운트 후 /api/plans?limit=300의 전체(253)로 교체.
 * fetch 실패/지연 시 initialPlans로 graceful degrade(화면 안 깨짐).
 * 결과 카운트는 aria-live. 0건이면 EmptyState. 필터는 history.replaceState debounce(150ms).
 * 전체 로드 전 추가 카드 영역은 스켈레톤(고정 높이)으로 CLS 0.
 * PlanCard 본체는 정적 렌더(인터랙션은 CompareToggle island만).
 */
export const PlanList = ({ initialPlans, cheapestId }: IPlanListProps): React.JSX.Element => {
  // 초기 상태는 URL 비의존 기본값 → 서버/정적 HTML과 클라 첫 렌더가 동일(hydration mismatch 0).
  const [state, setState] = useState<IFilterState>(DEFAULT_FILTER_STATE);
  // 전체 목록(클라 비동기 로드). 로드 전엔 null → 필터 소스는 initialPlans로 graceful degrade.
  const [fullPlans, setFullPlans] = useState<readonly Plan[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coreFiredRef = useRef(false);
  const viewFiredRef = useRef(false);

  // 필터/정렬 소스: 전체 로드 완료 시 전체(253), 그 전엔 SSR 초기 24개.
  const plans = fullPlans ?? initialPlans;
  // 전체 로드 전 보충 카드 영역 스켈레톤 수(CLS 0용). 전체 길이 추정 - 초기 표시 수.
  const pendingCount = fullPlans === null ? INITIAL_PLAN_COUNT : 0;

  // 마운트 후: ① URL 필터를 읽어 상태 반영(딥링크), ② popstate로 뒤로/앞으로가기 동기화.
  // useSearchParams 훅을 쓰지 않아 정적 프리렌더 바일아웃을 회피한다.
  useEffect(() => {
    setState(readFilterFromLocation());
    const onPopState = (): void => setState(readFilterFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 마운트 후 전체 목록 비동기 로드. 표준 fetch(클라 비콘과 동일, 서버 trackFetch 대상 아님).
  // 엔드포인트는 엣지캐시(Cache API) 히트라 빠름. 실패 시 initialPlans로 graceful degrade.
  useEffect(() => {
    const controller = new AbortController();
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(FULL_PLANS_ENDPOINT, { signal: controller.signal });
        if (!res.ok) return;
        const body: unknown = await res.json();
        // 정적 에셋(배열) 또는 Worker API({plans}) 양쪽 지원.
        const list = Array.isArray(body) ? body : (body as { plans?: unknown }).plans;
        // 시스템 경계 검증(Zod) — 부적합 응답은 무시(초기 24개 유지).
        const parsed = parsePlanList(list);
        setFullPlans(parsed);
      } catch {
        // abort/네트워크 실패 — initialPlans로 유지(화면 안 깨짐).
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  const onChange = useCallback(
    (next: IFilterState): void => {
      setState((prev) => {
        // 퀵칩 토글 감지(즉시 발화) — 추가/해제된 칩만 toggle_quickchip.
        const prevChips = new Set(prev.chips);
        const nextChips = new Set(next.chips);
        for (const chip of next.chips) {
          if (!prevChips.has(chip)) trackEvent(EVENTS.TOGGLE_QUICKCHIP, { chip_id: chip, active: true });
        }
        for (const chip of prev.chips) {
          if (!nextChips.has(chip)) trackEvent(EVENTS.TOGGLE_QUICKCHIP, { chip_id: chip, active: false });
        }
        return next;
      });

      // 첫 핵심행동(필터)이면 core_action 1회.
      if (!coreFiredRef.current) {
        coreFiredRef.current = true;
        trackEvent(EVENTS.CORE_ACTION, { action_kind: 'filter' });
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // URL 직렬화(공유 URL·딥링크). useRouter 없이 history API로 직접 반영 →
        // useSearchParams 훅 의존 제거(정적 렌더 바일아웃 회피)와 일관. scroll 위치 유지.
        const qs = serializeFilters(next).toString();
        const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        window.history.replaceState(window.history.state, '', url);
        // apply_filter — 확정(debounce 후) 1회. 축 이름·정렬·결과수 버킷만(절대값 0).
        trackEvent(EVENTS.APPLY_FILTER, {
          filter_keys: activeFilterKeys(next),
          sort: next.sort,
          result_count_bucket: resultCountBucket(applyFilters(plans, next).length),
        });
      }, 150);
    },
    [plans],
  );

  const resetFilters = useCallback((): void => {
    onChange({ priceMax: null, dataMin: null, network: null, sort: 'price_asc', chips: [] });
  }, [onChange]);

  const results = useMemo(() => applyFilters(plans, state), [plans, state]);
  const resultCount = results.length;

  // view_plan_list — 진입 1회. 결과수 버킷·필터 적용 여부만(절대값 0).
  useEffect(() => {
    if (viewFiredRef.current) return;
    viewFiredRef.current = true;
    trackEvent(EVENTS.VIEW_PLAN_LIST, {
      result_count_bucket: resultCountBucket(results.length),
      has_filter: activeFilterKeys(state) !== 'none',
    });
    // 마운트 1회만 — results/state는 초기 진입 스냅샷, 의존성 의도적으로 비움.
  }, []);

  return (
    <div className="space-y-4">
      <FilterBar state={state} onChange={onChange} resultCount={resultCount} />

      {results.length === 0 && fullPlans !== null ? (
        // 전체 로드 완료 후에도 0건일 때만 EmptyState — 로딩 중 "없음" 깜빡임 방지.
        <EmptyState
          title="조건에 맞는 요금제가 없어요"
          description="필터를 완화하면 더 많은 요금제를 볼 수 있어요."
          actionLabel="필터 초기화"
          onAction={resetFilters}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {results.map((plan) => (
            <li key={plan.id}>
              <PlanCard plan={plan} className="h-full" isLowest={plan.id === cheapestId} />
            </li>
          ))}
          {/* 전체 로드 전 보충 카드 영역 — 고정 높이 스켈레톤(그리드 하단에만 추가 → CLS 0).
              실 카드로 교체돼도 기존 카드는 이동하지 않음. */}
          {Array.from({ length: pendingCount }, (_, i) => (
            <li key={`skeleton-${i}`} aria-hidden="true">
              <Skeleton className="h-[18rem] w-full rounded-2xl" />
            </li>
          ))}
        </ul>
      )}

      <CompareTrayBar />
    </div>
  );
};
