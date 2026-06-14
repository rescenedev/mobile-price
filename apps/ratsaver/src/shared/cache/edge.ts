import { trackFetch } from '@/shared/perf/instrument';
import type { IPerfSink } from '@/shared/perf/types';
import { CACHE_VERSION } from './keys';

/**
 * Cloudflare Cache API(엣지 응답 캐시) 계층.
 *
 * 50ms 목표의 핵심: 웜 GET은 colo 엣지 캐시에서 즉시 반환되어 KV 읽기·D1·JSON 직렬화를
 * 전부 건너뛴다 → 서버 처리시간 한 자릿수 ms. 종단 지연은 사실상 PoP까지의 RTT만 남는다.
 *
 * - hit  → Worker 로직 미실행, `Server-Timing: app;dur≈0`, `x-edge-cache: HIT`
 * - miss → compute() 실행 + 서버 처리시간 측정(Server-Timing) + colo 캐시에 적재(waitUntil)
 *
 * KV read-through(`cachedJson`)는 compute() 내부에 그대로 유지되어 콜드 경로의 D1 보호와
 * trackFetch 계측(Hard Threshold ④⑤)을 보존한다. 본 계층은 그 위의 엣지 캐시다.
 *
 * 캐시 키 = 정규화된 요청 URL(쿼리 포함) → 필터 조합별로 개별 캐시된다.
 */
export interface IEdgeCacheOptions {
  readonly req: Request;
  readonly ctx: ExecutionContext;
  readonly sink: IPerfSink;
  readonly route: string;
  readonly ttlSec: number;
  readonly compute: () => Promise<Response>;
}

const edgeCache = (): Cache | null => {
  const c = (globalThis as { caches?: { default?: Cache } }).caches;
  return c?.default ?? null;
};

// 엣지 캐시 키에 캐시 버전을 포함 → 버전 범프 시 KV와 함께 엣지도 일괄 무효화.
const cacheKeyOf = (req: Request): Request => {
  const u = new URL(req.url);
  u.searchParams.set('__cv', CACHE_VERSION);
  return new Request(u.toString(), { method: 'GET' });
};

const nowMs = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

export const withEdgeCache = async (opts: IEdgeCacheOptions): Promise<Response> => {
  const { req, ctx, sink, route, ttlSec, compute } = opts;
  const cache = edgeCache();
  const key = cacheKeyOf(req);

  if (cache) {
    const hitStart = nowMs();
    const hit = await cache.match(key);
    if (hit) {
      const hitDur = Math.round(nowMs() - hitStart);
      // 엣지 히트도 perf 샘플로 기록(계측 단일 통로 유지).
      await trackFetch(sink, { route, method: 'GET', cache: 'hit' }, async () => hit.clone());
      const res = new Response(hit.body, hit);
      res.headers.set('x-edge-cache', 'HIT');
      res.headers.set('Server-Timing', `app;dur=${hitDur}`); // HIT 실제 엣지 서브 시간
      return res;
    }
  }

  const start = nowMs();
  const computed = await compute();
  const durMs = Math.round(nowMs() - start);

  const out = new Response(computed.body, computed);
  out.headers.set('Server-Timing', `app;dur=${durMs}`);
  out.headers.set('x-edge-cache', 'MISS');
  // 브라우저: max-age=60(반복요청 0ms) · CF 엣지: s-maxage/CDN-Cache-Control로 colo 캐시 + SWR 무중단 갱신.
  // CDN-Cache-Control은 Cloudflare 엣지 전용 TTL 지시자(브라우저 Cache-Control과 분리 제어).
  out.headers.set(
    'Cache-Control',
    `public, max-age=60, s-maxage=${ttlSec}, stale-while-revalidate=300`,
  );
  out.headers.set(
    'CDN-Cache-Control',
    `public, max-age=${ttlSec}, stale-while-revalidate=300`,
  );

  if (cache && computed.status === 200) {
    const put = cache.put(key, out.clone());
    if (ctx?.waitUntil) ctx.waitUntil(put);
    else await put;
  }
  return out;
};
