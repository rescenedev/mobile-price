---
project: ratsaver
phase: 3
version: 2
title: 디자인 v2 실행 체크리스트 (ui-developer가 그대로 적용)
status: ready-for-impl
created: 2026-06-14
target_dir: apps/ratsaver
scope: 디자인 토큰·테마·className만. 로직/데이터/라우트/렌더링전략 변경 0.
---

# ratsaver v2 (Toss/Apple Premium) — 파일별 변경 지시

> **원칙**: 아래는 className/토큰 치환 위주. import·props·로직·`'use client'`·서버/클라 경계는 건드리지 않는다.
> 각 항목 적용 후 `npm run typecheck && npm run lint`(Hard Threshold ①) 0 유지. 시각 검수는 site-inspector(Phase 5b).

---

## STEP 0 — 전역 치환 (sed로 일괄, 그 다음 수동 확인)

전 코드베이스에서 **구 shadow 토큰 → 신 토큰** 치환:
```
shadow-card-hover  →  shadow-e2
shadow-card        →  shadow-e1
shadow-popover     →  shadow-e3
```
> 주의: `shadow-card-hover`를 먼저 치환(부분 매칭 방지). `rg "shadow-(card|popover)" apps/ratsaver/src apps/ratsaver/app` 로 잔존 0 확인.

검색해서 **수동 판단**으로 제거할 패턴:
```
rg "border border-(border|input)" apps/ratsaver   # 카드/입력/패널 외곽 border → 제거 대상
rg "rounded-lg"  apps/ratsaver                     # 카드면 rounded-2xl, 버튼/입력이면 rounded-xl
rg "text-primary\b" apps/ratsaver                  # 가격/본문링크면 foreground / primary-strong 로
```

---

## STEP 1 — 토큰 배선 (2파일 전체 교체)

### `app/globals.css` → `theme.md` §1 전체 교체본으로 덮어쓰기
- `:root` 토스 팔레트 + `--foreground-secondary` + `--primary-strong` + `--saving-strong` 추가.
- **`.dark { ... }` 블록 전체 삭제**.
- **`* { @apply border-border }` 삭제** → `* { border-color: hsl(var(--border)) }` (전역 보더 적용 제거).
- `@layer utilities`에 `.shadow-focus` 추가, `.nums`에 `font-feature-settings:'tnum'` 추가.

### `tailwind.config.ts` → `theme.md` §2 전체 교체본으로 덮어쓰기
- `darkMode: 'class'` **제거**.
- `colors`: `foreground`를 `{DEFAULT, secondary}`, `background`를 `{DEFAULT, subtle}`, `primary`에 `strong`, `saving`에 `strong` 추가.
- `borderRadius`: `'2xl': var(--radius)`(16) / `xl`(12) / `lg`(10) / `md`(8) / `sm`(6).
- `boxShadow`: `e1`/`e2`/`e3`/`focus` (기존 card/card-hover/popover 삭제).

### `app/layout.tsx`
- `localFont({ weight: '400 700' })` → **`weight: '400 800'`** (1줄).
- footer: `className="border-t border-border bg-card"` → `className="border-t border-border bg-background-subtle"`.

---

## STEP 2 — shared/ui restyle (cva·className)

### `src/shared/ui/card.tsx`
- Card root: `'rounded-lg border border-border bg-card text-card-foreground shadow-card'`
  → `'rounded-2xl bg-card text-card-foreground shadow-e1 transition-[transform,box-shadow] duration-200'`
- CardHeader/CardContent/CardFooter 패딩 `p-4 sm:p-5` → `p-5 sm:p-6` (CardContent의 `pt-0`, CardFooter의 `pt-0` 동일 비율 유지).
- CardTitle: `'text-base font-semibold leading-snug'` → `'text-base sm:text-lg font-semibold leading-snug tracking-tight'`.

### `src/shared/ui/button.tsx` (buttonVariants)
- base 문자열: `rounded-md text-sm font-medium transition-colors` → `rounded-xl text-sm font-semibold transition-[transform,background-color,box-shadow] duration-200 active:scale-[0.97] motion-reduce:active:scale-100`.
- variants.default: `hover:bg-primary/90` → `hover:bg-primary-strong`.
- variants.saving: `hover:bg-saving/90` → `hover:bg-saving-strong`.
- variants.outline: `'border border-border bg-card hover:bg-accent hover:text-accent-foreground'` → `'bg-card text-foreground shadow-e1 hover:bg-accent hover:text-accent-foreground'`.
- variants.secondary: `hover:bg-secondary/80` → `hover:bg-muted`.
- variants.link: `text-primary` → `text-primary-strong`.
- size.default: `h-11 px-4 py-2` → `h-12 px-5 py-2`.
- size.lg: `h-12 rounded-md px-8 text-base` → `h-14 rounded-xl px-8 text-base`.
- size.sm: `h-9 rounded-md px-3` → `h-10 rounded-lg px-4`.
- size.icon: `h-11 w-11` → `h-12 w-12 rounded-xl`.

