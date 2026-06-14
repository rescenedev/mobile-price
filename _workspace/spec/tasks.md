---
project: ratsaver
phase: 2.5
title: 구현 Task 분해 (Phase 4a~4d)
status: not-started
created: 2026-06-14
updated: 2026-06-14
---

# ratsaver — 구현 Task 분해

> Phase 2.5 (spec-planner) 산출물. Phase 4 구현 에이전트가 그대로 따르는 작업 명세.
> 구현 순서(FSD 하위→상위 + 파이프라인): **4a routes(셸/스텁) → 4b data(entity/db/cache/env) → 4c ui(features/widgets/page 조립) → 4d obs(perf/AE/Web Vitals 배선)**.
> 모든 데이터 호출은 `@/shared/env`(바인딩 단일 통로) + `@/shared/perf.trackFetch()`(계측) 경유 — Hard Threshold ②④⑤.
> 인증·세션·CSRF·Server Action task **없음** (무인증·무쓰기 — `auth.methods=[]`).
> Task 완료 시 `- [ ]`→`- [x]`, phase 전 완료 시 frontmatter status·README 대시보드 갱신.

---

## Phase 4a — route-builder (라우트 셸 + API 핸들러 스텁 + features barrel 스캐폴드)

> 의존성: 없음 (최상위 셸). 산출: app/ 라우트 트리 + features 빈 barrel. 렌더링 stub 선언 강제.

### 4a-1. app 라우트 셸 (rendering-stub 전략 선언 포함)
- [ ] `app/page.tsx` — `/` 랜딩 셸. SSG(동적 API 미사용). 계산기 히어로 슬롯. (의존: widgets/saving-calculator·disclaimer는 4c에서 주입)
- [ ] `app/plans/page.tsx` — `/plans` 셸. `export const revalidate = 3600`. filter-bar·plan-list 슬롯
- [ ] `app/plans/[id]/page.tsx` — `/plans/[id]` 셸. `export const generateStaticParams`(스텁) + `export const dynamicParams = false`
- [ ] `app/compare/page.tsx` — `/compare` 셸. `export const revalidate = 3600`. searchParams `?ids=` 수신
- [ ] `app/recommend/page.tsx` — `/recommend` SSG 셸 + 클라 슬롯
- [ ] `app/calculator/page.tsx` — `/calculator` SSG 셸 + 클라 슬롯
- [ ] `app/layout.tsx` — 루트 레이아웃(메타·폰트·disclaimer 푸터 슬롯). Web Vitals 비콘 마운트 지점(4d 배선)
- [ ] `app/loading.tsx` / `app/plans/loading.tsx` — 스켈레톤(고정 높이, CLS 0 방지)
- [ ] `app/not-found.tsx` — 404 (dynamicParams=false plan id 대응)

### 4a-2. API 라우트 핸들러 스텁 (SSR-edge + 캐시 계약 자리)
- [ ] `app/api/plans/route.ts` — GET 핸들러 스텁. `export const dynamic = 'force-dynamic'`. **`runtime='edge'` 선언 금지**(OpenNext Worker 엣지 실행). 4b에서 `@/shared/cache`→`@/shared/db` 배선
- [ ] `app/api/plans/[id]/route.ts` — GET 단건 핸들러 스텁. 동일 캐시 계약 자리

### 4a-3. features barrel 스캐폴드 (빈 export, 4c에서 구현 채움)
- [ ] `src/features/plan-filter/index.ts` — barrel 스텁
- [ ] `src/features/plan-compare/index.ts` — barrel 스텁
- [ ] `src/features/plan-recommend/index.ts` — barrel 스텁
- [ ] `src/features/saving-calculator/index.ts` — barrel 스텁

### 4a 수용 기준
- [ ] 6 page + 2 API 라우트 전부 존재, 각 page에 rendering-stub 전략(revalidate/generateStaticParams/dynamic) 선언
- [ ] API 라우트에 라우트별 `runtime='edge'` 선언 0 (OpenNext 호환)
- [ ] typecheck 0 / lint 0
- [ ] 4a-QA 게이트 통과

---

