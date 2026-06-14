# rendering-matrix.md — ratsaver (Cloudflare Pages / next-on-pages)

**플랫폼**: Cloudflare Pages + `@cloudflare/next-on-pages` v1.13.16
**이전 플랫폼**: Cloudflare Workers + `@opennextjs/cloudflare` (마이그레이션 완료 — `_workspace/deploy/pages-migration.md`)

## 핵심 규칙 (OpenNext → Pages 반전)

- **OpenNext 시절**: Worker 자체가 엣지 실행 → 라우트별 `runtime='edge'` **금지**였다.
- **Pages(next-on-pages) 시절**: 바인딩 사용 라우트 + 동적 라우트에 `export const runtime = 'edge'` **필수**다. (없으면 빌드/런타임 실패.)
- **ISR 미지원**: next-on-pages는 on-demand revalidate를 지원하지 않는다. 데이터가 번들 시드(정적)이므로 ISR 라우트(`/`·`/compare`)를 **순수 SSG**로 전환했다. `export const revalidate` 전부 제거.
- 종단 지연: 이 네트워크에서 Pages 대역(172.66.x)은 **ICN(서울) PoP, RTT 8-10ms**. 실측 종단 p50: 홈 27ms · 상세 30ms · API 17ms (모두 <50ms 목표 달성, 무료).

## 라우트 매트릭스 (전 라우트 1행)

| route | strategy | Next 구현 | cache 계층 | revalidate | perf 예산(p95) | 실측 p50 | 근거 |
|-------|----------|-----------|-----------|-----------|---------------|---------|------|
| `/` | SSG | 기본(`revalidate` 제거) + 클라 필터 | 정적 프리렌더(Pages 엣지) · 클라는 `/data/plans.json`(cf-cache) | — | 1.5s LCP | 27ms | 시드 정적. 초기 12개 카드만 SSR, 전체는 클라가 정적 JSON 비동기 로드 |
| `/plans` | SSG | `redirect('/')` (정적 meta-refresh) | 정적 프리렌더 | — | 1.5s | — | 목록을 `/`로 이전 → 영구 리다이렉트 |
| `/plans/[id]` | SSG | `generateStaticParams` + `dynamicParams = false` | 정적 프리렌더(253건 전건) | — | 1.5s LCP | 30ms | 시드 외 id는 404. 전건 프리렌더 |
| `/recommend` | SSG | 기본(셸만 정적, 임베드 plan 0) | 정적 셸 · 클라는 `/data/plans.json` | — | 1.5s | — | 스코어링은 클라, 전체목록은 정적 JSON 비동기 로드 |
| `/calculator` | SSG | 기본(`Suspense` 셸) | 정적 셸 | — | 1.5s | — | 순수 클라 계산(PII 0). `?target=`는 클라에서 read |
| `/compare` | SSR-edge | `export const runtime = 'edge'` | 정적 시드(in-memory) | — | 200ms | — | `searchParams(?ids=)` 읽음 → 동적. Pages는 동적 페이지에 edge 요구 |
| `/api/plans` | SSR-edge | `runtime = 'edge'` + `dynamic = 'force-dynamic'` | **Cache API(엣지 응답)** + KV(`CACHE`) read-through + D1 | — | 200ms | 17ms | 쿼리 의존 동적. 웜 GET은 colo 엣지캐시 HIT(서버 ~3ms) |
| `/api/plans/[id]` | SSR-edge | `runtime = 'edge'` + `dynamic = 'force-dynamic'` | **Cache API** + KV(`CACHE`) read-through | — | 200ms | — | 단건 PK 조회. `/api/plans`와 동일 웜 KV 키 공유(콜드미스 0) |
| `/api/vitals` | SSR-edge | `runtime = 'edge'` + `dynamic = 'force-dynamic'` | none(쓰기 전용) | — | 200ms | — | Web Vitals 비콘 수집 → AE(`PERF`) 기록 |
| `/api/events` | SSR-edge | `runtime = 'edge'` + `dynamic = 'force-dynamic'` | none(쓰기 전용) | — | 200ms | — | KPI 이벤트 비콘 수집 → AE 기록 |

## 바인딩 (Pages wrangler.toml)

| binding | type | 용도 | 접근 통로 |
|---------|------|------|----------|
| `DB` | D1 | plan 시드(읽기전용) | `getServerContext().env` → `createEnvAccessor(env).get('DB')` |
| `CACHE` | KV | plans read-through 캐시(`plans:v1:all`) | `createEnvAccessor(env).get('CACHE')` |
| `PERF` | Analytics Engine | latency·Web Vitals·KPI 이벤트 관측 | `createEnvAccessor(env).get('PERF')` |

- 서버 컨텍스트 진입점: `@/shared/env/context`의 `getServerContext()` (next-on-pages `getRequestContext()` 래핑). `@opennextjs/cloudflare`는 더 이상 import하지 않는다.
- 바인딩 직접 접근 0 — 전부 `createEnvAccessor` 단일 통로(Hard Threshold ②).
- `SESSION`(KV)·`BUCKET`(R2)은 무인증·에셋업로드 없음으로 Pages wrangler.toml에서 제외(코드 미참조). `env.d.ts` 타입만 스켈레톤 일관성 위해 유지.

## 캐시 토폴로지

- **정적 페이지**(SSG): Pages 엣지가 프리렌더 HTML/RSC를 직접 서빙. OpenNext incremental cache(ASSETS 바인딩) 불필요 — Pages 네이티브.
- **Cache API**(`caches.default`, `withEdgeCache`): `/api/plans*` 웜 GET을 colo 엣지에 단기 캐시(키=정규화 URL+`__cv`). 실측 `x-edge-cache: HIT`, `server-timing: app;dur=3`.
- **KV**(`CACHE`): D1 보호용 cross-request read-through(`plans:v1:all`). 콜드 경로에서만 D1 1회 hit. 무효화 = 캐시 버전(`CACHE_VERSION`) 범프 + 재배포.
- **정적 데이터 에셋**(`/data/plans.json`): 빌드 전 `sync-static-data.mjs`로 생성, Pages가 cf-cache로 서빙. 클라(홈·추천·팔레트)가 Worker API 대신 직접 fetch.
