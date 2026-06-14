'use client';

import { useSearchParams } from 'next/navigation';
import { SavingResult } from './index';

interface ISavingTarget {
  readonly id: string;
  readonly name: string;
  readonly monthlyPrice: number;
}

interface ICalculatorPanelProps {
  readonly targets: readonly ISavingTarget[];
}

/**
 * /calculator 클라 래퍼 — ?target= 읽어 초기 대상 선택(페이지는 SSG 유지).
 */
export const CalculatorPanel = ({ targets }: ICalculatorPanelProps): React.JSX.Element => {
  const searchParams = useSearchParams();
  const target = searchParams.get('target') ?? undefined;
  return <SavingResult targets={targets} initialTargetId={target} variant="full" />;
};
