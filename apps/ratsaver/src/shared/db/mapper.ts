import type { Plan } from '@/entities/plan';
import { parsePlan } from '@/entities/plan';
import type { TPlanRow, TPlanInsert } from './schema';

/**
 * D1 row → 도메인 Plan. 시스템 경계이므로 Zod(parsePlan)로 검증한다.
 * mode:'boolean' 컬럼은 Drizzle가 이미 boolean으로 변환해 준다.
 */
export const rowToPlan = (row: TPlanRow): Plan =>
  parsePlan({
    id: row.id,
    carrier: row.carrier,
    network: row.network,
    tech: row.tech,
    mvno: row.mvno,
    name: row.name,
    dataGb: row.dataGb,
    dataUnlimited: row.dataUnlimited,
    throttleKbps: row.throttleKbps,
    callUnlimited: row.callUnlimited,
    callMinutes: row.callMinutes,
    smsUnlimited: row.smsUnlimited,
    smsCount: row.smsCount,
    monthlyPrice: row.monthlyPrice,
    regularPrice: row.regularPrice,
    promoMonths: row.promoMonths,
    contract: row.contract,
    signupType: row.signupType,
    giftCount: row.giftCount,
    notes: row.notes,
    lastVerifiedAt: row.lastVerifiedAt,
  });

/** 도메인 Plan → D1 insert row(시드 생성용). */
export const planToInsert = (plan: Plan): TPlanInsert => ({ ...plan });
