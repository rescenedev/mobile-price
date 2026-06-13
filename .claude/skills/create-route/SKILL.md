---
name: create-route
description: App Router 라우트·Route Handler·Server Action을 rendering-matrix에 맞춰 스캐폴딩한다. "라우트 추가해줘", "API 추가해줘", "Route Handler", "Server Action", "page 생성" 요청 시 사용. (Phase 4a)
---

# Create Route — App Router 라우트 & 서버 진입점

`app/`의 page/layout/route handler와 Server Action을 FSD 규약에 맞춰 만든다. **렌더링 전략은 직접 정하지 않는다** — `rendering-matrix.md`의 `runtime`/`revalidate`/`dynamic` 문자열을 그대로 복사한다. 이 스킬은 `route-builder` 에이전트의 얇은 래퍼다.

## 트리거
"라우트 추가해줘", "API 추가해줘", "Route Handler", "Server Action", "page 생성"

## 흐름
1. **Read agent** — `.claude/agents/route-builder.md`를 Read하고 그 렌더링 선언 규칙·Route Handler 패턴·Server Action 검증·FSD 경계 규칙을 그대로 따른다.
2. **Read inputs** — `_workspace/arch/rendering-matrix.md`(라우트별 전략 SSOT, 필독) + `_workspace/arch/bindings.md` + `_workspace/plan/prd.md`(엔드포인트 동작·입력 스키마)를 Read한다. matrix에 없는 라우트는 만들지 않는다 — 필요 시 architect-cf에 matrix 추가를 먼저 요청한다.
3. **Build** — matrix 행과 1:1로 렌더링 선언을 옮긴다. 모든 데이터 경로는 `trackFetch()` 경유(⑤), 바인딩은 `createEnvAccessor(env).get()` 통로(②). Server Action은 Zod 검증 + origin/CSRF 검증(③). 세션은 `@/shared/auth`만 호출, DB는 `edge-data-integrator`의 repository만 호출. 서버 전용 모듈에 `import 'server-only'`.
4. **Write outputs** — `app/**/page.tsx`·`layout.tsx`·`route.ts`·`actions.ts`, `src/features/{name}/` 모듈, `_workspace/impl/routes-built.md`(라우트↔matrix 매핑)를 Write한다. `npm run typecheck`/`lint` 0 확인.
5. **Update status** — `_workspace/pipeline-status.md`의 `4a Routes` 행을 갱신한다.

## 산출물
- `app/**/{page,layout,route,actions}.tsx|ts`
- `src/features/{name}/` (api/hooks/model/ui/index.ts)
- `_workspace/impl/routes-built.md`
- `_workspace/pipeline-status.md` (4a Routes 갱신)
