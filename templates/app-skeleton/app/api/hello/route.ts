import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createEnvAccessor } from '@/shared/env';
import { createAnalyticsEngineSink } from '@/shared/perf/sink';
import { trackFetch } from '@/shared/perf/instrument';

export async function GET(request: Request) {
  const { env } = getCloudflareContext();
  const accessor = createEnvAccessor(env as CloudflareEnv);
  const sink = createAnalyticsEngineSink(accessor.get('PERF'));

  return trackFetch(sink, { route: '/api/hello', method: 'GET', cache: 'none' }, async () => {
    return Response.json({ message: 'hello from edge', at: Date.now() });
  });
}