### `src/shared/ui/input.tsx`
- className: `'flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm ... focus-visible:ring-offset-2 ... aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive'`
  → `'flex h-12 w-full rounded-xl border-0 bg-muted px-4 py-2 text-[15px] ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive aria-[invalid=true]:bg-card'`.

### `src/shared/ui/badge.tsx` (badgeVariants)
- base: `'... border px-2.5 py-0.5 text-xs font-medium ...'` → `'... px-2.5 py-1 text-xs font-semibold ...'` (border 제거, py↑, semibold).
- default: `'border-transparent bg-secondary text-secondary-foreground'` → `'bg-muted text-foreground-secondary'`.
- mvno: `'border-transparent bg-primary/10 text-primary'` → `'bg-accent text-accent-foreground'`.
- outline: `'border-border text-foreground'` → `'bg-card shadow-e1 text-foreground'`.
- saving/warning: 그대로(토큰 톤 자동 반영).

### `src/shared/ui/toggle.tsx` (toggleVariants)
- base: `rounded-md ... data-[state=on]:bg-primary data-[state=on]:text-primary-foreground` → 추가 `data-[state=on]:shadow-e1`.
- variant.default: `'bg-card border border-border'` → `'bg-card text-foreground-secondary shadow-e1'`.
- size.default: `h-9 px-3` → `h-10 px-4`.
- size.chip: `h-9 rounded-full px-4` → `h-10 rounded-full px-4 text-[13px] font-semibold`.

### `src/shared/ui/select.tsx` (SelectTrigger className)
- `h-10 ... border border-input bg-background ... rounded-md` → `h-12 bg-muted rounded-xl border-0 px-4 focus:ring-2 focus:ring-ring focus:ring-offset-1`.

### `src/shared/ui/dialog.tsx` / `sheet.tsx`
- Content panel: `shadow-popover`(→이미 e3로 치환됨) 확인. radius: dialog `rounded-lg`→`rounded-2xl`. sheet side=bottom Content → `rounded-t-2xl`. overlay `bg-black/80`→`bg-black/40`.

### `src/shared/ui/table.tsx`
- 외곽 border가 컴포넌트에 있으면 제거(부모 카드 shadow가 담당). 행: `border-b`→`divide-y` 패턴은 사용처(compare-table)에서 관리. TableRow `border-b border-border` 유지 가능(헤어라인).

### `src/shared/ui/skeleton.tsx`
- `rounded-md bg-muted` → `rounded-2xl bg-muted`(카드 스켈레톤 일치). 작은 스켈레톤은 `rounded-lg`.

---

## STEP 3 — widgets restyle

### `src/widgets/plan-card/index.tsx` (핵심)
1. Card className: `'flex flex-col transition-shadow hover:shadow-card-hover motion-reduce:transition-none'`
   → `'flex flex-col transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-e2 motion-reduce:transition-none motion-reduce:hover:translate-y-0'`.
2. 내부 wrapper `p-4 sm:p-5` → `p-5 sm:p-6`, `gap-3` → `gap-4`.
3. **`<Separator />` 2개 제거** → 컨테이너가 `space-y-4`(또는 `gap-4`)로 블록 분리(이미 flex-col gap이면 OK). 시각 구분이 약하면 ②③ 텍스트를 묶어 한 블록으로.
4. 데이터 라인: `<p className="text-lg font-semibold">` → `<p className="text-xl sm:text-2xl font-bold tracking-tight">`.
5. 속도/통화/약정 `text-sm text-muted-foreground` → `text-sm text-foreground-secondary`.
6. h3 요금제명: `'text-base font-semibold leading-snug'` → `'text-base sm:text-lg font-semibold leading-snug tracking-tight'`.
7. footer: `'border-t border-border p-4 sm:p-5'` → `'border-t border-border p-5 sm:p-6 pt-4'` (액션 구분 헤어라인 1줄만 허용 — 카드 외곽 border는 여전히 없음). 또는 헤어라인 제거하고 `pt-2`.

