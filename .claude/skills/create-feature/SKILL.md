---
name: create-feature
description: FSD feature 모듈(src/features/<name>/{api,ui,model,lib,index.ts})을 규약에 맞춰 스캐폴딩한다. "피처 만들어줘", "feature 모듈 추가", "기능 모듈 스캐폴딩" 요청 시 사용. (Phase 4a)
---

# Create Feature — FSD feature 모듈 스캐폴딩

`src/features/<name>/`에 비즈니스 기능 모듈을 FSD 규약(`api/`·`ui/`·`model/`·`lib/`·`index.ts` barrel)으로 만든다. `app → features → entities → shared` 단방향 의존만 허용한다. 이 스킬은 `route-builder` 에이전트의 얇은 래퍼다 (모듈 스캐폴딩 책임).

## 트리거
"피처 만들어줘", "feature 모듈 추가", "기능 모듈 스캐폴딩"

## 흐름
1. **Read agent** — `.claude/agents/route-builder.md`를 Read하고 그 FSD & 경계 규칙(단방향 의존·barrel 누락 0·`server-only`·`any` 0·`@/` alias)을 그대로 따른다.
2. **Read inputs** — `_workspace/plan/prd.md`(FSD 모듈맵 — feature 책임 경계) + `_workspace/arch/bindings.md`(사용 가능한 바인딩)를 Read한다. 모듈 경계와 의존성을 PRD 모듈맵에서 확인한다.
3. **Scaffold** — `src/features/<name>/`에 `api/`(데이터 호출 — 실제 DB/캐시 구현은 edge-data-integrator에 위임), `model/`(타입·상태), `ui/`(컴포넌트 셸 — 마크업은 ui-developer가 채움), `lib/`(로컬 유틸), `index.ts`(public API barrel)를 생성한다. 상위 레이어만 하위를 import. 서버 전용 모듈에 `import 'server-only'`.
4. **Write outputs** — `src/features/<name>/{api,ui,model,lib,index.ts}` 모듈 + `_workspace/impl/routes-built.md`에 모듈 항목 기록. `npm run typecheck`/`lint` 0 확인.
5. **Update status** — `_workspace/pipeline-status.md`의 `4a Routes` 행을 갱신한다.

## 산출물
- `src/features/<name>/api/`
- `src/features/<name>/ui/`
- `src/features/<name>/model/`
- `src/features/<name>/lib/`
- `src/features/<name>/index.ts` (barrel)
- `_workspace/pipeline-status.md` (4a 갱신)
