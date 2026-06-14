import { onLCP, onINP, onCLS, onTTFB, type Metric } from 'web-vitals';
import type { TVitalName, TVitalsPayload } from './vitals-schema';

const VITALS_ENDPOINT = '/api/vitals';

const NAME_MAP: Record<string, TVitalName> = {
  LCP: 'LCP',
  INP: 'INP',
  CLS: 'CLS',
  TTFB: 'TTFB',
};

const send = (payload: TVitalsPayload): void => {
  const body = JSON.stringify(payload);
  // sendBeacon은 페이지 이탈 중에도 안정적으로 전송된다. 미지원/실패 시 keepalive fetch로 폴백.
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const ok = navigator.sendBeacon(VITALS_ENDPOINT, body);
    if (ok) return;
  }
  void fetch(VITALS_ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {
    // 비콘 실패가 앱을 깨면 안 된다 — 조용히 무시
  });
};

const handler = (metric: Metric): void => {
  const name = NAME_MAP[metric.name];
  if (name === undefined) return;
  send({
    name,
    value: metric.value,
    route: typeof location !== 'undefined' ? location.pathname : '/',
    id: metric.id,
  });
};

/**
 * Core Web Vitals를 구독해 /api/vitals로 비콘 전송한다(관측 ⑤).
 * 클라이언트에서 한 번만 호출한다(WebVitals 컴포넌트의 useEffect).
 */
export const reportWebVitals = (): void => {
  onLCP(handler);
  onINP(handler);
  onCLS(handler);
  onTTFB(handler);
};
