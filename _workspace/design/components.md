---
project: ratsaver
phase: 3
version: 2
title: 컴포넌트 restyle 명세 v2 (widgets + shadcn variant) — Toss/Apple Premium
status: completed
created: 2026-06-14
updated: 2026-06-14
supersedes: components.md v1
---

# ratsaver — 컴포넌트 restyle 명세 v2

> **로직/데이터/구조 변경 0** — className·토큰만 교체. ui-developer(4c)가 그대로 적용.
> 색 사용은 `tokens.md` v2 3색 의미 규약 유지(blue=행동·green=절약·amber=정직). 표면 분리는 **border 제거 → 섀도우+bg**.
> 파일별 실행 체크리스트는 `redesign-notes.md`.

---

## A. shadcn 컴포넌트 (cva) restyle

### button (`src/shared/ui/button.tsx`)
| 항목 | before (v1) | after (v2) |
|------|-------------|-----------|
| base | `rounded-md text-sm font-medium transition-colors` | `rounded-xl text-sm font-semibold transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.97] motion-reduce:active:scale-100` |
| `default` | `bg-primary hover:bg-primary/90` | `bg-primary text-primary-foreground hover:bg-primary-strong` |
| `saving` | `bg-saving hover:bg-saving/90` | `bg-saving text-saving-foreground hover:bg-saving-strong` |
| `outline` | `border border-border bg-card hover:bg-accent` | `bg-card text-foreground shadow-e1 hover:bg-accent hover:text-accent-foreground` (border 제거) |
| `secondary` | `bg-secondary hover:bg-secondary/80` | `bg-secondary text-secondary-foreground hover:bg-muted` (연회색 채움) |
| `ghost` | `hover:bg-accent` | 유지 |
| `link` | `text-primary hover:underline` | `text-primary-strong underline-offset-4 hover:underline` (본문 안전색) |
| `destructive` | `bg-destructive hover:bg-destructive/90` | 유지(톤만 v2 Toss Red) |
| size.default | `h-11 px-4` | `h-12 px-5` (48px, 토스 탭) |
| size.lg | `h-12 px-8 text-base` | `h-14 px-8 text-base rounded-xl` (56px 큰 CTA) |
| size.sm | `h-9 px-3` | `h-10 px-4 rounded-lg` |
| size.icon | `h-11 w-11` | `h-12 w-12 rounded-xl` |

> press scale·hover는 `motion-reduce`로 무력화. CTA는 항상 semibold(흰글자 on blue AA 보장).

### badge (`src/shared/ui/badge.tsx`)
| variant | before | after |
|---------|--------|-------|
| base | `rounded-full border px-2.5 py-0.5 text-xs font-medium` | `rounded-full px-2.5 py-1 text-xs font-semibold` (border 제거, 패딩 소폭↑) |
| `default` (망·세대) | `bg-secondary text-secondary-foreground` | `bg-muted text-foreground-secondary` (연회색 pill) |
| `saving` | `bg-saving-muted text-saving-muted-foreground` | 유지(v2 톤 자동 반영) |
| `warning` | `bg-warning-muted text-warning-muted-foreground` | 유지 |
| `mvno` (알뜰폰) | `bg-primary/10 text-primary` | `bg-primary-50 text-primary-strong` (= `bg-accent text-accent-foreground`) |
| `outline` | `border-border text-foreground` | `bg-card shadow-e1 text-foreground` (border 제거) |

> 망 색코드화 금지 유지(SKT=빨강 식 금지). pill만 연회색.

### input (`src/shared/ui/input.tsx`) — 채움형 전환 (핵심)
| 항목 | before | after |
|------|--------|-------|
| 전체 | `h-11 rounded-md border border-input bg-card px-3 ... focus-visible:ring-2 ring-ring ring-offset-2` | `h-12 rounded-xl bg-muted px-4 text-[15px] ... border-0 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors` |
| placeholder | `text-muted-foreground` | 유지(`#8B95A1`) |
| invalid | `aria-[invalid]:border-destructive ring-destructive` | `aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive aria-[invalid=true]:bg-card` (border 제거) |

> **토스 입력 패턴**: 평상시 연회색 채움(`bg-muted`) + 테두리 0 → focus 시 흰 배경 + 블루 ring. 답답한 박스 느낌 제거.

### select trigger (`src/shared/ui/select.tsx`)
- before: `h-10 border border-input bg-background rounded-md` → after: `h-12 bg-muted rounded-xl border-0 focus:ring-2 focus:ring-ring px-4`.

