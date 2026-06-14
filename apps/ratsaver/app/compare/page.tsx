// rendering-matrix: SSG + 클라 조립. (Pages는 ISR 미지원 → 시드 정적이므로 순수 SSG.)
// ?ids=a,b,c searchParams로 대상 선택(최대 3). 매트릭스 조립은 서버, 제거/복사만 클라 island.
import { seedPlans } from '@/shared/db';
import { parseCompareIds } from '@/features/plan-compare';
import { ViewBeacon } from '@/shared/perf/ViewBeacon';
import { EVENTS } from '@/shared/perf';
import { CompareTable } from '@/widgets/compare-table';
import { CopyUrlButton } from '@/widgets/compare-table/copy-url-button';
import { EmptyState } from '@/widgets/empty-state';

// searchParams(?ids=)를 읽으므로 동적 렌더 — Pages에선 edge runtime 필요.
// 시드는 번들 정적이라 바인딩 미사용이지만, next-on-pages는 동적 페이지에 edge를 요구한다.
export const runtime = 'edge';

interface IComparePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ComparePage({ searchParams }: IComparePageProps) {
  const sp = await searchParams;
  const raw = typeof sp.ids === 'string' ? sp.ids : Array.isArray(sp.ids) ? sp.ids[0] : '';
  const ids = parseCompareIds(raw);
  const plans = ids
    .map((id) => seedPlans.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">요금제 비교</h1>
        {plans.length > 0 ? <CopyUrlButton /> : null}
      </div>

      {/* North Star "결정 도달" 시그널 — 담긴 수(소건수)만, plan id·PII 0. */}
      {plans.length > 0 ? (
        <ViewBeacon event={EVENTS.VIEW_COMPARE} params={{ compare_count: plans.length }} />
      ) : null}

      {plans.length === 0 ? (
        <EmptyState
          title="비교할 요금제를 담아주세요"
          description="요금제 목록에서 '비교담기'로 최대 3개까지 담을 수 있어요."
          actionLabel="요금제 둘러보기"
          actionHref="/"
        />
      ) : (
        <CompareTable plans={plans} />
      )}
    </div>
  );
}