## Phase 4b — edge-data-integrator (entities/plan + shared/env·db·cache)

> 의존성: 없음(최하위 shared/entities). 산출: 데이터 단일 통로·D1 시드·KV 캐시·plan 도메인.
> **인증 없음** → `shared/auth`·`SESSION` KV 바인딩 task 생성 안 함.

### 4b-1. shared/env (바인딩 단일 통로 — Hard Threshold ②)
- [ ] `src/shared/env/index.ts` — `createEnvAccessor(env).get(key)` 타입드 접근. D1·KV(CACHE)·AE 바인딩만(R2·SESSION 없음). `process.env`/전역 직접 접근 금지

### 4b-2. entities/plan (도메인 단일 출처)
- [ ] `src/entities/plan/types.ts` — `Plan` 타입(18필드: id·carrier·network·mvno·name·monthlyPrice·regularPrice·promoMonths·dataGb·dataUnlimited·throttleKbps·callMinutes·callUnlimited·smsCount·smsUnlimited·contract·signupType·tags·notes·lastVerifiedAt), enum(`network` SKT\|KT\|LGU · `contract` none\|12m\|24m · `signupType`)
- [ ] `src/entities/plan/schema.ts` — Zod `planSchema`(boundary 검증)
- [ ] `src/entities/plan/format.ts` — 정직성 가격 포맷터 `formatPromoPrice`·`formatRegularPrice`, 검증일 `formatVerifiedDate`(**date-fns 사용, `.split('T')[0]` 금지** — Hard Threshold ①)
- [ ] `src/entities/plan/index.ts` — barrel export

### 4b-3. shared/db (Drizzle/D1 + 시드 + repository)
- [ ] `src/shared/db/schema.ts` — Drizzle plan 테이블 스키마(D1, entities/plan 필드 1:1)
- [ ] `src/shared/db/repository.ts` — `findAll()`·`findById(id)`·`filter(criteria)`. **단일 쿼리(N+1 0)**, `@/shared/env` 경유, `@/shared/perf.trackFetch` 래핑(4d 배선 자리)
- [ ] `src/shared/db/seed.sql` — 시드 50~150건(알뜰폰 80%/MNO 20%, 3망 균등, 30~40%가 7개월 프로모: regularPrice·promoMonths 채움)
- [ ] `migrations/` — Drizzle 마이그레이션 생성
- [ ] `src/shared/db/index.ts` — barrel export

### 4b-4. shared/cache (KV/Cache 계층 — Hard Threshold ④)
- [ ] `src/shared/cache/index.ts` — KV 캐시 read-through. 목록·상세 캐시 키, TTL 3600s. `@/shared/env`(CACHE KV) 경유. 동일 D1 반복호출 0 보장

### 4b-5. API 핸들러 데이터 배선 (4a 스텁 채움)
- [ ] `app/api/plans/route.ts` — `@/shared/cache`→`@/shared/db.filter(query)` 배선. p95 ≤ 120ms 목표(KV 히트)
- [ ] `app/api/plans/[id]/route.ts` — `@/shared/cache`→`@/shared/db.findById` 배선. p95 ≤ 100ms 목표

### 4b 수용 기준
- [ ] D1/KV 접근 100% `@/shared/env` 경유 (직접 접근 0 — Hard Threshold ②)
- [ ] repository N+1 0 (목록 단일 쿼리, 상세 단건 PK)
- [ ] 동일 업스트림 반복호출 `@/shared/cache` 통과 (미경유 0)
- [ ] `formatVerifiedDate`가 date-fns 사용 (`.split('T')[0]` 0)
- [ ] 시드 50~150건 적재, 프로모 30~40% regularPrice/promoMonths 채움
- [ ] typecheck 0 / lint 0 / 4b-QA 게이트 통과

---

## Phase 4c — ui-developer (features 구현 + widgets + page 조립, shadcn)

> 의존성: 4b(entities/plan) 완료 필요. 산출: 클라 순수함수 features·widgets·page 조립. 디자인 토큰은 Phase 3(design-architect) 산출물 사용.

