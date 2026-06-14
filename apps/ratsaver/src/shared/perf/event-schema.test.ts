import { describe, it, expect } from 'vitest';
import { eventPayloadSchema } from './event-schema';
import { EVENTS } from './events';

describe('eventPayloadSchema(PII·매직스트링 경계 차단)', () => {
  it('EVENTS 화이트리스트 이벤트 + 버킷 파라미터를 통과시킨다', () => {
    const parsed = eventPayloadSchema.safeParse({
      name: EVENTS.SAVING_CALC,
      route: '/calculator',
      params: { saving_bucket: 'over_15k', period: 'monthly' },
    });
    expect(parsed.success).toBe(true);
  });

  it('정의 밖 이벤트명(매직 스트링)을 거부한다', () => {
    const parsed = eventPayloadSchema.safeParse({
      name: 'random_event_xyz',
      route: '/',
      params: {},
    });
    expect(parsed.success).toBe(false);
  });

  it('현재요금 같은 절대 금액(대형 number)을 파라미터에서 거부한다(PII 차단)', () => {
    const parsed = eventPayloadSchema.safeParse({
      name: EVENTS.SAVING_CALC,
      route: '/calculator',
      params: { current_price: 45000 },
    });
    expect(parsed.success).toBe(false);
  });

  it('소건수(compare_count 등) number는 허용한다', () => {
    const parsed = eventPayloadSchema.safeParse({
      name: EVENTS.ADD_COMPARE,
      route: '/plans',
      params: { compare_count: 3 },
    });
    expect(parsed.success).toBe(true);
  });

  it('params 누락 시 빈 객체로 기본값 처리한다', () => {
    const parsed = eventPayloadSchema.safeParse({
      name: EVENTS.OPEN_USAGE_PRESET,
      route: '/recommend',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.params).toEqual({});
  });
});
