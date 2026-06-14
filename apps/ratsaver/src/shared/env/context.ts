import 'server-only';
import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * 서버 런타임 컨텍스트 단일 진입점 (Cloudflare Pages / next-on-pages).
 *
 * 마이그레이션 노트: 과거 @opennextjs/cloudflare의 getCloudflareContext()를 썼으나
 * Cloudflare Pages(@cloudflare/next-on-pages)로 이전하면서 getRequestContext()로 교체했다.
 * 두 API의 반환 shape({ env, ctx })가 동일하므로 이 단일 shim으로 흡수한다.
 *
 * - env: CloudflareEnv 바인딩(D1/KV/AE 등). 즉시 createEnvAccessor로 감싼다(직접 접근 0, Hard Threshold ②).
 * - ctx: ExecutionContext(waitUntil). 엣지 응답 캐시(withEdgeCache)의 백그라운드 적재에 사용.
 *
 * next-on-pages는 바인딩을 쓰는 라우트에 `export const runtime = 'edge'`를 요구한다.
 */
export interface IServerContext {
  readonly env: CloudflareEnv;
  readonly ctx: ExecutionContext;
}

export const getServerContext = (): IServerContext => {
  const { env, ctx } = getRequestContext();
  return { env, ctx };
};
