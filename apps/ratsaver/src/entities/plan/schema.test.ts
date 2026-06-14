import { describe, it, expect } from 'vitest';
import { parsePlan, parsePlanList, planSchema } from './schema';
import type { Plan } from './types';

const valid: Plan = {
  id: 'sample-15g',
  carrier: '헬로모바일',
  network: 'KT',
  tech: '5G',
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
  notes: null,
  lastVerifiedAt: '2026-06-01',
};

describe('planSchema', () => {
  it('parses a valid plan', () => {
    expect(parsePlan(valid)).toEqual(valid);
  });

  it('rejects invalid network', () => {
    expect(() => parsePlan({ ...valid, network: 'KTF' })).toThrow();
  });

  it('rejects malformed lastVerifiedAt', () => {
    expect(() => parsePlan({ ...valid, lastVerifiedAt: '2026/06/01' })).toThrow();
    expect(() => parsePlan({ ...valid, lastVerifiedAt: '2026-06-01T00:00:00Z' })).toThrow();
  });

  it('rejects negative price', () => {
    expect(() => parsePlan({ ...valid, monthlyPrice: -1 })).toThrow();
  });

  it('allows null data for unlimited plans', () => {
    const unlimited = { ...valid, dataGb: null, dataUnlimited: true, throttleKbps: null };
    expect(parsePlan(unlimited)).toEqual(unlimited);
  });

  it('is safe-parseable for boundary checks', () => {
    expect(planSchema.safeParse(valid).success).toBe(true);
    expect(planSchema.safeParse({ ...valid, contract: 'lifetime' }).success).toBe(false);
  });
});

describe('parsePlanList', () => {
  it('parses an array of plans', () => {
    expect(parsePlanList([valid, valid])).toHaveLength(2);
  });
  it('throws on a bad element', () => {
    expect(() => parsePlanList([valid, { ...valid, tech: '6G' }])).toThrow();
  });
});