### toggle / 칩 (`src/shared/ui/toggle.tsx`)
| 항목 | before | after |
|------|--------|-------|
| base | `rounded-md ... data-[state=on]:bg-primary` | `rounded-full ... data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-e1 transition-colors` |
| variant.default | `bg-card border border-border` | `bg-card text-foreground-secondary shadow-e1` (off=떠있는 흰 pill) |
| size.chip | `h-9 rounded-full px-4` | `h-10 rounded-full px-4 text-[13px] font-semibold` |

> off 칩 = 흰 배경 + 미세 섀도우(떠있음). on 칩 = 토스 블루 솔리드. border 제거.

### dialog / sheet / popover / dropdown
- 패널: `shadow-popover` → `shadow-e3`. 컨테이너 radius: 모달 `rounded-2xl`, 시트(bottom) `rounded-t-2xl`. overlay `bg-black/40`.

### card (`src/shared/ui/card.tsx`) — 표면 핵심
| 항목 | before | after |
|------|--------|-------|
| Card | `rounded-lg border border-border bg-card shadow-card` | `rounded-2xl bg-card shadow-e1 transition-[transform,box-shadow] duration-200` (border 제거) |
| CardHeader/Content/Footer | `p-4 sm:p-5` | `p-5 sm:p-6` (패딩 확대) |
| CardTitle | `text-base font-semibold` | `text-base sm:text-lg font-semibold tracking-tight` |
| (hover 옵션) | — | 카드 사용처에서 `hover:-translate-y-1 hover:shadow-e2` 부여(인터랙티브 카드만) |

### separator / table
- separator: 카드 내부 4블록 구분은 **가급적 `space-y-4` 여백으로 대체**. 꼭 필요한 곳만 `bg-border-hairline`.
- table: 외곽 border 제거(부모 카드 `shadow-e1`). 행 구분 `divide-y divide-[hsl(var(--border))]`.

---

## B. 6 Widgets restyle

### 1. PlanCard (`src/widgets/plan-card/index.tsx` + `price-block.tsx`) — 핵심 재디자인
> 토스 금융상품 카드처럼. **테두리 없는 흰 카드 + 소프트섀도우 + hover 떠오름**. 칩 pill, 데이터/속도 큰 타이포, 가격 토스 큰 숫자, 종료후정가 절제된 회색 보조(항상 병기).

**before (v1) 구조**: `Card(border shadow-card) hover:shadow-card-hover` → 내부 `Separator` 2개로 4블록 구분, 데이터 `text-lg`, 가격 `text-2xl 700 primary`, footer `border-t`.

**after (v2) 구조**:
```
┌────────────────────────────────────────────┐  rounded-2xl bg-card shadow-e1
│ (p-5 sm:p-6, space-y-4)                      │  hover:-translate-y-1 hover:shadow-e2
│ [KT망][LTE][알뜰폰]  pill 회색/accent         │  ← Badge 행 gap-1.5
│ 모요핫딜 6월 쉐이크 100GB     h3 lg 600 tight │  ← plan.name
│                                              │  ← Separator 삭제 → space-y-4 여백
│ 100GB           text-xl sm:text-2xl 700      │  ← 데이터(크게)
│ 소진 후 5Mbps    text-sm foreground-secondary │  ← 속도(회색)
│ 통화 무제한 · 문자 무제한   body-secondary     │  ← ②
│ KT · 약정없음               body-secondary     │  ← ③
│                                              │
│ ─ PriceBlock (강조) ─────────────────────    │
│ 월 15,300원      "월"sm + 숫자 text-3xl 800   │  ← 토스 큰 숫자(primary 아닌 foreground)
│  ⚠ 7개월 후 43,000원   warning-muted 띠 rounded-lg│ ← 종료후정가(항상 병기)
├────────────────────────────────────────────┤  (footer: border-t 제거 → pt-1 여백 or 헤어라인 1px)
│ 상세 보기(link primary-strong)   [비교담기 toggle]│  h-10
└────────────────────────────────────────────┘
```
**핵심 변경**:
- Card: `border` 제거, `shadow-card`→`shadow-e1`, hover에 **`hover:-translate-y-1 hover:shadow-e2`** 추가(현재는 shadow만). `motion-reduce:hover:translate-y-0`.
- `Separator` 2개 제거 → 상위 컨테이너 `space-y-4`로 블록 분리(테두리 없는 여백 분리). footer `border-t border-border` → `border-t border-[hsl(var(--border))] pt-4`(또는 헤어라인) — 액션 구분만 최소 헤어라인 1줄 허용.
- 데이터 수치 `text-lg`→`text-xl sm:text-2xl font-bold`(더 크게). 속도/통화/약정 텍스트 → `text-foreground-secondary`(회색 위계).
- 패딩 `p-4 sm:p-5`→`p-5 sm:p-6`.
- Badge: 망/세대 = `default`(연회색 pill), 알뜰폰 = `mvno`(연블루 pill).

