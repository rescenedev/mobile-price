import type { Plan } from '@/entities/plan';
import {
  formatData,
  formatThrottle,
  formatCall,
  formatSms,
  formatKrw,
} from '@/entities/plan';

/** 비교 최대 슬롯 수(초과 차단). */
export const MAX_COMPARE = 3;

/** `?ids=a,b,c` → 최대 3개의 유니크 id 배열(초과분 절단, 중복 제거). */
export const parseCompareIds = (raw: string | null | undefined): readonly string[] => {
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const unique: string[] = [];
  for (const id of ids) {
    if (!unique.includes(id)) unique.push(id);
    if (unique.length >= MAX_COMPARE) break;
  }
  return unique;
};

/** 비교 행 키 — 표 행 라벨 단일 출처(행 수 고정 → CLS 0). */
export type TCompareRowKey =
  | 'data'
  | 'throttle'
  | 'call'
  | 'sms'
  | 'network'
  | 'promoPrice'
  | 'regularPrice'
  | 'contract';

export interface ICompareRow {
  readonly key: TCompareRowKey;
  readonly label: string;
  /** 컬럼별 표시 셀(plan 순서와 일치). */
  readonly cells: readonly ICompareCell[];
}

export interface ICompareCell {
  readonly text: string;
  /** 최저 프로모가 셀(saving 강조). */
  readonly isBest?: boolean;
  /** 종료 후 정가 경고(warning). */
  readonly isWarning?: boolean;
}

const CONTRACT_LABEL: Record<Plan['contract'], string> = {
  none: '없음',
  '12m': '12개월',
  '24m': '24개월',
};

const networkLabel = (plan: Plan): string => `${plan.network} · ${plan.tech}`;

/**
 * 선택된 plan들을 비교 매트릭스(행 고정)로 조립한다. 순수함수.
 * 최저 프로모가 셀에 isBest, 프로모 종료 후 정가가 있으면 isWarning 표기.
 */
export const buildCompareMatrix = (plans: readonly Plan[]): readonly ICompareRow[] => {
  if (plans.length === 0) return [];

  const minPromo = Math.min(...plans.map((p) => p.monthlyPrice));

  const promoCells: readonly ICompareCell[] = plans.map((p) => ({
    text: `월 ${formatKrw(p.monthlyPrice)}`,
    isBest: p.monthlyPrice === minPromo,
  }));

  const regularCells: readonly ICompareCell[] = plans.map((p) => {
    const hasPromo = p.promoMonths > 0 && p.regularPrice !== p.monthlyPrice;
    return hasPromo
      ? { text: `${p.promoMonths}개월 후 ${formatKrw(p.regularPrice)}`, isWarning: true }
      : { text: '정가 유지' };
  });

  return [
    { key: 'data', label: '데이터', cells: plans.map((p) => ({ text: formatData(p) })) },
    {
      key: 'throttle',
      label: '소진 후 속도',
      cells: plans.map((p) => ({ text: formatThrottle(p) || '-' })),
    },
    { key: 'call', label: '통화', cells: plans.map((p) => ({ text: formatCall(p) })) },
    { key: 'sms', label: '문자', cells: plans.map((p) => ({ text: formatSms(p) })) },
    { key: 'network', label: '망 · 세대', cells: plans.map((p) => ({ text: networkLabel(p) })) },
    { key: 'promoPrice', label: '프로모가', cells: promoCells },
    { key: 'regularPrice', label: '종료 후 정가', cells: regularCells },
    {
      key: 'contract',
      label: '약정',
      cells: plans.map((p) => ({ text: CONTRACT_LABEL[p.contract] })),
    },
  ];
};
