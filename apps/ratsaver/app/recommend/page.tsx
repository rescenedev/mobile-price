// rendering-matrix: SSG 셸 + 클라 스코어링 (선언 없음).
// 초기 페이로드 급감: 전체 seedPlans(253)를 클라 패널에 props로 임베드하던 것을 제거.
// 셸(제목/설명/프리셋 UI)만 정적 SSR → 임베드 plan 0개. 추천 스코어링은 전체 목록이 필요하므로
// RecommendPanel(클라)이 마운트 후 /api/plans?limit=300(엣지캐시·서버 ~3ms)으로 직접 비동기 로드.
// 패널이 useSearchParams 훅을 쓰지 않으므로(window.location 기반) Suspense 경계 불필요 →
// 셸이 정적 HTML에 그대로 출력된다.
import { RecommendPanel } from '@/widgets/recommend-panel';

export default function RecommendPage() {
  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">내게 맞는 요금제 찾기</h1>
        <p className="mt-2 text-base text-foreground-secondary">
          평소 사용량을 고르면 가장 잘 맞고 저렴한 요금제를 추천해 드려요.
        </p>
      </div>
      <RecommendPanel />
    </div>
  );
}
