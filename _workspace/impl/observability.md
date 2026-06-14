---
project: ratsaver
phase: 4d
title: Observability — 관측 3층 배선(trackFetch·AE 이벤트·Web Vitals 비콘)
status: completed
created: 2026-06-14
updated: 2026-06-14
owner: perf-engineer
---

# observability — ratsaver (Phase 4d)

> perf-engineer 산출. Hard Threshold ⑤(관측) 충족 — Web Vitals 비콘·API latency 계측·KPI 이벤트(매직스트링 0·EVENTS 단일통로)·PII 0.
> 모든 analytics는 `@/shared/perf` 래퍼 경유. 4a/4b가 깐 trackFetch·Web Vitals 비콘 위에 KPI 이벤트 층을 추가.

## 1. `@/shared/perf` 모듈 (관측 단일 통로)

| 파일 | 역할 | 경계 |
|------|------|------|
| `events.ts` | `EVENTS.*` 상수 카탈로그 15종(kpis.md 1:1)·`TEventName` 유니온(매직스트링 차단)·`INTENT_EVENTS`/`DECISION_EVENTS`(North Star) | 동형(클라+서버) |
| `event-schema.ts` | `eventPayloadSchema`(Zod) — 이벤트명 화이트리스트 + **PII 경계 차단**(number는 소정수만→절대금액 거부) | 서버(수집 라우트) |
| `event-beacon.ts` | `trackEvent(EVENTS.*, params)` — sendBeacon→`/api/events`, pathname만(쿼리·해시 제외), SSR no-op | **클라** |
| `event-sink.ts` | `createAnalyticsEngineEventSink(PERF)` — AE writeDataPoint(직접 AE 호출 0) | 서버 |
| `ViewBeacon.tsx` | 마운트 1회 view_* 발화 클라 leaf(서버 페이지가 경계 안 넘기고 이벤트만 배선) | 클라 |
| `SessionBeacon.tsx` | 세션당 1회 `session_start`(entry_route·referrer_kind·returning) | 클라 |
| `index.ts` | barrel — 클라 안전 export만(`trackFetch`/`trackEvent`/`EVENTS`/타입). AE sink는 서버 라우트가 submodule 직접 import | — |
| (기존) `instrument.ts` | `trackFetch` — 모든 데이터 호출 latency 계측 | 서버 |
| (기존) `vitals.ts`·`WebVitals.tsx`·`vitals-sink.ts`·`vitals-schema.ts` | Web Vitals 비콘 | 클라+서버 |

> barrel은 클라 컴포넌트가 import해도 안전(AE 바인딩 비유출). API 라우트는 `@/shared/perf/sink`·`event-sink`를 직접 submodule import → 서버 전용 코드가 클라 번들에 새지 않음(build 검증).

## 2. Web Vitals 비콘 (Hard Threshold ⑤ — 미배선 0)

- `WebVitals.tsx`가 루트 `app/layout.tsx`에 마운트(4a/4b 기배선) → `onLCP/onINP/onCLS/onTTFB`→`navigator.sendBeacon('/api/vitals')`.
- `/api/vitals`(POST)가 `vitalsPayloadSchema` 검증 후 `createAnalyticsEngineVitalsSink(PERF)`로 AE 기록. 자기 latency도 trackFetch 경유.
- route(pathname)·metric·value·id만 전송 — PII 0. 라우트별 차등 예산은 Phase 5.5 게이트가 동일 수치로 벤치.

## 3. API latency 계측 (trackFetch 경유 — 미경유 0)

전 데이터 경로가 `@/shared/perf.trackFetch` 통과(4b 배선 검증·보강 불필요):

| 경로 | trackFetch 경유 | cache 필드 |
|------|----------------|-----------|
| `app/api/plans` GET | `getCachedPlans`→`cachedJson`(trackFetch) | hit/miss |
| `app/api/plans/[id]` GET | `getCachedPlanById`→`cachedJson`(trackFetch) | hit/miss |
| `app/api/vitals` POST | trackFetch(route='/api/vitals') | none |
| `app/api/events` POST | trackFetch(route='/api/events') | none |
| `app/api/hello` GET | trackFetch | none |
| `shared/db/repository` D1 | `cachedJson` 내부 loader로만 호출(전부 캐시 경유) | — |

- grep 검증: `writeDataPoint` 직접 호출 0(전부 `src/shared/perf/` 내부)·클라 직접 fetch(analytics) 0.

## 4. KPI 이벤트 배선 (EVENTS.* 상수 · 매직스트링 0 · 버킷화)

