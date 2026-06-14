import { getServerContext } from '@/shared/env/context';
import { createEnvAccessor } from '@/shared/env';
import { createAnalyticsEngineSink } from '@/shared/perf/sink';
import { createAnalyticsEngineEventSink } from '@/shared/perf/event-sink';
import { trackFetch } from '@/shared/perf/instrument';
import { eventPayloadSchema } from '@/shared/perf/event-schema';

// Cloudflare Pages(next-on-pages)는 바인딩(PERF) 사용 라우트에 edge runtime을 요구한다.
// 쓰기 전용 비콘 수집 — 캐시 대상 아님.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/events';

/**
 * POST /api/events — KPI 커스텀 이벤트 비콘 수집.
 * 경계에서 Zod 검증(이벤트명 화이트리스트 + PII-free 파라미터만) 후 AE 기록.
 * 자기 자신의 처리 latency도 trackFetch로 계측(④⑤).
 */
export async function POST(request: Request): Promise<Response> {
  const { env } = getServerContext();
  const accessor = createEnvAccessor(env);
  const perf = accessor.get('PERF');
  const sink = createAnalyticsEngineSink(perf);

  return trackFetch(sink, { route: ROUTE, method: 'POST', cache: 'none' }, async () => {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return Response.json({ error: 'invalid json' }, { status: 400 });
    }

    const parsed = eventPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: 'invalid payload' }, { status: 400 });
    }

    const eventSink = createAnalyticsEngineEventSink(perf);
    eventSink.record(parsed.data);

    return new Response(null, { status: 204 });
  });
}
