import type { TQuickChipKey } from '@/shared/config';

/**
 * 커맨드 팔레트 정적 카탈로그 — 라우트/필터 매직값 0(단일 출처).
 * 필터 이동은 plan-filter의 chips 직렬화 규약(`chips=<key>`)을 그대로 따른다.
 */

/** 정적 에셋 plans 소스(cf-cache·존재 보장). 검색 그룹의 데이터 소스. */
export const PLANS_DATA_URL = '/data/plans.json' as const;

/** 요금제 검색 결과 표시 상한(상위 N개만). */
export const SEARCH_RESULT_LIMIT = 8 as const;

/** 팔레트 a11y 라벨(dialog). */
export const PALETTE_LABEL = '명령 팔레트' as const;

/** 이동 명령(그룹 "이동") — href는 라우트 단일 출처. */
export interface INavCommand {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

export const NAV_COMMANDS: readonly INavCommand[] = [
  { id: 'nav-plans', label: '요금제', href: '/' },
  { id: 'nav-compare', label: '비교', href: '/compare' },
  { id: 'nav-recommend', label: '추천', href: '/recommend' },
  { id: 'nav-calculator', label: '계산기', href: '/calculator' },
];

/** 빠른 필터 명령(그룹 "빠른 필터") — chip 키는 plan-filter 직렬화 규약(임의 키 금지). */
export interface IFilterCommand {
  readonly id: string;
  readonly label: string;
  readonly chip: TQuickChipKey;
}

export const FILTER_COMMANDS: readonly IFilterCommand[] = [
  { id: 'filter-price', label: '1만원 이하', chip: 'price_under_10k' },
  { id: 'filter-data', label: '데이터 무제한', chip: 'data_unlimited' },
  { id: 'filter-mvno', label: '알뜰폰만', chip: 'mvno_only' },
  { id: 'filter-contract', label: '약정없음', chip: 'no_contract' },
];

/** 빠른 필터 칩 → `/?chips=<key>` 경로(plan-filter serialize 규약 준수). */
export const filterHref = (chip: TQuickChipKey): string =>
  `/?${new URLSearchParams({ chips: chip }).toString()}`;

/** 요금제 상세 경로. */
export const planDetailHref = (id: string): string => `/plans/${id}`;
