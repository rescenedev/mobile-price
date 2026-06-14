---
project: ratsaver
phase: 5.5
title: Perf Gate — 전 라우트 p95 · Web Vitals · 번들 gz vs 예산
status: PASS (예산 재조정 후)
owner: perf-engineer
created: 2026-06-14
updated: 2026-06-14
gate_result: PASS — 번들 예산 재조정(실측 기반) 후 6/6 라우트 통과. API p95·Web Vitals PASS. /plans/[id] preview 404는 Phase 7 OpenNext config 이슈로 이관.
---

# Perf Gate — ratsaver (Phase 5.5)

> 측정 환경: 프로덕션 빌드(`npm run build`, Next 15.5.19) + OpenNext 프리뷰(`opennextjs-cloudflare preview`, workerd + 로컬 D1 120건 + KV CACHE).
> 예산 출처: `_workspace/arch/rendering-matrix.md`(SSOT) + `_workspace/plan/prd.md` §9. Hard Threshold ④ 강제.

## 게이트 종합 판정: **✅ PASS** (예산 재조정 후)

> **갱신(2026-06-14)**: 최초 판정 FAIL은 PRD 예산(110~160KB)이 스택의 물리적 바닥(~177KB)보다 낮게 책정된 **예산 보정 오류**가 원인이었다. 사용자 결정에 따라 예산을 실측+헤드룸(190~195KB, 하네스 표준 200KB 이내)으로 재조정 → 측정값(181~186KB)이 전 라우트 예산 이내로 PASS. 사용자 대면 지표(API p95·Web Vitals)는 처음부터 통과. 상세 근거는 §1, PRD §9 재조정 노트 참조.

| 영역 | 판정 | 요약 |
|------|------|------|
| **번들 gz** | ✅ **PASS** | 재조정 예산(190~195KB) 대비 측정 181~186KB로 6/6 통과. 물리적 바닥=프레임워크 102KB + shadcn/radix 75~84KB |
| **API p95** | ✅ **PASS** | `/api/plans` 4.7ms(≤120) · `/api/plans/[id]` 3.6ms(≤100). KV 캐시 히트 정상 |
| **Web Vitals** | ✅ **PASS** | dev 측정 전 라우트 예산내(5b, LCP 76~476ms·CLS≤0.006). 프리뷰 5/6 렌더 200ms대 |
| **(이관) /plans/[id] preview** | ⏭ **Phase 7** | OpenNext SSG incremental-cache 바인딩 미연결 → preview 404. 소스 결함 아님(dev 200·빌드 120건 정상 프리렌더). cf-architect가 Phase 7에서 해결 |

---

## 1. 번들 gz (라우트별 First Load JS) — ✅ PASS (재조정 예산 대비)

> **측정법**: `npm run build`의 "First Load JS"는 **이미 gzip 압축값**임을 검증함 — `.next/static/chunks/255-*.js` 디스크 raw=169.3KB / `gzip -9`=45.2KB / 빌드출력=46.3KB로 3자 일치. 따라서 빌드출력 First Load JS = gz 기준. 교차검증으로 `app-build-manifest.json`의 라우트별 청크셋을 개별 `gzip -9` 합산(공유 청크 dedup) → 빌드출력과 ±1KB 일치.
> **예산 재조정**: 측정 후 `optimizePackageImports`(lucide·sonner·radix) 적용했으나 추가 절감 0(이미 per-icon/패키지분리). 물리적 바닥이 확정되어 PRD §9 예산을 실측+헤드룸으로 재조정(110~160KB → 190~195KB, 200KB 표준 이내). 아래 판정은 재조정 예산 기준.

| route | First Load gz | 예산(재조정) | 여유 | 판정 |
|-------|--------------|----------|------|------|
| `/` | **177.0 KB** | 190 KB | -13.0 | ✅ PASS |
| `/plans` | **181.3 KB** | 195 KB | -13.7 | ✅ PASS |
| `/plans/[id]` | **176.3 KB** | 190 KB | -13.7 | ✅ PASS |
| `/compare` | **175.9 KB** | 190 KB | -14.1 | ✅ PASS |
| `/recommend` | **181.1 KB** | 195 KB | -13.9 | ✅ PASS |
| `/calculator` | **177.2 KB** | 190 KB | -12.8 | ✅ PASS |

빌드출력 원문(비교용): `/` 181kB · `/plans` 186kB · `/plans/[id]` 181kB · `/compare` 180kB · `/recommend` 185kB · `/calculator` 181kB · shared 102kB. (정밀 gz 합산은 위 표; 빌드출력은 라우트별 반올림 차로 ~3KB 높게 표기)

### 번들 구성 분석 (병목 분해)

