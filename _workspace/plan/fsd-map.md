# FSD 레이어 매핑 — ratsaver

> Phase 2 산출물. spec-planner(Phase 2.5)·route-builder(4a)·edge-data-integrator(4b)·ui-developer(4c)의 모듈 스캐폴딩 입력.
> 의존성 규칙: `app → widgets → features → entities → shared` (상위만 하위 참조, 역방향 import 0 — Hard Threshold ①).

---

## app/ (라우트 — Next.js App Router)

| 경로 | 타입 | 렌더링 | 의존 widgets |
|------|------|--------|--------------|
| `app/page.tsx` (`/`) | page | SSG | `saving-calculator`(feature 직접 사용 가능), `disclaimer` |
| `app/plans/page.tsx` (`/plans`) | page | ISR(3600s) + 클라 필터 | `filter-bar`, `plan-list` |
| `app/plans/[id]/page.tsx` | page | SSG (generateStaticParams) | `plan-card`(상세형), `compare`(진입), `disclaimer` |
| `app/compare/page.tsx` (`/compare`) | page | ISR(3600s)/클라 조립 | `compare-table` |
| `app/recommend/page.tsx` (`/recommend`) | page | SSG 셸 + 클라 | `usage-preset-modal`, `plan-list`(추천결과) |
| `app/calculator/page.tsx` (`/calculator`) | page | SSG 셸 + 클라 | `saving-calculator` |
| `app/api/plans/route.ts` | route handler | SSR(edge) + KV | (shared/db, shared/cache, shared/perf) |
| `app/api/plans/[id]/route.ts` | route handler | SSR(edge) + KV | (shared/db, shared/cache, shared/perf) |

---

## widgets/ (독립 UI 블록)

| Module | 책임 | barrel export | 의존 |
|--------|------|---------------|------|
| `widgets/plan-card` | 요금제 카드 (4블록: 데이터+속도 / 통화·문자 / 망·세대 / 프로모가+정가) | `index.ts` | `features/plan-compare`(담기), `entities/plan`, `shared/ui` |
| `widgets/plan-list` | 목록 + 결과 카운트 + 페이지네이션 | `index.ts` | `features/plan-filter`, `widgets/plan-card` |
| `widgets/filter-bar` | 상단 필터바 + 퀵칩 4종 + 정렬 드롭다운 | `index.ts` | `features/plan-filter`, `shared/ui` |
| `widgets/compare-table` | 나란히 비교 테이블 (스펙 행 매트릭스) | `index.ts` | `features/plan-compare`, `entities/plan`, `shared/ui` |
| `widgets/usage-preset-modal` | 사용량 프리셋 5종 선택 모달 + 직접입력 | `index.ts` | `features/plan-recommend`, `shared/ui` |
| `widgets/disclaimer` | 검증일·면책 고지 | `index.ts` | `entities/plan`, `shared/ui` |

---

## features/ (비즈니스 로직)

| Module | 책임 | 핵심 함수 | barrel | 의존 |
|--------|------|----------|--------|------|
| `features/plan-filter` | searchParams ↔ 필터상태 직렬화/파싱, 필터 적용, 퀵칩 매핑, 정렬 | `parseFilters(searchParams)`, `serializeFilters(state)`, `applyFilters(plans, state)`, `sortPlans(plans, sort)` | `index.ts` | `entities/plan`, `shared/lib` |
| `features/plan-compare` | 비교 대상 선택(최대 3)·`?ids=` 직렬화·매트릭스 조립 | `parseCompareIds()`, `buildCompareMatrix(plans)` | `index.ts` | `entities/plan` |
| `features/plan-recommend` | 사용량→점수 매칭(순수함수)·정렬 | `scorePlan(plan, usage)`, `recommend(plans, usage)`, `USAGE_PRESETS` | `index.ts` | `entities/plan` |
| `features/saving-calculator` | 현재요금→월·연 절약액(순수함수)·입력검증(Zod) | `calcSaving(currentPrice, targetPlan)`, `savingInputSchema` | `index.ts` | `entities/plan`, `shared/lib` |

> features는 **클라이언트 순수함수 중심**(recommend·calculator). 서버 호출·PII 0. 필터는 searchParams 기반이라 서버/클라 양쪽 재사용.

---

## entities/ (도메인 모델)

| Module | 책임 | 내용 | barrel | 의존 |
|--------|------|------|--------|------|
| `entities/plan` | plan 도메인 단일 출처 | `Plan` 타입, Zod `planSchema`, enum(`network`/`contract`/`signupType`), 정직성 가격 포맷터(`formatPromoPrice`, `formatRegularPrice`), 검증일 포맷(`formatVerifiedDate` — **date-fns 사용, `.split('T')[0]` 금지**) | `index.ts` | `shared/lib`(date-fns) |

### Plan 필드 (data-model-notes.md 확정 스키마)
`id`(slug PK) · `carrier` · `network`(SKT\|KT\|LGU) · `mvno`(bool) · `name` · `monthlyPrice`(프로모가) · `regularPrice`(정가) · `promoMonths` · `dataGb` · `dataUnlimited` · `throttleKbps` · `callMinutes` · `callUnlimited` · `smsCount` · `smsUnlimited` · `contract`(none\|12m\|24m) · `signupType` · `tags`(JSON) · `notes` · `lastVerifiedAt`(ISO)

> 파생값(절약액·추천점수)은 **저장 안 함, 런타임 계산**. entity는 데이터·포맷·검증만.

---

## shared/ (인프라 — 3대 핵심 계약)

| Module | 책임 | Hard Threshold |
|--------|------|----------------|
| `shared/env` | D1/KV/AE 바인딩 타입드 접근 **단일 통로** (`createEnvAccessor(env).get(key)`) | ② 바인딩 접근 |
| `shared/db` | Drizzle/D1 — plan 시드 스키마·repository(findAll/findById/filter) | ②④(N+1 0) |
| `shared/cache` | KV/Cache 계층 — 목록·상세 캐시(TTL 3600s) | ④ 반복호출 캐시 |
| `shared/perf` | `trackFetch()` 계측 래퍼 + AE 이벤트 상수(`EVENTS.*`) + Web Vitals 비콘 | ④⑤ |
| `shared/ui` | shadcn/ui 컴포넌트 (design-architect Phase 3 토큰) | ① |
| `shared/lib` | date-fns 포맷·searchParams 헬퍼·Zod 유틸 | ① |
| `shared/config` | 가격/데이터 버킷 상수·퀵칩 정의·프리셋 상수 | - |

---

## 모듈 생성 순서 (Phase 4 구현 가이드)
1. **4a route-builder**: `app/` 라우트 셸 + `api/plans` 핸들러 스텁 + features barrel 스캐폴드
2. **4b edge-data-integrator**: `shared/db`(Drizzle+시드) · `shared/cache`(KV) · `shared/env` · `entities/plan`
3. **4c ui-developer**: `widgets/*` + features 구현 + page 조립 (shadcn)
4. **4d perf-engineer**: `shared/perf`(trackFetch·AE 상수·Web Vitals 비콘) 배선

> 인증 모듈 없음(무인증). `shared/auth`·`SESSION` KV 바인딩 불필요.
