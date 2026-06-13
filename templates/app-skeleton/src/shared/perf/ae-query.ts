import 'server-only';
import { trackFetch } from './instrument';
import type { IPerfSink } from './types';

/**
 * Analytics Engine SQL API 클라이언트.
 *
 * AE는 바인딩으로 쓰기(writeDataPoint)만 가능하고, 읽기/집계는 별도 SQL API
 * (https://api.cloudflare.com/client/v4/accounts/{account_id}/analytics_engine/sql)를 통해
 * 계정 API 토큰으로만 가능하다. 토큰/계정ID가 없으면 'unconfigured'를 반환한다(graceful).
 *
 * // FOLLOW-UP: 아래 3개 시크릿이 필요하다(CF 계정 연결 후 주입):
 * //   - CF_ACCOUNT_ID          : Cloudflare 계정 ID
 * //   - CF_AE_API_TOKEN        : "Account Analytics" 읽기 권한 API 토큰
 * //   - PERF_DATASET           : AE 데이터셋 이름(wrangler.toml의 dataset, 기본 app_skeleton_perf)
 * //   wrangler secret put CF_AE_API_TOKEN  /  .dev.vars 로 주입. 토큰은 NEXT_PUBLIC_ 금지(서버 전용).
 */

export interface IAeConfig {
  accountId: string;
  apiToken: string;
  dataset: string;
}

export interface IRouteStat {
  route: string;
  count: number;
  p50: number;
  p95: number;
  p99: number;
  hitRate: number; // 0..1
}

export type TAeQueryResult =
  | { status: 'ok'; rows: IRouteStat[] }
  | { status: 'unconfigured' }
  | { status: 'error'; message: string };

/** env에서 AE SQL 설정을 읽는다. 누락 시 null(→ unconfigured). */
export const readAeConfig = (
  env: Record<string, string | undefined>,
): IAeConfig | null => {
  const accountId = env.CF_ACCOUNT_ID;
  const apiToken = env.CF_AE_API_TOKEN;
  const dataset = env.PERF_DATASET ?? 'app_skeleton_perf';
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken, dataset };
};

interface IAeSqlResponse {
  data?: Array<Record<string, unknown>>;
}

const toNum = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * 라우트별 p50/p95/p99 + 캐시 히트율을 집계한다.
 * sink/route 인자로 trackFetch 계측을 통과시킨다(Hard Threshold ⑤).
 */
export const queryRouteStats = async (
  config: IAeConfig | null,
  sink: IPerfSink,
): Promise<TAeQueryResult> => {
  if (config === null) return { status: 'unconfigured' };

  const sql = `
    SELECT
      blob1 AS route,
      COUNT() AS count,
      quantileWeighted(0.5, double1, _sample_interval) AS p50,
      quantileWeighted(0.95, double1, _sample_interval) AS p95,
      quantileWeighted(0.99, double1, _sample_interval) AS p99,
      SUM(IF(blob4 = 'hit', _sample_interval, 0)) / SUM(_sample_interval) AS hit_rate
    FROM ${config.dataset}
    WHERE timestamp > NOW() - INTERVAL '24' HOUR
    GROUP BY route
    ORDER BY count DESC
    LIMIT 50
  `;

  const url = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/analytics_engine/sql`;

  try {
    const response = await trackFetch(
      sink,
      { route: '/perf:ae-sql', method: 'POST', cache: 'none' },
      () =>
        fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiToken}`,
            'Content-Type': 'text/plain',
          },
          body: sql,
        }),
    );

    if (!response.ok) {
      return { status: 'error', message: `AE SQL ${response.status}` };
    }

    const json = (await response.json()) as IAeSqlResponse;
    const rows: IRouteStat[] = (json.data ?? []).map((r) => ({
      route: String(r.route ?? ''),
      count: toNum(r.count),
      p50: toNum(r.p50),
      p95: toNum(r.p95),
      p99: toNum(r.p99),
      hitRate: toNum(r.hit_rate),
    }));
    return { status: 'ok', rows };
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'unknown error' };
  }
};
