# Command Palette (⌘K) — 구현 노트

Phase 4c (ui-developer). Linear/Vercel/Raycast 스타일 커맨드 팔레트.

## 트리거
- **전역 단축키**: `⌘K`(Mac) / `Ctrl+K`(Win) — `CommandMenu`(전역 client leaf)가 `keydown` 리스너로 토글. `e.preventDefault()`로 브라우저 기본 동작 차단. ESC·바깥클릭은 Radix Dialog가 처리.
- **헤더 힌트 버튼**: `CommandPaletteHint`(가벼운 client leaf) — lucide `Search` 아이콘 + `⌘K` kbd. `site-header`에 상주. 다크 톤 절제(hairline 보더 + `bg-muted/60`). 클릭 시 `requestOpenPalette()`가 `ratsaver:open-command-palette` DOM 커스텀 이벤트를 디스패치 → 전역 `CommandMenu`가 수신해 오픈(state 디커플).
- 오픈 시 `trackEvent(EVENTS.CORE_ACTION, { surface: 'command_palette' })` 계측(매직 스트링 0 — 이벤트명은 카탈로그 단일 출처). **events.ts 카탈로그는 4d 계약(15개 lock)이라 신규 이벤트 추가하지 않고 CORE_ACTION 재사용.**

## 그룹 (shadcn `command` = cmdk)
1. **이동**: 요금제(`/`)·비교(`/compare`)·추천(`/recommend`)·계산기(`/calculator`). lucide 아이콘(ListFilter·Columns3·Sparkles·Calculator). 라우트는 `NAV_COMMANDS` 상수 단일 출처.
2. **빠른 필터**: 1만원 이하·데이터 무제한·알뜰폰만·약정없음 → `filterHref(chip)` = `/?chips=<key>`. **chip 키는 `plan-filter`의 `TQuickChipKey` 직렬화 규약 그대로**(임의 키 0). `FILTER_COMMANDS` 상수.
3. **요금제 검색**: 입력어 → `searchPlans(plans, q)` 순수함수가 name/carrier 느슨 매칭(소문자·공백 제거). name 매칭 우선 > carrier-only, 동일 rank는 월요금 오름차순. 상위 8개(`SEARCH_RESULT_LIMIT`). 선택 시 `/plans/[id]`. 우측 가격 emerald `text-price`.

## 데이터
- `usePlansSource(enabled)` 훅 — 팔레트 오픈 시 `/data/plans.json`(정적 에셋·cf-cache, 253 plans) 1회 `fetch(force-cache)` + `parsePlanList`(Zod 경계검증).
- **graceful**: fetch/parse 실패 시 `plans=[]` 유지 → 검색 그룹만 비고 이동/필터는 정상. (클라 정적 에셋 직접 fetch이므로 서버 전용 `trackFetch` 대상 아님.)

## Lazy-load (번들 보호)
- `CommandMenu`(상주)가 `next/dynamic(() => import('./CommandPalette'), { ssr:false })`로 팔레트를 **첫 오픈 시점에만** 로드. `mounted` 가드로 미오픈 시 null 렌더.
- **핵심 수정**: cmdk가 초기 번들에 끌려오던 문제 해결 — `command.tsx`를 `@/shared/ui` barrel에서 **제외**(barrel은 layout의 Toaster·Tooltip이 eager 로드). 팔레트는 `@/shared/ui/command` **deep-import**로만 cmdk 소비. 결과: cmdk가 async 청크(`296`/`676`)로 완전 분리.

## 검증 결과 (bun)
- `typecheck` 0 · `lint` 0 · `test` 153 passed (search 6종 신규) · `build` 성공.
- **`/` First Load JS = 187 kB** (예산 200 kB 이내). barrel 제외 전 191 kB → 후 187 kB(전 라우트 ~4 kB 감소).
- **cmdk lazy 분리 확인**: cmdk는 async 청크 `296`(8K)/`676`(16K)에만 존재. `app-build-manifest.json` 기준 `/` First Load 11개 파일에 **cmdk 청크 0개**(exact-filename 검증).

## 산출 파일
- `src/shared/ui/command.tsx` (+ barrel 제외 주석)
- `src/features/command-palette/` (model: constants·search·usePlansSource·events / ui: CommandMenu·CommandPalette·CommandPaletteHint / index.ts barrel)
- `src/features/command-palette/model/search.test.ts`
- `src/widgets/site-header/index.tsx` (힌트 버튼 배치)
- `app/layout.tsx` (전역 CommandMenu 마운트)

## a11y
- Dialog role + Radix 포커스 트랩 + ESC. `aria-label="명령 팔레트"`. 헤더 버튼 `aria-keyshortcuts` + `aria-label`. kbd `aria-hidden`. 검색 input `aria-label`. 터치 타겟 44px(h-11).