### 4c-1. features 구현 (클라 순수함수 — 서버 호출·PII 0)
- [ ] `src/features/plan-filter/parse.ts` — `parseFilters(searchParams)`·`serializeFilters(state)` (searchParams ↔ 상태, 공유가능 URL)
- [ ] `src/features/plan-filter/apply.ts` — `applyFilters(plans, state)`·`sortPlans(plans, sort)` (price↑/data↓/recommend)
- [ ] `src/features/plan-filter/quickchips.ts` — 퀵칩 4종 매핑(price_under_10k·data_unlimited·mvno_only·no_contract) ↔ 필터 AND 결합
- [ ] `src/features/plan-filter/index.ts` — barrel
- [ ] `src/features/plan-compare/compare.ts` — `parseCompareIds(searchParams)`(최대 3, 초과 차단)·`buildCompareMatrix(plans)`
- [ ] `src/features/plan-compare/index.ts` — barrel
- [ ] `src/features/plan-recommend/score.ts` — `scorePlan(plan, usage)`·`recommend(plans, usage)`·`USAGE_PRESETS`(5종: call_only 1GB·web_7g·commute_15g·video_71g·unlimited_100g). **순수함수, INP ≤ 200ms**
- [ ] `src/features/plan-recommend/index.ts` — barrel
- [ ] `src/features/saving-calculator/calc.ts` — `calcSaving(currentPrice, targetPlan)`(월·연 절약액)·`savingInputSchema`(Zod: 음수·0·과대 검증). **클라 계산·서버 미저장**
- [ ] `src/features/saving-calculator/index.ts` — barrel

### 4c-2. shared/config·lib (features 보조)
- [ ] `src/shared/config/index.ts` — 가격 버킷(under_10k·10k_25k·25k_40k·over_40k)·데이터 버킷·퀵칩 정의·프리셋 상수
- [ ] `src/shared/lib/index.ts` — searchParams 헬퍼·date-fns 포맷·Zod 유틸 barrel

### 4c-3. widgets (shadcn/ui, next/image width/height 필수 — CLS 0)
- [ ] `src/widgets/plan-card/index.tsx` — 카드 4블록(데이터+속도 / 통화·문자 / 망·세대 / **프로모가+종료후정가 병기**). 비교담기 버튼(features/plan-compare)
- [ ] `src/widgets/filter-bar/index.tsx` — 필터바 + 퀵칩 4종 + 정렬 드롭다운 (features/plan-filter)
- [ ] `src/widgets/plan-list/index.tsx` — 목록 + **결과 카운트("N개의 결과")** + 페이지/무한스크롤 (고정높이 스켈레톤)
- [ ] `src/widgets/compare-table/index.tsx` — 나란히 비교 테이블(데이터·속도·통화·문자·망·프로모가·정가·약정 행)
- [ ] `src/widgets/usage-preset-modal/index.tsx` — 사용량 프리셋 5종 모달 + 직접입력(데이터GB·통화분)
- [ ] `src/widgets/disclaimer/index.tsx` — `lastVerifiedAt` 검증일 + "큐레이션 스냅샷·수시 변동" 면책

### 4c-4. page 조립 (4a 셸에 widgets/features 주입)
- [ ] `app/page.tsx` — 랜딩: 가치제안 + **절약 계산기 히어로**(saving-calculator) + 추천 진입 CTA. LCP ≤ 1.2s
- [ ] `app/plans/page.tsx` — filter-bar + plan-list 조립. 초기 전체목록 서버 페치 + 클라 필터
- [ ] `app/plans/[id]/page.tsx` — 상세: 전체 스펙 + **정직성 가격 병기**(promo+regular+promoMonths) + 검증일. `generateStaticParams`로 전 plan 프리렌더
- [ ] `app/compare/page.tsx` — compare-table 조립, `?ids=` 기반
- [ ] `app/recommend/page.tsx` — usage-preset-modal + 추천 결과 리스트(클라 스코어링)
- [ ] `app/calculator/page.tsx` — saving-calculator 전용 페이지

