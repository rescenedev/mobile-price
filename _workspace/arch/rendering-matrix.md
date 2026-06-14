---
project: ratsaver
phase: 3.5
title: Rendering Matrix — 라우트별 렌더링/캐시 단일 출처 (SSOT 계약)
status: confirmed
created: 2026-06-14
updated: 2026-06-14
owner: cf-architect
---

# Rendering Matrix — ratsaver (★단일 출처 / 계약)

> **이 파일은 cf-architect가 Phase 3.5에서 확정했고, 모든 구현 에이전트(4a~4d)가 그대로 따른다.**
> 여기 없는 라우트를 구현하면 Hard Threshold ② 위반. 선언 전략과 실제 코드(`runtime`/`revalidate`/`dynamic`)가 불일치하면 위반.
> 입력: `_workspace/spec/rendering-stub.md`(Phase 2.5) + `_workspace/plan/prd.md` §4·§9 + `_workspace/plan/kpis.md`.

---

## ⚠️ OpenNext / Cloudflare Workers 전제 (필독 — 구현 에이전트 강제)

1. **라우트별 `export const runtime = 'edge'` 선언 금지.** OpenNext(`@opennextjs/cloudflare`)에서 Worker 자체가 엣지에서 실행되므로 라우트 단위 edge runtime 선언은 불필요하며 빌드 호환 이슈를 유발한다. (커밋 `2e0f19e` 정책)
   - 본 매트릭스의 "SSR-edge"는 **Worker 엣지 런타임에서의 동적 SSR**을 뜻하며, Next 구현은 `runtime` 선언 없이 `export const dynamic = 'force-dynamic'`로만 표현한다.
2. **바인딩 접근 단일 통로**: D1/KV/AE는 전부 `@/shared/env`의 `createEnvAccessor(env).get(key)` 경유. `process.env`/전역 직접 접근 0 (Hard Threshold ②). 서버 진입점은 `getCloudflareContext().env`.
3. **데이터 호출 단일 통로**: 모든 D1/외부 호출은 `@/shared/perf.trackFetch()`로 래핑 (Hard Threshold ④⑤).
4. **반복 동일 업스트림(D1)**: `@/shared/cache`(KV) 통과 필수 — 미경유 0 (Hard Threshold ④).
5. **인증 없음**: 세션·쿠키·SESSION KV·R2 미사용. 개인화 라우트 0 → SSG/ISR 안전(세션 누수 없음).
6. **SSG/ISR 서빙 = Static Assets Incremental Cache** (Phase 7 확정, BLOCKER 해결): OpenNext는 프리렌더 산출물(`/plans/[id]` 120건 SSG · `/plans`·`/compare` ISR)을 `incrementalCache` override가 없으면 `.open-next/cache`에만 두고 런타임에 서빙하지 못해 `dynamicParams=false` 라우트가 전건 404가 된다. ratsaver는 **런타임 쓰기 0(읽기전용)**이므로 `open-next.config.ts`에 `staticAssetsIncrementalCache` + `enableCacheInterception: true`를 설정해 빌드타임 프리렌더 값을 `env.ASSETS`(Workers Static Assets)에서 서빙한다. R2/KV 캐시 백엔드 불요(추가 바인딩 0). `wrangler.toml`에 `[assets] directory=".open-next/assets" binding="ASSETS"` + `global_fetch_strictly_public` 플래그 필수.
   - **무효화**: 이 캐시는 read-only이므로 ISR `revalidate=3600`의 런타임 `set()`은 no-op(로그만). 시드 갱신은 **재배포로만 반영** — `arch/cache-topology.md` "시드 재배포 기반 무효화"와 일치(런타임 쓰기 0 앱에 부합).

---

## 라우트 매트릭스 (전 라우트 1행 — 누락 0)

