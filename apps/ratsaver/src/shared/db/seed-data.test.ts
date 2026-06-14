import { describe, it, expect } from 'vitest';
import { seedPlans } from './seed-data';
import { planSchema } from '@/entities/plan';

/**
 * 시드 분포 계약 — moyo 실데이터 기준(합성 균등 가정 제거).
 * 실데이터(2026-06-01 스크랩): 253건, 망 KT 우세(KT>LGU>SKT), MVNO ~87%,
 * 프로모 개월 다양(4/6/7/10/12/18/24). 검증은 데이터 형태에 맞춰 느슨하게,
 * 단 진짜 불변식(스키마 유효성·id 유일성·정직성 wedge)은 엄격하게 유지한다.
 */
describe('seedPlans distribution contract (moyo real data)', () => {
  it('has a realistic catalog size (100~300 plans)', () => {
    expect(seedPlans.length).toBeGreaterThanOrEqual(100);
    expect(seedPlans.length).toBeLessThanOrEqual(300);
  });

  it('every plan passes boundary schema', () => {
    for (const p of seedPlans) {
      expect(planSchema.safeParse(p).success).toBe(true);
    }
  });

  it('has unique ids', () => {
    expect(new Set(seedPlans.map((p) => p.id)).size).toBe(seedPlans.length);
  });

  it('covers all 3 networks (each present; SKT ≥ 5% — 현실 분포, 균등 아님)', () => {
    const counts = { SKT: 0, KT: 0, LGU: 0 } as Record<string, number>;
    for (const p of seedPlans) counts[p.network] += 1;
    for (const n of ['SKT', 'KT', 'LGU']) {
      expect(counts[n]).toBeGreaterThan(0);
    }
    // SKT는 소수지만 무시할 수 없는 비중(균등 가정 제거, 최소 존재성만 보장).
    expect(counts.SKT / seedPlans.length).toBeGreaterThanOrEqual(0.05);
  });

  it('is MVNO-heavy (~87%)', () => {
    const ratio = seedPlans.filter((p) => p.mvno).length / seedPlans.length;
    expect(ratio).toBeGreaterThanOrEqual(0.7);
    expect(ratio).toBeLessThanOrEqual(0.95);
  });

  it('has promo plans with an honest regular-price bump (정직성 wedge)', () => {
    const promo = seedPlans.filter((p) => p.promoMonths > 0);
    // 프로모 플랜이 실제로 존재한다(데이터가 합성이 아님을 보증).
    expect(promo.length).toBeGreaterThan(0);
    // 프로모면 반드시 정가 > 현재가(사용자에게 정직한 정가 공시).
    for (const p of promo) expect(p.regularPrice).toBeGreaterThan(p.monthlyPrice);
  });

  it('uses varied promo periods (합성 7개월 고정 아님)', () => {
    const months = new Set(seedPlans.filter((p) => p.promoMonths > 0).map((p) => p.promoMonths));
    expect(months.size).toBeGreaterThanOrEqual(2);
  });

  it('keeps regularPrice == monthlyPrice when no promo', () => {
    for (const p of seedPlans.filter((x) => x.promoMonths === 0)) {
      expect(p.regularPrice).toBe(p.monthlyPrice);
    }
  });

  it('has a consistent verification date and a real low-price entry', () => {
    expect(seedPlans.every((p) => p.lastVerifiedAt === '2026-06-01')).toBe(true);
    const min = Math.min(...seedPlans.map((p) => p.monthlyPrice));
    // 실데이터 최저가는 합성 기본가(8,800원~)보다 훨씬 낮다.
    expect(min).toBeLessThan(8000);
  });
});
