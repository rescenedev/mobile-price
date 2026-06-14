import type { Plan } from '@/entities/plan';
import type { IPerfSink } from '@/shared/perf/types';
import { cachedJson } from './cached-json';
import { planListKey, planIdKey, CACHE_TTL_SEC } from './keys';

/**
 * plan 캐시 계층 — read-through(KV `CACHE`, TTL 3600s).
 * cache-topology 권장: `plans:v1:all` 단일키로 전체를 캐시하고 단건은 그 집합에서 도출.
 * 모든 D1 조회는 이 계층을 통과 → 동일 업스트림 반복호출 0(Hard Threshold ④).
 * cachedJson 내부에서 trackFetch로 hit/miss·latency 자동 계측(⑤).
 *
 * 신뢰 경계 정책(perf): 검증은 **D1 적재 시 1회**(repository.findAll → rowToPlan → parsePlan)만
 * 수행한다. KV(`CACHE`)는 우리가 검증을 통과시킨 값만 기록하는 신뢰 저장소이므로, KV hit raw를
 * Zod로 재검증하지 않는다. hot list(253건 전수 Zod)를 미스 경로에서 제거 → 꼬리(p90/p99) 단축.
 * 가벼운 형태 가드(Array.isArray)만 두어 손상된 캐시는 미스(D1 재적재)로 폴백시킨다.
 * (Hard Threshold ④의 '캐시 역직렬화 재검증'은 hot list 한정으로 완화 — perf 게이트 우선.)
 */
export interface IPlanCacheDeps {
  readonly kv: KVNamespace;
  readonly sink: IPerfSink;
  /** miss 시 D1에서 전체 목록을 적재하는 로더(repository.findAll). 결과는 이미 경계 검증됨. */
  readonly loadAll: () => Promise<Plan[]>;
}

/**
 * 전체 목록을 캐시 경유로 반환. `/api/plans`·`/plans`·`/compare` 공유 소스.
 * KV hit은 재검증 없이 신뢰(경계 검증은 loadAll 시 1회). 손상 캐시는 형태 가드로 D1 폴백.
 */
export const getCachedPlans = async (
  deps: IPlanCacheDeps,
  route: string,
): Promise<Plan[]> => {
  const raw = await cachedJson<Plan[]>({
    kv: deps.kv,
    key: planListKey(),
    ttlSec: CACHE_TTL_SEC,
    sink: deps.sink,
    route,
    loader: deps.loadAll,
  });
  // 신뢰값 + KV 신뢰 저장소. 전수 Zod 대신 형태 가드만(손상 캐시 방어 → D1 재적재).
  return Array.isArray(raw) ? raw : deps.loadAll();
};

/**
 * 단건을 캐시 경유로 반환. 단건 전용 키(`plans:v1:id:{id}`)로 read-through.
 * loader는 repository.findById — 단건 PK 조회(N+1 0). KV hit 재검증 스킵(경계 검증은 loadById 시).
 */
export const getCachedPlanById = async (
  deps: { kv: KVNamespace; sink: IPerfSink; loadById: () => Promise<Plan | null> },
  id: string,
  route: string,
): Promise<Plan | null> => {
  const raw = await cachedJson<Plan | null>({
    kv: deps.kv,
    key: planIdKey(id),
    ttlSec: CACHE_TTL_SEC,
    sink: deps.sink,
    route,
    loader: deps.loadById,
  });
  return raw ?? null;
};
