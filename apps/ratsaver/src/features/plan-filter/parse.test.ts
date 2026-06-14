import { describe, it, expect } from 'vitest';
import { parseFilters, serializeFilters, type IFilterState } from './parse';

describe('parseFilters', () => {
  it('빈 searchParams는 기본 상태(정렬 price_asc — 최저가 우선)를 반환한다', () => {
    const state = parseFilters(new URLSearchParams());
    expect(state).toEqual({
      priceMax: null,
      dataMin: null,
      network: null,
      sort: 'price_asc',
      chips: [],
    });
  });

  it('가격·데이터·망·정렬·칩을 파싱한다', () => {
    const params = new URLSearchParams(
      'price_max=10000&data_min=7&network=KT&sort=price_asc&chips=mvno_only,no_contract',
    );
    const state = parseFilters(params);
    expect(state.priceMax).toBe(10000);
    expect(state.dataMin).toBe(7);
    expect(state.network).toBe('KT');
    expect(state.sort).toBe('price_asc');
    expect(state.chips).toEqual(['mvno_only', 'no_contract']);
  });

  it('잘못된 값(음수 가격·미지 망·미지 정렬·미지 칩)은 안전 폴백한다', () => {
    const params = new URLSearchParams(
      'price_max=-5&network=ZZZ&sort=bogus&chips=nope,mvno_only',
    );
    const state = parseFilters(params);
    expect(state.priceMax).toBeNull();
    expect(state.network).toBeNull();
    expect(state.sort).toBe('price_asc');
    expect(state.chips).toEqual(['mvno_only']);
  });
});

describe('serializeFilters (round-trip — 공유가능 URL US-002)', () => {
  it('상태를 직렬화하면 parseFilters로 동일 복원된다', () => {
    const state: IFilterState = {
      priceMax: 25000,
      dataMin: 15,
      network: 'LGU',
      sort: 'data_desc',
      chips: ['data_unlimited'],
    };
    const restored = parseFilters(serializeFilters(state));
    expect(restored).toEqual(state);
  });

  it('기본값(정렬 price_asc·빈 칩)은 URL 키를 생략한다', () => {
    const params = serializeFilters({
      priceMax: null,
      dataMin: null,
      network: null,
      sort: 'price_asc',
      chips: [],
    });
    expect(params.toString()).toBe('');
  });
});