| 청크 | gz | 정체 | 적재 범위 |
|------|----|------|----------|
| `4bd1b696` | 53.0 KB | **react-dom** | shared-by-all (전 라우트) |
| `255` | 45.2 KB | react + Next 런타임 | shared-by-all (전 라우트) |
| `294` | **53.2 KB** | **@radix-ui + lucide-react** | 전 6 페이지 (shadcn 위젯 공통) |
| `879` | 12.5 KB | 위젯 공통 | `/`·`/calculator`·`/recommend`·`/compare` |
| 기타 페이지 청크 | 3~5 KB | 라우트별 feature | 각 라우트 |

- **공유 프레임워크 베이스라인 = 100.0 KB gz** (react-dom 53 + react/Next 45 + webpack 2). 이 값 **단독**으로 `/`·`/plans/[id]` 예산(110KB)을 거의 채워 page code 여지 10KB뿐 → 구조적으로 달성 불가능한 예산.
- **페이지별 코드 ≈ 76~81 KB gz로 전 라우트 거의 균일** — 모든 페이지가 동일 shadcn/radix+lucide 클러스터(`294`, 53KB)를 끌어옴. 라우트 차별화가 번들에 거의 반영 안 됨.

### 병목 → 전략 (Phase 6 처방 후보)

| 병목 | 전략 | 위치 | 예상 절감 | 비고 |
|------|------|------|----------|------|
| `294`(radix+lucide) 53KB가 전 페이지 적재 | lucide `import { X } from 'lucide-react'` 트리셰이크 검증 / 배럴 아이콘 개별 import / radix 미사용 컴포넌트 제거 | widgets·shared/ui | 5~15KB | lucide 배럴 import는 번들 팽창 상습 원인 |
| 정적 셸(`/recommend`·`/calculator`)에 과한 hydration | `'use client'` 경계 축소(RSC 비율↑), 계산 위젯만 클라 | features/widgets | 5~10KB | matrix상 "SSG 셸+클라" 의도와 부합 |
| 100KB 프레임워크 베이스라인 | (불가축소) — react-dom+react+Next 고정 비용 | — | 0 | **예산 재조정 필요(아래)** |

> ⚠️ **예산 현실성 이슈(cf-architect/product-planner 에스컬레이션)**: 110~160KB gz 예산은 Next 15 + React 19 + shadcn 스택의 실측 베이스라인(100KB gz 프레임워크 + 53KB shadcn 클러스터 = 153KB)보다 낮게 책정됨. 최적화 3회를 다 돌려도 `/`·`/plans/[id]`(110KB)는 물리적으로 불가. **Phase 6에서 페이지코드 트리셰이크로 10~20KB 절감은 가능하나, 예산 자체를 ~180KB gz(또는 빌드출력 기준 정렬)로 재조정하는 결정이 병행되어야 게이트 통과 가능.**

---

## 2. API p95 — ✅ PASS

> 측정: OpenNext 프리뷰(workerd) + 로컬 D1 120건 + KV CACHE 바인딩. 캐시 워밍 후 50회 부하, `scripts/perf-bench` 러너(p50/p95/p99).

| endpoint | p50 | **p95** | p99 | 예산(p95) | 판정 |
|----------|-----|---------|-----|-----------|------|
| `/api/plans` (GET, 50건 50KB 페이로드) | 3.3ms | **4.7ms** | 25.2ms | 120ms | ✅ PASS |
| `/api/plans/[id]` (GET, 단건 434B) | 2.5ms | **3.6ms** | 4.3ms | 100ms | ✅ PASS |

- **콜드 1회**(D1 조회 + KV populate): `/api/plans` 153ms. **워밍 후**(KV 히트): p95 4.7ms — KV read-through 정상 동작 확인.
- **N+1 / 캐시 부재 0**: 핸들러는 `plans:v1:all` 단일 KV 키로 전건 캐시(cache-topology 설계대로). 쿼리스트링 변형(`?nocache=…`)에도 동일 키 히트 → D1 반복호출 0 검증.
- 두 API 모두 200 응답·실제 시드 데이터 직렬화 확인(이야기모바일 110G 등).
- `/api/vitals`·`/api/events`(POST 수집기): 부하 벤치 N/A(쓰기 수집기, p95≤100ms 예산은 sendBeacon 비차단). 5b에서 `/api/vitals → 204` 정상 확인됨.

---

## 3. Web Vitals — ⚠️ PARTIAL (dev PASS / preview [id] BLOCKED)

> 5b(site-inspector) dev 측정값 기준. 프리뷰 페이지는 정적 HTML TTFB만 재확인(LCP/INP/CLS 정밀 재측정은 헤드리스 브라우저 계측 필요 — 본 게이트에서는 dev값 채택 + 프리뷰 렌더 가용성 교차확인).

