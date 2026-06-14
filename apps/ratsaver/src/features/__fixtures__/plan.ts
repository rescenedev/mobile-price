import type { Plan } from '@/entities/plan';

/** 테스트용 Plan 팩토리 — 기본값에 override 병합(immutable). */
export const makePlan = (override: Partial<Plan> = {}): Plan => ({
  id: 'test-plan',
  carrier: '테스트모바일',
  network: 'KT',
  tech: 'LTE',
  mvno: true,
  name: '테스트 요금제',
  dataGb: 15,
  dataUnlimited: false,
  throttleKbps: 5000,
  callUnlimited: true,
  callMinutes: null,
  smsUnlimited: true,
  smsCount: null,
  monthlyPrice: 15300,
  regularPrice: 43000,
  promoMonths: 7,
  contract: 'none',
  signupType: 'online',
  giftCount: 0,
  notes: null,
  lastVerifiedAt: '2026-06-01',
  ...override,
});
