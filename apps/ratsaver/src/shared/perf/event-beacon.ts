import type { TEventName, TEventParams } from './events';

const EVENTS_ENDPOINT = '/api/events';

/**
 * 비콘 페이로드를 직렬화한다(클라). route는 현재 pathname(쿼리·해시 제외 — referrer/PII 누출 방지).
 */
const buildBody = (name: TEventName, params: TEventParams): string => {
  const route =
    typeof location !== 'undefined' && location.pathname ? location.pathname : '/';
  return JSON.stringify({ name, route, params });
};

const post = (body: string): void => {
  // sendBeacon은 페이지 이탈 중에도 안정적으로 전송된다. 미지원/실패 시 keepalive fetch 폴백.
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon(EVENTS_ENDPOINT, blob)) return;
  }
  void fetch(EVENTS_ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {
    // 비콘 실패가 앱을 깨면 안 된다 — 조용히 무시.
  });
};

/**
 * KPI 커스텀 이벤트를 AE로 비콘 전송한다(클라 단일 통로 · Hard Threshold ⑤).
 * - 이벤트명은 `EVENTS.*` 상수만 받는다(매직 스트링 0 — TEventName 타입 강제).
 * - params는 버킷/열거형/bool/소건수만(현재요금·절약액 절대값 0 — 호출부에서 버킷 헬퍼 경유).
 * - 서버에서 환경 미가용/SSR이면 no-op(가드).
 */
export const trackEvent = (name: TEventName, params: TEventParams = {}): void => {
  if (typeof window === 'undefined') return;
  try {
    post(buildBody(name, params));
  } catch {
    // 직렬화/전송 실패는 조용히 무시.
  }
};
