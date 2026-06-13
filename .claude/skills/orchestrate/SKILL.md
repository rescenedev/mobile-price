---
name: orchestrate
description: 아이디어부터 Cloudflare 배포까지 풀스택 Next.js 앱을 7-Phase 파이프라인으로 양산한다. "앱 만들어줘", "풀 앱 개발", "처음부터 끝까지" 요청 시 사용. 각 Phase는 _workspace 블랙보드로 산출물을 전달하고 Hard Threshold 게이트를 통과해야 다음으로 진행한다.
---

# Orchestrate — Full App Lifecycle Pipeline

풀스택 Next.js(App Router, on Cloudflare Workers) 앱을 7-Phase로 양산한다. **Phase를 건너뛰지 않는다.** 각 Phase 산출물은 `_workspace/`에 저장하고, 다음 Phase는 이를 Read하여 이어간다. 진행 상태는 `_workspace/pipeline-status.md`에 갱신한다.

## 시작 전
1. `templates/app-skeleton`을 대상 디렉토리로 복사하거나, 기존 앱 디렉토리를 확인한다.
2. `_workspace/`가 없으면 리포의 `_workspace/` 템플릿을 복사해 초기화한다.
3. `_workspace/pipeline-status.md`의 프로젝트명/날짜를 채운다.

## Phase 0 — Pre-flight Survey (orchestrate)
사용자에게 핵심 결정만 확정 → `_workspace/spec.md` 작성: 콘셉트, 타깃, 데이터 모델 유무, 인증 필요 여부, 수익화, 렌더링 기본 성향, perf 민감도. Cloudflare 계정/도메인 가용성 확인.

## Phase 1 — Ideation (idea-researcher)
`.claude/agents/idea-researcher.md`를 Read하고 따른다. 시장조사·콘셉트 검증 → `_workspace/idea/`.

## Phase 2 — Planning (product-planner)
`product-planner`를 Read. PRD(기능 목록·유저스토리·정보구조) + KPI + **perf 예산(API p95, LCP/INP/CLS, 번들 예산)을 수치로 확정** → `_workspace/plan/prd.md`, `_workspace/plan/kpis.md`. perf 예산은 Hard Threshold ④의 임계값이 된다.

## Phase 2.5 — Spec (spec-planner)
`spec-planner`를 Read. 모듈별 task 분해 + 라우트별 렌더링전략 stub → `_workspace/spec/`. Go/No-Go 판정.

## Phase 3 — Design (design-architect)
`design-architect`를 Read. shadcn/Tailwind 디자인 토큰·테마·화면 레이아웃 → `_workspace/design/`. NativeWind가 아닌 **shadcn 컴포넌트 + Tailwind 토큰** 기준.

## Phase 3.5 — Architecture (cf-architect)
`cf-architect`를 Read. **핵심 계약 작성**:
- `_workspace/arch/rendering-matrix.md` — 모든 라우트의 렌더링 전략(SSG/ISR/SSR-edge) + 캐시 계층 + perf 예산
- `_workspace/arch/bindings.md` — D1/KV/R2/AE 바인딩 계획
- `_workspace/arch/cache-topology.md` — 캐시 계층 설계
- `wrangler.toml` 바인딩 확정, OpenNext 설정 검토

## Phase 4 — Implementation (순차 + 각 sub-phase QA 게이트)
각 sub-phase 완료 후 `qa-reviewer`로 **typecheck 0 / lint 0 / test 통과**를 확인해야 다음 진행. `pipeline-status.md` 갱신.

- **4a Routes** (`route-builder`): App Router 라우트·Route Handler·Server Action. rendering-matrix를 따른다.
- **4b Edge Data** (`edge-data-integrator`): Drizzle/D1 스키마, KV/Cache 계층, **better-auth 쿠키세션**. `@/shared/env` 단일 통로 강제.
- **4c UI** (`ui-developer`): shadcn/Tailwind 페이지·컴포넌트. `next/image` width/height 필수.
- **4d Observability** (`perf-engineer`): Web Vitals 비콘, API 레이턴시 계측(`@/shared/perf` 배선), RUM 수집. KPI 이벤트 매핑.

## Phase 5 — QA (병렬)
- **5a** `qa-reviewer`: 코드품질 + Hard Threshold 5종 전부 grep/AST 검사 → `_workspace/qa/code-review.md`
- **5b** `site-inspector`: 기능/UX/a11y/Web Vitals 라이브 검사 → `_workspace/qa/inspection.md`

## Phase 5.5 — Perf Gate (perf-engineer)
라우트 트리 자동 스캔 → 전 엔드포인트 N회 부하 → p95 측정 + 주요 라우트 Web Vitals → PRD 예산 대조 → `_workspace/qa/perf-gate.md` PASS/FAIL.

## Phase 6 — Iteration & Perf 최적화 루프 (최대 3회)
QA 결함 + perf 게이트 위반을 함께 수정. 병목→전략 카탈로그(KV/Cache 계층, ISR 전환, edge 이동, RSC 경계, 페이로드 축소) 적용 후 **QA·벤치 재실행**. 전부 green이거나 개선 없으면 종료. `_workspace/qa/fix-loop-N.md`.

## Phase 7 — Deploy (cf-architect)
D1/KV/R2 리소스 생성 → `wrangler.toml` placeholder 교체 → `npm run deploy`(OpenNext build + deploy). 배포 후 `/canary` 모니터 선택.

## 종료 기준
모든 Phase COMPLETED, Hard Threshold 5종 전부 통과, perf 예산 충족, `pipeline-status.md`에 증거 기록.
