import { kvGetJson, kvSetJson } from '@/shared/kv';
import { trackFetch } from '@/shared/perf/instrument';
import type { IPerfSink } from '@/shared/perf/types';

export interface ICachedJsonOptions<T> {
  kv: KVNamespace;
  key: string;
  ttlSec: number;
  sink: IPerfSink;
  route: string;
  loader: () => Promise<T>;
}

/**
 * KV 캐시 계층. hit/miss와 레이턴시를 기존 perf 계측(trackFetch)으로 자동 기록한다(Hard Threshold ④⑤).
 *
 * - KV hit  → loader 미호출, cache='hit'으로 샘플 기록 후 캐시값 반환
 * - KV miss → loader 호출, ttl과 함께 KV에 저장, cache='miss'로 샘플 기록
 * - loader 에러 → cache='miss' + status 500으로 기록되고 에러를 재전파
 *
 * loader 결과/캐시값을 임시 Response로 감싸 trackFetch를 통과시키되,
 * Response 본문을 다시 파싱하지 않고 클로저로 값을 보존한다(직렬화 왕복 없음).
 */
export const cachedJson = async <T>(opts: ICachedJsonOptions<T>): Promise<T> => {
  const { kv, key, ttlSec, sink, route, loader } = opts;

  const cached = await kvGetJson<T>(kv, key);

  if (cached !== null) {
    let value = cached;
    await trackFetch(sink, { route, method: 'GET', cache: 'hit' }, async () => {
      value = cached;
      return new Response(null, { status: 200 });
    });
    return value;
  }

  let loaded: T | undefined;
  await trackFetch(sink, { route, method: 'GET', cache: 'miss' }, async () => {
    loaded = await loader();
    await kvSetJson(kv, key, loaded, ttlSec);
    return new Response(null, { status: 200 });
  });

  // trackFetch가 throw하지 않고 반환했다면 loader는 성공했고 loaded는 채워져 있다.
  return loaded as T;
};
