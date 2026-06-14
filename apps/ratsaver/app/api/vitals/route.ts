import { getServerContext } from '@/shared/env/context';
import { createEnvAccessor } from '@/shared/env';
import { createAnalyticsEngineSink } from '@/shared/perf/sink';
import { createAnalyticsEngineVitalsSink } from '@/shared/perf/vitals-sink';
import { trackFetch } from '@/shared/perf/instrument';
import { vitalsPayloadSchema } from '@/shared/perf/vitals-schema';

// Cloudflare Pages(next-on-pages)는 바인딩(PERF) 사용 라우트에 edge runtime을 요구한다.
// 비콘 수집기 — rendering-matrix 계약과 1:1 정합을 위해 명시 선언(다른 API 라우트와 동일).
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ROUTE = '/api/vitals';

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

    const parsed = vitalsPayloadSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json({ error: 'invalid payload' }, { status: 400 });
    }

    const vitalsSink = createAnalyticsEngineVitalsSink(perf);
    vitalsSink.record(parsed.data);

    return new Response(null, { status: 204 });
  });
}
