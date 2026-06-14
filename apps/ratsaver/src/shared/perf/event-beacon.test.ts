import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { trackEvent } from './event-beacon';
import { EVENTS } from './events';

describe('trackEvent(클라 비콘 단일 통로)', () => {
  const sendBeacon = vi.fn<(url: string, body?: unknown) => boolean>(() => true);

  beforeEach(() => {
    sendBeacon.mockClear();
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', { sendBeacon });
    vi.stubGlobal('location', { pathname: '/calculator' });
    vi.stubGlobal('Blob', class {
      constructor(public parts: unknown[], public opts: unknown) {}
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('/api/events로 sendBeacon을 호출한다', () => {
    trackEvent(EVENTS.SAVING_CALC, { saving_bucket: 'over_15k', period: 'monthly' });
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0][0]).toBe('/api/events');
  });

  it('페이로드에 이벤트명·현재 pathname·params를 담는다(쿼리 제외)', () => {
    trackEvent(EVENTS.ADD_COMPARE, { compare_count: 2 });
    const blob = sendBeacon.mock.calls[0][1] as { parts: string[] };
    const body = JSON.parse(blob.parts[0]);
    expect(body.name).toBe(EVENTS.ADD_COMPARE);
    expect(body.route).toBe('/calculator');
    expect(body.params).toEqual({ compare_count: 2 });
  });

  it('window 미정의(SSR)면 no-op이며 throw하지 않는다', () => {
    vi.stubGlobal('window', undefined);
    expect(() => trackEvent(EVENTS.RECOMMEND_RUN)).not.toThrow();
  });
});
