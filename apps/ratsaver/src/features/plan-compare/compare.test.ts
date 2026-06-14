import { describe, it, expect } from 'vitest';
import { parseCompareIds, buildCompareMatrix, MAX_COMPARE } from './compare';
import { makePlan } from '../__fixtures__/plan';

describe('parseCompareIds', () => {
  it('CSV를 id 배열로 파싱한다', () => {
    expect(parseCompareIds('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('빈 값은 빈 배열', () => {
    expect(parseCompareIds(null)).toEqual([]);
    expect(parseCompareIds('')).toEqual([]);
  });

  it('중복을 제거한다', () => {
    expect(parseCompareIds('a,a,b')).toEqual(['a', 'b']);
  });

  it(`최대 ${MAX_COMPARE}개로 절단한다`, () => {
    expect(parseCompareIds('a,b,c,d,e')).toEqual(['a', 'b', 'c']);
  });
});

describe('buildCompareMatrix', () => {
  it('빈 입력은 빈 행', () => {
    expect(buildCompareMatrix([])).toEqual([]);
  });

  it('8개 고정 행을 생성한다(CLS 0)', () => {
    const rows = buildCompareMatrix([makePlan({ id: 'a' })]);
    expect(rows).toHaveLength(8);
    expect(rows.map((r) => r.key)).toEqual([
      'data',
      'throttle',
      'call',
      'sms',
      'network',
      'promoPrice',
      'regularPrice',
      'contract',
    ]);
  });

  it('최저 프로모가 셀에 isBest 표기', () => {
    const plans = [
      makePlan({ id: 'a', monthlyPrice: 22000 }),
      makePlan({ id: 'b', monthlyPrice: 15300 }),
    ];
    const promoRow = buildCompareMatrix(plans).find((r) => r.key === 'promoPrice');
    expect(promoRow?.cells[0]?.isBest).toBe(false);
    expect(promoRow?.cells[1]?.isBest).toBe(true);
  });

  it('프로모 plan의 종료 후 정가에 isWarning, 정가 유지 plan은 경고 없음', () => {
    const plans = [
      makePlan({ id: 'promo', monthlyPrice: 15300, regularPrice: 43000, promoMonths: 7 }),
      makePlan({ id: 'flat', monthlyPrice: 20000, regularPrice: 20000, promoMonths: 0 }),
    ];
    const regularRow = buildCompareMatrix(plans).find((r) => r.key === 'regularPrice');
    expect(regularRow?.cells[0]?.isWarning).toBe(true);
    expect(regularRow?.cells[1]?.isWarning).toBeUndefined();
  });
});
