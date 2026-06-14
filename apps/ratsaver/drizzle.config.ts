import type { Config } from 'drizzle-kit';

/**
 * `npm run db:generate`로 마이그레이션 SQL을 생성한다(스키마 변경 시).
 * dialect는 sqlite(D1). out 디렉토리에 마이그레이션이 쌓인다.
 *
 * // FOLLOW-UP: `drizzle-kit push`/원격 적용은 CF 계정 자격증명(CLOUDFLARE_ACCOUNT_ID,
 * //   CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN)이 필요하다. 마이그레이션 적용은
 * //   `wrangler d1 migrations apply <DB>`로 수행한다(토큰 없이 wrangler 로그인으로 가능).
 */
export default {
  schema: './src/shared/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
} satisfies Config;
