'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui';

interface IRemoveColumnButtonProps {
  readonly planId: string;
  readonly planName: string;
  readonly currentIds: readonly string[];
}

/**
 * 비교 열 제거(클라 island) — ?ids=에서 해당 id 제거 후 이동.
 * 마지막 열 제거 시 빈 /compare로.
 */
export const RemoveColumnButton = ({
  planId,
  planName,
  currentIds,
}: IRemoveColumnButtonProps): React.JSX.Element => {
  const router = useRouter();
  const onRemove = (): void => {
    const next = currentIds.filter((id) => id !== planId);
    router.replace(next.length > 0 ? `/compare?ids=${next.join(',')}` : '/compare');
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onRemove}
      aria-label={`${planName} 비교에서 제거`}
    >
      <X aria-hidden="true" />
      제거
    </Button>
  );
};
