import { describe, it, expect } from 'vitest';
import { percentile, summarize } from './stats.mjs';

describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 50)).toBe(0);
  });

  it('returns the single value regardless of p', () => {
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 99)).toBe(42);
  });

  // 1..10: R-7 linear interpolation. p50 of 1..10 → rank 4.5 → 5.5
  it('computes p50 of 1..10 as 5.5 (linear interpolation)', () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50)).toBeCloseTo(5.5, 6);
  });

  it('computes p90 of 1..10 as 9.1', () => {
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBeCloseTo(9.1, 6);
  });

  it('p0 is min and p100 is max', () => {
    expect(percentile([5, 1, 9, 3], 0)).toBe(1);
    expect(percentile([5, 1, 9, 3], 100)).toBe(9);
  });

  it('is order-independent', () => {
    const a = percentile([10, 1, 5, 8, 3], 75);
    const b = percentile([1, 3, 5, 8, 10], 75);
    expect(a).toBe(b);
  });
});

describe('summarize', () => {
  it('returns zeros for an empty input', () => {
    expect(summarize([])).toEqual({ p50: 0, p95: 0, p99: 0, min: 0, max: 0, count: 0 });
  });

  it('summarizes a known set', () => {
    const s = summarize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(s.count).toBe(10);
    expect(s.min).toBe(1);
    expect(s.max).toBe(10);
    expect(s.p50).toBeCloseTo(5.5, 6);
    expect(s.p95).toBeCloseTo(9.55, 6);
    expect(s.p99).toBeCloseTo(9.91, 6);
  });
});
