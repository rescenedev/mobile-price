import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Drizzle D1(SQLite) 스키마 — plan 단일 출처.
 * entities/plan 의 `Plan` 18필드와 1:1 매핑(boolean→integer mode:boolean, GB→real, 나머지 nullable 반영).
 * 읽기 100%·쓰기 0(무인증·시드 데이터). 검증일은 ISO date 문자열로 저장(date-fns 포맷).
 */
export const plans = sqliteTable('plans', {
  id: text('id').primaryKey(),
  carrier: text('carrier').notNull(),
  network: text('network').notNull(), // 'SKT' | 'KT' | 'LGU'
  tech: text('tech').notNull(), // 'LTE' | '5G'
  mvno: integer('mvno', { mode: 'boolean' }).notNull(),
  name: text('name').notNull(),
  dataGb: real('data_gb'), // null = 무제한
  dataUnlimited: integer('data_unlimited', { mode: 'boolean' }).notNull(),
  throttleKbps: integer('throttle_kbps'), // null = 차단/추가과금
  callUnlimited: integer('call_unlimited', { mode: 'boolean' }).notNull(),
  callMinutes: integer('call_minutes'), // null = 무제한
  smsUnlimited: integer('sms_unlimited', { mode: 'boolean' }).notNull(),
  smsCount: integer('sms_count'), // null = 무제한
  monthlyPrice: integer('monthly_price').notNull(),
  regularPrice: integer('regular_price').notNull(),
  promoMonths: integer('promo_months').notNull(),
  contract: text('contract').notNull(), // 'none' | '12m' | '24m'
  signupType: text('signup_type').notNull(), // 'online' | 'offline' | 'both'
  giftCount: integer('gift_count').notNull(),
  notes: text('notes'),
  lastVerifiedAt: text('last_verified_at').notNull(), // ISO date 'YYYY-MM-DD'
});

export type TPlanRow = typeof plans.$inferSelect;
export type TPlanInsert = typeof plans.$inferInsert;
