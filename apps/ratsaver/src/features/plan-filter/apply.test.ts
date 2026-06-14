import { describe, it, expect } from 'vitest';
import { applyFilters } from './apply';
import { buildCriteria } from './quickchips';
import type { IFilterState } from './parse';
import { makePlan } from '../__fixtures__/plan';

const baseState: IFilterState = {
  priceMax: null,
  dataMin: null,
  network: null,
  sort: 'recommend',
  chips: [],
};

const plans = [
  makePlan({ id: 'a', monthlyPrice: 8000, dataGb: 5, mvno: true, contract: 'none' }),
  makePlan({ id: 'b', monthlyPrice: 22000, dataGb: 71, mvno: false, contract: '24m' }),
  makePlan({
    id: 'c',
    monthlyPrice: 33000,
    dataGb: null,
    dataUnlimited: true,
    mvno: true,
    contract: '12m',
  }),
];

describe('applyFilters', () => {
  it('필터 없으면 전체를 반환한다', () => {
    expect(applyFilters(plans, baseState)).toHaveLength(3);
  });

  it('망 필터를 적용한다', () => {
    const filtered = applyFilters(plans, { ...baseState, network: 'KT' });
    expect(filtered.every((p) => p.network === 'KT')).toBe(true);
  });

  it('가격 상한을 적용한다', () => {
    const filtered = applyFilters(plans, { ...baseState, priceMax: 10000 });
    expect(filtered.map((p) => p.id)).toEqual(['a']);
  });

  it('정렬 price_asc는 가격 오름차순', () => {
    const sorted = applyFilters(plans, { ...baseState, sort: 'price_asc' });
    expect(sorted.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('입력 배열을 변형하지 않는다(immutable)', () => {
    const snapshot = [...plans];
    applyFilters(plans, { ...baseState, sort: 'price_asc' });
    expect(plans).toEqual(snapshot);
  });
});

describe('buildCriteria — 퀵칩 AND 결합', () => {
  it('1만원 이하 칩은 priceMax를 10000으로 좁힌다', () => {
    const c = buildCriteria({ ...baseState, chips: ['price_under_10k'] });
    expect(c.priceMax).toBe(10000);
  });

  it('1만원 칩 + 더 작은 priceMax는 더 좁은 쪽을 채택', () => {
    const c = buildCriteria({ ...baseState, priceMax: 8000, chips: ['price_under_10k'] });
    expect(c.priceMax).toBe(8000);
  });

  it('알뜰폰만·무제한·약정없음 칩을 누적한다', () => {
    const c = buildCriteria({
      ...baseState,
      chips: ['mvno_only', 'data_unlimited', 'no_contract'],
    });
    expect(c.mvno).toBe(true);
    expect(c.unlimited).toBe(true);
    expect(c.noContract).toBe(true);
  });

  it('알뜰폰만 칩 적용 시 MNO는 제외된다', () => {
    const filtered = applyFilters(plans, { ...baseState, chips: ['mvno_only'] });
    expect(filtered.every((p) => p.mvno)).toBe(true);
    expect(filtered.map((p) => p.id)).not.toContain('b');
  });

  it('무제한 칩은 무제한 plan만 남긴다', () => {
    const filtered = applyFilters(plans, { ...baseState, chips: ['data_unlimited'] });
    expect(filtered.map((p) => p.id)).toEqual(['c']);
  });
});
