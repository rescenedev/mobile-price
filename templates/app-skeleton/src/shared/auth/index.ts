import 'server-only';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { createDb } from '@/shared/db';

/**
 * better-auth 인스턴스 팩토리 — D1/Drizzle 어댑터 + httpOnly 쿠키 세션.
 *
 * 보안 계약(Hard Threshold ③):
 *  - 세션은 httpOnly + Secure + SameSite=Lax 쿠키로만 전달(클라이언트 스토리지 금지).
 *  - 시크릿은 env(BETTER_AUTH_SECRET)에서만 — NEXT_PUBLIC_ 금지, 서버 전용.
 *  - DB 접근은 createDb(d1)로만(@/shared/env의 createEnvAccessor(env).get('DB')).
 *
 * // FOLLOW-UP: 실행/배포에 다음이 필요하다(CF 계정 연결 후):
 * //   - BETTER_AUTH_SECRET : 랜덤 32+ 바이트. `openssl rand -base64 32` → wrangler secret put BETTER_AUTH_SECRET
 * //                          로컬은 .dev.vars. 미설정 시 createAuth가 명시적 에러를 던진다(아래).
 * //   - BETTER_AUTH_URL    : 배포 베이스 URL(예: https://app.example.com). 콜백/쿠키 도메인에 사용.
 * //   - 인증 테이블 마이그레이션: `npx @better-auth/cli generate` 로 user/session/account/verification
 * //                          스키마를 생성한 뒤 `wrangler d1 migrations apply DB` 로 적용.
 */

export interface IAuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
}

const isProd = (): boolean => process.env.NODE_ENV === 'production';

export const createAuth = (env: IAuthEnv) => {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret) {
    // graceful unconfigured: 명시적 에러로 조용한 보안 실패를 막는다.
    throw new Error(
      'BETTER_AUTH_SECRET is not configured. Set it via `wrangler secret put BETTER_AUTH_SECRET` (or .dev.vars).',
    );
  }

  const db = createDb(env.DB);

  return betterAuth({
    secret,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: 'sqlite' }),
    emailAndPassword: { enabled: true },
    advanced: {
      // httpOnly + Secure + SameSite=Lax 강제(Hard Threshold ③).
      defaultCookieAttributes: {
        httpOnly: true,
        secure: isProd(),
        sameSite: 'lax',
      },
    },
    // next.js 쿠키 헬퍼 — Server Action/Route Handler에서 Set-Cookie를 자동 처리.
    plugins: [nextCookies()],
  });
};

export type TAuth = ReturnType<typeof createAuth>;

/**
 * 요청에서 현재 세션을 조회한다. 미인증이면 null.
 * 호출자는 createEnvAccessor(env)로 얻은 바인딩을 IAuthEnv로 전달한다.
 */
export const getSession = async (auth: TAuth, request: Request) => {
  return auth.api.getSession({ headers: request.headers });
};
