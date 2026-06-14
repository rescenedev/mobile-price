import { describe, it, expect } from 'vitest';
import { EVENTS, INTENT_EVENTS, DECISION_EVENTS } from './events';

describe('EVENTS 카탈로그(매직 스트링 단일 출처)', () => {
  it('kpis.md 15개 이벤트를 모두 정의한다', () => {
    expect(Object.keys(EVENTS)).toHaveLength(15);
  });

  it('모든 이벤트명은 snake_case 동사_명사 규칙을 따른다', () => {
    for (const name of Object.values(EVENTS)) {
      expect(name).toMatch(/^[a-z]+(_[a-z0-9]+)+$/);
    }
  });

  it('이벤트명에 중복이 없다', () => {
    const values = Object.values(EVENTS);
    expect(new Set(values).size).toBe(values.length);
  });

  it('North Star 분자: 추천/계산 의도 이벤트가 정의돼 있다', () => {
    expect(INTENT_EVENTS).toEqual([EVENTS.RECOMMEND_RUN, EVENTS.SAVING_CALC]);
  });

  it('North Star 분자: 결정 도달(비교/상세) 이벤트가 정의돼 있다', () => {
    expect(DECISION_EVENTS).toEqual([EVENTS.VIEW_COMPARE, EVENTS.VIEW_PLAN_DETAIL]);
  });
});
