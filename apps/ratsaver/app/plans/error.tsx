'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui';

// /plans 에러 바운더리(재시도). 데이터 의존 화면 상태 표면 — loading/empty/error 3종 충족.

export default function PlansError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('plans error:', error.digest ?? error.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">요금제를 불러오지 못했어요</h1>
        <p className="text-sm text-muted-foreground">잠시 후 다시 시도해 주세요.</p>
      </div>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
