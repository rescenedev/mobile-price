'use client';

import { Check, GitCompareArrows } from 'lucide-react';
import { toast } from 'sonner';
import { useCompareTray, MAX_COMPARE } from '@/features/plan-compare';
import { trackEvent, EVENTS } from '@/shared/perf';
import { Button } from '@/shared/ui';

interface ICompareToggleProps {
  readonly planId: string;
  readonly planName: string;
}

/**
 * 비교담기 토글(클라 island) — sessionStorage 누적, 3개 초과 시 토스트 차단.
 * aria-pressed로 담김 상태 노출. plan id만 저장(PII 0).
 */
export const CompareToggle = ({ planId, planName }: ICompareToggleProps): React.JSX.Element => {
  const { ids, has, toggle } = useCompareTray();
  const active = has(planId);

  const onClick = (): void => {
    const wasActive = active;
    const result = toggle(planId);
    if (!result.ok && result.reason === 'limit') {
      toast.warning(`비교는 최대 ${MAX_COMPARE}개까지 담을 수 있어요`);
      return;
    }
    // 추가(빼기 아님)일 때만 add_compare 발화 — plan id·PII 0, compare_count(소건수)만.
    if (!wasActive) {
      const nextCount = Math.min(ids.length + 1, MAX_COMPARE);
      trackEvent(EVENTS.ADD_COMPARE, { compare_count: nextCount });
    }
    toast.success(wasActive ? '비교에서 뺐어요' : `'${planName}'을(를) 비교에 담았어요`);
  };

  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      aria-pressed={active}
      aria-label={active ? `${planName} 비교 빼기` : `${planName} 비교 담기`}
      onClick={onClick}
    >
      {active ? <Check aria-hidden="true" /> : <GitCompareArrows aria-hidden="true" />}
      {active ? '담김' : '비교담기'}
    </Button>
  );
};
