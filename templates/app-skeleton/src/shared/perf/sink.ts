import type { IPerfSink } from './types';

export const createAnalyticsEngineSink = (dataset: AnalyticsEngineDataset): IPerfSink => ({
  record(sample) {
    dataset.writeDataPoint({
      indexes: [sample.route],
      blobs: [sample.route, sample.method, String(sample.status), sample.cache],
      doubles: [sample.durationMs],
    });
  },
});
