/**
 * 프로버 순수 로직 — 타이밍/집계. fetch/AE I/O와 분리되어 테스트 가능.
 */

export interface IProbeResult {
  route: string;
  status: number;
  durationMs: number;
  ok: boolean;
}

export interface IProberConfig {
  baseUrl: string;
  routes: string[];
}

/** "https://x.dev/" + "/api/hello" → "https://x.dev/api/hello" (슬래시 중복 제거). */
export const joinUrl = (baseUrl: string, route: string): string => {
  const base = baseUrl.replace(/\/+$/, '');
  const path = route.startsWith('/') ? route : `/${route}`;
  return `${base}${path}`;
};

/** env에서 BASE_URL + 콤마구분 ROUTES를 파싱한다. 누락 시 null. */
export const parseProberConfig = (
  env: Record<string, string | undefined>,
): IProberConfig | null => {
  const baseUrl = env.BASE_URL;
  if (!baseUrl) return null;
  const routes = (env.ROUTES ?? '/')
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);
  if (routes.length === 0) return null;
  return { baseUrl, routes };
};

/** 단일 라우트를 시간 측정하며 호출한다. 시계/페처 주입으로 테스트 가능. */
export const probeRoute = async (
  url: string,
  route: string,
  deps: { fetch: (input: string) => Promise<Response>; now: () => number },
): Promise<IProbeResult> => {
  const start = deps.now();
  try {
    const response = await deps.fetch(url);
    return {
      route,
      status: response.status,
      durationMs: Math.round(deps.now() - start),
      ok: response.ok,
    };
  } catch {
    return { route, status: 0, durationMs: Math.round(deps.now() - start), ok: false };
  }
};

/** 설정의 모든 라우트를 순차 프로빙한다. */
export const probeAll = async (
  config: IProberConfig,
  deps: { fetch: (input: string) => Promise<Response>; now: () => number },
): Promise<IProbeResult[]> => {
  const results: IProbeResult[] = [];
  for (const route of config.routes) {
    results.push(await probeRoute(joinUrl(config.baseUrl, route), route, deps));
  }
  return results;
};
