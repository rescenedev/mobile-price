import { AlertTriangle } from 'lucide-react';
import type { Plan } from '@/entities/plan';
import { formatKrw, formatFirstYearCost } from '@/entities/plan';
import { cn } from '@/shared/lib';

interface IPriceBlockProps {
  readonly plan: Plan;
  /** 히어로 크기(상세 페이지). 기본은 카드용. */
  readonly size?: 'card' | 'hero';
}

/**
 * 정직성 가격 병기 — 단일 출처 UI(PlanCard·상세 재사용).
 * 프로모가(primary) + 프로모 존재 시 "N개월 후 정가"(warning 띠) 항상 병기 — 숨김 0(US-005).
 */
export const PriceBlock = ({ plan, size = 'card' }: IPriceBlockProps): React.JSX.Element => {
  const hasPromo = plan.promoMonths > 0 && plan.regularPrice !== plan.monthlyPrice;
  const isCheaper = plan.regularPrice > plan.monthlyPrice;
  return (
    <div className="space-y-2">
      {/* 정가가 더 비싸면 취소선으로 절제 표기(무채색 슬레이트 보조) */}
      {isCheaper ? (
        <p className="nums text-xs font-normal text-muted-foreground line-through">
          월 {formatKrw(plan.regularPrice)}
        </p>
      ) : null}
      {/* 월 프로모가 — 카드의 유일한 비비드 색(emerald price 액센트). 항상 튄다. */}
      <p className="flex items-baseline gap-1">
        <span className="text-sm font-normal text-muted-foreground">월</span>
        <span
          className={cn(
            'nums font-bold leading-none tracking-tight text-price',
            size === 'hero' ? 'text-4xl sm:text-5xl' : 'text-[28px] sm:text-3xl',
          )}
        >
          {formatKrw(plan.monthlyPrice)}
        </span>
      </p>
      {hasPromo ? (
        <p className="flex items-center gap-2 rounded-lg bg-warning-muted px-3 py-2 text-xs font-medium text-warning-muted-foreground">
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            {plan.promoMonths}개월 후 <span className="nums">{formatKrw(plan.regularPrice)}</span>
            {plan.contract === 'none' ? ' · 약정 없음' : null}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">프로모션 없이 정가 유지</p>
      )}
      {/* 1년 총비용 — 정직성 wedge 정점. 무채색 보조(가격 색은 월 프로모가 하나만). */}
      <p className="text-xs text-muted-foreground">
        1년 총 <span className="nums font-semibold text-foreground">{formatFirstYearCost(plan)}</span>
      </p>
    </div>
  );
};
