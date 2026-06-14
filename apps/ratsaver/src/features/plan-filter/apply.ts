import type { Plan } from '@/entities/plan';
// criteria 모듈 직접 import — @/shared/db 배럴은 server-only라 클라(plan-list)에서 못 씀.
// criteria.ts 자체는 server-only가 아니며 순수 in-memory 정렬/필터.
import { applyCriteria } from '@/shared/db/criteria';
import type { IFilterState } from './parse';
import { buildCriteria } from './quickchips';

/**
 * 필터 상태를 전체 plan 목록에 적용(필터 + 정렬). 순수함수, 입력 불변.
 * 150건 in-memory 필터 → 마이크로초(INP ≤ 200ms). 서버 호출 0.
 * shared/db.applyCriteria를 재사용해 정렬 로직 단일 출처 유지.
 */
export const applyFilters = (plans: readonly Plan[], state: IFilterState): Plan[] =>
  applyCriteria(plans, buildCriteria(state));
