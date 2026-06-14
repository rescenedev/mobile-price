---
project: ratsaver
phase: 3.5
title: 캐시 토폴로지 — 계층·키 스킴·TTL·무효화 (계약)
status: confirmed
created: 2026-06-14
updated: 2026-06-14
owner: cf-architect
---

# Cache Topology — ratsaver

> **목적**: 동일 업스트림(D1) 반복 호출에 캐시 부재 0 보장 (Hard Threshold ④). 모든 동적 라우트는 최소 1개 캐시 계층을 통과한다.
> **구현 위치**: `@/shared/cache`(KV read-through) · Next ISR(OpenNext incremental cache) · (선택) Cache API.
> ratsaver는 **읽기 100%·시드데이터·쓰기 0**이므로 무효화는 단순(시간 기반 TTL + 시드 재배포 시 일괄 purge)이다.

---

## 3계층 캐시 구조

```
요청
 │
 ├── [페이지] /plans · /compare ───► Next ISR (revalidate=3600)  ← OpenNext incremental cache (KV 백엔드)
 │                                         │ miss/만료 시 페이지 재생성
 │                                         └─► 내부 데이터 페치 → @/shared/cache(KV) → D1
 │
 ├── [페이지] / · /plans/[id] · /recommend · /calculator ───► SSG (빌드 정적, 런타임 D1 0)
 │
 └── [API] /api/plans · /api/plans/[id] ───► @/shared/cache (KV CACHE) read-through
                                                  │ hit → JSON 반환 (D1 0)
                                                  └ miss → D1 조회 → KV put(TTL 3600s) → 반환
```

핵심: **모든 런타임 D1 접근 경로는 KV(`CACHE`)를 먼저 통과**한다 → 동일 업스트림 반복호출 0.

---

## 계층 1 — KV (`CACHE`) read-through (★주력)

`@/shared/cache`가 소유. `@/shared/env.get('CACHE')` 경유. 모든 D1 조회 결과를 캐싱.

| 캐시 대상 | 키 스킴 | TTL | metadata | 소비처 |
|-----------|---------|-----|----------|--------|
| 전체 목록(필터 전 raw set) | `plans:v1:all` | 3600s | `{ expireAt }` | `/api/plans`, `/plans` ISR 데이터, `/compare` ISR 데이터 |
| 필터된 목록(쿼리별) | `plans:v1:list:{queryHash}` | 3600s | `{ expireAt }` | `/api/plans?network=...&sort=...` |
| 단건 상세 | `plans:v1:id:{planId}` | 3600s | `{ expireAt }` | `/api/plans/[id]` |

- **`queryHash`**: 정규화된 searchParams(`network·data_min·data_max·price_max·mvno·unlimited·contract·sort`)를 정렬 직렬화 후 해시. `features/plan-filter`의 `serializeFilters` 정규화 결과를 키 재료로 사용 → 동일 필터=동일 키.
- **read-through 패턴**: `get(key)` → hit 반환 / miss 시 `@/shared/db` 단일 쿼리 → `put(key, value, {expirationTtl: 3600, metadata:{expireAt}})` → 반환. 전부 `@/shared/perf.trackFetch` 래핑.
- **버전 프리픽스 `v1`**: 스키마/시드 구조 변경 시 `v2`로 올려 일괄 무효화(아래 무효화 전략).

> **권장 단순화**: 시드 150건은 작으므로 `/api/plans`는 **`plans:v1:all` 한 키로 전체를 KV 캐시**하고 필터/정렬은 핸들러 메모리에서 적용하는 방식을 우선한다(키 폭발 방지·캐시 히트율 극대화). `plans:v1:list:{queryHash}`는 트래픽 패턴상 필요 시에만 추가. → D1 호출은 사실상 3600s에 1회.

---

## 계층 2 — Next ISR (OpenNext incremental cache)

`/plans`·`/compare` 페이지. `export const revalidate = 3600`.

- OpenNext incremental cache가 ISR 페이지 산출물(HTML/RSC payload)을 캐싱·재생성. **백엔드 = Static Assets Incremental Cache** (Phase 7 확정): `open-next.config.ts`의 `staticAssetsIncrementalCache` + `enableCacheInterception: true`로 빌드타임 프리렌더 값을 `env.ASSETS`에서 서빙. read-only이므로 런타임 `set()`은 no-op → 시드 갱신은 재배포 반영(아래 무효화 전략). 별도 KV/R2 캐시 백엔드 불요(추가 바인딩 0).
  - 이 override가 없으면 SSG(`/plans/[id]`)·ISR 프리렌더가 런타임에 서빙되지 못해 404(Phase 5.5 BLOCKER) — `arch/rendering-matrix.md` 전제 6 참조.
