import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createEnvAccessor } from '@/shared/env';
import { createAnalyticsEngineSink } from '@/shared/perf/sink';
import { createAnalyticsEngineVitalsSink } from '@/shared/perf/vitals-sink';
import { trackFetch } from '@/shared/perf/instrument';
import { vitalsPayloadSchema } from '@/shared/perf/vitals-schema';

export const runtime = 'edge';

const ROUTE = '/api/vitals';

export async function POST(request: Request): Promise<Response> {
  const { env } = getCloudflareContext();
  const accessor = createEnvAccessor(env as CloudflareEnv);
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
