import 'server-only';
import { getServerContext } from '@/shared/env/context';
import { createEnvAccessor } from '@/shared/env';
import { createAnalyticsEngineSink } from '@/shared/perf/sink';
import { getDb, createPlanRepository } from '@/shared/db';
import { getCachedPlans, withEdgeCache, CACHE_TTL_SEC } from '@/shared/cache';

// rendering-matrix: SSR-edge + 엣지 응답 캐시(Cache API) + KV read-through.
// Cloudflare Pages(next-on-pages)는 바인딩 사용 라우트에 edge runtime을 요구한다.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/plans/[id]';

interface IRouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/plans/[id] — 요금제 단건 (PK 조회).
 * 계층: ① Cache API 엣지 응답 캐시(웜=서버 ~0ms) → ② 단일 웜 키(plans:v1:all)에서 in-memory 도출.
 * 기존 id별 개별 KV 키(콜드미스→D1)를 폐기 → /api/plans 1회 호출로 전 id가 동일 웜 캐시 공유(콜드미스 0).
 * 응답에 Server-Timing 노출. 미존재 id는 404(엣지 미캐시). N+1 0.
 */
export async function GET(req: Request, context: IRouteContext): Promise<Response> {
  const { id } = await context.params;
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
      const plan = all.find((p) => p.id === id) ?? null;
      if (plan === null) {
        return Response.json({ error: 'plan_not_found', id }, { status: 404 });
      }
      return Response.json({ plan });
    },
  });
}
