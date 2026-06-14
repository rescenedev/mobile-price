import { describe, it, expect, vi } from 'vitest';
import { joinUrl, parseProberConfig, probeRoute, probeAll } from './probe';

describe('joinUrl', () => {
  it('joins without doubling slashes', () => {
    expect(joinUrl('https://x.dev/', '/api/hello')).toBe('https://x.dev/api/hello');
  });
  it('adds a leading slash to a bare route', () => {
    expect(joinUrl('https://x.dev', 'api/hello')).toBe('https://x.dev/api/hello');
  });
});

describe('parseProberConfig', () => {
  it('returns null without BASE_URL', () => {
    expect(parseProberConfig({ ROUTES: '/a' })).toBeNull();
  });
  it('defaults routes to root', () => {
    expect(parseProberConfig({ BASE_URL: 'https://x.dev' })).toEqual({
      baseUrl: 'https://x.dev',
      routes: ['/'],
    });
  });
  it('splits and trims a comma list', () => {
    expect(parseProberConfig({ BASE_URL: 'https://x.dev', ROUTES: '/a, /b ,/c' })).toEqual({
      baseUrl: 'https://x.dev',
      routes: ['/a', '/b', '/c'],
    });
  });
});

describe('probeRoute', () => {
  it('measures duration and reports ok', async () => {
    let t = 1000;
    const now = () => t;
    const fetch = vi.fn(async () => {
      t = 1150;
      return new Response(null, { status: 200 });
    });
    const result = await probeRoute('https://x.dev/a', '/a', { fetch, now });
    expect(result).toEqual({ route: '/a', status: 200, durationMs: 150, ok: true });
  });

  it('captures a thrown fetch as status 0 not-ok', async () => {
    let t = 0;
    const now = () => (t += 10);
    const fetch = vi.fn(async () => {
      throw new Error('network');
    });
    const result = await probeRoute('https://x.dev/a', '/a', { fetch, now });
    expect(result).toMatchObject({ route: '/a', status: 0, ok: false });
  });
});

describe('probeAll', () => {
  it('probes every configured route', async () => {
    const now = (() => {
      let t = 0;
      return () => (t += 5);
    })();
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    const results = await probeAll(
      { baseUrl: 'https://x.dev', routes: ['/a', '/b'] },
      { fetch, now },
    );
    expect(results.map((r) => r.route)).toEqual(['/a', '/b']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