**PriceBlock (price-block.tsx) after**:
- 가격 숫자 색: v1 `text-primary` → **`text-foreground`** (토스는 금액을 near-black 큰 숫자로, primary는 CTA에만). 크기 `text-2xl`→`text-[28px] sm:text-3xl font-extrabold tracking-tight`. "월"은 `price-unit`(sm 500 foreground-secondary).
- 종료후정가 띠: `bg-warning-muted rounded-md`→`rounded-lg px-3 py-1.5`, 텍스트 `text-warning-muted-foreground`(=`#A85812`). ⚠ 아이콘 `text-warning`. 항상 병기 유지(US-005).
- hero size: `text-4xl`→`text-4xl sm:text-5xl font-extrabold`.

### 2. SiteHeader (`src/widgets/site-header/index.tsx`)
- before: `border-b border-border bg-card/80 backdrop-blur`, 로고 `text-lg text-primary`.
- after: **`border-b` 제거 → 스크롤 시에만 `shadow-e1`** 느낌. `bg-card/80 backdrop-blur`(유지). 헤더 높이 `h-14`→`h-16`(여유). 로고 `text-lg text-primary`→`text-xl font-extrabold tracking-tight text-foreground`("ratsaver" near-black + 로고감), 활성 nav 링크 `text-primary-strong`. nav 링크 hover `bg-accent`(연블루) 유지, `rounded-lg`.
- 경계 표현: border-b 대신 `after:` 미세 헤어라인 또는 sticky 그림자. 토스 헤더는 거의 라인 없이 배경 대비로 분리 → `border-b` 삭제하고 필요 시 `shadow-[0_1px_0_0_hsl(var(--border))]`만.

### 3. FilterBar (`src/widgets/filter-bar/index.tsx`)
- before: `sticky border-b border-border bg-background/90 ... sm:rounded-lg sm:border`.
- after: `sticky bg-background/90 backdrop-blur ... sm:rounded-2xl sm:bg-card sm:shadow-e1` (sm+에서 카드형 떠있는 바, **border 제거**). 모바일 sticky 바는 `border-b` 대신 스크롤 그림자.
- 상세필터 입력들 = 채움형 input/select(v2). "상세 필터" 버튼 `variant=outline`(섀도우형). 정렬 select `bg-muted rounded-xl`.
- Sheet(bottom) `rounded-t-2xl shadow-e3`.

### 4. QuickChips (`src/widgets/filter-bar/quick-chips.tsx`)
- 구조 변경 없음. toggle v2 restyle 자동 반영: off=흰 pill+`shadow-e1`, on=토스블루 솔리드, `h-10 rounded-full`. 가로 스크롤(ScrollArea) 유지. 칩 `gap`을 `gap-2`로.

### 5. UsagePresetModal (`src/widgets/usage-preset-modal/index.tsx`)
- dialog/sheet 패널 `shadow-e3 rounded-2xl`(데스크탑)/`rounded-t-2xl`(모바일).
- 프리셋 옵션 카드: 선택 강조 `ring-2 ring-primary`→유지하되 **off 상태 border 제거**, off=`bg-muted rounded-xl`, on=`bg-accent ring-2 ring-primary`. 아이콘+라벨+용량, 패딩 확대.
- 탭(tabs): 활성 인디케이터 primary. "추천 받기" 버튼 `h-12` default.

### 6. CompareTable (`src/widgets/compare-table/index.tsx`)
- before: `ScrollArea rounded-lg border border-border bg-card`, 행 `border-b border-border`.
- after: `ScrollArea rounded-2xl bg-card shadow-e1`(**외곽 border 제거**). 행 구분만 `divide-y` 헤어라인 유지(표는 정보 구조상 행 라인 필요). 첫 열 sticky `bg-card`.
- 최저 프로모가 셀 `badge saving`(✅) 유지, 종료후정가 `warning` 유지. 헤더 요금제명 `font-semibold tracking-tight`. 셀 패딩 `py-3`→`py-3.5`.
- 제거/상세 버튼 v2 size(`sm` = h-10 / link primary-strong).

### 7. SavingResult (`src/widgets/saving-result/index.tsx`) — 히어로 강조
- before: `rounded-lg border border-border bg-card p-4 shadow-card`, 결과 `bg-saving-muted rounded-md min-h-[112px]`, 절약 숫자 `text-3xl sm:text-4xl text-saving`.
- after: 카드 `rounded-2xl bg-card shadow-e1 p-6 sm:p-8`(**border 제거, 패딩 확대**). 입력=채움형 input. "계산하기" `variant=saving h-12`.
- 결과 박스: `bg-saving-muted rounded-md`→`rounded-2xl min-h-[128px] p-6`. 절약액 `text-3xl sm:text-4xl`→**`text-4xl sm:text-5xl font-extrabold text-saving-strong tracking-tight nums`**(토스 큰 숫자). "월" 라벨 `text-saving-strong/70 text-sm`. 연 절약 `text-saving-strong`.
- 동선 CTA `h-12` 유지.

