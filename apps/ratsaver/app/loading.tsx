import { Skeleton } from '@/shared/ui';

// 전역 로딩 스켈레톤. 고정 높이로 CLS 0 방지. layout이 <main>을 제공하므로 여기선 div.

export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">불러오는 중</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[55vh] w-full" />
    </div>
  );
}