| 이벤트 | 발화 위치 | 파라미터(PII 0) |
|--------|-----------|------------------|
| `session_start` | `SessionBeacon`(layout, 세션 1회) | entry_route(라우트종류), referrer_kind, returning(bool) |
| `view_plan_list` | `plan-list`(마운트 1회) | result_count_bucket, has_filter(bool) |
| `apply_filter` | `plan-list`(debounce 확정) | filter_keys(축이름), sort, result_count_bucket |
| `toggle_quickchip` | `plan-list`(칩 변경) | chip_id, active(bool) |
| `view_plan_detail` | `/plans/[id]`(ViewBeacon) | network, price_bucket, is_mvno, has_promo |
| `add_compare` | `compare-toggle`(추가 시) | compare_count(1~3) |
| `view_compare` | `/compare`(ViewBeacon, 대상>0) | compare_count |
| `open_usage_preset` | `usage-preset-modal`(열기) | (없음) |
| `select_usage_preset` | `usage-preset-modal`·`recommend-panel` | preset_id |
| `recommend_run` | `recommend-panel`(사용량 적용) | input_kind(preset\|manual), data_bucket, call_bucket |
| `saving_calc` | `saving-result`(계산 실행) | **saving_bucket**(절대값 0), period |
| `core_action` | filter/recommend/calc 첫 행동 | action_kind |
| `disclaimer_view` | `/plans/[id]`(ViewBeacon) | surface=detail |
| `web_vital` | `/api/vitals`(비콘 수집) | metric, value, route |
| `cta_click` | (2차 제휴 CTA 스텁 — MVP 미발화) | cta_slot |

### North Star("추천→결정 도달률 ≥ 40%") 측정 배선
- 분자 의도 시그널: `recommend_run`·`saving_calc`(`INTENT_EVENTS`).
- 분자 결정 시그널: `view_compare`·`view_plan_detail`(`DECISION_EVENTS`).
- AE 세션 집계로 `INTENT ∩ DECISION / INTENT 세션` 산출(AE 쿼리는 /perf 대시보드·5.5에서). 이벤트 route + AE 인덱스로 세션 묶음 가능.

## 5. PII·관측 계약 검증 (Hard Threshold ③⑤)

- **절대값 0**: 현재요금·절약액·정확 가격/데이터/통화 → 전부 버킷 헬퍼(`savingBucket`·`priceBucket`·`dataBucket`·`callBucket`·`resultCountBucket`) 경유. grep: trackEvent params에 raw 금액 0.
- **이중 방어**: `event-schema`가 서버 경계에서 number를 소정수(≤1000)로 제한 → 클라가 실수로 금액을 넣어도 AE 미기록(거부). 단위 테스트로 45000 거부 검증.
- **referrer**: 원본 URL·쿼리 금지 → `referrer_kind`(direct/internal/search/social/other)로만 분류.
- **비교/추천**: plan id만(PII 아님)·sessionStorage 누적, 서버 미전송.
- **매직스트링 0**: 전 발화가 `EVENTS.*`·`TEventName` 타입 강제. grep: EVENTS 외 문자열 이벤트 0.
- **직접 AE 0**: writeDataPoint는 `src/shared/perf/` 내부에만. 라우트는 sink 팩토리 경유.
- **console PII 0**: `console.error`는 `error.digest`/`error.message`만(요금/입력값 0).

## 6. 버킷 헬퍼 추가 (`src/shared/config`)

`savingBucket`(기존)에 더해 `priceBucket`·`dataBucket`·`callBucket`·`resultCountBucket` 추가 — kpis.md 버킷화 규칙 SSOT. AE 파라미터는 이 헬퍼 출력만 사용.

## 7. 신규 라우트

- `app/api/events` (POST, `dynamic='force-dynamic'`, runtime=edge 0) — KPI 이벤트 비콘 수집. matrix 미선언 라우트지만 `/api/vitals`와 동일 관측 인프라 라우트(쓰기전용 비콘 수집). **cf-architect에 rendering-matrix `/api/events` 1행 추가 요청 권장**(② 누락 0 유지 — /api/vitals와 동일 SSR-edge·캐시 none·계측 비콘).

## QA 결과

- `npm run typecheck` → **0**
- `npm run lint` → **0** (`any` 0)
- `npm run test` → **146 passed (25 files)** — 신규 18: events(5)·event-schema(5)·event-beacon(3)·config buckets(5)
- `npm run build` → **성공**(130 정적 페이지·`/api/events` dynamic 등록·전 라우트 전략 matrix 일치·서버코드 클라 비유출)
- grep: 매직스트링 이벤트 0·직접 AE 0·trackEvent params 절대금액 0·`any` 0

## 다음 (4d-QA → 5 QA / 5.5 Perf Gate)

- 4d-QA(qa-reviewer): Web Vitals 비콘·trackFetch 미경유 0·매직스트링 0·PII 0 정량 재확인.
- cf-architect: `/api/events` rendering-matrix 1행 추가(② 누락 0).
- 5.5 Perf Gate(perf-engineer): 전 엔드포인트 p95 벤치 + Web Vitals(LCP/INP/CLS) + 번들 gz vs PRD §9 예산 PASS/FAIL.