### `src/widgets/plan-card/price-block.tsx`
1. 가격 숫자 span: `'nums font-bold leading-none text-primary'` + `size==='hero'?'text-4xl':'text-2xl'`
   → `'nums font-extrabold leading-none tracking-tight text-foreground'` + `size==='hero'?'text-4xl sm:text-5xl':'text-[28px] sm:text-3xl'`.
   (**색 primary → foreground**: 토스는 금액을 near-black 큰 숫자로. primary는 CTA 전용.)
2. "월" 라벨: `'text-sm text-muted-foreground'` → `'text-sm font-medium text-foreground-secondary'`.
3. warning 띠 `<p>`: `'... rounded-md bg-warning-muted px-2 py-1 text-xs ...'` → `'... rounded-lg bg-warning-muted px-3 py-1.5 text-xs ...'`. AlertTriangle `text-warning` 추가(아이콘만 앰버), 텍스트 `text-warning-muted-foreground` 유지.
4. "프로모션 없이 정가 유지" `text-xs text-muted-foreground` 유지.

### `src/widgets/site-header/index.tsx`
1. header: `'sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70'`
   → `'sticky top-0 z-40 bg-card/80 backdrop-blur shadow-[0_1px_0_0_hsl(var(--border))] supports-[backdrop-filter]:bg-card/70'` (border-b 제거, 미세 헤어라인 그림자만).
2. 내부 div `h-14` → `h-16`.
3. 로고 Link: `'... text-lg font-semibold text-primary ...'` → `'... text-xl font-extrabold tracking-tight text-foreground ...'`.
4. nav 링크: `text-muted-foreground` → `text-foreground-secondary`, `rounded-md`→`rounded-lg`, hover `bg-accent hover:text-accent-foreground` 유지.

> **연동**: `/plans`의 FilterBar `sticky top-14` → `top-16`으로 변경(아래).

### `src/widgets/filter-bar/index.tsx`
1. 루트 div: `'sticky top-14 z-30 -mx-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:px-4'`
   → `'sticky top-16 z-30 -mx-5 bg-background/90 px-5 py-3 backdrop-blur shadow-[0_1px_0_0_hsl(var(--border))] sm:mx-0 sm:rounded-2xl sm:bg-card sm:px-5 sm:py-4 sm:shadow-e1'`.
2. (입력/select/버튼은 shared/ui restyle로 자동 채움형 적용. 추가 변경 불필요.)

### `src/widgets/filter-bar/quick-chips.tsx`
- 변경 없음(toggle v2가 자동 반영). 필요 시 ToggleGroup에 `className="gap-2"` 부여.

### `src/widgets/saving-result/index.tsx`
1. 루트 div: `'rounded-lg border border-border bg-card p-4 shadow-card sm:p-5'`
   → `'rounded-2xl bg-card p-6 shadow-e1 sm:p-8'`.
2. 결과 div: `'mt-4 flex min-h-[112px] ... rounded-md bg-saving-muted px-4 py-4 ...'`
   → `'mt-5 flex min-h-[128px] ... rounded-2xl bg-saving-muted px-6 py-6 ...'`.
3. "월" 라벨 `text-sm text-saving-muted-foreground` → 유지(또는 `text-saving-strong/70`).
4. 절약액 `p`: `'nums text-3xl font-bold leading-none text-saving sm:text-4xl'`
   → `'nums text-4xl font-extrabold leading-none tracking-tight text-saving-strong sm:text-5xl'`.
5. 연 절약 `text-saving-muted-foreground` 유지.

### `src/widgets/compare-table/index.tsx`
1. ScrollArea: `'w-full rounded-lg border border-border bg-card'` → `'w-full rounded-2xl bg-card shadow-e1'`.
2. table에 `divide-y divide-border`가 필요하면 thead/tbody 행 `border-b border-border` 유지(헤어라인). 외곽선만 제거됨.
3. 헤더 요금제명 `text-sm font-semibold leading-snug` → `+tracking-tight`.
4. 셀 패딩 `py-3` → `py-3.5`(선택).

### `src/widgets/usage-preset-modal/index.tsx`
1. dialog/sheet Content는 shared/ui restyle 반영(rounded-2xl/rounded-t-2xl, shadow-e3).
2. 프리셋 옵션 카드(선택 가능 버튼): off 상태 `border` → 제거, off=`bg-muted rounded-xl`, on=`bg-accent ring-2 ring-primary`. 패딩 확대.

