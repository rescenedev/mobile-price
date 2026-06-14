import { describe, it, expect } from 'vitest';
import type { Plan } from '@/entities/plan';
import { buildSeedSql } from './seed-sql';

const mk = (over: Partial<Plan>): Plan => ({
  id: 'x',
  carrier: "오'브라이언", // 작은따옴표 이스케이프 검증
  network: 'KT',
  tech: 'LTE',
  mvno: true,
  name: 'n',
  dataGb: null,
  dataUnlimited: true,
  throttleKbps: null,
  callUnlimited: true,
  callMinutes: null,
  smsUnlimited: true,
  smsCount: null,
  monthlyPrice: 15000,
  regularPrice: 43600,
  promoMonths: 7,
  contract: 'none',
  signupType: 'online',
  giftCount: 0,
  notes: null,
  lastVerifiedAt: '2026-06-01',
  ...over,
});

describe('buildSeedSql', () => {
  it('emits DELETE + single multi-row INSERT', () => {
    const sql = buildSeedSql([mk({ id: 'a' }), mk({ id: 'b' })]);
    expect(sql).toContain('DELETE FROM plans;');
    expect((sql.match(/INSERT INTO plans/g) ?? []).length).toBe(1);
    expect(sql.trim().endsWith(';')).toBe(true);
  });

  it('escapes single quotes in string literals', () => {
    const sql = buildSeedSql([mk({ id: 'a' })]);
    expect(sql).toContain("'오''브라이언'");
  });

  it('maps null/boolean correctly', () => {
    const sql = buildSeedSql([mk({ id: 'a' })]);
    // dataGb null, mvno true(1), dataUnlimited true(1), callMinutes null
    expect(sql).toContain("'a', '오''브라이언', 'KT', 'LTE', 1, 'n', NULL, 1, NULL, 1, NULL");
  });
});
