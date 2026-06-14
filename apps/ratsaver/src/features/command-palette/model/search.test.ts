import { describe, expect, it } from 'vitest';
import type { Plan } from '@/entities/plan';
import { searchPlans } from './search';

const base: Plan = {
  id: 'p0',
  carrier: '헬로모바일',
  network: 'KT',
  tech: 'LTE',
  mvno: true,
  name: '헬로 15GB 평생',
  dataGb: 15,
  dataUnlimited: false,
  throttleKbps: 1000,
  callUnlimited: true,
  callMinutes: null,
  smsUnlimited: true,
  smsCount: null,
  monthlyPrice: 9900,
  regularPrice: 9900,
  promoMonths: 0,
  contract: 'none',
  signupType: 'online',
  giftCount: 0,
  notes: null,
  lastVerifiedAt: '2026-06-01',
};

const make = (over: Partial<Plan>): Plan => ({ ...base, ...over });

describe('searchPlans', () => {
  it('빈/공백 입력은 빈 배열', () => {
    expect(searchPlans([base], '')).toEqual([]);
    expect(searchPlans([base], '   ')).toEqual([]);
  });

  it('요금제명으로 매칭', () => {
    const plans = [base, make({ id: 'p1', name: '다른 요금제' })];
    const res = searchPlans(plans, '15GB');
    expect(res).toHaveLength(1);
    expect(res[0]?.id).toBe('p0');
  });

  it('통신사명으로 매칭(공백 무시)', () => {
    const res = searchPlans([base], '헬로 모바일');
    expect(res).toHaveLength(1);
  });

  it('name 매칭을 carrier-only 매칭보다 우선', () => {
    const nameHit = make({ id: 'name', name: 'zeta 플랜', carrier: 'X', monthlyPrice: 50000 });
    const carrierHit = make({ id: 'carrier', name: '플랜', carrier: 'zeta', monthlyPrice: 1000 });
    const res = searchPlans([carrierHit, nameHit], 'zeta');
    expect(res[0]?.id).toBe('name');
  });

  it('동일 rank는 월요금 오름차순', () => {
    const cheap = make({ id: 'cheap', name: '알뜰 A', monthlyPrice: 3000 });
    const pricey = make({ id: 'pricey', name: '알뜰 B', monthlyPrice: 30000 });
    const res = searchPlans([pricey, cheap], '알뜰');
    expect(res.map((p) => p.id)).toEqual(['cheap', 'pricey']);
  });

  it('limit 상한 적용', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      make({ id: `m${i}`, name: `테스트 ${i}` }),
    );
    expect(searchPlans(many, '테스트', 8)).toHaveLength(8);
  });
});
