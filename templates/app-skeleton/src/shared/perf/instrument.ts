import type { IPerfSink, IPerfSample, ITrackOptions, TCacheOutcome } from './types';

const defaultNow = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

const safeRecord = (sink: IPerfSink, sample: IPerfSample): void => {
  try {
    sink.record(sample);
  } catch {
    // 계측 실패가 요청을 깨면 안 된다 — 조용히 무시
  }
};

/**
 * 모든 API/데이터 호출을 감싸 perf 샘플을 기록한다.
 * Hard Threshold ④⑤: 데이터 접근은 반드시 이 래퍼를 통한다.
 */
export const trackFetch = async (
  sink: IPerfSink,
  options: ITrackOptions,
  operation: () => Promise<Response>,
): Promise<Response> => {
  const now = options.now ?? defaultNow;
  const cache: TCacheOutcome = options.cache ?? 'none';
  const start = now();
  try {
    const response = await operation();
    safeRecord(sink, {
      route: options.route,
      method: options.method,
      durationMs: Math.round(now() - start),
      status: response.status,
      cache,
      at: Date.now(),
    });
    return response;
  } catch (error) {
    safeRecord(sink, {
      route: options.route,
      method: options.method,
      durationMs: Math.round(now() - start),
      status: 500,
      cache,
      at: Date.now(),
    });
    throw error;
  }
};
