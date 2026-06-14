import { z } from 'zod';
import type { Plan } from '@/entities/plan';

/**
 * 절약 계산 입력 검증(Zod) — 음수·0·과대 차단.
 * 현재요금은 클라 메모리에서만 다룬다(서버 미전송·PII 0).
 */
export const savingInputSchema = z.object({
  currentPrice: z
    .number({ invalid_type_error: '숫자를 입력해 주세요' })
    .int('정수로 입력해 주세요')
    .positive('0보다 큰 금액을 입력해 주세요')
    .max(200000, '200,000원 이하로 입력해 주세요'),
});

export type TSavingInput = z.infer<typeof savingInputSchema>;

export interface ISavingResult {
  /** 비교 대상 월요금(프로모가). */
  readonly targetMonthly: number;
  /** 월 절약액(현재요금 - 대상요금). 0 이상으로 클램프. */
  readonly monthlySaving: number;
  /** 연 절약액(월 × 12). */
  readonly yearlySaving: number;
  /** 절약 가능 여부(대상이 더 싸면 true). */
  readonly hasSaving: boolean;
}

/**
 * 절약액 계산 — 순수함수, 서버 미저장.
 * 현재요금이 대상보다 비싸면 차액을 절약으로, 아니면 0.
 */
export const calcSaving = (currentPrice: number, target: Plan): ISavingResult => {
  const diff = currentPrice - target.monthlyPrice;
  const monthlySaving = diff > 0 ? diff : 0;
  return {
    targetMonthly: target.monthlyPrice,
    monthlySaving,
    yearlySaving: monthlySaving * 12,
    hasSaving: monthlySaving > 0,
  };
};

/** 입력 안전 파싱(에러 메시지 반환). */
export const parseSavingInput = (
  raw: string,
): { ok: true; value: number } | { ok: false; error: string } => {
  const num = Number.parseInt(raw.replace(/[,\s]/g, ''), 10);
  const result = savingInputSchema.safeParse({ currentPrice: num });
  if (result.success) return { ok: true, value: result.data.currentPrice };
  return { ok: false, error: result.error.issues[0]?.message ?? '올바른 금액을 입력해 주세요' };
};
