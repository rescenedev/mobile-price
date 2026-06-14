import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/shared/ui';

interface IEmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
  /** 클릭 액션(클라 컨텍스트에서 필터 초기화 등). href와 택일. */
  readonly onAction?: () => void;
}

/**
 * 빈 상태(고정 높이 — CLS 0). 결과 0건·비교 슬롯 없음 등에 재사용.
 * 액션은 href(이동) 또는 onAction(클라) 택일.
 */
export const EmptyState = ({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: IEmptyStateProps): React.JSX.Element => (
  <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-2xl bg-card px-6 py-16 text-center shadow-e1">
    <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
      <SearchX className="size-6" aria-hidden="true" />
    </span>
    <div className="space-y-1">
      <p className="text-base font-bold text-foreground">{title}</p>
      {description ? <p className="text-sm text-foreground-secondary">{description}</p> : null}
    </div>
    {actionLabel && actionHref ? (
      <Button asChild variant="outline" size="sm">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    ) : actionLabel && onAction ? (
      <Button variant="outline" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
