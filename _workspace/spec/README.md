# Spec Dashboard — ratsaver

> Phase 2.5 (spec-planner) 산출물. Phase 4 구현 진행 추적.
> Phase 4 에이전트는 task 완료 시 `tasks.md` 체크박스·본 대시보드 진행률을 갱신한다.

## 산출물
- `tasks.md` — 모듈별(4a routes / 4b data / 4c ui / 4d obs) 구현 task 분해 (의존성·파일경로·수용기준)
- `rendering-stub.md` — 라우트별 렌더링 전략 stub (cf-architect Phase 3.5에서 rendering-matrix.md로 승격)
- `go-no-go.md` — 착수 판정: **GO**

## 진행 대시보드 (Phase 4)

| 모듈 | 에이전트 | Tasks | Status |
|------|---------|-------|--------|
| 4a. Routes (셸·API스텁·features barrel) | route-builder | 🔴 0/18 | not started |
| 4b. Edge Data (env·entity·db·cache·API배선) | edge-data-integrator | 🔴 0/14 | not started |
| 4c. UI (features·widgets·page 조립) | ui-developer | 🔴 0/26 | not started |
| 4d. Observability (perf·AE·Web Vitals) | perf-engineer | 🔴 0/12 | not started |

상태 아이콘: 🔴 not started · 🟡 in-progress · 🟢 completed

## 핵심 수치 (Hard Threshold ④ 게이트 — Phase 5.5 벤치 기준)
- **API p95**: `/api/plans` ≤ 120ms · `/api/plans/[id]` ≤ 100ms · 기본 ≤ 150ms (전부 KV/Cache)
- **LCP**: 전역 ≤ 1.5s, `/`·`/plans/[id]` ≤ 1.2s
- **INP** ≤ 200ms (랜딩/상세 150ms) · **CLS** ≤ 0.1 (랜딩/상세 0.05)
- **번들(gz)**: `/`110 · `/plans`160 · `/plans/[id]`110 · `/compare`140 · `/recommend`150 · `/calculator`120 KB

## 무인증·무쓰기 특이사항
- 인증/세션/CSRF/Server Action task **0** (`auth.methods=[]`, 읽기전용)
- 추천·계산기·비교 = 클라이언트 순수함수 (서버 호출 0, PII 0)
- North Star: 추천→결정 도달률 ≥ 40%
