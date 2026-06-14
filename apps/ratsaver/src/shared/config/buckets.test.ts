import { describe, it, expect } from 'vitest';
import {
  savingBucket,
  priceBucket,
  dataBucket,
  callBucket,
  resultCountBucket,
} from './index';

describe('AE 파라미터 버킷 헬퍼(절대값 미전송 — PII 차단)', () => {
  it('savingBucket: 절약액을 구간으로만 매핑한다', () => {
    expect(savingBucket(0)).toBe('none');
    expect(savingBucket(3000)).toBe('under_5k');
    expect(savingBucket(15000)).toBe('5k_15k');
    expect(savingBucket(20000)).toBe('over_15k');
  });

  it('priceBucket: 가격을 구간으로만 매핑한다', () => {
    expect(priceBucket(5000)).toBe('under_10k');
    expect(priceBucket(20000)).toBe('10k_25k');
    expect(priceBucket(40000)).toBe('25k_40k');
    expect(priceBucket(50000)).toBe('over_40k');
  });

  it('dataBucket: 무제한·구간을 매핑한다', () => {
    expect(dataBucket(0, true)).toBe('unlimited');
    expect(dataBucket(1)).toBe('under_3g');
    expect(dataBucket(7)).toBe('3g_15g');
    expect(dataBucket(50)).toBe('15g_70g');
    expect(dataBucket(100)).toBe('over_70g');
  });

  it('callBucket: 무제한·구간을 매핑한다', () => {
    expect(callBucket(0, true)).toBe('unlimited');
    expect(callBucket(50)).toBe('under_100');
    expect(callBucket(200)).toBe('100_300');
    expect(callBucket(500)).toBe('over_300');
  });

  it('resultCountBucket: 결과 수를 구간으로만 매핑한다', () => {
    expect(resultCountBucket(0)).toBe('empty');
    expect(resultCountBucket(5)).toBe('1_10');
    expect(resultCountBucket(30)).toBe('11_50');
    expect(resultCountBucket(120)).toBe('over_50');
  });
});
