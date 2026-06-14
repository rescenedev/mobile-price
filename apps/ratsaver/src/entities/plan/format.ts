import { format, parseISO } from 'date-fns';
import type { Plan } from './types';

/** 원 단위 가격을 `15,300원` 형식으로 포맷. */
export const formatKrw = (won: number): string => `${won.toLocaleString('ko-KR')}원`;

/** 프로모션(현재) 월요금 표시. */
export const formatPromoPrice = (plan: Plan): string => formatKrw(plan.monthlyPrice);

/** 프로모션 종료 후 정가 표시. */
export const formatRegularPrice = (plan: Plan): string => formatKrw(plan.regularPrice);

/**
 * 1년(12개월) 총비용(원) — 정직성 wedge의 정점.
 * = min(프로모개월,12)×프로모가 + (12−프로모개월)×정가.
 * 프로모 없는 플랜은 12×정가(=12×월요금). "월 10원" 미끼도 1년 환산하면 진짜 비용이 드러난다.
 */
export const firstYearCost = (plan: Plan): number => {
  const promoMonths = Math.min(Math.max(plan.promoMonths, 0), 12);
  return promoMonths * plan.monthlyPrice + (12 - promoMonths) * plan.regularPrice;
};

/** 1년 총비용 표시 — `99,060원`. */
export const formatFirstYearCost = (plan: Plan): string => formatKrw(firstYearCost(plan));

/**
 * 정직성 가격 병기 — 프로모션이 있으면 "월 15,300원 (7개월 후 43,600원)",
 * 없으면 "월 43,600원"만. 정가 숨김 0(US-005 wedge).
 */
export const formatHonestPrice = (plan: Plan): string => {
  const promo = formatPromoPrice(plan);
  if (plan.promoMonths > 0 && plan.regularPrice !== plan.monthlyPrice) {
    return `월 ${promo} (${plan.promoMonths}개월 후 ${formatRegularPrice(plan)})`;
  }
  return `월 ${promo}`;
};

/**
 * 검증일 포맷 — date-fns 사용. `.split('T')[0]` 금지(Hard Threshold ①).
 * 입력은 ISO date 문자열(`YYYY-MM-DD`), 출력은 `2026년 6월 1일`.
 */
export const formatVerifiedDate = (lastVerifiedAt: string): string =>
  format(parseISO(lastVerifiedAt), 'yyyy년 M월 d일');

/** 데이터 표시 — 무제한이면 "무제한", 아니면 "15GB". */
export const formatData = (plan: Plan): string => {
  if (plan.dataUnlimited) return '데이터 무제한';
  if (plan.dataGb === null) return '데이터 무제한';
  return `${plan.dataGb}GB`;
};

/** 소진 후 속도 표시 — "소진 후 5Mbps" / null이면 빈 문자열. */
export const formatThrottle = (plan: Plan): string => {
  if (plan.throttleKbps === null) return '';
  const mbps = plan.throttleKbps / 1000;
  return `소진 후 ${mbps}Mbps`;
};

/** 통화 표시 — 무제한/분. */
export const formatCall = (plan: Plan): string =>
  plan.callUnlimited ? '통화 무제한' : `통화 ${plan.callMinutes ?? 0}분`;

/** 문자 표시 — 무제한/건. */
export const formatSms = (plan: Plan): string =>
  plan.smsUnlimited ? '문자 무제한' : `문자 ${plan.smsCount ?? 0}건`;
