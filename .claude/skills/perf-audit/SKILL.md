---
name: perf-audit
description: 전 라우트를 벤치해 PRD 성능 예산(p95·LCP/INP/CLS·번들)과 대조하고 병목을 전략 카탈로그로 최적화한다. "성능 점검해줘", "perf gate", "벤치마크", "p95", "병목", "최적화" 요청 시 사용. (Phase 5.5 / 6)
---

# Perf Audit — 성능 게이트 & 최적화 루프

전 엔드포인트를 N회 부하해 p95를 산출하고 대표 라우트 Web Vitals·번들을 측정해 PRD 예산과 대조한다(PASS/FAIL). 위반 시 병목→전략 카탈로그로 처방하고 **재벤치**한다. 이 스킬은 `perf-engineer` 에이전트의 얇은 래퍼다.

## 트리거
"성능 점검해줘", "perf gate", "벤치마크", "p95", "병목", "최적화"

## 흐름
1. **Read agent** — `.claude/agents/perf-engineer.md`를 Read하고 그 perf 게이트 절차·병목→전략 매핑 표·최적화 루프 규칙을 그대로 따른다.
2. **Read inputs** — `_workspace/plan/prd.md`(**perf 예산** — 게이트 임계값 출처) + `_workspace/arch/rendering-matrix.md`·`cache-topology.md` + `_workspace/impl/routes-built.md`·`data-layer.md`(스캔 대상 엔드포인트)를 Read한다.
3. **Audit** — `routes-built.md`에서 라우트를 자동 스캔 → 각 엔드포인트 ≥30회 부하 → p95 산출. 페이지는 LCP/INP/CLS + 클라이언트 번들 gz 크기 측정(`npm run preview` 대상). PRD 예산과 대조. 위반 시 병목→전략 표로 처방(KV/Cache 추가, ISR 전환, edge 이동, RSC 경계 정리, 페이로드 축소, N+1 해소) 후 **재벤치**. 렌더링 전략 변경은 architect-cf에 rendering-matrix 갱신을 먼저 요청한다(전략 SSOT는 cf-architect 소유). 최대 3회.
4. **Write outputs** — `_workspace/qa/perf-gate.md`(라우트별 p95·Web Vitals·번들 vs 예산 PASS/FAIL) + (최적화 시) `_workspace/qa/perf-optimization.md`(병목→전략→before/after 로그)를 Write한다.
5. **Update status** — `_workspace/pipeline-status.md`의 `5.5 Perf Gate`(및 최적화 시 `6 Iteration`) 행을 갱신한다.

## 산출물
- `_workspace/qa/perf-gate.md` (PASS/FAIL)
- `_workspace/qa/perf-optimization.md` (최적화 루프 실행 시)
- `_workspace/pipeline-status.md` (5.5 / 6 갱신)
