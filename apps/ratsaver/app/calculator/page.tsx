// rendering-matrix: SSG 셸 + 클라 계산 (선언 없음).
// 현재요금 입력 → calcSaving 순수함수 클라 실행(서버 미저장, PII 0). ?target= 은 클라에서 읽음.
import { Suspense } from 'react';
import { seedPlans } from '@/shared/db';
import { CalculatorPanel } from '@/widgets/saving-result/calculator-panel';
import { Disclaimer } from '@/widgets/disclaimer';
import { Skeleton } from '@/shared/ui';

// 대상 후보: 전체 plan(저렴한 순). 클라 select에서 선택.
const targets = [...seedPlans]
  .sort((a, b) => a.monthlyPrice - b.monthlyPrice)
  .map((p) => ({ id: p.id, name: p.name, monthlyPrice: p.monthlyPrice }));

export default function CalculatorPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">얼마나 아낄 수 있을까?</h1>
        <p className="mt-2 text-base text-foreground-secondary">
          현재 요금을 입력하면 월·연 절약액을 계산해 드려요. 입력값은 저장하지 않습니다.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-80 w-full" />}>
        <CalculatorPanel targets={targets} />
      </Suspense>
      <Disclaimer />
    </div>
  );
}