### 4c 수용 기준
- [ ] 필터 상태 URL searchParams 직렬화 — 복사 시 동일 결과 재현(US-002)
- [ ] 정직성 가격 병기 — 정가 숨김 0(US-005), 상세·카드 양쪽
- [ ] 추천·계산기 클라 순수함수 — 서버 호출 0, PII 0(현재요금 네트워크 전송 0)
- [ ] 비교 3개 초과 선택 차단
- [ ] `next/image` width/height 전부 명시(CLS 누락 0)
- [ ] 무인증 — 어떤 page도 로그인 게이트 0
- [ ] FSD 의존성 위반 0(역방향 import 0), barrel 누락 0
- [ ] typecheck 0 / lint 0 / `any` 0 / 4c-QA 게이트 통과

---

## Phase 4d — perf-engineer (관측 배선: trackFetch·AE 상수·Web Vitals 비콘)

> 의존성: 4b(db/cache)·4c(features/page) 완료 필요. 산출: 관측 3층 — Hard Threshold ⑤.

### 4d-1. shared/perf (계측 단일 통로)
- [ ] `src/shared/perf/events.ts` — AE 이벤트 상수 `EVENTS.*`(session_start·view_plan_list·apply_filter·toggle_quickchip·view_plan_detail·add_compare·view_compare·open_usage_preset·select_usage_preset·recommend_run·saving_calc·core_action·cta_click·disclaimer_view·web_vital). **매직 스트링 0**
- [ ] `src/shared/perf/instrument.ts` — `trackFetch()` 래퍼(latency 자동 계측, `@/shared/env`로 AE 접근). 모든 데이터 호출 유일 통로
- [ ] `src/shared/perf/vitals.ts` — Web Vitals 비콘(LCP/INP/CLS → AE `web_vital` 이벤트, 파라미터 metric·value·route·rating)
- [ ] `src/shared/perf/index.ts` — barrel

### 4d-2. 계측 배선 (기존 호출에 trackFetch·이벤트 주입)
- [ ] `src/shared/db/repository.ts` — 전 D1 호출 `trackFetch` 경유 확인
- [ ] `app/api/plans/route.ts`·`[id]/route.ts` — 데이터 호출 `trackFetch` 래핑
- [ ] `app/layout.tsx` — Web Vitals 비콘 마운트(`vitals.ts`)
- [ ] features/page에 AE 이벤트 배선 — apply_filter·toggle_quickchip·recommend_run·saving_calc·view_* 등 (PII 0, 버킷화: saving_bucket·price_bucket·data_bucket·call_bucket)
- [ ] North Star 측정 배선 — recommend_run/saving_calc ∩ view_compare/view_plan_detail 세션 교집합

### 4d-3. PII·관측 계약 검증
- [ ] 현재요금/절약액 절대값 AE·log·network 노출 0 → `saving_bucket`(none·under_5k·5k_15k·over_15k)만
- [ ] 이메일·전화·실명·정확위치 파라미터 0, referrer는 `referrer_kind`만
- [ ] 직접 AE 호출 0 (전부 `@/shared/perf` 래퍼 경유)

### 4d 수용 기준
- [ ] Web Vitals 비콘 배선 완료(미배선 0 — Hard Threshold ⑤)
- [ ] 모든 데이터 호출 `trackFetch` 경유(미경유 0)
- [ ] 이벤트명 전부 `EVENTS.*` 상수(매직 스트링 0)
- [ ] PII·절대값 노출 0 (버킷화만)
- [ ] typecheck 0 / lint 0 / 4d-QA 게이트 통과

---

## 전역 QA 게이트 (각 sub-phase 종료 시 qa-reviewer)
- [ ] `npm run typecheck` 오류 0
- [ ] `npm run lint` 에러 0, `any` 0
- [ ] `npm run test` 통과 (features 순수함수 단위 테스트: parseFilters·scorePlan·calcSaving 우선)
- [ ] 라우트 실제 `revalidate`/`generateStaticParams`/`dynamic`이 rendering-stub 선언과 일치
- [ ] server-only 코드(D1·시크릿) 클라이언트 번들 미유출
- [ ] FSD 레이어 의존성 위반 0, barrel 누락 0
