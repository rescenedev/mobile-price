import type { TVitalsPayload } from './vitals-schema';

export interface IVitalsSink {
  record(payload: TVitalsPayload): void;
}

/**
 * Web Vitals 샘플을 Analytics Engine에 기록한다.
 * blobs: [route, name, id], doubles: [value] — /perf 대시보드에서 라우트별 분위수 집계에 사용.
 */
export const createAnalyticsEngineVitalsSink = (
  dataset: AnalyticsEngineDataset,
): IVitalsSink => ({
  record(payload) {
    dataset.writeDataPoint({
      indexes: [payload.route],
      blobs: [payload.route, payload.name, payload.id ?? ''],
      doubles: [payload.value],
    });
  },
});
