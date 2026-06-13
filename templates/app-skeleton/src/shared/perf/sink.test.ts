import { describe, it, expect } from 'vitest';
import { createAnalyticsEngineSink } from './sink';

describe('createAnalyticsEngineSink', () => {
  it('writes a data point with route as blob and duration as double', () => {
    const writes: unknown[] = [];
    const dataset = { writeDataPoint: (p: unknown) => writes.push(p) } as unknown as AnalyticsEngineDataset;
    const sink = createAnalyticsEngineSink(dataset);
    sink.record({ route: '/api/hello', method: 'GET', durationMs: 150, status: 200, cache: 'miss', at: 1700000000000 });
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      indexes: ['/api/hello'],
      blobs: ['/api/hello', 'GET', '200', 'miss'],
      doubles: [150],
    });
  });
});
