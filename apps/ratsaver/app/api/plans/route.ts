import 'server-only';
import { getServerContext } from '@/shared/env/context';
import { createEnvAccessor } from '@/shared/env';
import { createAnalyticsEngineSink } from '@/shared/perf/sink';
import { getDb, createPlanRepository, applyCriteria, parseCriteria } from '@/shared/db';
import { getCachedPlans, withEdgeCache, CACHE_TTL_SEC } from '@/shared/cache';

// rendering-matrix: SSR-edge + 엣지 응답 캐시(Cache API) + KV read-through.
// Cloudflare Pages(next-on-pages)는 바인딩 사용 라우트에 edge runtime을 요구한다.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/plans';

/**
 * GET /api/plans — 요금제 목록 (쿼리 의존 동적).
 * 계층: ① Cache API 엣지 응답 캐시(웜=Worker 로직 스킵, 서버 ~0ms) → ② KV read-through(plans:v1:all)
 * → ③ D1 findAll. 필터는 in-memory(applyCriteria). 모든 D1 접근은 cachedJson 내부 trackFetch 계측(④⑤).
 * 응답에 Server-Timing(서버 처리 ms) 노출.
 */
export async function GET(req: Request): Promise<Response> {
  const { env, ctx } = getServerContext();
  const accessor = createEnvAccessor(env);
  const sink = createAnalyticsEngineSink(accessor.get('PERF'));

  return withEdgeCache({
    req,
    ctx,
    sink,
    route: ROUTE,
    ttlSec: CACHE_TTL_SEC,
    compute: async () => {
      const repo = createPlanRepository(getDb());
      const all = await getCachedPlans(
        { kv: accessor.get('CACHE'), sink, loadAll: () => repo.findAll() },
        ROUTE,
      );
      const params = new URL(req.url).searchParams;
      const criteria = parseCriteria(params);
      const filtered = applyCriteria(all, criteria);

      // 페이로드 축소(전송시간↓): 기본 페이지 limit. 전량은 limit 크게 지정해 opt-in.
      const total = filtered.length;
      const limit = Math.min(Math.max(Number.parseInt(params.get('limit') ?? '50', 10) || 50, 1), 300);
      const offset = Math.max(Number.parseInt(params.get('offset') ?? '0', 10) || 0, 0);
      const plans = filtered.slice(offset, offset + limit);

      return Response.json({ plans, total, limit, offset });
    },
  });
}
