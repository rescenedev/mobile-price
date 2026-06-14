import { z } from 'zod';
import type { Plan } from './types';

/** 망 enum. */
export const networkSchema = z.enum(['SKT', 'KT', 'LGU']);

/** 통신 세대 enum. */
export const techSchema = z.enum(['LTE', '5G']);

/** 약정 enum. */
export const contractSchema = z.enum(['none', '12m', '24m']);

/** 가입 형태 enum. */
export const signupTypeSchema = z.enum(['online', 'offline', 'both']);

/** ISO date(`YYYY-MM-DD`) 검증. */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'lastVerifiedAt must be YYYY-MM-DD');

/**
 * 시스템 경계(시드/DB row→도메인) 검증 스키마.
 * D1에서 읽은 raw row를 repository에서 이 스키마로 parse해 신뢰 경계를 강제한다.
 * `satisfies z.ZodType<Plan>`로 스키마와 도메인 타입의 표류(drift)를 컴파일 타임에 차단한다.
 */
export const planSchema = z.object({
  id: z.string().min(1),
  carrier: z.string().min(1),
  network: networkSchema,
  tech: techSchema,
  mvno: z.boolean(),
  name: z.string().min(1),
  dataGb: z.number().nonnegative().nullable(),
  dataUnlimited: z.boolean(),
  throttleKbps: z.number().int().positive().nullable(),
  callUnlimited: z.boolean(),
  callMinutes: z.number().int().nonnegative().nullable(),
  smsUnlimited: z.boolean(),
  smsCount: z.number().int().nonnegative().nullable(),
  monthlyPrice: z.number().int().nonnegative(),
  regularPrice: z.number().int().nonnegative(),
  promoMonths: z.number().int().nonnegative(),
  contract: contractSchema,
  signupType: signupTypeSchema,
  giftCount: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  lastVerifiedAt: isoDateSchema,
}) satisfies z.ZodType<Plan>;

/** plan 배열 스키마(목록 캐시 역직렬화 경계 검증용). */
export const planListSchema = z.array(planSchema);

/** 검증된 Plan을 생성·반환(throw on invalid). */
export const parsePlan = (input: unknown): Plan => planSchema.parse(input);

/** 검증된 Plan 배열을 반환(throw on invalid). */
export const parsePlanList = (input: unknown): Plan[] => planListSchema.parse(input);
