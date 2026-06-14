'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import type { Plan } from '@/entities/plan';
import { formatKrw } from '@/entities/plan';
import { calcSaving, parseSavingInput, type ISavingResult } from '@/features/saving-calculator';
import { trackEvent, EVENTS } from '@/shared/perf';
import { savingBucket } from '@/shared/config';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';

interface ISavingTarget {
  readonly id: string;
  readonly name: string;
  readonly monthlyPrice: number;
}

interface ISavingResultProps {
  /** 비교 대상 후보(가장 싼 추천 plan들). 첫 항목이 기본 대상. */
  readonly targets: readonly ISavingTarget[];
  /** 초기 선택 대상 id(?target=). */
  readonly initialTargetId?: string;
  /** 확장형(/calculator)이면 대상 선택 + 동선 CTA 노출. */
  readonly variant?: 'hero' | 'full';
}

const toPlanLike = (t: ISavingTarget): Plan =>
  ({ monthlyPrice: t.monthlyPrice } as Plan);

/**
 * 절약 결과(클라 leaf) — 현재요금 입력 → calcSaving 클라 계산(서버 미전송·PII 0).
 * 결과 영역 고정 높이 예약 → CLS 0. 숫자는 saving green + tabular-nums.
 */
export const SavingResult = ({
  targets,
  initialTargetId,
  variant = 'hero',
}: ISavingResultProps): React.JSX.Element => {
  const inputId = useId();
  const errorId = useId();
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ISavingResult | null>(null);
  const [targetId, setTargetId] = useState<string>(
    initialTargetId ?? targets[0]?.id ?? '',
  );

  const target = useMemo(
    () => targets.find((t) => t.id === targetId) ?? targets[0],
    [targets, targetId],
  );

  const onCalc = (): void => {
    const parsed = parseSavingInput(raw);
    if (!parsed.ok) {
      setError(parsed.error);
      setResult(null);
      return;
    }
    if (!target) {
      setError('비교할 요금제를 선택해 주세요');
      return;
    }
    setError(null);
    const calc = calcSaving(parsed.value, toPlanLike(target));
    setResult(calc);
    // saving_calc 발화 — 절약액 버킷만(현재요금·절약 절대값 0 · Hard Threshold ③⑤).
    trackEvent(EVENTS.SAVING_CALC, {
      saving_bucket: savingBucket(calc.monthlySaving),
      period: 'monthly',
    });
    trackEvent(EVENTS.CORE_ACTION, { action_kind: 'calc' });
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onCalc();
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-e1 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor={inputId}>지금 매월 내는 요금</Label>
          <div className="flex gap-2">
            <Input
              id={inputId}
              inputMode="numeric"
              placeholder="예: 45000"
              value={raw}
              aria-invalid={error !== null}
              aria-describedby={error !== null ? errorId : undefined}
              onChange={(e) => setRaw(e.target.value)}
              className="nums"
            />
            <Button type="submit" variant="saving" className="shrink-0">
              계산하기
            </Button>
          </div>
          {error !== null ? (
            <p id={errorId} role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        {variant === 'full' && targets.length > 0 ? (
          <div className="space-y-1.5">
            <Label htmlFor={`${inputId}-target`}>비교 대상 요금제</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger id={`${inputId}-target`} aria-label="비교 대상 요금제 선택">
                <SelectValue placeholder="요금제 선택" />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} (월 {formatKrw(t.monthlyPrice)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </form>

      {/* 결과 영역 — 고정 높이 예약(계산 전후 동일 높이 → CLS 0) */}
      <div
        className="mt-5 flex min-h-[128px] flex-col items-center justify-center rounded-2xl bg-saving-muted px-6 py-6 text-center"
        aria-live="polite"
      >
        {result ? (
          result.hasSaving ? (
            <>
              <p className="text-sm text-saving-muted-foreground">월</p>
              <p className="nums text-4xl font-extrabold leading-none tracking-tight text-saving-strong sm:text-5xl">
                {formatKrw(result.monthlySaving)} 절약
              </p>
              <p className="mt-1 text-sm text-saving-muted-foreground">
                연 <span className="nums">{formatKrw(result.yearlySaving)}</span> 아낄 수 있어요
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              이 요금제로는 절약이 어려워요. 더 저렴한 요금제를 추천받아 보세요.
            </p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            현재 요금을 입력하면 월·연 절약액을 계산해 드려요
          </p>
        )}
      </div>

      {variant === 'full' && result?.hasSaving && target ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/plans/${target.id}`}>이 요금제 상세 보기</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/recommend">더 맞는 요금제 추천받기</Link>
          </Button>
        </div>
      ) : null}

      {variant === 'hero' ? (
        <div className="mt-3 text-center">
          <Button asChild variant="link" size="sm">
            <Link href="/recommend">맞춤 추천으로 더 아끼기 →</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
};
