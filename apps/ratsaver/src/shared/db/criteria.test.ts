import { describe, it, expect } from 'vitest';
import type { Plan } from '@/entities/plan';
import { applyCriteria, parseCriteria } from './criteria';

const mk = (over: Partial<Plan>): Plan => ({
  id: 'x',
  carrier: 'c',
  network: 'KT',
  tech: 'LTE',
  mvno: true,
  name: 'n',
  dataGb: 10,
  dataUnlimited: false,
  throttleKbps: null,
  callUnlimited: true,
  callMinutes: null,
  smsUnlimited: true,
  smsCount: null,
  monthlyPrice: 15000,
  regularPrice: 15000,
  promoMonths: 0,
  contract: 'none',
  signupType: 'online',
  giftCount: 0,
  notes: null,
  lastVerifiedAt: '2026-06-01',
  ...over,
});

const plans: Plan[] = [
  mk({ id: 'a', network: 'SKT', mvno: true, monthlyPrice: 8000, dataGb: 5 }),
  mk({ id: 'b', network: 'KT', mvno: false, monthlyPrice: 55000, dataGb: null, dataUnlimited: true }),
  mk({ id: 'c', network: 'LGU', mvno: true, monthlyPrice: 22000, dataGb: 71, contract: '12m' }),
  mk({ id: 'd', network: 'KT', mvno: true, monthlyPrice: 19000, dataGb: 11 }),
];

describe('applyCriteria', () => {
  it('returns all on empty criteria (no mutation)', () => {
    const r = applyCriteria(plans, {});
    expect(r).toHaveLength(4);
    expect(r).not.toBe(plans);
  });

  it('filters by network (기본 정렬 price_asc — 싼 요금제 먼저)', () => {
    // sort 미지정 → 기본 price_asc: d(19000) < b(55000).
    expect(applyCriteria(plans, { network: 'KT' }).map((p) => p.id)).toEqual(['d', 'b']);
  });

  it('filters by mvno', () => {
    expect(applyCriteria(plans, { mvno: true }).map((p) => p.id).sort()).toEqual(['a', 'c', 'd']);
  });

  it('filters by unlimited', () => {
    expect(applyCriteria(plans, { unlimited: true }).map((p) => p.id)).toEqual(['b']);
  });

  it('filters by noContract', () => {
    expect(applyCriteria(plans, { noContract: true }).map((p) => p.id).sort()).toEqual(['a', 'b', 'd']);
  });

  it('filters by priceMax', () => {
    expect(applyCriteria(plans, { priceMax: 20000 }).map((p) => p.id).sort()).toEqual(['a', 'd']);
  });

  it('filters by dataMin (unlimited always satisfies)', () => {
    expect(applyCriteria(plans, { dataMin: 50 }).map((p) => p.id).sort()).toEqual(['b', 'c']);
  });

  it('sorts price_asc', () => {
    expect(applyCriteria(plans, { sort: 'price_asc' }).map((p) => p.monthlyPrice)).toEqual([
      8000, 19000, 22000, 55000,
    ]);
  });

  it('sorts data_desc (unlimited first)', () => {
    expect(applyCriteria(plans, { sort: 'data_desc' }).map((p) => p.id)[0]).toBe('b');
  });

  it('combines filter + sort', () => {
    const r = applyCriteria(plans, { mvno: true, sort: 'price_asc' });
    expect(r.map((p) => p.id)).toEqual(['a', 'd', 'c']);
  });
});

describe('parseCriteria', () => {
  it('parses valid params', () => {
    const sp = new URLSearchParams(
      'network=KT&mvno=true&unlimited=false&no_contract=1&price_max=20000&data_min=7&sort=price_asc',
    );
    expect(parseCriteria(sp)).toEqual({
      network: 'KT',
      mvno: true,
      unlimited: false,
      noContract: true,
      priceMax: 20000,
      dataMin: 7,
      sort: 'price_asc',
    });
  });

  it('ignores invalid values (safe fallback to undefined)', () => {
    const sp = new URLSearchParams('network=KTF&sort=weird&price_max=abc&mvno=maybe');
    expect(parseCriteria(sp)).toEqual({
      network: undefined,
      mvno: undefined,
      unlimited: undefined,
      noContract: undefined,
      priceMax: undefined,
      dataMin: undefined,
      sort: undefined,
    });
  });

  it('returns all-undefined for empty params', () => {
    expect(parseCriteria(new URLSearchParams())).toEqual({
      network: undefined,
      mvno: undefined,
      unlimited: undefined,
      noContract: undefined,
      priceMax: undefined,
      dataMin: undefined,
      sort: undefined,
    });
  });
});
