'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Plan } from '@/entities/plan';
import { parsePlanList } from '@/entities/plan';
import {
  recommend,
  usageFromPreset,
  USAGE_PRESETS,
  type IUsage,
} from '@/features/plan-recommend';
import { ToggleGroup, ToggleGroupItem, Skeleton } from '@/shared/ui';
import { trackEvent, EVENTS } from '@/shared/perf';
import { dataBucket, callBucket } from '@/shared/config';
import { PlanCard } from '@/widgets/plan-card';
import { EmptyState } from '@/widgets/empty-state';
import { CompareTrayBar } from '@/widgets/compare-tray-bar';

// 모달은 lazy import — 초기 번들에서 제외(진입 시 적재).
const UsagePresetModal = dynamic(
  () => import('@/widgets/usage-preset-modal').then((m) => m.UsagePresetModal),
  {
    ssr: false,
    loading: () => <Skeleton className="h-11 w-40" />,
  },
);

/** 전체 목록 — 정적 에셋(ASSETS 직접 서빙, ~47ms·Worker 스킵). 스코어링은 전체가 필요. */
const FULL_PLANS_ENDPOINT = `/data/plans.json`;

/** 추천 결과 상위 노출 개수. */
const RECOMMEND_LIMIT = 12;

/** searchParams(?preset= 또는 ?data=&call=) → 초기 사용량. */
const readInitialUsage = (params: URLSearchParams): IUsage | null => {
  const preset = params.get('preset');
  if (preset) {
    const fromPreset = usageFromPreset(preset);
    if (fromPreset) return fromPreset;
  }
  const data = params.get('data');
  const call = params.get('call');
  if (data !== null || call !== null) {
    const d = Number.parseInt(data ?? '', 10);
    const c = Number.parseInt(call ?? '', 10);
    return {
      dataGb: Number.isFinite(d) && d >= 0 ? d : 0,
      callMinutes: Number.isFinite(c) && c >= 0 ? c : 0,
    };
  }
  return null;
};

/** 현재 브라우저 URL의 preset query(클라 전용). 마운트/popstate 시 호출. */
const readPresetFromLocation = (): string =>
  new URLSearchParams(window.location.search).get('preset') ?? '';

/**
 * RecommendPanel(클라) — 프리셋 칩(인라인) + 직접입력 모달(lazy) → scorePlan 클라 스코어링.
 *
 * 렌더링 핵심(셸 정적 SSR): 전체 plan(253)을 props로 임베드하지 않는다. 추천 스코어링은 전체 목록을
 * 요구하므로, 마운트 후 useEffect에서 /api/plans?limit=300(엣지캐시)으로 직접 비동기 로드 →
 * parsePlanList(Zod 경계 검증) → fullPlans 상태. 로드 전엔 프리셋은 고르되 "요금제 불러오는 중"을
 * 고정 높이로 표시(CLS 0). 로드 후 기존 recommend() 스코어링 그대로.
 *
 * URL 상태(딥링크): useSearchParams/useRouter 훅 의존을 제거(정적 프리렌더 바일아웃 회피). 초기 preset은
 * 마운트 후 window.location.search로 읽고, 직렬화는 history.replaceState로 직접 반영, 뒤로/앞으로가기는
 * popstate 리스너로 동기화한다. 이벤트 발화(select_usage_preset·recommend_run·core_action)는 유지.
 *
 * fetch 실패/지연 시 graceful degrade: fullPlans는 null 유지 → 빈 결과 + 안내(화면 안 깨짐). 결과 영역
 * 고정 최소 높이 → CLS 0. PII 0(데이터/통화 GB·분만, 금액 0).
 */
