# 히어로 1줄화 + 커맨드 팔레트 방향키 네비

## 1) 히어로 보조문구 한 줄로 — `app/page.tsx`

- 카피 단축(의미 유지): "프로모가와 종료 후 정가를 함께. 가입·광고 없이 필터로 내게 맞는 요금제를 3초 만에 찾으세요." → **"종료 후 정가까지 정직하게, 가입·광고 없이 3초 만에."**
- 강조 톤 유지: `종료 후 정가`만 `font-semibold text-foreground`(밑줄 0).
- 데스크탑 1줄 보장: `lg:max-w-none lg:whitespace-nowrap`. 모바일은 `max-w-xl`+`whitespace:normal`(줄바꿈 허용)이나 카피가 짧아 1줄로 들어가며 가로 오버플로 0.
- 매직값 0(토큰만), CLS 0(이미지/레이아웃 변경 없음).

검증(라이브, browse):
- 1440px: subline height 28px = lineHeight 28px → **1줄**.
- 375px: 1줄(height 26px), `scrollWidth(375)==innerWidth(375)` → 가로 오버플로 0.

## 2) 커맨드 팔레트 방향키 네비게이션

### 원인
Radix `Dialog.Content` 기본 오토포커스가 **Content(div)** 에 포커스를 둘 수 있다.
cmdk의 ↑/↓ keydown 리스너는 **Command 루트(Content의 자식)** 에 붙는다.
포커스가 Command의 조상(Content)에 있으면 keydown이 Command 루트로 전파되지 않아 방향키가 cmdk 핸들러에 도달하지 못한다 → 하이라이트 이동 불가.

### 수정
`src/features/command-palette/ui/CommandPalette.tsx`
- `inputRef` 추가 → `CommandInput ref={inputRef}`.
- `DialogPrimitive.Content`에 `onOpenAutoFocus`: 기본 동작 `preventDefault()` 후 `inputRef.current?.focus()`로 **CommandInput(=Command의 후손)** 에 포커스 고정. 이로써 keydown이 cmdk Command 루트로 전파되어 ↑/↓/Enter 정상 작동.

`src/shared/ui/command.tsx`
- `CommandItem`의 `data-[selected=true]` 하이라이트를 다크테마에서 분명히 보이도록 강화:
  - 기존 `bg-accent`(slate-800) 유지 + **emerald(price) 좌측 2px 바**(`before:`) 추가.
  - `before:opacity-0` → `data-[selected=true]:before:opacity-100`(절제된 단일 액센트, 매직값 0).

### 검증(라이브, browse)
- ⌘K 오픈 시 `document.activeElement` = cmdk INPUT, 초기 선택 = 첫 항목("요금제").
- ↓ x3: 요금제 → 비교 → 추천 → 계산기, ↑ x1: 추천(역방향 정상).
- 선택 항목 `::before` = position absolute, height 20px, bg rgb(54,211,153)=#34D399(price), 좌측 바 렌더 확인(스크린샷에서 "추천" 행 accent + emerald 바 가시).
- 필터/검색 그룹에도 동일 항목 구조라 타이핑 후 필터 결과 내 방향키 이동 동일 작동(`shouldFilter=false`+개별 `value` 유지).

## 제약 준수
- 다크테마 토큰만 / 밑줄 0 / CLS 0 / a11y(포커스·aria-label·시맨틱) 유지 / `any` 0 / 매직값 0.
- 데이터·캐시·API 미변경.

## 게이트
- `bun run typecheck` 0
- `bun run lint` 0
- `bun run test` 153 passed (26 files)
- `bun run build` 성공 — `/` First Load JS 187 kB (< 200 KB 예산)
