---
name: plan-app
description: 아이디어를 PRD로 변환하고 성능 예산(API p95·LCP/INP/CLS·라우트별 번들)을 수치로 확정한다. "앱 기획해줘", "PRD 작성", "성능 예산 정해줘", "KPI 정의" 요청 시 사용. (Phase 2)
---

# Plan App — 웹앱 기획 & 성능 예산

PRD(기능 목록·유저 스토리·정보구조·라우트 IA·FSD 모듈맵·API)와 KPI를 작성하고, **성능 예산을 정량 수치로 확정**한다. 이 수치가 Hard Threshold ④의 임계값으로 주입되므로 빈칸·비정량 표현은 게이트 통과 불가다. 이 스킬은 `product-planner` 에이전트의 얇은 래퍼다.

## 트리거
"앱 기획해줘", "PRD 작성", "성능 예산 정해줘", "KPI 정의"

## 흐름
1. **Read agent** — `.claude/agents/product-planner.md`를 Read하고 그 역할·PRD 포맷·성능 예산 표·체크리스트를 그대로 따른다.
2. **Read inputs** — `_workspace/spec.md`(전 섹션 + `*_notes` + `project.context`) + `_workspace/idea/research.md`·`shortlist.md`를 Read한다. spec의 [필수] 필드가 비면 즉시 중단하고 Phase 0 재실행을 요청한다.
3. **Plan** — spec에서 켜진(true) 항목만 PRD에 반영한다. 라우트 IA의 모든 라우트에 예상 렌더링 전략(SSG/ISR/SSR-edge)을 1줄 표기하고, **API p95·LCP/INP/CLS·라우트별 번들 예산을 모두 수치로 확정**한다. North Star 1개 + 4축 KPI를 Analytics Engine 이벤트로 매핑(PII 무첨가·snake_case).
4. **Write outputs** — `_workspace/plan/prd.md`(PRD 본문 + 성능 예산 표) + `_workspace/plan/kpis.md`(North Star + 4축 + 이벤트 카탈로그)를 Write한다.
5. **Update status** — `_workspace/pipeline-status.md`의 `2. Planning` 행을 갱신하고 perf 예산 핵심값(API p95 / LCP)을 `Key Decisions`에 기록한다.

## 산출물
- `_workspace/plan/prd.md` (성능 예산 = Hard Threshold ④ 임계값)
- `_workspace/plan/kpis.md`
- `_workspace/pipeline-status.md` (2. Planning 갱신)
