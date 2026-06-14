'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui';

// 전역 에러 바운더리(재시도 포함). layout이 <main> 제공.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 상세 컨텍스트는 서버 로그로(클라에선 PII·민감정보 노출 금지).
    console.error('route error:', error.digest ?? error.message);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">문제가 발생했어요</h1>
        <p className="text-sm text-muted-foreground">
          일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
