---
project: ratsaver
phase: 4a
title: Routes Built — 라우트↔rendering-matrix 매핑 (추적)
status: completed
created: 2026-06-14
updated: 2026-06-14
owner: route-builder
---

# routes-built — ratsaver (Phase 4a)

> route-builder 산출. 라우트 셸 + API 핸들러 스텁 + features barrel 골격만.
> 실제 데이터 로직은 4b(edge-data-integrator), UI 조립은 4c(ui-developer)가 채운다.
> 렌더링 선언은 `_workspace/arch/rendering-matrix.md`(SSOT) §"라우트별 Next 선언 정확 매핑"을 글자 그대로 복사.

## 라우트 ↔ matrix 매핑 (선언 1:1 검증)

| route | 파일 | matrix 전략 | 실제 선언 (복사) | 일치 |
|-------|------|-------------|------------------|------|
| `/` | `app/page.tsx` | SSG | (선언 없음 — 동적 API·searchParams 미사용) | ✅ |
| `/plans` | `app/plans/page.tsx` | ISR + 클라 필터 | `export const revalidate = 3600;` | ✅ |
| `/plans/[id]` | `app/plans/[id]/page.tsx` | SSG | `export const dynamicParams = false;` + `export async function generateStaticParams()` (스텁: `[]`) | ✅ |
| `/compare` | `app/compare/page.tsx` | ISR + 클라 조립 | `export const revalidate = 3600;` | ✅ |
| `/recommend` | `app/recommend/page.tsx` | SSG 셸 + 클라 | (선언 없음) | ✅ |
| `/calculator` | `app/calculator/page.tsx` | SSG 셸 + 클라 | (선언 없음) | ✅ |
| `/api/plans` (GET) | `app/api/plans/route.ts` | SSR-edge + KV | `export const dynamic = 'force-dynamic';` | ✅ |
| `/api/plans/[id]` (GET) | `app/api/plans/[id]/route.ts` | SSR-edge + KV | `export const dynamic = 'force-dynamic';` | ✅ |

**전 라우트 `runtime='edge'` 선언 0** (OpenNext Worker 엣지 실행 — 매트릭스 금지 조항 준수). grep 검증: 코드 선언 0 (주석만 존재).

## API 핸들러 스텁 계약 (4b가 채울 자리)

- `app/api/plans/route.ts` — GET. `getCloudflareContext().env` → `createEnvAccessor(env).get('PERF')` → `createAnalyticsEngineSink` → `trackFetch({ route: '/api/plans', method: 'GET', cache: 'none' })` 래핑. 현재 `{ plans: [] }` 반환. **TODO(4b)**: `accessor.get('CACHE')` read-through → `@/shared/db.filter(query)`. route 문자열은 matrix 경로와 동일(매직스트링 0).
- `app/api/plans/[id]/route.ts` — GET 단건. `params: Promise<{ id: string }>` (Next 15). `trackFetch({ route: '/api/plans/[id]', method: 'GET', cache: 'none' })` 래핑. 현재 `{ plan: null, id }` 반환. **TODO(4b)**: `accessor.get('CACHE')` read-through → `@/shared/db.findById(id)`.

## 보조 셸

- `app/layout.tsx` — `metadata`(title/description) 추가, `WebVitals` 마운트 유지(4d 배선), disclaimer 푸터 슬롯 주석(4c).
- `app/loading.tsx` · `app/plans/loading.tsx` — 고정 높이(`minHeight:60vh`) 스켈레톤 → CLS 0 방지.
- `app/not-found.tsx` — 404 (dynamicParams=false plan id 대응). `/plans` 복귀 링크.

## features barrel 골격 (4c가 구현 채움)

| feature | barrel | 4c 구현 대상 (tasks.md 4c-1) | 의존(FSD 단방향) |
|---------|--------|------------------------------|-------------------|
| `plan-filter` | `src/features/plan-filter/index.ts` (`export {}`) | parse.ts·apply.ts·quickchips.ts | entities/plan, shared/lib |
| `plan-compare` | `src/features/plan-compare/index.ts` (`export {}`) | compare.ts | entities/plan |
| `plan-recommend` | `src/features/plan-recommend/index.ts` (`export {}`) | score.ts | entities/plan |
| `saving-calculator` | `src/features/saving-calculator/index.ts` (`export {}`) | calc.ts | entities/plan, shared/lib |

## Hard Threshold 준수 (4a 범위)

- ② 선언↔matrix 1:1 일치, `runtime='edge'` 0. API 핸들러 `import 'server-only'` + `createEnvAccessor(env).get()` 단일 통로. `process.env` 0.
- ④⑤ 두 API 핸들러 전부 `trackFetch()` 경유. 매직스트링 route 0(matrix 경로 동일).
- ① FSD 단방향(`app→features→entities→shared`), barrel 4종 존재, `any` 0, `.split('T')[0]` 0.
- ③ N/A — 쓰기 경로 0(Server Action·POST 0 → CSRF 표면 0).

## QA 결과

- `npm run typecheck` → **0 오류**
- `npm run lint` → **0 에러**
- grep: `runtime='edge'` 코드 0 · `: any`/`as any` 0 · `.split('T')` 0

## 다음 (4b edge-data-integrator)

1. `src/shared/env`·`entities/plan`·`src/shared/db`(Drizzle+시드)·`src/shared/cache`(KV) 구현
2. 두 API 핸들러 TODO(4b) 자리에 `@/shared/cache`→`@/shared/db` 배선
3. `generateStaticParams`를 `repository.findAll()` 기반 id 목록으로 교체
