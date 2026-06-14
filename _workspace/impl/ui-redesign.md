---
project: ratsaver
phase: 4c (재실행 — 디자인 v2 전면 개편)
title: UI 재개편 구현 노트 — Toss/Apple 프리미엄 + 홈 구조 변경
status: completed
created: 2026-06-14
owner: ui-developer
target_dir: apps/ratsaver
---

# ratsaver UI 재개편 (v2) — 구현 노트

> 사용자 피드백("촌스럽다") → 토스/애플 모던 프리미엄. design-architect v2 명세(`_workspace/design/*` + `redesign-notes.md`)를 그대로 적용.
> 로직/데이터/스키마/API 무변경 — 비주얼·레이아웃·라우트 구조만.

---

## 1. 디자인 v2 토큰 배선 (STEP 1)

| 파일 | 변경 |
|------|------|
| `app/globals.css` | 전체 교체. Toss 팔레트(primary `#3182F6`·foreground near-black `#191F28`·회색 2단 `#4E5968`/`#8B95A1`·saving `#0E7C50`·warning `#A85812`). `--background-subtle`·`--primary-strong`·`--saving-strong` 추가. **`.dark` 블록 삭제**(라이트 전용). **전역 `* { @apply border-border }` 삭제** → `border-color`만. `--radius: 1rem`(16px). `.shadow-focus` utility·`.nums` tnum 추가 |
| `tailwind.config.ts` | 전체 교체. **`darkMode` 제거**. color alias 확장(foreground.secondary·background.subtle·primary.strong·saving.strong). `borderRadius` 2xl(16)/xl(12)/lg(10)/md(8)/sm(6). **`boxShadow` e1/e2/e3/focus**(구 card/card-hover/popover 삭제). 2겹 레이어드 섀도우 |
| `app/layout.tsx` | Pretendard weight `400 700`→**`400 800`**(extrabold). footer `bg-card`→`bg-background-subtle`. main 패딩 `px-4 py-8`→`px-5 py-12 sm:py-16` |

**STEP 0 일괄치환**: 전 코드베이스 `shadow-card-hover→e2`·`shadow-card→e1`·`shadow-popover→e3` (잔존 0 확인).

## 2. shared/ui restyle (9종)

- **card**: `border` 제거 → `rounded-2xl bg-card shadow-e1` + transition. 패딩 `p-5 sm:p-6`. CardTitle `sm:text-lg tracking-tight`.
- **button**: base `rounded-xl font-semibold` + `active:scale-[0.97]`(motion-reduce 무력화). default hover→`primary-strong`·saving hover→`saving-strong`·outline `shadow-e1`(border 제거)·link `primary-strong`. size default `h-12`·lg `h-14`·sm `h-10`·icon `h-12 w-12`.
- **input**: 채움형 — `border-0 bg-muted rounded-xl h-12 text-[15px]` → focus 시 `bg-card` + 블루 ring. invalid `ring-destructive`.
- **badge**: border 제거·`py-1 font-semibold`. default 연회색 pill·mvno `bg-accent`·outline `bg-card shadow-e1`.
- **toggle/chip**: off=`bg-card shadow-e1`(떠있는 흰 pill)·on=`bg-primary shadow-e1`. chip `h-10 rounded-full text-[13px] font-semibold`.
- **select trigger**: `bg-muted rounded-xl border-0 h-12`.
- **dialog/sheet**: 패널 `rounded-2xl`(dialog)·`rounded-t-2xl`(sheet bottom)·`shadow-e3`. dialog 패널 border 제거. overlay `bg-foreground/40`.
- **skeleton**: `rounded-2xl`(카드 일치).
- (tooltip/sonner/select-content 오버레이는 shadow-e3 + 미세 hairline 유지 — 오버레이 가장자리 선명도용, 카드 아님)

## 3. 위젯 restyle

