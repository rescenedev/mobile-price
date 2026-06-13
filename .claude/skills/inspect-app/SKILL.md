---
name: inspect-app
description: 라이브 사이트를 /browse로 띄워 기능·UX·접근성·Web Vitals를 검수하고 100점 스코어 + H/M/L 이슈로 판정한다. "앱 검사해줘", "사이트 검수", "기능 테스트", "UX 검토", "Web Vitals 측정" 요청 시 사용. (Phase 5b)
---

# Inspect App — 라이브 사이트 종합 검수

빌드·preview를 띄우고 `/browse`(gstack 헤드리스 브라우저)로 페이지를 탐색하며, PRD 대비 기능 완성도와 실제 UX·접근성·Web Vitals를 증거(스크린샷·측정값)와 함께 판정한다. 정적 코드 검사(qa-reviewer)와 교차 확인한다. 이 스킬은 `site-inspector` 에이전트의 얇은 래퍼다.

## 트리거
"앱 검사해줘", "사이트 검수", "기능 테스트", "UX 검토", "Web Vitals 측정"

## 흐름
1. **Read agent** — `.claude/agents/site-inspector.md`를 Read하고 그 검수 절차·Hard Threshold 표·디자인 Grading·Output Format을 그대로 따른다. **`/browse` 스킬만 사용**하고 `mcp__claude-in-chrome__*` 직접 호출은 금지한다.
2. **Read inputs** — `_workspace/spec.md` + `_workspace/plan/prd.md`(유저 스토리→체크리스트, perf 예산) + `_workspace/design/`(시각 일관성 기준) + `_workspace/arch/rendering-matrix.md` + `_workspace/qa/code-review.md`(중복 회피)를 Read한다.
3. **Inspect** — `npm run preview`(Web Vitals/렌더링 판정은 반드시 preview에서) 기동 후 `/browse`로: P0 유저 스토리 전수 조작 + 폼 오입력 검증, 전 내부 링크(깨진 링크 0), 데이터 화면 loading/empty/error 3종, 키보드 전용 탐색·포커스·모달 트랩, 대표 라우트 LCP/INP/CLS 실측(예산 대비), 인증 보호 라우트가 로그아웃 후 차단되는지·토큰이 브라우저 스토리지에 없는지, 엣지 케이스(긴 텍스트·이미지 실패·throttle·연타)를 검수한다.
4. **Write outputs** — `_workspace/qa/inspection.md`(100점 스코어 + H/M/L 이슈 + 유저 스토리 매트릭스 + Web Vitals 표 + 스크린샷 경로)를 Write한다. 결함은 담당 에이전트(`ui-developer`/`route-builder`/`edge-data-integrator`)에 SendMessage.
5. **Update status** — `_workspace/pipeline-status.md`의 `5b Inspection` 행을 갱신한다.

## 산출물
- `_workspace/qa/inspection.md` (100점 스코어 + H/M/L + Web Vitals + 스크린샷)
- `_workspace/pipeline-status.md` (5b 갱신)
