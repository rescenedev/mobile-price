import type { Plan } from '@/entities/plan';

/** SQL 리터럴 이스케이프(문자열은 작은따옴표 이중화, null·boolean·number 매핑). */
const sqlLit = (v: string | number | boolean | null): string => {
  if (v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  return `'${v.replace(/'/g, "''")}'`;
};

/** plan 1건 → INSERT VALUES 튜플. schema.ts 컬럼 순서와 1:1. */
const planToValues = (p: Plan): string => {
  const cols: Array<string | number | boolean | null> = [
    p.id,
    p.carrier,
    p.network,
    p.tech,
    p.mvno,
    p.name,
    p.dataGb,
    p.dataUnlimited,
    p.throttleKbps,
    p.callUnlimited,
    p.callMinutes,
    p.smsUnlimited,
    p.smsCount,
    p.monthlyPrice,
    p.regularPrice,
    p.promoMonths,
    p.contract,
    p.signupType,
    p.giftCount,
    p.notes,
    p.lastVerifiedAt,
  ];
  return `(${cols.map(sqlLit).join(', ')})`;
};

const COLUMNS = [
  'id',
  'carrier',
  'network',
  'tech',
  'mvno',
  'name',
  'data_gb',
  'data_unlimited',
  'throttle_kbps',
  'call_unlimited',
  'call_minutes',
  'sms_unlimited',
  'sms_count',
  'monthly_price',
  'regular_price',
  'promo_months',
  'contract',
  'signup_type',
  'gift_count',
  'notes',
  'last_verified_at',
].join(', ');

/**
 * 시드 plan 목록 → 멱등 시드 SQL.
 * `DELETE FROM plans;` 후 단일 multi-row INSERT(N+1 없는 일괄 적재).
 * `wrangler d1 execute <DB> --file=src/shared/db/seed.sql`로 적용.
 */
export const buildSeedSql = (plans: readonly Plan[]): string => {
  const values = plans.map(planToValues).join(',\n');
  return [
    '-- ratsaver 시드 데이터 (자동 생성: scripts/gen-seed). 직접 편집 금지.',
    '-- 적용: wrangler d1 execute ratsaver-db --file=src/shared/db/seed.sql [--local|--remote]',
    'DELETE FROM plans;',
    `INSERT INTO plans (${COLUMNS}) VALUES`,
    `${values};`,
    '',
  ].join('\n');
};