### `src/widgets/empty-state/index.tsx`
- 컨테이너: border 카드 → `bg-card rounded-2xl shadow-e1 p-10 text-center`.

### `src/widgets/disclaimer/index.tsx`
- 변경 거의 없음(caption 톤 유지). 텍스트 `text-muted-foreground`(=#8B95A1) 유지.

---

## STEP 4 — pages restyle (랜딩 가치블록 등)

### `app/page.tsx`
1. 히어로 h1: `'text-3xl font-bold leading-tight sm:text-4xl'` → `'text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl'`.
2. 부제 p: `'... text-sm text-muted-foreground sm:text-base'` → `'... text-base text-foreground-secondary sm:text-lg'`.
3. SavingResult wrapper `max-w-md` → `max-w-xl`.
4. CTA 버튼들: `className="sm:min-w-40"`에 `size="lg"`(h-14) 부여(둘 다).
5. 가치블록 `<li>`: `'rounded-lg border border-border bg-card p-5 shadow-card'`
   → `'rounded-2xl bg-card p-6 shadow-e1 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-e2 motion-reduce:hover:translate-y-0'`.
6. 섹션 간격 `space-y-12 sm:space-y-16` → `space-y-16 sm:space-y-24`.

### 기타 page (`plans`, `plans/[id]`, `compare`, `recommend`, `calculator`)
- 제목 h1: `text-2xl`류 → `text-2xl sm:text-3xl font-bold tracking-tight`.
- 폼 중심(`recommend`/`calculator`) 컨테이너 `max-w-md`→`max-w-xl` 중앙.
- 그 외 카드/입력/표면은 widgets·shared/ui restyle로 자동 반영. 잔존 `border border-border` 카드 발견 시 제거 + `shadow-e1 rounded-2xl`.

---

## STEP 5 — 검증 (Hard Threshold)

```bash
cd apps/ratsaver
rg "shadow-(card|popover)" src app          # → 0 (구 토큰 잔존 0)
rg "border border-(border|input)" src app   # → 카드/입력/패널 외곽 0 (표 행 헤어라인만 허용)
rg "\.dark" app/globals.css                 # → 0 (다크 블록 제거)
rg "text-primary['\" ]" src app             # → 가격/본문링크 잔존 점검(primary는 CTA·활성·아이콘만)
npm run typecheck                            # 0
npm run lint                                 # 0
npm run build                                # 통과
```

체크리스트:
- [ ] STEP 0 shadow 토큰 일괄 치환, 잔존 0
- [ ] globals.css/tailwind.config 전체 교체(다크 삭제·전역 border 제거·e1/e2/e3·radius·색 alias)
- [ ] layout.tsx weight 400 800 · footer bg-background-subtle
- [ ] shared/ui 9종 restyle(card/button/input/badge/toggle/select/dialog/sheet/skeleton)
- [ ] plan-card·price-block(가격 foreground 큰 숫자·hover 떠오름·Separator 제거)
- [ ] site-header(h-16·border-b 제거·로고 extrabold) ↔ filter-bar(top-16) 정합
- [ ] saving-result(큰 절약 숫자 800 saving-strong·패딩 확대)
- [ ] compare-table·empty-state·preset-modal border 제거
- [ ] page.tsx 히어로 5xl·가치블록 hover·CTA h-14
- [ ] typecheck/lint/build 0 · CLS 가드(고정높이·next/font·next/image) 불변

---

## 마이그레이션 리스크 메모
- **sticky 겹침**: Header h-14→h-16 변경 시 FilterBar `top-14`→`top-16` 동시 수정 필수(누락 시 칩 가림).
- **shadow 부분매칭**: `shadow-card-hover`를 `shadow-card`보다 먼저 치환.
- **table 행선**: 표는 정보 구조상 행 헤어라인(`border-b`/`divide-y border`) 유지 — 일괄 border 제거에서 제외.
- **대비 가드**: `text-primary`(#3182F6, 3.6:1)는 14px+ bold/아이콘/활성 칩에만. 본문 링크는 `text-primary-strong`. 가격은 `text-foreground`. (Hard Threshold 외 a11y — site-inspector 검수.)
- **CLS**: restyle은 className만 → 레이아웃 박스 크기 변화 최소. 패딩 확대는 빌드시 고정값이라 런타임 CLS 무관(스켈레톤 높이만 카드 실제 높이와 재정렬 확인).
