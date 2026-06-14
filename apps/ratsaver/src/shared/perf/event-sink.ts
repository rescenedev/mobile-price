import type { TEventPayload } from './event-schema';

export interface IEventSink {
  record(payload: TEventPayload): void;
}

/**
 * KPI 커스텀 이벤트를 Analytics Engine에 기록한다(직접 AE 호출 0 — 이 래퍼 경유).
 * indexes: [name] (이벤트별 집계), blobs: [name, route, params(JSON)] — /perf·KPI 쿼리에서 사용.
 * params는 이미 버킷화된 PII-free 값만 담긴다(event-schema가 경계에서 강제).
 */
export const createAnalyticsEngineEventSink = (
  dataset: AnalyticsEngineDataset,
): IEventSink => ({
  record(payload) {
    dataset.writeDataPoint({
      indexes: [payload.name],
      blobs: [payload.name, payload.route, JSON.stringify(payload.params)],
      doubles: [1],
    });
  },
});