---

## C. 보조 컴포넌트 restyle

| 컴포넌트 | before | after |
|----------|--------|-------|
| Disclaimer | `text-xs muted-foreground` | 유지(`text-muted-foreground` = #8B95A1, caption). 푸터 `border-t bg-card`→`bg-background-subtle`(연회색, border 제거 or 헤어라인 1px) |
| ResultCount | `text-sm muted-foreground`, 숫자 `text-foreground 600` | 숫자 강조 `font-bold`, 라벨 `text-foreground-secondary` |
| EmptyState | border 카드 | `bg-card rounded-2xl shadow-e1` 중앙 정렬, 넉넉한 패딩 `p-10` |
| LoadingSkeleton | 고정 높이(유지) | radius `rounded-2xl`로 카드와 일치. `bg-muted` shimmer |
| 가치 3블록(랜딩) | `rounded-lg border border-border bg-card p-5 shadow-card` | `rounded-2xl bg-card p-6 shadow-e1 hover:-translate-y-1 hover:shadow-e2`(border 제거) |

---

## D. 서버/클라 경계 (변경 없음 — 번들 예산 보호)
| 컴포넌트 | 경계 |
|----------|------|
| PlanCard | 서버 (비교 toggle만 클라) |
| Disclaimer/ResultCount(셸)/CompareTable | 서버 (제거 버튼 클라) |
| FilterBar/QuickChips/SavingResult | 클라 |
| PresetModal | 클라 + `next/dynamic` lazy |

> restyle은 className만 → 경계·번들 영향 0. `'use client'` 추가/이동 없음.

---

## E. 가드레일 (Do's & Don'ts) — v2

**Do**
- 표면 분리는 **`shadow-e1`(기본)/`shadow-e2`(hover)/`shadow-e3`(오버레이)** 토큰만.
- 카드/패널/입력 radius: 카드 `rounded-2xl`, 버튼·입력·select `rounded-xl`, 칩·배지 `rounded-full`.
- 텍스트 위계: 본문/제목 `foreground` · 라벨/2차 `foreground-secondary` · placeholder/3차 `muted-foreground`.
- 링크 텍스트는 `text-primary-strong`(본문 대비), CTA 라벨은 항상 `font-semibold` 이상.
- 금액/절약액은 페이지 최대 크기(`price`/`price-hero`) + `nums`. 단위("월"/"원")는 작게.
- 간격은 4px 스케일만. 카드 패딩 `p-5 sm:p-6`, 섹션 `py-12 sm:py-16`.
- hover 떠오름·press scale은 `motion-reduce`로 무력화.

**Don't**
- ❌ 카드/입력/패널/표 외곽에 `border` 사용(표 내부 행 헤어라인·꼭 필요한 구분선만 예외).
- ❌ `shadow-card`/`shadow-card-hover`/`shadow-popover`(구 토큰) 잔존 — 전부 e1/e2/e3로 치환.
- ❌ 14px 미만 본문에 `text-primary`(#3182F6)·`text-muted-foreground`·`text-destructive` 단독 사용(대비 미달).
- ❌ 임의 hex·임의 radius(`rounded-[13px]`)·임의 shadow. 토큰만.
- ❌ 가격 숫자를 `text-primary`로(primary는 CTA·활성 전용 — 금액은 `foreground`/절약은 `saving-strong`).
- ❌ 보라 그라데이션·네온 글로우·바운스 모션·한 화면 weight 4종 이상.
- ❌ 망 컬러코딩(SKT=빨강 등).

---

## F. 4축 자체 평가 (components v2)
| 축 | 점수 | 근거 |
|----|------|------|
| Design Quality (≥7) | 9 | PlanCard 토스 카드화(무border·hover 떠오름·큰 숫자), 입력 채움형, 일관된 e1/e2 표면. |
| Originality (≥6) | 8 | 가격=near-black 큰 숫자(primary 아님)·off칩 흰 pill 섀도우·채움형 입력 등 토스 패턴 차용. |
| Craft (≥7) | 9 | before→after 표로 정밀 명세, motion-reduce·대비 가드·shadow rename 마이그레이션 명시. |
| Functionality (≥8) | 9 | 정직성 가격 병기 유지, 회색 위계로 정보 우선순위, 44~56px 타겟, 경계/번들 불변. |

가중 합 ≈ 8.75 — 통과.
