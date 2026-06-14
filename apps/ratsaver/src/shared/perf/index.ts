/**
 * @/shared/perf — 관측 단일 통로(Hard Threshold ④⑤).
 * - trackFetch: 모든 데이터/외부 호출 latency 계측 래퍼(서버).
 * - trackEvent + EVENTS: KPI 커스텀 이벤트 발화(클라, 매직 스트링 0).
 * - Web Vitals 비콘은 WebVitals 컴포넌트로 layout에 마운트.
 *
 * 주의: sink/event-sink/route 핸들러는 AnalyticsEngineDataset(서버 바인딩)을 받으므로
 * 서버 진입점(route handler·RSC)에서만 import한다. 클라는 trackEvent/EVENTS만 사용.
 */
export { trackFetch } from './instrument';
export { trackEvent } from './event-beacon';
export {
  EVENTS,
  INTENT_EVENTS,
  DECISION_EVENTS,
  type TEventName,
  type TEventParams,
} from './events';
export type {
  IPerfSample,
  IPerfSink,
  ITrackOptions,
  TCacheOutcome,
} from './types';
export type { TEventPayload } from './event-schema';
export type { TVitalsPayload, TVitalName } from './vitals-schema';
