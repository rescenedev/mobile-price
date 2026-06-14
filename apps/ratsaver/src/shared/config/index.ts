/**
 * 앱 전역 상수 — 가격/데이터 버킷, 퀵칩 정의, 정렬 옵션.
 * features(plan-filter·recommend·saving-calculator)와 widgets가 단일 출처로 소비한다.
 * 절대값을 AE로 보내지 않기 위한 버킷 경계도 여기서 정의(4d가 재사용).
 */

/** 퀵필터 칩 키(searchParams 토글). */
export type TQuickChipKey = 'price_under_10k' | 'data_unlimited' | 'mvno_only' | 'no_contract';

export interface IQuickChip {
  readonly key: TQuickChipKey;
  readonly label: string;
}

/** 퀵칩 4종(moyo-reference 차용). */
export const QUICK_CHIPS: readonly IQuickChip[] = [
  { key: 'price_under_10k', label: '1만원 이하' },
  { key: 'data_unlimited', label: '데이터 무제한' },
  { key: 'mvno_only', label: '알뜰폰만' },
  { key: 'no_contract', label: '약정없음' },
];

/** 1만원 이하 칩의 가격 경계(원). */
export const PRICE_UNDER_10K = 10000;

/** 정렬 옵션(라벨 ↔ sort searchParam). value는 shared/db.TPlanSort와 동일 집합. */
export interface ISortOption {
  readonly value: 'recommend' | 'price_asc' | 'year_cost_asc' | 'data_desc';
  readonly label: string;
}

export const SORT_OPTIONS: readonly ISortOption[] = [
  { value: 'recommend', label: '추천순' },
  { value: 'price_asc', label: '가격 낮은순' },
  // 정직성 wedge: 프로모 미끼("월 10원")를 1년 환산 진짜 최저가로 드러낸다(firstYearCost).
  { value: 'year_cost_asc', label: '1년 총비용 낮은순' },
  { value: 'data_desc', label: '데이터 많은순' },
];

/** 가격대 슬라이더 경계(원). */
export const PRICE_RANGE = { min: 0, max: 90000, step: 5000 } as const;

/** 데이터 슬라이더 경계(GB). */
export const DATA_RANGE = { min: 0, max: 110, step: 1 } as const;

/** 절약액 버킷(절대값 미전송 — 4d AE 파라미터용). */
export type TSavingBucket = 'none' | 'under_5k' | '5k_15k' | 'over_15k';

export const savingBucket = (monthlySaving: number): TSavingBucket => {
  if (monthlySaving <= 0) return 'none';
  if (monthlySaving < 5000) return 'under_5k';
  if (monthlySaving <= 15000) return '5k_15k';
  return 'over_15k';
};

/** 가격대 버킷(절대값 미전송 — kpis.md price_bucket). */
export type TPriceBucket = 'under_10k' | '10k_25k' | '25k_40k' | 'over_40k';

export const priceBucket = (monthlyPrice: number): TPriceBucket => {
  if (monthlyPrice < 10000) return 'under_10k';
  if (monthlyPrice < 25000) return '10k_25k';
  if (monthlyPrice <= 40000) return '25k_40k';
  return 'over_40k';
};

/** 데이터(GB) 버킷(절대값 미전송 — kpis.md data_bucket). */
export type TDataBucket = 'under_3g' | '3g_15g' | '15g_70g' | 'over_70g' | 'unlimited';

export const dataBucket = (dataGb: number, unlimited = false): TDataBucket => {
  if (unlimited) return 'unlimited';
  if (dataGb < 3) return 'under_3g';
  if (dataGb < 15) return '3g_15g';
  if (dataGb <= 70) return '15g_70g';
  return 'over_70g';
};

/** 통화(분) 버킷(절대값 미전송 — kpis.md call_bucket). */
export type TCallBucket = 'under_100' | '100_300' | 'over_300' | 'unlimited';

export const callBucket = (callMinutes: number, unlimited = false): TCallBucket => {
  if (unlimited) return 'unlimited';
  if (callMinutes < 100) return 'under_100';
  if (callMinutes <= 300) return '100_300';
  return 'over_300';
};

/** 결과 건수 버킷(절대값 미전송 — kpis.md result_count_bucket). */
export type TResultCountBucket = 'empty' | '1_10' | '11_50' | 'over_50';

export const resultCountBucket = (count: number): TResultCountBucket => {
  if (count <= 0) return 'empty';
  if (count <= 10) return '1_10';
  if (count <= 50) return '11_50';
  return 'over_50';
};
