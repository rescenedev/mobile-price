---
name: integrate-data
description: Drizzle/D1 스키마·마이그레이션, KV/Cache 캐시 계층, better-auth httpOnly 쿠키 세션을 구축한다. "데이터 붙여줘", "DB 스키마", "캐시 계층", "인증 붙여줘", "세션", "better-auth" 요청 시 사용. (Phase 4b)
---

# Integrate Data — 데이터·캐시·인증 통합

생성앱의 데이터 계층 전부를 구축한다: Drizzle/D1 스키마·마이그레이션, KV·Cache API 캐시 계층, better-auth 기반 httpOnly 쿠키 세션. 모든 바인딩은 `@/shared/env` 단일 통로로 강제하고, 반복 업스트림은 캐시 계층을 통과시킨다. 이 스킬은 `edge-data-integrator` 에이전트의 얇은 래퍼다.

## 트리거
"데이터 붙여줘", "DB 스키마", "Drizzle", "캐시 계층", "KV 캐시", "인증 붙여줘", "세션", "better-auth"

## 흐름
1. **Read agent** — `.claude/agents/edge-data-integrator.md`를 Read하고 그 Drizzle/D1 패턴·캐시 래퍼·better-auth 세션 규칙·공통 규약을 그대로 따른다.
2. **Read inputs** — `_workspace/arch/bindings.md`(DB/CACHE/SESSION/BUCKET/PERF) + `_workspace/arch/cache-topology.md`(키 스킴·TTL·무효화 SSOT) + `_workspace/arch/rendering-matrix.md`(캐시/세션 사용 라우트) + `_workspace/plan/prd.md`(엔티티·인증 요구)를 Read한다.
3. **Integrate** — `src/shared/db/`에 Drizzle 스키마·`getDb()`(env 통로), repository는 N+1 금지(④, 배치/조인). `src/shared/cache/`에 KV/Cache 래퍼 — 키·TTL은 cache-topology 그대로, hit/miss를 `trackFetch` `cache` 필드에 기록(⑤). `src/shared/auth/`에 better-auth — 세션은 KV(`SESSION`), 쿠키 httpOnly+Secure+SameSite=Lax(③), 토큰을 클라이언트 스토리지/`NEXT_PUBLIC_*`/로그에 노출 0. 모든 DB·auth 모듈에 `import 'server-only'`.
4. **Write outputs** — `src/shared/db/` · `src/shared/cache/` · `src/shared/auth/`, `drizzle/`(마이그레이션 — `npm run db:generate`), repository 함수, `_workspace/impl/data-layer.md`(스키마·캐시 키·인증 흐름 요약)를 Write한다. `typecheck`/`lint`/`test` 0.
5. **Update status** — `_workspace/pipeline-status.md`의 `4b Edge Data` 행을 갱신한다.

## 산출물
- `src/shared/db/` (schema.ts, client.ts, index.ts) + `drizzle/`
- `src/shared/cache/` (kv.ts, http.ts, index.ts)
- `src/shared/auth/` (better-auth 세션, index.ts)
- `_workspace/impl/data-layer.md`
- `_workspace/pipeline-status.md` (4b 갱신)
