'use client';

import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui';

/**
 * 현재 비교 URL 복사(클라 island) — ?ids= 공유. sonner 토스트.
 */
export const CopyUrlButton = (): React.JSX.Element => {
  const onCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('비교 URL을 복사했어요');
    } catch {
      toast.error('복사에 실패했어요. 주소창을 직접 복사해 주세요.');
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={onCopy}>
      <Link2 aria-hidden="true" />
      URL 복사
    </Button>
  );
};
