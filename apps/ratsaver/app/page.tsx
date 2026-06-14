// rendering-matrix: SSG + 클라 필터 (구 /plans 전략을 / 로 이전).
// Pages(next-on-pages)는 ISR(on-demand revalidate) 미지원 → 데이터가 번들 시드(정적)이므로 순수 SSG.
// 초기 페이로드 급감: 전체(253) 임베드 대신 최저가 상위 INITIAL_PLAN_COUNT개만 SSR 공급 →
// PlanList(클라)가 마운트 후 /api/plans?limit=300(엣지캐시·서버 ~3ms)로 전체를 비동기 로드.
// 첫 페인트는 initialPlans로 빠르게(LCP·CLS 0), 이후 전체로 필터 소스만 교체.
// 히어로(아이브로우 + 헤드라인 + 보조문구, 단일 컬럼) + 그 아래 요금제 목록/필터/비교 리스트.
// "이번 주 최저가" 강조는 히어로 앵커가 아니라 하단 리스트의 최저가 카드(글로우+왕관)로 이전.
import { seedPlans } from '@/shared/db';
import { PlanList, INITIAL_PLAN_COUNT } from '@/widgets/plan-list';

/** 전체 요금제 수 — 정적 서버 상수(히어로 아이브로우 신뢰 신호). */
const TOTAL_PLAN_COUNT = seedPlans.length;

export default function HomePage() {
  // 초기 HTML 축소: 최저가(월요금 오름차순) 상위 N개만 직렬화. 전체는 클라가 비동기 로드.
  // 입력 불변 — 정렬은 복사본에서 수행(seedPlans는 readonly 단일 출처).
  const sorted = [...seedPlans].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  const initialPlans = sorted.slice(0, INITIAL_PLAN_COUNT);
  // 전체 중 월요금 최저가 1개의 id — 하단 리스트에서 글로우+왕관 강조 대상(추가 연산 0).
  const cheapestId = sorted[0].id;

  return (
    <div className="space-y-10 pb-24 sm:space-y-14">
      {/* === 히어로: 단일 컬럼 카피(아이브로우 + 헤드라인 + 보조문구). 시각 앵커는 리스트로 이전. === */}
      <section className="max-w-2xl space-y-5">
        {/* 아이브로우 — 무채색 pill + 작은 price dot(실시간 신호만, 색 절제) */}
        <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground-secondary">
          <span className="size-1.5 rounded-full bg-price" aria-hidden="true" />
          실시간 {TOTAL_PLAN_COUNT}개 알뜰폰 요금제 비교
        </span>

        <h1 className="text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-5xl">
          가장 싼 요금제부터,
          <br />
          <span className="text-foreground">정직하게</span> 보여드려요
        </h1>

        {/* 보조문구 — 데스크탑(lg+) 1줄 보장: 카피 간결화 + lg에서 max-w 해제(whitespace-nowrap).
            모바일은 줄바꿈 허용(짧은 카피라 오버플로 없음). */}
        <p className="max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg lg:max-w-none lg:whitespace-nowrap">
          <span className="font-semibold text-foreground">종료 후 정가</span>까지 정직하게,
          가입·광고 없이 3초 만에.
        </p>
      </section>

      {/* Suspense 경계 없음 — PlanList(클라)가 useSearchParams를 쓰지 않아 정적 렌더에서
          바일아웃되지 않는다. 초기 12개 카드를 정적 HTML에 그대로 출력(LCP·SEO·체감성능).
          cheapestId 카드만 글로우+왕관으로 강조(정렬이 바뀌어도 그 id면 강조). */}
      <PlanList initialPlans={initialPlans} cheapestId={cheapestId} />
    </div>
  );
}
