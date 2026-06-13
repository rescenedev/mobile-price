---
name: design-system
description: Tailwind 토큰·CSS 변수 테마·shadcn/ui 컴포넌트 인벤토리·라우트별 레이아웃을 정의한다. "디자인 시스템 만들어줘", "테마 만들어줘", "컬러 팔레트", "화면 디자인" 요청 시 사용. (Phase 3)
---

# Design System — 웹앱 디자인 시스템

컬러·타이포·스페이싱 토큰을 CSS 변수 + Tailwind theme로 구조화하고, 도입할 shadcn/ui 컴포넌트와 variant 확장, 라우트별 반응형 레이아웃을 명세한다. CLS 가드(`next/image` 치수·`next/font` self-host)와 접근성(WCAG AA)을 레이아웃에 강제한다. 이 스킬은 `design-architect` 에이전트의 얇은 래퍼다.

## 트리거
"디자인 시스템 만들어줘", "테마 만들어줘", "컬러 팔레트", "화면 디자인", "디자인 해줘"

## 흐름
1. **Read agent** — `.claude/agents/design-architect.md`를 Read하고 그 토큰 포맷·컴포넌트 인벤토리·레이아웃 규칙·4축 자체 평가·가드레일을 그대로 따른다.
2. **Read inputs** — `_workspace/spec.md`(`ux.*`·`tech.animation_level`·`*_notes`·`project.context`) + `_workspace/plan/prd.md`(라우트 IA·UI 요구) + `_workspace/idea/research.md`(디자인 레퍼런스)를 Read한다. `ux.dark_mode`에 따라 토큰 범위를 조정한다.
3. **Design** — shadcn 표준대로 HSL CSS 변수(`:root`/`.dark`) + Tailwind theme 스니펫을 제공하고, 라우트별 레이아웃에 반응형 브레이크포인트·CLS 가드·접근성을 적는다. 4축(Design Quality/Originality/Craft/Functionality) 자체 평가 후 임계값 미달 시 재작업.
4. **Write outputs** — `_workspace/design/design-system.md` · `theme-tokens.md` · `component-inventory.md` · `layouts.md` 4개를 Write한다.
5. **Update status** — `_workspace/pipeline-status.md`의 `3. Design` 행을 갱신한다.

## 산출물
- `_workspace/design/design-system.md`
- `_workspace/design/theme-tokens.md`
- `_workspace/design/component-inventory.md`
- `_workspace/design/layouts.md`
- `_workspace/pipeline-status.md` (3. Design 갱신)
