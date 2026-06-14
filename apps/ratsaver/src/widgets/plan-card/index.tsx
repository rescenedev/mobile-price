import Link from 'next/link';
import { ArrowRight, Crown } from 'lucide-react';
import type { Plan } from '@/entities/plan';
import { formatData, formatThrottle, formatCall, formatSms } from '@/entities/plan';
import { Badge, Button, Card } from '@/shared/ui';
import { cn } from '@/shared/lib';
import { PriceBlock } from './price-block';
import { CompareToggle } from './compare-toggle';

interface IPlanCardProps {
  readonly plan: Plan;
  /** 추천/계산 컨텍스트에서 "월 N원 절약" 배지 노출(옵션). */
  readonly savingLabel?: string;
  readonly className?: string;
  /** 전체 최저가 1장만 true — 절제된 emerald 글로우 + 왕관 뱃지로 강조. 다른 카드는 평소대로. */
  readonly isLowest?: boolean;
}

const CONTRACT_LABEL: Record<Plan['contract'], string> = {
  none: '약정없음',
  '12m': '약정 12개월',
  '24m': '약정 24개월',
};

/**
 * PlanCard(서버 컴포넌트) — 모요 4블록 패턴.
 * 블록: [badge 행] / ①데이터+속도 / ②통화·문자 / ③망·세대·약정 / ④정직성 가격 / footer 액션.
 * 비교담기만 클라 island(CompareToggle). 고정 구조 → CLS 0. 로고 이미지 미사용(텍스트 배지).
 */
export const PlanCard = ({
  plan,
  savingLabel,
  className,
  isLowest = false,
}: IPlanCardProps): React.JSX.Element => {
  const throttle = formatThrottle(plan);
  return (
    <Card
      className={cn(
        'group relative flex flex-col rounded-2xl shadow-e1 transition-[transform,box-shadow] duration-200',
        'hover:-translate-y-0.5 hover:shadow-e2',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        // 최저가 강조 — elevated 표면(slate-800)으로 분리 + 절제된 emerald 글로우(ring + soft shadow).
        // 과한 네온 금지: ring/40 + 짧은 spread의 soft glow. CLS 0(절대배치 뱃지·레이아웃 불변).
        isLowest &&
          'bg-card-elevated ring-1 ring-[hsl(var(--price))]/40 shadow-[0_0_28px_-4px_hsl(var(--price)/0.45)] hover:shadow-[0_0_32px_-4px_hsl(var(--price)/0.55)]',
        className,
      )}
    >
      {/* 왕관 뱃지 — 최저가 1장만. 절대배치(우상단 코너)라 다른 카드와 높이 안 어긋남(CLS 0). */}
      {isLowest ? (
        <span
          aria-label="최저가"
          className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-saving-muted px-2.5 py-1 text-xs font-semibold text-saving-muted-foreground shadow-e1"
        >
          <Crown className="size-3.5 text-price" aria-hidden="true" />
          최저가
        </span>
      ) : null}

      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
        {/* 헤더: carrier eyebrow + 요금제명 (이니셜 칩 제거 — 무채색 위계 2단) */}
        <div className="flex flex-col gap-3">
          {/* 최저가 카드는 우상단 왕관 뱃지와 겹치지 않게 carrier/요금제명에 우측 여유(truncate 유지). */}
          <div className={cn('flex flex-col gap-1', isLowest && 'pr-20')}>
            <p className="truncate text-[13px] font-medium text-muted-foreground">
              {plan.carrier}
            </p>
            <h3 className="truncate text-[17px] font-bold leading-snug tracking-tight text-foreground sm:text-lg">
              {plan.name}
            </h3>
          </div>

          {/* 메타 라인 — 망·세대·약정·알뜰폰을 무채색 1줄로(색 0). 위계 3차. */}
          <p className="meta-dot flex flex-wrap items-center text-[13px] text-muted-foreground">
            <span>{plan.network}망</span>
            <span>{plan.tech}</span>
            <span>{CONTRACT_LABEL[plan.contract]}</span>
            {plan.mvno ? <span>알뜰폰</span> : null}
          </p>

          {/* 색 신호 — 추천/계산 컨텍스트의 "절약"만(평소 카드는 색 0, 가격만 emerald). */}
          {savingLabel ? (
            <div>
              <Badge variant="saving">{savingLabel}</Badge>
            </div>
          ) : null}
        </div>

        {/* ① 데이터 + 속도 — 위계 2차(plan명보다 가볍게) */}
        <div className="space-y-0.5">
          <p className="text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
            {formatData(plan)}
          </p>
          {throttle ? <p className="text-[13px] text-muted-foreground">{throttle}</p> : null}
        </div>

        {/* ② 통화 · 문자 — 3차 위계 */}
        <p className="text-[13px] text-muted-foreground">
          {formatCall(plan)} · {formatSms(plan)}
        </p>

        {/* ④ 정직성 가격 블록 — 카드의 유일한 비비드 색(emerald) */}
        <PriceBlock plan={plan} />
      </div>

      {/* footer 액션 */}
      <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4 sm:px-7">
        <Button
          asChild
          variant="link"
          size="sm"
          className="group/link px-0 text-foreground-secondary hover:text-foreground"
        >
          <Link href={`/plans/${plan.id}`} className="inline-flex items-center gap-1">
            상세 보기
            <ArrowRight
              className="size-4 transition-transform group-hover/link:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </Button>
        <CompareToggle planId={plan.id} planName={plan.name} />
      </div>
    </Card>
  );
};
