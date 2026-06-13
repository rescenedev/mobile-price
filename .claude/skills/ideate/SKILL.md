---
name: ideate
description: Next.js + Cloudflare 스택으로 양산 가능한 웹앱 아이디어를 리서치·제안한다. "앱 아이디어 찾아줘", "뭐 만들까", "트렌드 조사", "경쟁 웹앱 분석" 요청 시 사용. (Phase 1)
---

# Ideate — 웹앱 아이디어 리서치

웹 프로덕트 트렌드·시장·경쟁 SaaS를 조사해 1인이 출시 가능한 아이디어 3~5개를 제안한다. 각 아이디어에 렌더링 성향·읽기/쓰기 비율·CF 적합성을 분류해 후속 Phase의 입력 단서를 남긴다. 이 스킬은 `idea-researcher` 에이전트의 얇은 래퍼다.

## 트리거
"앱 아이디어 찾아줘", "뭐 만들까", "트렌드 조사", "경쟁 웹앱 분석"

## 흐름
1. **Read agent** — `.claude/agents/idea-researcher.md`를 Read하고 그 역할·작업 규칙·체크리스트를 그대로 따른다. 로직을 중복 구현하지 않는다.
2. **Read inputs** — `_workspace/spec.md`(Phase 0 산출물)를 Read한다. 없으면 즉시 중단하고 사용자에게 Phase 0 Pre-flight Survey 실행을 요청한다. `project.context`·`*_notes` 우선 반영.
3. **Research** — `WebSearch`/`WebFetch`로 ProductHunt·HN·검색 트렌드를 조사하고 출처 URL을 단다. CF Workers 제약에 부적합한 아이디어는 걸러내거나 엣지 친화 대안으로 변형한다.
4. **Write outputs** — `_workspace/idea/research.md`(시장·경쟁·아이디어 제안서) + `_workspace/idea/shortlist.md`(선택용 1줄 요약 + 추천 순위)를 Write한다.
5. **Update status** — `_workspace/pipeline-status.md`의 `1. Ideation` 행을 `COMPLETED`로 갱신하고 선정 아이디어 슬러그를 Notes에 기록한다.

## 산출물
- `_workspace/idea/research.md`
- `_workspace/idea/shortlist.md`
- `_workspace/pipeline-status.md` (1. Ideation 갱신)
