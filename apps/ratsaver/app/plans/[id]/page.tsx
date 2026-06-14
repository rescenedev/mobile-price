import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { seedPlans } from '@/shared/db';
import {
  formatData,
  formatThrottle,
  formatCall,
  formatSms,
  formatFirstYearCost,
  carrierSearchUrl,
} from '@/entities/plan';
import { Button } from '@/shared/ui';
import { ViewBeacon } from '@/shared/perf/ViewBeacon';
import { EVENTS } from '@/shared/perf';
import { priceBucket } from '@/shared/config';
import { PriceBlock } from '@/widgets/plan-card/price-block';
import { CompareToggle } from '@/widgets/plan-card/compare-toggle';
import { Disclaimer } from '@/widgets/disclaimer';

// rendering-matrix: SSG (generateStaticParams 전건 프리렌더 + dynamicParams=false → 시드 외 id 404).
export const dynamicParams = false;

export async function generateStaticParams(): Promise<Array<{ id: string }>> {
  return seedPlans.map((p) => ({ id: p.id }));
}

interface IPlanDetailPageProps {
  params: Promise<{ id: string }>;
}

const CONTRACT_LABEL = { none: '약정없음', '12m': '12개월', '24m': '24개월' } as const;

export default async function PlanDetailPage({ params }: IPlanDetailPageProps) {
  const { id } = await params;
  const plan = seedPlans.find((p) => p.id === id);
  if (!plan) notFound();

  const throttle = formatThrottle(plan);
  const specs: Array<{ term: string; desc: ReactNode }> = [
    { term: '데이터', desc: formatData(plan) + (throttle ? ` · ${throttle}` : '') },
    { term: '통화', desc: formatCall(plan) },
    { term: '문자', desc: formatSms(plan) },
    { term: '통신망', desc: `${plan.network} · ${plan.tech}` },
    { term: '약정', desc: CONTRACT_LABEL[plan.contract] },
    {
      term: '통신사',
      desc: (
        <a
          href={carrierSearchUrl(plan.carrier)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${plan.carrier} 통신사 검색(새 창)`}
          className="group/carrier inline-flex items-center gap-1 rounded-sm text-foreground transition-colors hover:text-price focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        >
          {plan.carrier}
          <ExternalLink
            aria-hidden="true"
            className="size-3.5 text-foreground-secondary transition-colors group-hover/carrier:text-price"
          />
          <span className="sr-only">새 창에서 열림</span>
        </a>
      ),
    },
  ];
  if (plan.giftCount > 0) specs.push({ term: '사은품', desc: `최대 ${plan.giftCount}개` });
  if (plan.notes) specs.push({ term: '비고', desc: plan.notes });

  return (
    <div className="mx-auto max-w-screen-md space-y-6">
      {/* North Star "결정 도달" 시그널 — 버킷/열거형 파라미터만(절대 가격 0). */}
      <ViewBeacon
        event={EVENTS.VIEW_PLAN_DETAIL}
        params={{
          network: plan.network,
          price_bucket: priceBucket(plan.monthlyPrice),
          is_mvno: plan.mvno,
          has_promo: plan.promoMonths > 0,
        }}
      />

      <Button asChild variant="link" size="sm" className="px-0">
        <Link href="/">
          <ArrowLeft aria-hidden="true" />
          목록으로
        </Link>
      </Button>

      {/* 무채색 메타 라인 — 망·세대·알뜰폰(색 0, 가격만 emerald) */}
      <p className="meta-dot flex flex-wrap items-center text-sm text-muted-foreground">
        <span>{plan.network}망</span>
        <span>{plan.tech}</span>
        {plan.mvno ? <span>알뜰폰</span> : null}
      </p>

      <h1 className="text-2xl font-bold leading-snug tracking-tight sm:text-3xl">{plan.name}</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* 정직성 가격 블록 */}
        <section
          aria-label="가격"
          className="rounded-2xl bg-card p-6 shadow-e1 sm:p-8"
        >
          <PriceBlock plan={plan} size="hero" />
          {/* 1년 총비용 — 정직성 wedge 정점. 12개월 환산 진짜 비용 명시. */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-foreground-secondary">1년 총비용</span>
              <span className="nums text-lg font-bold tracking-tight text-foreground">
                {formatFirstYearCost(plan)}
              </span>
            </p>
            <p className="mt-1 text-xs text-foreground-secondary">
              {plan.promoMonths > 0 && plan.regularPrice !== plan.monthlyPrice
                ? `프로모 ${plan.promoMonths}개월 + 정가 ${12 - plan.promoMonths}개월, 12개월 환산`
                : '12개월 환산'}
            </p>
          </div>
        </section>

        {/* 스펙 */}
        <section aria-label="요금제 상세 스펙">
          <dl className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-e1">
            {specs.map((spec) => (
              <div key={spec.term} className="flex gap-4 px-5 py-3.5 sm:px-6">
                <dt className="w-20 shrink-0 text-sm text-foreground-secondary">{spec.term}</dt>
                <dd className="text-sm font-medium">{spec.desc}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <CompareToggle planId={plan.id} planName={plan.name} />
        <Button asChild variant="saving" className="sm:flex-1">
          <Link href={`/calculator?target=${plan.id}`}>이 요금제로 절약액 계산하기</Link>
        </Button>
      </div>

      <ViewBeacon event={EVENTS.DISCLAIMER_VIEW} params={{ surface: 'detail' }} />
      <Disclaimer lastVerifiedAt={plan.lastVerifiedAt} />
    </div>
  );
}