- **plan-card**: `Separator` 2개 제거 → `space-y-4`(gap-4) 여백 분리. Card hover **`-translate-y-1 hover:shadow-e2`**(떠오름). 패딩 `p-5 sm:p-6`. 데이터 `text-xl sm:text-2xl font-bold`. 속도/통화/약정 `text-foreground-secondary`. h3 `sm:text-lg tracking-tight`. footer 헤어라인 1줄만 유지.
- **price-block**: 가격 숫자 **`text-primary`→`text-foreground`**(near-black 큰 숫자)·`font-extrabold tracking-tight text-[28px] sm:text-3xl`(hero `sm:text-5xl`). "월" `foreground-secondary`. warning 띠 `rounded-lg px-3 py-1.5`·⚠ 아이콘만 `text-warning`. 정직성 가격병기 유지.
- **site-header**: `h-14`→`h-16`·**border-b 제거**→`shadow-[0_1px_0_0_hsl(var(--border))]` 헤어라인. 로고 `text-xl font-extrabold tracking-tight text-foreground`. nav `foreground-secondary`·`rounded-lg`.
- **filter-bar**: `sticky top-14`→**`top-16`**(헤더 높이 정합). sm+ `rounded-2xl bg-card shadow-e1`(border 제거).
- **saving-result**: `rounded-2xl shadow-e1 p-6 sm:p-8`(border 제거). 결과박스 `rounded-2xl min-h-[128px] p-6`. 절약숫자 `text-4xl sm:text-5xl font-extrabold text-saving-strong`.
- **compare-table**: `rounded-2xl shadow-e1`(외곽 border 제거)·행 헤어라인 유지·헤더명 tracking-tight.
- **empty-state**: `bg-card rounded-2xl shadow-e1 p-10`(dashed border 제거).
- **usage-preset-modal**: 프리셋 옵션 off=`bg-muted rounded-xl`·on=`bg-accent ring-2 ring-primary`(border 제거).
- **compare-tray-bar**: 카운트 `text-primary`→`text-primary-strong`(대비 AA).
- **recommend-panel**: 사용량 섹션 `rounded-2xl shadow-e1`(border 제거).

## 4. ★ 구조 변경 (사용자 신규 요구)

### 홈(`/`) = 요금제 비교 리스트
- `app/page.tsx` 전면 교체: 구 절약계산기 히어로 → **모던 히어로(한 줄 카피 "가장 싼 요금제부터, 정직하게" + 부제) + 그 아래 `PlanList`(필터/정렬/카드)**. 첫 화면이 요금제 목록.
- **렌더링 전략**: 구 `/plans`의 `export const revalidate = 3600`(ISR + 클라 필터)을 `/`로 이전. (구 `/`는 SSG였음.)
- `app/plans/page.tsx` → **`redirect('/')`** (중복 제거). 내부 링크(`layout` 푸터·`not-found`·`compare` EmptyState·`plans/[id]` 목록으로)를 `/plans`→`/`로 일괄 정리.
- 절약계산기·추천은 네비 메뉴로 유지(`/calculator`·`/recommend` 별도 라우트 그대로).

### 기본 정렬 = 가장 싼 요금제 최상단 (`price_asc`)
- `PlanList`(UI 레이어): URL에 `sort` 파라미터가 없으면 초기/동기화 상태를 **`price_asc`**로 override. 필터 초기화도 `price_asc`. (데이터 레이어 `parseFilters` 기본값은 edge-data-integrator 담당이라 미변경 — UI 기본 상태값만 맞춤.)
- 정렬 select 기본 선택값도 "가격 낮은순"으로 표시됨(상태 연동).

### 네비게이션
- SiteHeader 메뉴: **요금제(홈 `/`)·비교·추천·계산기**. 모던 톤(foreground-secondary + accent hover).

## 5. 검증 결과

```
npm run typecheck   → 0
npm run lint        → 0
npm run test        → 146 passed (25 files)
npm run build       → 성공, 128 페이지 생성
```

빌드 라우트 요약(First Load JS, 모두 ≤ 200KB gz 표준):
- `/` 186KB **(Revalidate 1h — ISR 이전 확인)**
- `/plans` 103KB(redirect 스텁) · `/plans/[id]` 181KB(SSG 120건)
- `/compare` 180KB · `/recommend` 186KB · `/calculator` 181KB

가드 확인: 구 shadow 토큰 0 · `.dark` 0 · 카드/입력/패널 외곽 border 0(표 행/오버레이 헤어라인만) · `any` 0 · 매직 hex 0(토큰 경유) · 매직 날짜 0 · `'use client'` 추가/이동 0(restyle은 className만).

## 6. ⚠️ 후속 필요 (다른 에이전트)

1. **rendering-matrix 갱신**(cf-architect): `/` 행 전략 **SSG → ISR(revalidate=3600)**, `/plans` 행을 "→ `/` redirect"로. 현재 `/`의 실제 코드(`export const revalidate = 3600`)와 매트릭스 선언(SSG)이 불일치 → Hard Threshold ② 정합 위해 SSOT 갱신 필요. (구 `/plans` ISR 근거를 `/`로 이전.)
2. **edge-data-integrator**: repository/criteria 기본 정렬을 `price_asc`로(병행). UI는 이미 price_asc 기본.
3. **site-inspector(5b 재검수)**: 홈 구조 변경·정렬 기본값·시각 프리미엄 톤 재검증. preview Web Vitals 재측정.
