import { getCloudflareContext } from '@opennextjs/cloudflare';
import { createEnvAccessor } from '@/shared/env';
import { createAnalyticsEngineSink } from '@/shared/perf/sink';
import { readAeConfig, queryRouteStats, type IRouteStat } from '@/shared/perf/ae-query';

export const runtime = 'edge';
// 관측 데이터는 요청 시점 기준 — 캐시하지 않는다.
export const dynamic = 'force-dynamic';

const fmtMs = (n: number): string => `${Math.round(n)}ms`;
const fmtPct = (n: number): string => `${(n * 100).toFixed(0)}%`;

function StatTable({ rows }: { rows: IRouteStat[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">아직 수집된 샘플이 없습니다.</p>;
  }
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-gray-600">
          <th className="py-2 pr-4">Route</th>
          <th className="py-2 pr-4 text-right">Count</th>
          <th className="py-2 pr-4 text-right">p50</th>
          <th className="py-2 pr-4 text-right">p95</th>
          <th className="py-2 pr-4 text-right">p99</th>
          <th className="py-2 text-right">Hit rate</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.route} className="border-b last:border-0">
            <td className="py-2 pr-4 font-mono">{r.route}</td>
            <td className="py-2 pr-4 text-right">{r.count}</td>
            <td className="py-2 pr-4 text-right">{fmtMs(r.p50)}</td>
            <td className="py-2 pr-4 text-right">{fmtMs(r.p95)}</td>
            <td className="py-2 pr-4 text-right">{fmtMs(r.p99)}</td>
            <td className="py-2 text-right">{fmtPct(r.hitRate)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Unconfigured() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">관측 미구성</p>
      <p className="mt-1">
        Analytics Engine SQL API 자격증명이 없어 집계를 불러올 수 없습니다. 다음 시크릿을 주입하세요:
      </p>
      <ul className="mt-2 list-inside list-disc font-mono">
        <li>CF_ACCOUNT_ID</li>
        <li>CF_AE_API_TOKEN (Account Analytics 읽기 권한)</li>
        <li>PERF_DATASET (선택, 기본 app_skeleton_perf)</li>
      </ul>
      <p className="mt-2">
        주입:{' '}
        <code className="font-mono">wrangler secret put CF_AE_API_TOKEN</code> · 로컬{' '}
        <code className="font-mono">.dev.vars</code>. 비콘 쓰기(/api/vitals)는 자격증명 없이도 동작합니다.
      </p>
    </div>
  );
}

export default async function PerfDashboardPage() {
  const { env } = getCloudflareContext();
  const accessor = createEnvAccessor(env as CloudflareEnv);
  const sink = createAnalyticsEngineSink(accessor.get('PERF'));

  const config = readAeConfig(env as unknown as Record<string, string | undefined>);
  const result = await queryRouteStats(config, sink);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold">성능 관측 대시보드</h1>
      <p className="mt-1 text-sm text-gray-500">
        라우트별 레이턴시 분위수(p50/p95/p99)와 캐시 히트율 — 최근 24시간.
      </p>
      <div className="mt-6">
        {result.status === 'unconfigured' && <Unconfigured />}
        {result.status === 'error' && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            집계 조회 실패: {result.message}
          </div>
        )}
        {result.status === 'ok' && <StatTable rows={result.rows} />}
      </div>
    </main>
  );
}
