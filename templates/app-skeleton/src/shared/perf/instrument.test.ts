import { describe, it, expect, vi } from 'vitest';
import { trackFetch } from './instrument';
import type { IPerfSample, IPerfSink } from './types';

const makeSink = () => {
  const samples: IPerfSample[] = [];
  const sink: IPerfSink = { record: (s) => samples.push(s) };
  return { sink, samples };
};

describe('trackFetch', () => {
  it('records duration, status and route on success', async () => {
    const { sink, samples } = makeSink();
    let t = 1000;
    const now = () => t;
    const result = await trackFetch(
      sink,
      { route: '/api/hello', method: 'GET', cache: 'miss', now },
      async () => {
        t = 1150; // 150ms 경과 시뮬레이션
        return new Response('ok', { status: 200 });
      },
    );
    expect(result.status).toBe(200);
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({
      route: '/api/hello',
      method: 'GET',
      durationMs: 150,
      status: 200,
      cache: 'miss',
    });
  });

  it('records status 500 and rethrows when the operation throws', async () => {
    const { sink, samples } = makeSink();
    let t = 0;
    const now = () => t;
    await expect(
      trackFetch(sink, { route: '/api/boom', method: 'POST', now }, async () => {
        t = 42;
        throw new Error('upstream down');
      }),
    ).rejects.toThrow('upstream down');
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({ route: '/api/boom', method: 'POST', status: 500, durationMs: 42, cache: 'none' });
  });

  it('does not let a sink failure break the request', async () => {
    const sink: IPerfSink = { record: () => { throw new Error('sink exploded'); } };
    const result = await trackFetch(
      sink,
      { route: '/api/ok', method: 'GET', now: () => 0 },
      async () => new Response('ok', { status: 200 }),
    );
    expect(result.status).toBe(200);
  });
});