| route | strategy | Next 구현 (그대로 복사) | 캐시 계층 | revalidate | perf 예산 (LCP / INP / CLS · API p95) | 번들 예산(gz) | 근거 |
|-------|----------|--------------------------|-----------|-----------|---------------------------------------|---------------|------|
| `/` | **ISR + 클라 필터** | `export const revalidate = 3600` — 홈=요금제 비교 리스트(기존 `/plans` 콘텐츠 이전). 초기 전체목록 + 필터·정렬·퀵칩 클라 searchParams. **기본정렬 price_asc(최저가 우선)** | **Next ISR**(페이지) + 시드 bundled | 3600 | LCP ≤ 1.5s / INP ≤ 200ms / CLS ≤ 0.1 | ≤ 195KB | 사용자 요구 "비교가 첫화면". moyo 실데이터 253건 |
| `/plans` | **redirect→`/`** | `redirect('/')` — 홈이 목록을 흡수, 중복 제거 | — | — | — | — | 구/외부 링크 호환용 |
| `/plans/[id]` | **SSG** | `export const generateStaticParams` (전 plan 프리렌더) + `export const dynamicParams = false` (시드 외 id→404) | — (빌드 시 정적) | — | LCP ≤ 1.2s / INP ≤ 150ms / CLS ≤ 0.05 | ≤ 190KB | 읽기전용 시드·전건 프리렌더 가능. 런타임 D1 0 |
| `/compare` | **ISR + 클라 조립** | `export const revalidate = 3600` — `?ids=a,b,c` searchParams로 대상 선택, 매트릭스는 클라 조립 | **Next ISR**(페이지) + KV(목록 데이터 재사용, 3600s) | 3600 | LCP ≤ 1.5s / INP ≤ 200ms / CLS ≤ 0.1 | ≤ 190KB | `/plans`와 동일 목록 소스 재사용 |
| `/recommend` | **SSG 셸 + 클라 스코어링** | (기본) — 정적 셸 + 클라 컴포넌트. 프리셋/입력→`scorePlan` 순수함수 클라 실행 (서버 호출 0, PII 0) | — (정적 셸) | — | LCP ≤ 1.5s / INP ≤ 200ms / CLS ≤ 0.1 | ≤ 195KB | 입력→파생값=클라 순수함수. 서버 왕복 0 |
| `/calculator` | **SSG 셸 + 클라 계산** | (기본) — 정적 셸 + 클라 컴포넌트. 현재요금 입력→`calcSaving` 순수함수 클라 실행 (서버 미저장) | — (정적 셸) | — | LCP ≤ 1.5s / INP ≤ 200ms / CLS ≤ 0.1 | ≤ 190KB | 현재요금 클라 메모리 계산. 서버 전송 0(PII 0) |
| `/api/plans` (GET) | **SSR-edge + 캐시** | Route Handler. `export const dynamic = 'force-dynamic'`. **`runtime='edge'` 금지**. `@/shared/cache`(KV)→`@/shared/db.filter()`, `trackFetch` 래핑 | **KV(`CACHE`, TTL 3600s)** | — (force-dynamic) | API p95 ≤ 120ms | n/a | 쿼리 의존 동적. 클라 필터 데이터 공급. KV 히트=edge 응답 |
| `/api/plans/[id]` (GET) | **SSR-edge + 캐시** | Route Handler. `export const dynamic = 'force-dynamic'`. **`runtime='edge'` 금지**. `@/shared/cache`(KV)→`@/shared/db.findById()`, `trackFetch` 래핑 | **KV(`CACHE`, TTL 3600s)** | — (force-dynamic) | API p95 ≤ 100ms | n/a | 단건 PK 조회. 가장 가벼움. N+1 0 |
| `/api/vitals` (POST) | **SSR-edge 비콘 수집** | Route Handler. `export const dynamic = 'force-dynamic'`. **`runtime='edge'` 금지**. Web Vitals(LCP/INP/CLS/TTFB) → AE(`PERF`). Zod 검증, PII 0 | — (수집 전용, 캐시 없음) | — (force-dynamic) | p95 ≤ 100ms | n/a | sendBeacon 수신. 쓰기 없음(AE append). 캐시 N/A(수집기) |
| `/api/events` (POST) | **SSR-edge 비콘 수집** | Route Handler. `export const dynamic = 'force-dynamic'`. **`runtime='edge'` 금지**. KPI 이벤트(EVENTS 상수) → AE(`PERF`). event-schema 서버 검증으로 PII/금액 거부 | — (수집 전용, 캐시 없음) | — (force-dynamic) | p95 ≤ 100ms | n/a | sendBeacon 수신. 버킷값만 허용(raw 금액 거부). 캐시 N/A(수집기) |

