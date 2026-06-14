---
project: ratsaver
phase: 5a
title: QA Review Report — Hard Threshold 5종 전수 정량 검증
status: PASS (1 WARNING — 비차단)
reviewer: qa-reviewer
created: 2026-06-14
updated: 2026-06-14
---

# QA Review Report (Phase 5a) — ratsaver

> 검증 방식: 실제 명령 실행(typecheck/lint/test/build) + grep/AST. 추정 0.
> 대조 계약: `_workspace/arch/rendering-matrix.md`(8라우트 SSOT) · `_workspace/plan/kpis.md`(perf 예산·관측 계약).
> 앱 특성: **무인증**(세션·쿠키·SESSION KV·R2 미사용) → ③ 쿠키/Server Action CSRF 항목 일부 N/A. **이미지 미사용** → ④ next/image N/A.

---

## 0. 명령 실행 결과 (능동 검증)

| 명령 | 결과 | 증거 |
|------|------|------|
| `npm run typecheck` (tsc --noEmit) | **PASS** | EXIT 0, error 0 |
| `npm run lint` (eslint .) | **PASS** | EXIT 0, 출력 0 (clean) |
| `npm run test` (vitest run) | **PASS** | 25 files / **146 tests passed** (0 fail) |
| `npm run build` (next build) | **PASS** | Compiled successfully, 129 static pages 생성, 빌드 에러 0 |

---

## Hard Threshold Results

### ① 코드 품질

| 검사 | 결과 | 증거 (명령출력 / 파일:라인) |
|------|------|------|
| 타입 오류 | **PASS** | `tsc --noEmit` EXIT 0, error 0 |
| Lint 에러 | **PASS** | `eslint .` EXIT 0, 0 출력 |
| `any` 사용 | **PASS** | `grep -rnE ':\s*any\b\|<any>\|as any\|: any\[\]' src app` → 매치 0 |
| `eslint-disable` 우회 | **PASS** | grep → 매치 0 |
| FSD 의존성 위반 | **PASS** | lower→app 0 · entities/shared→widgets/features 0 · entities→features 0 |
| 동일레이어 deep-import | **PASS** | features 간 internal 경로 직참조 0 · widgets→features internal 0 |
| barrel 누락 | **PASS** | features/entities/widgets 전 슬라이스 `index.ts(x)` 존재. 11 widgets 전부 OK |
| 날짜 타임존 버그 | **PASS** | `toISOString().split('T')[0]` / `.substring(0,10)` → 매치 0 (date-fns 사용) |

> 참고(WARNING 아님): `src/features/__fixtures__/`는 barrel index 없음 → **테스트 전용 fixture 디렉토리**(`.test.ts`만 `../__fixtures__/plan`을 상대경로로 소비). 공개 FSD 슬라이스가 아니므로 barrel 불요. 위반 아님.

### ② 렌더링 & Cloudflare

| 검사 | 결과 | 증거 |
|------|------|------|
| 전략 미선언 라우트 | **PASS** | 디스크 10 라우트(6 page + 4 API) 전부 matrix 1행 존재 (matrix 8행 = 6 page + `/api/plans`·`/api/plans/[id]` 명시, vitals/events 포함 10라우트 전수 매핑됨) |
| 선언↔구현 일치 | **WARNING(1)** | 아래 표 — 9/10 일치, `/api/vitals`만 명시 선언 누락 (실제 런타임은 Dynamic) |
| 서버코드 클라 유출 | **PASS** | `'use client'` 파일에서 DB/env/process.env 런타임 참조 0. `filter-bar/index.tsx:7`의 `@/shared/db`는 **`import type TPlanSort`**(타입-온리, 컴파일 시 erase) → 런타임 유출 없음 |
| `server-only` 사용 | **PASS** | DB/AE 유틸 상단 `import 'server-only'` 배치: repository.ts·client.ts·db/index.ts·perf/ae-query.ts·api/plans·api/plans/[id] |
| 동적 라우트 캐시 부재 | **PASS** | `/api/plans`→`getCachedPlans`(KV read-through `plans:v1:all`)·`/api/plans/[id]`→`getCachedPlanById`(`plans:v1:id:{id}`). 둘 다 `@/shared/cache` 경유. vitals/events는 수집 전용→캐시 N/A(matrix 명시) |
| env 래퍼 우회 | **PASS** | `process.env` 직접 접근 0 · 바인딩(DB/CACHE/PERF)은 전부 `createEnvAccessor(env).get()` 경유. `getCloudflareContext().env` 직접 바인딩 접근 0 |
| `runtime='edge'` 금지 | **PASS** | 실제 `export const runtime='edge'` 선언 0 (grep 매치는 전부 "금지" 주석). OpenNext 호환 |

**선언↔구현 cross-check 표:**

