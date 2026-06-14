import { describe, it, expect } from 'vitest';
import { calcSaving, parseSavingInput, savingInputSchema } from './calc';
import { makePlan } from '../__fixtures__/plan';

describe('calcSaving', () => {
  it('현재요금이 대상보다 비싸면 월·연 절약액을 계산한다', () => {
    const target = makePlan({ monthlyPrice: 15300 });
    const result = calcSaving(28000, target);
    expect(result.monthlySaving).toBe(12700);
    expect(result.yearlySaving).toBe(152400);
    expect(result.hasSaving).toBe(true);
  });

  it('대상이 더 비싸면 절약액 0(음수 클램프)', () => {
    const target = makePlan({ monthlyPrice: 40000 });
    const result = calcSaving(28000, target);
    expect(result.monthlySaving).toBe(0);
    expect(result.yearlySaving).toBe(0);
    expect(result.hasSaving).toBe(false);
  });

  it('targetMonthly를 결과에 담는다', () => {
    const target = makePlan({ monthlyPrice: 15300 });
    expect(calcSaving(28000, target).targetMonthly).toBe(15300);
  });
});

describe('savingInputSchema', () => {
  it('양의 정수를 통과시킨다', () => {
    expect(savingInputSchema.safeParse({ currentPrice: 28000 }).success).toBe(true);
  });

  it('0·음수·과대(>200000)를 거절한다', () => {
    expect(savingInputSchema.safeParse({ currentPrice: 0 }).success).toBe(false);
    expect(savingInputSchema.safeParse({ currentPrice: -1 }).success).toBe(false);
    expect(savingInputSchema.safeParse({ currentPrice: 200001 }).success).toBe(false);
  });
});

describe('parseSavingInput', () => {
  it('콤마·공백을 제거하고 파싱한다', () => {
    const r = parseSavingInput('28,000');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(28000);
  });

  it('잘못된 입력에 사용자 친화 에러를 반환한다', () => {
    const r = parseSavingInput('0');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });
});