> 전역 게이트(라우트별 미명시 시 기본): LCP ≤ 1.5s / INP ≤ 200ms / CLS ≤ 0.1 · API p95 ≤ 150ms · 번들 ≤ 200KB(하네스 표준) (PRD §9).

---

## 라우트별 Next 선언 정확 매핑 (route-builder 복사 대상 — 글자 그대로)

| route | 파일 | 선언 (복사) |
|-------|------|-------------|
| `/` | `app/page.tsx` | `export const revalidate = 3600;` (홈=요금제 리스트) |
| `/plans` | `app/plans/page.tsx` | `redirect('/')` (선언 없음) |
| `/plans/[id]` | `app/plans/[id]/page.tsx` | `export const dynamicParams = false;` + `export async function generateStaticParams() { ... }` |
| `/compare` | `app/compare/page.tsx` | `export const revalidate = 3600;` |
| `/recommend` | `app/recommend/page.tsx` | (선언 없음 — SSG 셸 기본) |
| `/calculator` | `app/calculator/page.tsx` | (선언 없음 — SSG 셸 기본) |
| `/api/plans` | `app/api/plans/route.ts` | `export const dynamic = 'force-dynamic';` |
| `/api/plans/[id]` | `app/api/plans/[id]/route.ts` | `export const dynamic = 'force-dynamic';` |
| `/api/vitals` | `app/api/vitals/route.ts` | `export const dynamic = 'force-dynamic';` |
| `/api/events` | `app/api/events/route.ts` | `export const dynamic = 'force-dynamic';` |

**금지 선언(전 라우트)**: `export const runtime = 'edge'` — OpenNext Worker가 엣지 실행. 선언 시 4a-QA FAIL.

---

## 라우트별 캐시·데이터 계약 메모

- **`/plans` ISR vs `/api/plans`**: `/plans` 페이지는 ISR(3600s)로 초기 전체목록을 정적 제공 → 150건 클라 필터. `/api/plans`는 클라가 서버 데이터를 (재)요청하거나 SSR 폴백 시 캐시된 JSON 공급용. 둘 다 동일 D1 소스 → **반드시 `@/shared/cache`(KV) 통과** → D1 반복호출 0 (Hard Threshold ④).
- **`/plans/[id]` SSG vs `/api/plans/[id]`**: 페이지는 SSG 프리렌더(런타임 D1 접근 0). API는 외부/클라 단건 조회용 캐시 JSON. 단건 PK 조회만 → N+1 0.
- **추천·계산기·비교 조립**: 전부 클라 순수함수(`features/plan-recommend`·`saving-calculator`·`plan-compare`). 서버 왕복 0, PII 0, API 불요.
- **쓰기 경로 0**: Server Action·POST/PUT/DELETE 핸들러 없음 → CSRF 표면 0 (Hard Threshold ③ 해당 항목 N/A).

---

## 검증 체크리스트 (Phase 5 / QA 게이트가 정량 확인)

- [x] 전 8 라우트(6 page + 2 API)가 1행씩 존재 — 누락 0
- [x] 각 행 `revalidate`/`dynamic`/`generateStaticParams` 문자열이 구현에 그대로 복사 가능
- [x] 개인화/세션 라우트 0 (무인증) → SSG/ISR 오분류 위험 없음
- [x] 동적 라우트(`/api/plans`·`/api/plans/[id]`) 전부 KV 캐시 계층 명시 (캐시 부재 0)
- [x] ISR 라우트(`/plans`·`/compare`) Next ISR + KV 데이터 캐시 명시
- [x] 전 라우트 `runtime='edge'` 선언 0 (OpenNext 호환)
- [x] perf 예산(PRD §9) 라우트별 LCP/INP/CLS·API p95·번들 박음