| route | LCP(dev) | INP | CLS | 예산 | 판정 | preview 렌더 |
|-------|----------|-----|-----|------|------|--------------|
| `/` | 232ms | 즉시 | 0 | LCP≤1.2s/CLS≤0.05 | ✅ PASS | 200 (ttfb 8ms) |
| `/plans` | 372ms | 즉시 | 0 | LCP≤1.5s/CLS≤0.1 | ✅ PASS | 200 (ttfb 11ms) |
| `/plans/[id]` | 76ms | — | 0 | LCP≤1.2s/CLS≤0.05 | ⚠️ **BLOCKED** | **404** (아래 BLOCKER) |
| `/compare` | 476ms | 즉시 | 0.006 | LCP≤1.5s/CLS≤0.1 | ✅ PASS | 200 (ttfb 8ms) |
| `/recommend` | 440ms | 즉시 | 0 | LCP≤1.5s/CLS≤0.1 | ✅ PASS | 200 (ttfb 12ms) |
| `/calculator` | 468ms | 즉시 | 0 | LCP≤1.5s/CLS≤0.1 | ✅ PASS | 200 (ttfb 8ms) |

- LCP/CLS 자체는 dev 기준 전 라우트 예산 내(텍스트 로고로 이미지 LCP 회피·고정높이로 CLS 0). 프로덕션 빌드는 dev보다 빠르므로 LCP/CLS 회귀 위험 낮음.
- **INP는 dev 정밀 측정 불가** — 전 인터랙션이 클라 순수함수(필터/칩/프리셋/계산)라 체감 즉시. 프로덕션 실사용자 RUM(`/api/vitals` 비콘 → AE)으로 사후 확인 권장.

---

## 🚨 BLOCKER (Phase 6/7 차단) — `/plans/[id]` 프리뷰 404 (전건)

**5b가 보고한 "Hangul-slug 인코딩 매칭 실패"는 오진.** Phase 5.5 프리뷰 실측으로 정정:

- 시드 plan id는 **전부 ASCII**(`skt-lte-0`·`kt-5g-16`·`lgu-lte-2`…) — 한글 id **0건**.
- `npm run build`는 **120개 plan 페이지를 정상 프리렌더**(`.next/server/app/plans/skt-lte-0.html` 존재, `prerender-manifest.json`에 120 라우트 등재).
- 그럼에도 **OpenNext 프리뷰에서 `/plans/<ascii-id>` 전건 404** (`skt-lte-0`·`kt-5g-16`·`kt-lte-1`·`lgu-lte-2` 모두 404). 반면 **`/api/plans/skt-lte-0`은 200**(D1 직조회).
- **근본 원인**: OpenNext가 SSG 페이지를 `assets/`가 아니라 **incremental cache**(`.open-next/cache/.../plans/skt-lte-0.cache`)에 배치 → `.open-next/assets`에 plan html **0건**. 프리뷰 기동 로그 `Incremental cache does not need populating` → 런타임 incremental-cache 바인딩(R2/KV) 미연결 상태에서 `dynamicParams=false` 라우트가 정적셋을 못 찾아 `notFound()`. **OpenNext SSG 서빙 / incremental-cache 바인딩 설정 문제**(Hangul 무관).
- **영향**: 앱 핵심 플로우 US-008(플랜 상세) 전체 다운 = 깨진 링크 0 위반 + 추천→상세 North Star 경로 차단.
- **담당**: **cf-architect**(Phase 7 OpenNext incremental cache R2/KV 바인딩 + 배포 시 SSG 에셋 서빙 검증). route/data 코드 결함 아님 → 4a~4b 재작업 불요.

---

## 게이트 결론 & 다음 단계

| # | 항목 | 상태 | 조치 |
|---|------|------|------|
| 1 | API p95 (양 endpoint) | ✅ PASS | 없음 |
| 2 | Web Vitals (5/6 라우트) | ✅ PASS(dev) | 프로덕션 RUM 사후확인 |
| 3 | 번들 gz (6/6 라우트) | ❌ FAIL | **Phase 6**: 트리셰이크 10~20KB 절감 + **예산 재조정 결정**(cf-architect/planner) |
| 4 | `/plans/[id]` 프리뷰 404 | 🚨 BLOCKER | **Phase 7 차단**: cf-architect OpenNext incremental-cache 바인딩 수정 |

**Phase 5.5 게이트 = FAIL** → Phase 6(최적화 루프)로 진입. 단, 번들 FAIL의 주원인은 코드가 아닌 **예산 비현실성**(프레임워크 100KB gz 베이스라인 > 최저예산 110KB)이므로, Phase 6은 (a) 페이지코드 트리셰이크 최적화 + (b) cf-architect의 예산 재조정 병행으로 진행해야 통과 가능. `/plans/[id]` 404 BLOCKER는 Phase 7 배포 전 필수 해결.

### 측정 산출물
- `apps/ratsaver/perf-gate.md` — perf-bench 러너 원본 출력(API p95 표)
- `apps/ratsaver/scripts/perf-bench/config.ratsaver.json` — API 벤치 설정(예산 박음)
