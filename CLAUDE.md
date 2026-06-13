# CLAUDE.md

This file provides guidance to Claude Code when working with the **web-harness** repository.

## Project Overview

Next.js + Cloudflare **AI Agent Harness** — 아이디어부터 배포까지 풀스택 Next.js(App Router, on Cloudflare Workers) 앱을 양산하는 7-Phase 파이프라인. Feature-Sliced Design(FSD) + 정량 Hard Threshold 게이트로 "실패할 수 없게" 설계되었다.

설계 출처: `expo-demo` 리포의 `docs/superpowers/specs/2026-06-14-web-harness-design.md`.

## Tech Stack (생성앱 기본값)

- **Framework**: Next.js 15 (App Router, React 19)
- **Runtime/Deploy**: Cloudflare Workers via `@opennextjs/cloudflare`
- **Data**: D1(SQLite) + Drizzle ORM · KV(SESSION·CACHE) · Cache API · R2
- **Observability**: Cloudflare Analytics Engine
- **Auth**: better-auth (httpOnly 쿠키 세션)
- **Styling**: Tailwind CSS + shadcn/ui
- **Validation**: Zod
- **TypeScript**: strict

## Harness Engineering Rules (MANDATORY)

**이 리포의 모든 작업은 아래 하네스 규칙을 따른다. 에이전트와 스킬을 반드시 활용한다.**

1. **새 기능 구현 시**: FSD 구조 규칙을 따른다. route/feature/entity 생성 시 해당 에이전트 정의 파일(`.claude/agents/`)을 Read하고 지시를 따른다.
2. **풀 앱 개발 시**: `orchestrate` 스킬의 7-Phase 파이프라인을 따른다. Phase를 건너뛰지 않는다.
3. **QA는 생략할 수 없다**: 구현 완료 후 반드시 `npm run typecheck`, `npm run lint`, `npm run test`를 실행한다. Hard Threshold를 적용한다.
4. **`_workspace/` 블랙보드**: 에이전트 간 데이터는 `_workspace/`에 파일로 저장하여 전달한다. Phase 전환 시 이전 산출물을 Read하고 이어서 작업한다.
5. **렌더링 전략**: 모든 라우트는 `_workspace/arch/rendering-matrix.md`에 전략(SSG/ISR/SSR-edge)과 캐시 계층을 선언한 뒤 구현한다.
6. **배포 시**: `cf-architect`가 `wrangler`/OpenNext로 배포한다.

### Hard Thresholds (위반 시 작업 FAIL)

#### ① 코드 품질
| 기준 | 임계값 |
|------|--------|
| `npm run typecheck` 오류 | **0** |
| `npm run lint` 에러 | **0** |
| `any` 타입 사용 | **0** |
| FSD 레이어 의존성 위반 | **0** |
| barrel export 누락 | **0** |
| `new Date().toISOString().split('T')[0]`로 로컬 날짜 | **0** (date-fns/dayjs) |

#### ② 렌더링 & Cloudflare
| 기준 | 임계값 |
|------|--------|
| `rendering-matrix.md`에 전략 미선언된 라우트 | **0** |
| 선언 전략과 실제 `runtime`/`revalidate`/`dynamic` 불일치 | **0** |
| 서버 전용 코드(DB·시크릿)가 클라이언트 번들에 유출 (`server-only` 미사용) | **0** |
| 동적 라우트에 캐시 전략(revalidate/Cache) 부재 | **0** |
| D1/KV/R2/AE 바인딩을 타입드 `env` 래퍼(`@/shared/env`) 밖에서 접근 | **0** |

#### ③ 인증 & 보안
| 기준 | 임계값 |
|------|--------|
| 세션 토큰이 `localStorage`/`sessionStorage`에 저장 (httpOnly 쿠키 필수) | **0** |
| 인증 쿠키에 `httpOnly`+`Secure`+`SameSite` 누락 | **0** |
| Server Action/POST 핸들러에 origin/CSRF 검증 누락 | **0** |
| 시크릿이 `NEXT_PUBLIC_*` 또는 클라이언트 번들에 노출 | **0** |
| 토큰/PII가 `console.log`·analytics 파라미터에 노출 | **0** |

#### ④ 성능 (앱별 예산은 PRD에서 수치 확정, 게이트는 항상 강제)
| 기준 | 기본 임계값 |
|------|------------|
| API 엔드포인트 **p95** | **> 예산(기본 200ms) → FAIL** |
| 라우트 **LCP / INP / CLS** | **> 1.5s / 200ms / 0.1 → FAIL** |
| 동일 업스트림 API 반복 호출에 캐시 계층(KV/Cache) 부재 | **0** |
| D1 접근 N+1 쿼리 | **0** |
| 라우트별 클라이언트 JS 번들 | **> 예산(기본 200KB gz) → FAIL** |
| `next/image` 미사용 또는 width/height 누락(CLS 유발) | **0** |

#### ⑤ 관측
| 기준 | 임계값 |
|------|--------|
| Web Vitals 비콘 미배선 | **0** |
| API 호출 레이턴시 미계측 (`@/shared/perf` 래퍼 미경유) | **0** |
| 래퍼 미경유 직접 analytics 호출 / 매직스트링 이벤트명 | **0** |

> ④ 성능만 앱별 가변 — `perf-engineer`가 Phase 2에서 PRD의 perf 예산을 읽어 임계값을 주입. 나머지는 전 앱 고정.

