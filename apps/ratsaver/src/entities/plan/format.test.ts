import { describe, it, expect } from 'vitest';
import type { Plan } from './types';
import {
  formatKrw,
  formatHonestPrice,
  formatVerifiedDate,
  formatData,
  formatThrottle,
  formatCall,
  formatSms,
} from './format';

const basePlan: Plan = {
  id: 'sample-15g',
  carrier: '헬로모바일',
  network: 'KT',
  tech: 'LTE',
  mvno: true,
  name: '15G 평생 요금제',
  dataGb: 15,
  dataUnlimited: false,
  throttleKbps: 5000,
  callUnlimited: true,
  callMinutes: null,
  smsUnlimited: true,
  smsCount: null,
  monthlyPrice: 15300,
  regularPrice: 43600,
  promoMonths: 7,
  contract: 'none',
  signupType: 'online',
  giftCount: 0,
  notes: '7개월 후 43,600원',
  lastVerifiedAt: '2026-06-01',
};

describe('formatKrw', () => {
  it('formats won with thousands separators', () => {
    expect(formatKrw(15300)).toBe('15,300원');
    expect(formatKrw(0)).toBe('0원');
  });
});

describe('formatHonestPrice', () => {
  it('shows promo + regular when promo is active (wedge: no hidden regular price)', () => {
    expect(formatHonestPrice(basePlan)).toBe('월 15,300원 (7개월 후 43,600원)');
  });

  it('shows single price when no promo (promoMonths 0)', () => {
    const lifelong: Plan = { ...basePlan, monthlyPrice: 9900, regularPrice: 9900, promoMonths: 0 };
    expect(formatHonestPrice(lifelong)).toBe('월 9,900원');
  });

  it('shows single price when regular equals monthly even if promoMonths set', () => {
    const noBump: Plan = { ...basePlan, monthlyPrice: 20000, regularPrice: 20000, promoMonths: 12 };
    expect(formatHonestPrice(noBump)).toBe('월 20,000원');
  });
});

describe('formatVerifiedDate', () => {
  it('formats ISO date via date-fns (no .split fallback)', () => {
    expect(formatVerifiedDate('2026-06-01')).toBe('2026년 6월 1일');
    expect(formatVerifiedDate('2026-12-25')).toBe('2026년 12월 25일');
  });
});

describe('formatData', () => {
  it('renders GB for finite data', () => {
    expect(formatData(basePlan)).toBe('15GB');
  });
  it('renders unlimited when flagged or dataGb null', () => {
    expect(formatData({ ...basePlan, dataUnlimited: true })).toBe('데이터 무제한');
    expect(formatData({ ...basePlan, dataGb: null, dataUnlimited: false })).toBe('데이터 무제한');
  });
});

describe('formatThrottle', () => {
  it('converts Kbps to Mbps label', () => {
    expect(formatThrottle(basePlan)).toBe('소진 후 5Mbps');
    expect(formatThrottle({ ...basePlan, throttleKbps: 3000 })).toBe('소진 후 3Mbps');
  });
  it('returns empty when no throttle', () => {
    expect(formatThrottle({ ...basePlan, throttleKbps: null })).toBe('');
  });
});

describe('formatCall / formatSms', () => {
  it('renders unlimited or count', () => {
    expect(formatCall(basePlan)).toBe('통화 무제한');
    expect(formatCall({ ...basePlan, callUnlimited: false, callMinutes: 200 })).toBe('통화 200분');
    expect(formatSms(basePlan)).toBe('문자 무제한');
    expect(formatSms({ ...basePlan, smsUnlimited: false, smsCount: 100 })).toBe('문자 100건');
  });
});
