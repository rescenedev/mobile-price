import { Skeleton } from '@/shared/ui';

// /plans 로딩 스켈레톤 — 카드 그리드와 동일 높이/그리드(CLS 0). layout이 <main> 제공.

export default function PlansLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">요금제를 불러오는 중</span>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-5 w-24" />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-72 w-full rounded-lg" />
          </li>
        ))}
      </ul>
    </div>
  );
}