| route | matrix 선언 | 실제 코드 | build 렌더 | 판정 |
|-------|-------------|-----------|-----------|------|
| `/` | (없음·SSG) | (없음) | ○ Static | ✅ |
| `/plans` | `revalidate=3600` | `revalidate=3600` (line 8) | ○ Static, Revalidate 1h | ✅ |
| `/plans/[id]` | `dynamicParams=false`+`generateStaticParams` | `dynamicParams=false`(15)+`generateStaticParams`(17) | ● SSG (120 paths) | ✅ |
| `/compare` | `revalidate=3600` | `revalidate=3600` (line 11) | ○ Static | ✅ |
| `/recommend` | (없음·SSG 셸) | (없음) | ○ Static | ✅ |
| `/calculator` | (없음·SSG 셸) | (없음) | ○ Static | ✅ |
| `/api/plans` | `dynamic='force-dynamic'` | `dynamic='force-dynamic'`(9) | ƒ Dynamic | ✅ |
| `/api/plans/[id]` | `dynamic='force-dynamic'` | `dynamic='force-dynamic'`(9) | ƒ Dynamic | ✅ |
| `/api/vitals` | `dynamic='force-dynamic'` | **선언 없음** | ƒ Dynamic | ⚠️ WARNING |
| `/api/events` | `dynamic='force-dynamic'` | `dynamic='force-dynamic'`(10) | ƒ Dynamic | ✅ |

### ③ 인증 & 보안

| 검사 | 결과 | 증거 |
|------|------|------|
| 세션 토큰 클라 저장 | **PASS (N/A 무인증)** | `(localStorage\|sessionStorage).(set\|get)Item.*(token\|session\|auth)` → 매치 0. localStorage/sessionStorage는 **비교트레이 plan id 목록**(use-compare-tray.ts, PII 아님)·**세션/seen bool 플래그**(SessionBeacon.tsx)만. 토큰 저장 0 |
| 쿠키 플래그 누락 | **N/A** | 무인증 → 인증 쿠키 0 (matrix line 26·73). `cookies().set` 없음 |
| Server Action CSRF | **N/A** | `'use server'` 0 · 변경 핸들러(PUT/DELETE/POST-mutation) 0. POST 2종(vitals/events)은 AE append-only 텔레메트리 수집기(상태변경·DB쓰기 0)이며 Zod 검증으로 입력 거부 |
| 시크릿 클라 노출 | **PASS** | `NEXT_PUBLIC_*(KEY\|SECRET\|TOKEN\|PASSWORD)` → 매치 0 |
| 토큰/PII 로그 | **PASS** | `console.*` 2건(error.tsx:17·plans/error.tsx:16) — 둘 다 `error.digest ?? error.message`만(Next 에러 다이제스트). token/email/password/session 인자 0 |
| POST 입력검증·PII 거부 | **PASS** | `/api/vitals`·`/api/events` 둘 다 `safeParse`→실패 시 400. event-schema: 이벤트명 `z.enum(EVENT_NAMES)` 화이트리스트(매직스트링 거부)·number `max(1000)`(raw 금액·요금 절대값 차단)·string len cap. vitals-schema: name enum·value 유한 비음수 |

### ④ 성능

| 검사 | 결과 | 증거 |
|------|------|------|
| D1 N+1 쿼리 | **PASS** | `findAll`=`db.select().from(plans).all()` 단일쿼리 · `findById`=PK 단일쿼리(limit 1) · `filter`=findAll 후 in-memory `applyCriteria`. `rows.map(rowToPlan)`은 메모리 매핑(쿼리 아님). 루프 내 await db 0 |
| 캐시 계층 부재 | **PASS** | 반복 동일 업스트림(D1 plans)은 `@/shared/cache` cachedJson(KV read-through 3600s) 경유. `/api/plans`·`/api/plans/[id]` 둘 다 적용 |
| next/image 누락 | **N/A** | `<img ` 0 · `next/image`/`<Image` 사용 0 (이미지 미사용 앱) → CLS 이미지 위험 없음 |
| 번들 예산 (gz) | **WARNING(측정유형)** | 아래 표 — **빌드 출력은 비압축 First Load JS**. matrix 예산은 gz. 정밀 gz 측정은 Phase 5.5 perf-gate가 수행. 비압축 수치만 기록 |

**First Load JS (비압축 — gz 예산과 직접 비교 불가, 5.5에서 정밀측정):**

| route | First Load JS(비압축) | matrix gz 예산 | 비고 |
|-------|----------------------|----------------|------|
| `/` | 181 kB | ≤ 110 KB gz | 비압축. 통상 gz ~30-35% → 추정 gz 대략 60KB대, 5.5 정밀 확인 필요 |
| `/plans` | 186 kB | ≤ 160 KB gz | 〃 |
| `/plans/[id]` | 181 kB | ≤ 110 KB gz | 〃 |
| `/compare` | 180 kB | ≤ 140 KB gz | 〃 |
| `/recommend` | 185 kB | ≤ 150 KB gz | 〃 |
| `/calculator` | 181 kB | ≤ 120 KB gz | 〃 |
| shared chunks | 102 kB | — | 공통 |

