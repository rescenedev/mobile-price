import type { TPlanSort } from '@/shared/db';
import type { TQuickChipKey } from '@/shared/config';
import { setParam, deleteParam } from '@/shared/lib';

/**
 * 목록 필터 상태(클라) — searchParams ↔ 상태 직렬화.
 * 공유가능 URL(US-002): 같은 URL이면 같은 결과를 재현한다.
 */
export interface IFilterState {
  readonly priceMax: number | null;
  readonly dataMin: number | null;
  readonly network: 'SKT' | 'KT' | 'LGU' | null;
  readonly sort: TPlanSort;
  readonly chips: readonly TQuickChipKey[];
}

const CHIP_KEYS: readonly TQuickChipKey[] = [
  'price_under_10k',
  'data_unlimited',
  'mvno_only',
  'no_contract',
];

const isChipKey = (v: string): v is TQuickChipKey =>
  (CHIP_KEYS as readonly string[]).includes(v);

const SORT_KEYS: readonly TPlanSort[] = ['recommend', 'price_asc', 'year_cost_asc', 'data_desc'];
const isSort = (v: string | null): v is TPlanSort =>
  v !== null && (SORT_KEYS as readonly string[]).includes(v);

/** 기본 정렬 — 가장 싼 요금제 최상단(price_asc). shared/db.DEFAULT_SORT와 일치. */
const DEFAULT_SORT: TPlanSort = 'price_asc';

const parseIntOrNull = (raw: string | null): number | null => {
  if (raw === null) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** searchParams → 필터 상태(안전 폴백: 잘못된 값은 무시). */
export const parseFilters = (params: URLSearchParams): IFilterState => {
  const network = params.get('network');
  const validNetwork =
    network === 'SKT' || network === 'KT' || network === 'LGU' ? network : null;

  const chips = (params.get('chips') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(isChipKey);

  return {
    priceMax: parseIntOrNull(params.get('price_max')),
    dataMin: parseIntOrNull(params.get('data_min')),
    network: validNetwork,
    sort: isSort(params.get('sort')) ? (params.get('sort') as TPlanSort) : DEFAULT_SORT,
    chips,
  };
};

/** 필터 상태 → searchParams(공유가능 URL). 기본값은 키를 생략해 URL을 깔끔하게 유지. */
export const serializeFilters = (state: IFilterState): URLSearchParams => {
  let next = new URLSearchParams();
  next = setParam(next, 'price_max', state.priceMax !== null ? String(state.priceMax) : null);
  next = setParam(next, 'data_min', state.dataMin !== null ? String(state.dataMin) : null);
  next = setParam(next, 'network', state.network);
  // 기본 정렬(price_asc)은 URL 키를 생략해 공유 URL을 깔끔히 유지(round-trip 보존).
  next =
    state.sort === DEFAULT_SORT ? deleteParam(next, 'sort') : setParam(next, 'sort', state.sort);
  next =
    state.chips.length > 0
      ? setParam(next, 'chips', state.chips.join(','))
      : deleteParam(next, 'chips');
  return next;
};
