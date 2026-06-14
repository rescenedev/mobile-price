import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Plan } from '@/entities/plan';
import { buildCompareMatrix, type ICompareCell } from '@/features/plan-compare';
import { Badge, Button, ScrollArea, ScrollBar } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { RemoveColumnButton } from './remove-column-button';

interface ICompareTableProps {
  readonly plans: readonly Plan[];
}

const cellClass = (cell: ICompareCell): string =>
  cn(
    'px-3 py-3 align-middle text-sm',
    cell.isBest && 'font-semibold',
    cell.isWarning && 'text-warning-muted-foreground',
  );

/**
 * CompareTable(서버 우선) — 행 고정 매트릭스(CLS 0). 첫 열 sticky, 모바일 가로 스크롤.
 * 최저 프로모가 셀 saving 강조, 종료 후 정가 warning. 제거 버튼만 클라 island.
 */
export const CompareTable = ({ plans }: ICompareTableProps): React.JSX.Element => {
  const rows = buildCompareMatrix(plans);
  const ids = plans.map((p) => p.id);

  return (
    <ScrollArea className="w-full rounded-2xl bg-card shadow-e1">
      <table className="w-full caption-bottom border-collapse text-sm">
        <caption className="sr-only">선택한 요금제 비교표</caption>
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="sticky left-0 z-10 min-w-[100px] bg-card px-3 py-3 text-left text-xs font-semibold text-muted-foreground"
            >
              항목
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                scope="col"
                className="min-w-[160px] px-3 py-3 text-left align-top"
              >
                <div className="space-y-1.5">
                  <p className="meta-dot flex flex-wrap items-center text-[13px] text-muted-foreground">
                    <span>{plan.network}망</span>
                    {plan.mvno ? <span>알뜰폰</span> : null}
                  </p>
                  <p className="text-sm font-semibold leading-snug tracking-tight">{plan.name}</p>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border last:border-0">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-card px-3 py-3 text-left text-xs font-medium text-muted-foreground"
              >
                {row.label}
              </th>
              {row.cells.map((cell, idx) => (
                <td key={ids[idx] ?? idx} className={cellClass(cell)}>
                  <span className="inline-flex items-center gap-1">
                    {cell.isBest ? (
                      <Check className="size-4 text-saving" aria-label="최저가" />
                    ) : null}
                    {cell.isBest ? (
                      <Badge variant="saving" className="nums">
                        {cell.text}
                      </Badge>
                    ) : (
                      <span className={cn('nums', cell.isWarning && 'font-medium')}>{cell.text}</span>
                    )}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          {/* 액션 행 */}
          <tr>
            <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-3" />
            {plans.map((plan) => (
              <td key={plan.id} className="px-3 py-3 align-middle">
                <div className="flex flex-col items-start gap-1">
                  <Button asChild variant="link" size="sm" className="px-0">
                    <Link href={`/plans/${plan.id}`}>상세</Link>
                  </Button>
                  <RemoveColumnButton planId={plan.id} planName={plan.name} currentIds={ids} />
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