### 렌더링 전략 규칙 (CRITICAL)

`_workspace/arch/rendering-matrix.md`가 라우트별 렌더링/캐시의 **단일 출처(single source of truth)**다. 모든 구현 에이전트는 여기를 읽고 따른다.

| 라우트 유형 | 전략 | Next 구현 |
|-------------|------|-----------|
| 정적 콘텐츠 | SSG | 기본 (동적 API 미사용) |
| 주기 갱신 콘텐츠 | ISR | `export const revalidate = N` |
| 요청별 개인화 | SSR (edge) | `export const runtime = 'edge'` / dynamic |
| 빈번한 동일 업스트림 | SSR + KV/Cache 계층 | `@/shared/cache` 경유 |

### 데이터 접근 규칙 (CRITICAL)

- D1/KV/R2/AE 바인딩은 **`@/shared/env`의 `createEnvAccessor(env).get(key)` 단일 통로**로만 접근한다. `process.env`/전역 직접 접근 금지.
- 모든 외부 API / 데이터 호출은 **`@/shared/perf`의 `trackFetch()`로 감싼다** — 자동 latency 계측. 래퍼 미경유 호출은 Hard Threshold ⑤ 위반.
- 반복되는 동일 업스트림 호출은 `@/shared/cache`(KV 또는 Cache API) 계층을 통과시킨다.

### 쿠키 세션 보안 규칙 (better-auth)

- 세션은 **httpOnly + Secure + SameSite=Lax** 쿠키로만. 토큰을 클라이언트 스토리지에 절대 저장하지 않는다.
- Server Action / 변경 POST 핸들러는 origin 검증을 거친다.
- 세션 저장소는 KV(`SESSION` 바인딩).

## Architecture: Feature-Sliced Design (FSD)

```
app/                 # Next.js App Router (라우트, Route Handler, Server Action)
src/
├── shared/          # env · db · kv · cache · auth · perf · ui(shadcn) · lib · config
├── entities/        # 도메인 모델
├── features/        # 비즈니스 로직
└── widgets/         # 독립 UI 블록
```

**의존성 규칙**: `app → widgets → features → entities → shared` (상위만 하위 참조).

### 3대 핵심 계약 (Hard Threshold가 강제)
1. `src/shared/env/` — D1/KV/R2/AE 접근 유일 통로 (②)
2. `src/shared/perf/instrument.ts` — 모든 데이터 호출 유일 통로 → 자동 계측 (④⑤)
3. `_workspace/arch/rendering-matrix.md` — 라우트별 렌더링/캐시 단일 출처 (②)

## 에이전트 활용 매핑

| 작업 유형 | 에이전트 | 참조 파일 |
|----------|---------|----------|
| 아이디어/리서치 | `idea-researcher` | `.claude/agents/idea-researcher.md` |
| 기획/PRD/perf예산 | `product-planner` | `.claude/agents/product-planner.md` |
| 스펙/Task 분해 | `spec-planner` | `.claude/agents/spec-planner.md` |
| 디자인/shadcn 테마 | `design-architect` | `.claude/agents/design-architect.md` |
| CF 토폴로지/렌더링전략 | `cf-architect` | `.claude/agents/cf-architect.md` |
| 라우트/Server Action | `route-builder` | `.claude/agents/route-builder.md` |
| 데이터/인증/캐시 | `edge-data-integrator` | `.claude/agents/edge-data-integrator.md` |
| UI/페이지 | `ui-developer` | `.claude/agents/ui-developer.md` |
| 성능 3층 | `perf-engineer` | `.claude/agents/perf-engineer.md` |
| 코드 품질 | `qa-reviewer` | `.claude/agents/qa-reviewer.md` |
| 기능/UX/Web Vitals 검수 | `site-inspector` | `.claude/agents/site-inspector.md` |

## Full Pipeline (orchestrate 스킬)

```
Phase 0   Pre-flight Survey   — orchestrate (spec.md)
Phase 1   Ideation            — idea-researcher
Phase 2   Planning            — product-planner (PRD + perf 예산)
Phase 2.5 Spec                — spec-planner
Phase 3   Design              — design-architect (shadcn 토큰)
Phase 3.5 Architecture        — cf-architect (rendering-matrix·bindings)
Phase 4   Implementation (순차 + sub-QA 게이트)
  4a route-builder · 4b edge-data-integrator · 4c ui-developer · 4d perf-engineer(관측 배선)
Phase 5   QA (병렬)            — qa-reviewer ∥ site-inspector
Phase 5.5 Perf Gate           — perf-engineer (전 엔드포인트 스캔·벤치)
Phase 6   Iteration & Perf 최적화 루프 (최대 3회)
Phase 7   Deploy              — cf-architect (wrangler/OpenNext → Cloudflare)
```

데이터 흐름: `_workspace/` 블랙보드 + `pipeline-status.md` 진행추적.

## Commands (생성앱 / `templates/app-skeleton`)

```bash
npm install
npm run dev          # next dev
npm run build        # next build
npm run preview      # opennextjs-cloudflare build && preview
npm run deploy       # opennextjs-cloudflare build && deploy
npm run typecheck    # tsc --noEmit
npm run lint         # eslint .
npm run test         # vitest run
npm run cf-typegen   # wrangler types
```

## Branch Strategy

```
main      <- Production
  ^
feature/* <- Feature branches
```
