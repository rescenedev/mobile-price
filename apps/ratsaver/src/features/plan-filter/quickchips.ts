import type { IPlanCriteria } from '@/shared/db';
import type { TQuickChipKey } from '@/shared/config';
import { PRICE_UNDER_10K } from '@/shared/config';
import type { IFilterState } from './parse';

/**
 * 퀵칩 → criteria 부분 결합(AND). 활성 칩들이 누적되어 다른 필터와 함께 적용된다.
 * 칩 간/필터 간 충돌 시 더 좁은(작은 priceMax, 큰 dataMin) 조건을 채택한다.
 */
const applyChip = (criteria: IPlanCriteria, chip: TQuickChipKey): IPlanCriteria => {
  switch (chip) {
    case 'price_under_10k':
      return {
        ...criteria,
        priceMax:
          criteria.priceMax === undefined
            ? PRICE_UNDER_10K
            : Math.min(criteria.priceMax, PRICE_UNDER_10K),
      };
    case 'data_unlimited':
      return { ...criteria, unlimited: true };
    case 'mvno_only':
      return { ...criteria, mvno: true };
    case 'no_contract':
      return { ...criteria, noContract: true };
    default:
      return criteria;
  }
};

/** 필터 상태(슬라이더·망·정렬·칩) → 단일 IPlanCriteria(applyCriteria 입력). */
export const buildCriteria = (state: IFilterState): IPlanCriteria => {
  const base: IPlanCriteria = {
    sort: state.sort,
    ...(state.network !== null ? { network: state.network } : {}),
    ...(state.priceMax !== null ? { priceMax: state.priceMax } : {}),
    ...(state.dataMin !== null ? { dataMin: state.dataMin } : {}),
  };
  return state.chips.reduce(applyChip, base);
};
