import type { Plan } from '@/entities/plan';

/** 사용량 입력(클라 순수 — 서버 미전송). */
export interface IUsage {
  /** 월 데이터 사용량(GB). */
  readonly dataGb: number;
  /** 월 통화량(분). */
  readonly callMinutes: number;
}

/** 사용량 프리셋 키. */
export type TUsagePresetKey =
  | 'call_only'
  | 'web_7g'
  | 'commute_15g'
  | 'video_71g'
  | 'unlimited_100g';

export interface IUsagePreset {
  readonly key: TUsagePresetKey;
  readonly emoji: string;
  readonly label: string;
  readonly usage: IUsage;
}

/** 프리셋 5종(moyo-reference 차용 — 사용량 입력 진입장벽 최소화). */
export const USAGE_PRESETS: readonly IUsagePreset[] = [
  { key: 'call_only', emoji: '📞', label: '주로 통화만', usage: { dataGb: 1, callMinutes: 300 } },
  { key: 'web_7g', emoji: '🔎', label: '웹서핑 · 카톡', usage: { dataGb: 7, callMinutes: 200 } },
  {
    key: 'commute_15g',
    emoji: '🚆',
    label: '출퇴근 영상',
    usage: { dataGb: 15, callMinutes: 150 },
  },
  { key: 'video_71g', emoji: '🎬', label: '매일 영상', usage: { dataGb: 71, callMinutes: 100 } },
  {
    key: 'unlimited_100g',
    emoji: '♾️',
    label: '맘껏 사용',
    usage: { dataGb: 100, callMinutes: 100 },
  },
];

const presetByKey = new Map(USAGE_PRESETS.map((p) => [p.key, p]));

/** 프리셋 키 → 사용량(없으면 undefined). */
export const usageFromPreset = (key: string): IUsage | undefined => presetByKey.get(key as TUsagePresetKey)?.usage;

const effectiveData = (plan: Plan): number =>
  plan.dataUnlimited ? Number.POSITIVE_INFINITY : (plan.dataGb ?? 0);

const effectiveCall = (plan: Plan): number =>
  plan.callUnlimited ? Number.POSITIVE_INFINITY : (plan.callMinutes ?? 0);

/**
 * 적합도 점수(높을수록 추천). 순수함수.
 * - 데이터/통화가 사용량을 못 채우면 강한 패널티(부족분 비례).
 * - 충족 시 초과 여유는 약하게 가점(낭비 방지), 가격이 낮을수록 가점.
 * - 무제한은 항상 충족.
 */
export const scorePlan = (plan: Plan, usage: IUsage): number => {
  const data = effectiveData(plan);
  const call = effectiveCall(plan);

  let score = 100;

  // 데이터 부족: 부족 GB당 -8 (못 채우면 크게 깎임)
  if (data < usage.dataGb) {
    score -= (usage.dataGb - data) * 8;
  } else {
    // 충족: 가까울수록 좋음(과잉 여유는 소폭 감점). 무제한은 여유 패널티 면제.
    const slack = data === Number.POSITIVE_INFINITY ? 0 : data - usage.dataGb;
    score -= Math.min(slack * 0.1, 10);
  }

  // 통화 부족: 부족 분당 -0.05
  if (call < usage.callMinutes) {
    score -= (usage.callMinutes - call) * 0.05;
  }

  // 가격: 1,000원당 -1 (저렴할수록 가점)
  score -= plan.monthlyPrice / 1000;

  return score;
};

export interface IRecommendation {
  readonly plan: Plan;
  readonly score: number;
}

/** 사용량 기준 점수 내림차순 추천 목록. 입력 불변(immutable). */
export const recommend = (
  plans: readonly Plan[],
  usage: IUsage,
  limit = 20,
): readonly IRecommendation[] =>
  plans
    .map((plan) => ({ plan, score: scorePlan(plan, usage) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