- 페이지 ISR과 KV 데이터 캐시는 **독립 계층**: ISR 만료(3600s) 시 페이지 재생성 중 내부 데이터 페치가 다시 KV(계층1)를 통과 → D1 보호 유지.
- TTL 정합: ISR `revalidate=3600` = KV TTL `3600s` (동일 갱신 주기 — 시드 반나절 큐레이션 반영, 보수적).

---

## 계층 3 — Cache API (선택 / 단기)

현재 MVP 불요. `/api/plans`의 KV 계층이 이미 3600s 공유 캐시를 제공하므로 추가 단기 Cache API는 생략한다.
- 향후 트래픽 급증 시: 동일 GET 응답을 Cache API로 초~분 단위 추가 캐싱(키=정규화 URL) 가능. 추가 시 본 문서에 행 추가.

---

## TTL 결정 요약

| 계층 | 대상 | TTL | 근거 |
|------|------|-----|------|
| KV `CACHE` | 목록/상세 JSON | **3600s** | 시드데이터 반나절 큐레이션·수시 아님. 보수적 1h. API p95(≤120ms/100ms)는 KV 히트로 달성 |
| Next ISR | `/plans`·`/compare` 페이지 | **3600s** | KV와 동일 주기. ISR 만료=페이지 재생성, 데이터는 KV 재통과 |
| SSG | `/`·`/plans/[id]`·`/recommend`·`/calculator` | **무한**(빌드 정적) | 런타임 D1 0. 시드 변경은 재배포로 반영 |

---

## 무효화(Invalidation) 전략

ratsaver는 **런타임 쓰기 경로 0**(무인증·읽기전용)이므로 이벤트 기반 무효화 없음. 무효화는 두 경로뿐:

1. **시간 기반(자동)**: KV `expirationTtl=3600` + ISR `revalidate=3600`. 만료 시 다음 요청이 D1에서 재페치·재생성.
2. **시드 재배포 기반(수동)**: 시드 SQL 갱신 → D1 마이그레이션 재적용 시:
   - **KV 버전 범프**: `@/shared/cache` 키 프리픽스 `v1`→`v2`로 올려 구 캐시 즉시 무력화(가장 안전·단순). 또는
   - **빌드 재배포**: SSG/ISR 페이지는 재빌드/재배포로 자동 갱신.
   - (선택) `wrangler kv key delete --prefix plans:v1:` 로 명시 purge.

> 쓰기 후 KV delete·tag purge 트리거는 **해당 없음**(쓰기 0). Hard Threshold ③의 CSRF/origin 항목과 함께 N/A.

---

## Hard Threshold ④ 보장 매핑

| 게이트 항목 | 보장 방식 |
|-------------|-----------|
| 동일 업스트림(D1) 반복호출에 캐시 부재 | **0** — 전 런타임 D1 경로가 KV(`CACHE`) read-through 통과 |
| D1 N+1 쿼리 | **0** — 목록=단일 filter 쿼리, 상세=단건 PK. repository 단일 쿼리 강제 |
| 동적 라우트 캐시 전략 부재 | **0** — `/api/plans`·`/api/plans/[id]`=KV, `/plans`·`/compare`=ISR+KV |
| API p95 예산 초과 | KV 히트 시 사실상 edge 응답 → ≤120ms/100ms 달성 |

---

## 검증 체크리스트

- [x] 모든 동적 라우트(API 2개 + ISR 2개)에 캐시 계층 ≥1 명시
- [x] KV 키 스킴·TTL·metadata 명시 (`plans:v1:*`, 3600s)
- [x] ISR revalidate(3600) ↔ KV TTL(3600) 정합
- [x] 무효화 전략(시간 기반 + 버전 범프/재배포) 기술 — 쓰기 0이므로 이벤트 무효화 N/A 명시
- [x] read-through 패턴(`@/shared/cache`→`@/shared/db`, `trackFetch` 래핑) 규약화
