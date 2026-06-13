import { parseProberConfig, probeAll, type IProbeResult } from './probe';

/**
 * 프로버 cron 워커 — OpenNext 워커와 분리된 독립 Cloudflare Worker.
 * 스케줄마다 설정된 라우트를 능동 스캔하고 레이턴시 샘플을 Analytics Engine에 기록한다.
 *
 * // FOLLOW-UP: 배포에는 다음이 필요하다(CF 계정 연결 후):
 * //   - BASE_URL 변수: 프로빙 대상 배포 URL (wrangler.toml [vars] 또는 secret)
 * //   - ROUTES 변수(선택): 콤마구분 경로 목록, 기본 '/'
 * //   - PERF AE 바인딩 dataset id: OpenNext 워커와 동일 dataset을 가리키도록 설정
 */

export interface IProberEnv {
  PERF: AnalyticsEngineDataset;
  BASE_URL?: string;
  ROUTES?: string;
}

const writeSamples = (dataset: AnalyticsEngineDataset, results: IProbeResult[]): void => {
  for (const r of results) {
    dataset.writeDataPoint({
      indexes: [r.route],
      blobs: [r.route, 'GET', String(r.status), 'probe'],
      doubles: [r.durationMs],
    });
  }
};

export default {
  async scheduled(_event: ScheduledController, env: IProberEnv): Promise<void> {
    const config = parseProberConfig(env as unknown as Record<string, string | undefined>);
    if (config === null) {
      // BASE_URL 미설정 — graceful no-op (배포 전 상태)
      return;
    }
    const results = await probeAll(config, {
      fetch: (input) => fetch(input),
      now: () => Date.now(),
    });
    writeSamples(env.PERF, results);
  },
};
