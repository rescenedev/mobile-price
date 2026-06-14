import { describe, it, expect, vi } from 'vitest';
import { createAnalyticsEngineVitalsSink } from './vitals-sink';
import { vitalsPayloadSchema } from './vitals-schema';

describe('createAnalyticsEngineVitalsSink', () => {
  it('writes route/name/id as blobs and value as double', () => {
    const writes: unknown[] = [];
    const dataset = {
      writeDataPoint: (p: unknown) => writes.push(p),
    } as unknown as AnalyticsEngineDataset;
    const sink = createAnalyticsEngineVitalsSink(dataset);
    sink.record({ name: 'LCP', value: 1234.5, route: '/home', id: 'v1' });
    expect(writes[0]).toMatchObject({
      indexes: ['/home'],
      blobs: ['/home', 'LCP', 'v1'],
      doubles: [1234.5],
    });
  });

  it('coerces a missing id to empty string', () => {
    const writes: Array<{ blobs: string[] }> = [];
    const dataset = {
      writeDataPoint: vi.fn((p: { blobs: string[] }) => writes.push(p)),
    } as unknown as AnalyticsEngineDataset;
    createAnalyticsEngineVitalsSink(dataset).record({ name: 'CLS', value: 0.02, route: '/x' });
    expect(writes[0].blobs[2]).toBe('');
  });
});

describe('vitalsPayloadSchema', () => {
  it('accepts a valid payload', () => {
    const parsed = vitalsPayloadSchema.safeParse({ name: 'INP', value: 50, route: '/p' });
    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown metric name', () => {
    const parsed = vitalsPayloadSchema.safeParse({ name: 'FID', value: 1, route: '/p' });
    expect(parsed.success).toBe(false);
  });

  it('rejects a negative value', () => {
    const parsed = vitalsPayloadSchema.safeParse({ name: 'LCP', value: -1, route: '/p' });
    expect(parsed.success).toBe(false);
  });
});
