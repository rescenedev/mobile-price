'use client';

import Link from 'next/link';
import { GitCompareArrows, X } from 'lucide-react';
import { useCompareTray, MAX_COMPARE } from '@/features/plan-compare';
import { Button } from '@/shared/ui';

/**
 * 비교 트레이(클라) — 하단 **정중앙 플로팅 알약**. 담긴 수 + "비교하기" CTA(/compare?ids=).
 * 1개 이상 담겼을 때만 노출. 풀폭 바 아님 — 콘텐츠 폭만큼 조그맣게 가운데. aria-live로 담김 수 알림.
 */
export const CompareTrayBar = (): React.JSX.Element | null => {
  const { ids, clear } = useCompareTray();
  if (ids.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
      role="region"
      aria-label="비교 트레이"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/90 py-1.5 pl-4 pr-1.5 shadow-e3 backdrop-blur">
        <p className="whitespace-nowrap text-sm" aria-live="polite">
          <span className="nums font-bold text-price">{ids.length}</span>
          <span className="text-foreground-secondary">/{MAX_COMPARE} 비교</span>
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full"
          onClick={clear}
          aria-label="비교 목록 비우기"
        >
          <X aria-hidden="true" />
        </Button>
        <Button asChild size="sm" className="h-9 rounded-full px-4">
          <Link href={`/compare?ids=${ids.join(',')}`}>
            <GitCompareArrows aria-hidden="true" />
            비교하기
          </Link>
        </Button>
      </div>
    </div>
  );
};
