/**
 * KV 캐시 키 스킴 — cache-topology.md SSOT를 그대로 코드화(임의 변경 금지).
 * 버전 프리픽스: 시드/스키마/캐시계층 변경 시 올려 KV+엣지 일괄 무효화.
 * v2: moyo 실데이터(253건) 재시드 + Cache API 엣지 캐시 도입.
 */
export const CACHE_VERSION = 'v2' as const;
const VERSION = CACHE_VERSION;

/** KV TTL(초) — cache-topology.md: 3600s (ISR revalidate와 정합). */
export const CACHE_TTL_SEC = 3600;

/** 전체 목록(필터 전 raw set). `/api/plans`·`/plans` ISR·`/compare` 공유. */
export const planListKey = (): string => `plans:${VERSION}:all`;

/** 단건 상세. `/api/plans/[id]`. */
export const planIdKey = (id: string): string => `plans:${VERSION}:id:${id}`;

/** 버전 프리픽스(일괄 purge용). */
export const planKeyPrefix = (): string => `plans:${VERSION}:`;