export const RecommendPanel = (): React.JSX.Element => {
  // 사용량/프리셋 초기값은 URL 비의존(서버/클라 첫 렌더 동일, hydration mismatch 0). 마운트 후 URL 반영.
  const [usage, setUsage] = useState<IUsage | null>(null);
  const [presetKey, setPresetKey] = useState<string>('');
  // 전체 목록(클라 비동기 로드). 로드 전엔 null → 스코어 소스 없음(로딩 표시).
  const [fullPlans, setFullPlans] = useState<readonly Plan[] | null>(null);

  // 마운트 후: ① URL preset/사용량을 읽어 상태 반영(딥링크), ② popstate로 뒤로/앞으로가기 동기화.
  // useSearchParams 훅을 쓰지 않아 정적 프리렌더 바일아웃을 회피한다.
  useEffect(() => {
    const sync = (): void => {
      const params = new URLSearchParams(window.location.search);
      setUsage(readInitialUsage(params));
      setPresetKey(readPresetFromLocation());
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  // 마운트 후 전체 목록 비동기 로드. 표준 fetch(클라 비콘과 동일, 서버 trackFetch 대상 아님).
  // 엔드포인트는 엣지캐시(Cache API) 히트라 빠름. 실패 시 fullPlans=null 유지(graceful degrade).
  useEffect(() => {
    const controller = new AbortController();
    const load = async (): Promise<void> => {
      try {
        const res = await fetch(FULL_PLANS_ENDPOINT, { signal: controller.signal });
        if (!res.ok) return;
        const body: unknown = await res.json();
        const list = Array.isArray(body) ? body : (body as { plans?: unknown }).plans;
        // 시스템 경계 검증(Zod) — 부적합 응답은 무시(로딩 상태 유지).
        const parsed = parsePlanList(list);
        setFullPlans(parsed);
      } catch {
        // abort/네트워크 실패 — fullPlans=null 유지(빈 결과 + 안내).
      }
    };
    void load();
    return () => controller.abort();
  }, []);

  // 선택 사용량을 URL searchParams에 직렬화 → 공유가능 딥링크 + 새로고침 시 상태 유지.
  // useRouter 없이 history.replaceState로 직접 반영(useSearchParams 훅 제거와 일관). 스크롤 점프 방지.
  // PII 0(데이터/통화 GB·분만, 금액 0).
  const syncUrl = useCallback((next: URLSearchParams): void => {
    const qs = next.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(window.history.state, '', url);
  }, []);

  // 스코어 소스: 전체 로드 완료 시에만 산출(전체가 필요). 로드 전엔 빈 배열(로딩 표시).
  const results = useMemo(
    () => (usage && fullPlans ? recommend(fullPlans, usage, RECOMMEND_LIMIT) : []),
    [fullPlans, usage],
  );

  // 추천 상위 그룹의 최저 프로모가 — 절약 배지 기준점.
  const cheapest = useMemo(
    () => (results.length > 0 ? Math.min(...results.map((r) => r.plan.monthlyPrice)) : 0),
    [results],
  );

  // 추천 실행 이벤트 발화(버킷화만 — 절대값 0). 첫 핵심행동이면 core_action도.
  const emitRecommendRun = (u: IUsage, inputKind: 'preset' | 'manual'): void => {
    trackEvent(EVENTS.RECOMMEND_RUN, {
      input_kind: inputKind,
      data_bucket: dataBucket(u.dataGb),
      call_bucket: callBucket(u.callMinutes),
    });
    trackEvent(EVENTS.CORE_ACTION, { action_kind: 'recommend' });
  };

  const onPreset = (key: string): void => {
    setPresetKey(key);
    const u = usageFromPreset(key);
    if (u) {
      setUsage(u);
      syncUrl(new URLSearchParams(key ? { preset: key } : {}));
      trackEvent(EVENTS.SELECT_USAGE_PRESET, { preset_id: key });
      emitRecommendRun(u, 'preset');
    }
  };

  const onManualApply = (u: IUsage): void => {
    setUsage(u);
    setPresetKey('');
    syncUrl(new URLSearchParams({ data: String(u.dataGb), call: String(u.callMinutes) }));
    emitRecommendRun(u, 'manual');
  };

  const savingLabel = (plan: Plan): string | undefined => {
    const diff = plan.monthlyPrice - cheapest;
    return diff > 0 ? undefined : '최저가';
  };

  // 결과 영역 본문 — 상태별 분기. 고정 최소 높이(섹션)로 CLS 0.
  // 로딩 깜빡임 방지: 사용량 선택됐는데 전체 미로드면 "없음"이 아니라 로딩 표시.
  const renderResults = (): React.JSX.Element => {
    if (usage === null) {
      return (
        <EmptyState
          title="사용량을 선택하면 추천을 시작해요"
          description="프리셋을 고르거나 직접 입력해 보세요."
        />
      );
    }
    if (fullPlans === null) {
      return (
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="sr-only">요금제를 불러오는 중이에요</span>
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={`recommend-skeleton-${i}`} className="h-[18rem] w-full rounded-2xl" aria-hidden="true" />
          ))}
        </div>
      );
    }
    if (results.length === 0) {
      return (
        <EmptyState
          title="추천할 요금제가 없어요"
          description="다른 사용량으로 다시 시도해 보세요."
        />
      );
    }
    return (
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {results.map((r) => (
          <li key={r.plan.id}>
            <PlanCard plan={r.plan} savingLabel={savingLabel(r.plan)} className="h-full" />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <section
        aria-label="사용량 선택"
        className="space-y-3 rounded-2xl bg-card p-5 shadow-e1 sm:p-6"
      >
        <p className="text-sm font-medium">평소 사용량을 골라주세요</p>
        <ToggleGroup
          type="single"
          value={presetKey}
          onValueChange={onPreset}
          size="chip"
          aria-label="사용량 프리셋"
        >
          {USAGE_PRESETS.map((p) => (
            <ToggleGroupItem key={p.key} value={p.key} className="shrink-0">
              <span aria-hidden="true">{p.emoji}</span>
              {p.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="pt-1">
          <UsagePresetModal onApply={onManualApply} triggerLabel="직접 입력하기" />
        </div>
      </section>

      <section aria-label="추천 결과" className="min-h-[320px]">
        {renderResults()}
      </section>

      <CompareTrayBar />
    </div>
  );
};