> ⚠️ 비압축 First Load JS는 gz 예산과 **단위가 달라** 여기서 PASS/FAIL 판정하지 않는다(에이전트 정의 지시). Phase 5.5 perf-gate가 gz 정밀 측정으로 최종 판정. 비압축 절대값은 동급 Next 앱 정상 범위.

### ⑤ 관측

| 검사 | 결과 | 증거 |
|------|------|------|
| trackFetch 미경유 | **PASS** | 서버 데이터/외부 호출 전부 `trackFetch` 경유: cachedJson(`cached-json.ts:31,39`)·ae-query(`ae-query.ts:87`)·api/vitals(17)·api/events(25). 잔여 raw `fetch()` 3건은 **클라 비콘 transport**(vitals.ts:20·event-beacon.ts:20 = sendBeacon keepalive 폴백)·ae-query.ts:91(=trackFetch 내부에서 호출) → 래퍼 밖 서버 fetch 0 |
| Web Vitals 비콘 | **PASS** | 루트 `app/layout.tsx:62` `<WebVitals/>` 마운트 → `WebVitals.tsx`가 `reportWebVitals()`(onLCP/onINP/onCLS/onTTFB)→`/api/vitals` 비콘. `<SessionBeacon/>`(63) 세션시작 비콘 |
| 매직스트링 이벤트 | **PASS** | 이벤트명 전부 `EVENTS.*` 상수(events.ts 카탈로그). plan-list/SessionBeacon/ViewBeacon 등 호출부 리터럴 이벤트명 0. event-schema가 `z.enum(EVENT_NAMES)`로 서버 강제 |
| 직접 analytics 호출 | **PASS** | `writeDataPoint` 4건 전부 `@/shared/perf` 싱크 내부(sink.ts·vitals-sink.ts·event-sink.ts·ae-query 주석). 래퍼 외부 직접 호출 0 |

---

## Sprint Verdict: **PASS** (Hard Threshold 위반 0)

5종 Hard Threshold 전부 임계값(0) 충족. 차단 FAIL 0건. WARNING 2건은 비차단(아래).

| Threshold | 판정 |
|-----------|------|
| ① 코드 품질 | **PASS** (typecheck 0·lint 0·any 0·FSD 0·barrel 0·날짜버그 0) |
| ② 렌더링 & CF | **PASS** (미선언 0·env우회 0·서버유출 0·캐시 OK · 단 vitals 명시선언 WARNING) |
| ③ 인증 & 보안 | **PASS** (무인증 N/A 항목 외 시크릿노출 0·PII로그 0·POST검증 OK) |
| ④ 성능 | **PASS** (N+1 0·캐시 OK·image N/A · 번들 gz는 5.5 위임) |
| ⑤ 관측 | **PASS** (trackFetch 100%·Vitals비콘 OK·매직스트링 0·직접호출 0) |

---

## ⚠️ Warnings (비차단 — 권장 개선)

1. **[`app/api/vitals/route.ts`] `export const dynamic = 'force-dynamic';` 명시 선언 누락**
   - matrix(line 61)는 전 API에 명시 `force-dynamic` 선언을 계약으로 요구. 나머지 3 API(plans·plans/[id]·events)는 선언 존재, vitals만 누락.
   - **실질 영향 0**: POST-only Route Handler는 Next.js에서 기본 Dynamic(정적 최적화 대상 아님). build 출력도 `ƒ /api/vitals` Dynamic으로 확인됨 → 런타임 동작은 계약과 동일.
   - **권장 수정**: `app/api/vitals/route.ts` line 9 `const ROUTE` 위에 `export const dynamic = 'force-dynamic';` 1줄 추가 → 계약 문자열 1:1 일치. 담당: route-builder.

2. **[번들 예산] 비압축 First Load JS만 측정 — gz 정밀 판정은 Phase 5.5로 위임**
   - 빌드 출력(180~186kB)은 비압축, matrix 예산은 gz. 단위 불일치로 본 게이트에서 PASS/FAIL 미판정(에이전트 정의 규칙).
   - **5.5 perf-gate가 gz 측정으로 라우트별 예산(`/`≤110·`/plans/[id]`≤110 등) 최종 검증 필요.** 비압축 절대값은 동급 Next 앱 정상 범위.

---

## 검증 체크리스트 (전부 완료)

- [x] typecheck/lint/test 실제 실행 — 0 에러 / 146 test pass
- [x] ①~⑤ 각 grep/명령 실행 후 매치 결과 기록
- [x] rendering-matrix vs page/route 선언 1:1 cross-check (10/10, 9 일치 + 1 WARNING)
- [x] 무인증 → ③ 쿠키/CSRF N/A 처리, 켜진 항목 전수 grep
- [x] `_workspace/qa/code-review.md` 증거 포함 작성
- [x] pipeline-status 5a 갱신
