---
name: architect-cf
description: 라우트별 렌더링 전략(SSG/ISR/SSR-edge)·캐시 토폴로지·D1/KV/R2/AE 바인딩을 확정하는 Cloudflare 아키텍처의 단일 두뇌. "아키텍처 설계해줘", "렌더링 전략", "rendering-matrix", "바인딩", "캐시 토폴로지" 요청 시 사용. (Phase 3.5)
---

# Architect CF — Cloudflare 토폴로지 & 렌더링 전략

이 앱이 Cloudflare Workers(@opennextjs/cloudflare) 위에서 **어떻게 렌더링되고 어디에 캐싱되며 어떤 바인딩을 쓰는지**를 확정한다. 렌더링 전략 결정은 cf-architect만 한다 — 구현 에이전트는 산출물을 읽고 따른다. 이 스킬은 `cf-architect` 에이전트의 얇은 래퍼다.

## 트리거
"아키텍처 설계해줘", "렌더링 전략", "rendering-matrix", "바인딩", "D1/KV/R2", "캐시 토폴로지"

## 흐름
1. **Read agent** — `.claude/agents/cf-architect.md`를 Read하고 그 rendering-matrix 포맷·bindings 규약·cache-topology 규칙·체크리스트를 그대로 따른다.
2. **Read inputs** — `_workspace/spec.md`(라우트 후보) + `_workspace/plan/prd.md`(perf 예산·개인화/인증 요구·라우트 IA) + `_workspace/design/`(정적/동적 화면 힌트)를 Read한다.
3. **Architect** — **모든 라우트를 rendering-matrix에 1행씩** 작성하고(누락 0 = Hard Threshold ②), 각 행에 `runtime`/`revalidate`/`dynamic` 문자열을 그대로 적는다. 개인화/세션 라우트는 SSG/ISR로 두지 않는다. 모든 동적 라우트에 캐시 계층(Cache/KV/ISR) 1개 이상을 cache-topology에 명시한다. 바인딩(`DB`/`CACHE`/`SESSION`/`BUCKET`/`PERF`)은 `wrangler.toml`과 일치시킨다.
4. **Write outputs** — `_workspace/arch/rendering-matrix.md`(렌더링/캐시 SSOT) · `bindings.md` · `cache-topology.md`를 Write한다. 필요 시 `wrangler.toml`·`open-next.config.ts` 확정.
5. **Update status** — `_workspace/pipeline-status.md`의 `3.5 Architecture` 행을 갱신한다. (배포 Phase 7은 orchestrate에서 별도 호출.)

## 산출물
- `_workspace/arch/rendering-matrix.md` (렌더링/캐시 SSOT)
- `_workspace/arch/bindings.md`
- `_workspace/arch/cache-topology.md`
- `_workspace/pipeline-status.md` (3.5 Architecture 갱신)
