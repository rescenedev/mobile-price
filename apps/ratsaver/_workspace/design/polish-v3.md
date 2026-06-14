# Design Polish v3 — "촌스러움" 제거 실행 스펙

> 대상: ratsaver 홈(`/`) + 전역 헤더·카드. **토큰(v2)은 그대로 사용** — 이미 좋다(Toss Blue `#3182F6`, near-black `#191F28`, 2겹 섀도우 e1/e2/e3, saving green, warning amber). 문제는 **실행**: 색이 화면에 안 보이고, 히어로가 텍스트 한 줄이고, 필터바에 정렬 드롭다운이 외롭게 떠 있고, 카드가 평면적이고, 로고 마크가 없다. 아래는 ui-developer가 **파일별로 그대로 적용**할 변경 지시다.
>
> 진단 핵심: **여백은 충분하다. 부족한 건 위계·색·디테일·개성.** 토스/애플 패턴은 "절제된 컬러 1포인트 + 강한 숫자 위계 + 미세한 표면 디테일"로 만들어진다. 보라 그라데이션·글로우(AI 슬롭) 절대 금지.

레퍼런스 패턴 출처:
- **토스 홈/상품 카드**: 회색 배경(`#F2F4F6`) 위 순백 카드, 카드 안에서 **가장 큰 숫자 = 핵심값**, 브랜드 블루는 CTA·활성 상태·강조 1포인트에만. 좌측 컬러 액센트 레일.
- **토스 "내 보험/카드" 리스트**: 한 줄 헤더(결과수 좌 + 정렬 우)가 리스트 **위에 정돈**되어 떠 있지 않음.
- **애플 스토어 히어로**: 아이브로우(작은 강조 라벨) → 큰 헤드라인 → 보조문구 → 시각 앵커(제품/스탯). 휑함 0.

새 토큰: **불필요.** 기존 토큰 + 기존 유틸(`shadow-e1/e2/e3`, `bg-accent`, `text-primary`, `bg-saving-muted`)만으로 전부 해결. 단 globals.css에 유틸 2개(브랜드 레일·아이브로우 pill) 추가만 허용.

---

## 1. 로고 / 브랜드 마크 — `src/widgets/site-header/index.tsx`

현재: "최저가 요금제" 텍스트만. 마크 없음 → 무명 사이트 느낌.

**변경**: lucide `Zap`(번개=빠른/저렴) 아이콘을 primary-blue 둥근 사각형에 흰색으로 담아 워드마크 앞에 배치. 토스 앱 아이콘 = "둥근 사각형 + 흰 심볼" 공식 그대로.

```tsx
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { cn } from '@/shared/lib';

// ...NAV 동일...

export const SiteHeader = (): React.JSX.Element => (
  <header className="sticky top-0 z-40 bg-card/80 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-card/70">
    <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
      <Link
        href="/"
        aria-label="최저가 요금제 홈"
        className="group flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* 브랜드 마크 — primary 채움 + 흰 아이콘. size 고정(32px)으로 CLS 0. */}
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-e1 transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <Zap className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-foreground">
          최저가 요금제
        </span>
      </Link>
      {/* nav 동일 — 단, 활성 링크 강조를 위해 아래 2번 항목 참고(선택) */}
      <nav aria-label="주요 메뉴">{/* ...기존... */}</nav>
    </div>
  </header>
);
```

선택(권장): 현재 라우트가 활성인 nav 링크에 primary 텍스트 적용 — `usePathname()`을 쓰려면 `'use client'`가 되므로, 서버 컴포넌트 유지를 위해 이번 v3에서는 **마크 추가만** 적용하고 활성 표시는 보류. (성능/경계 보존 우선.)

**왜 촌스러움이 사라지나**: 화면 좌상단에 처음으로 primary-blue 색면이 등장 → 즉시 "브랜드 있는 서비스"로 인지. 아이콘 자체가 시각 앵커.

---

## 2. 히어로 리디자인 — `app/page.tsx`

현재: 회색 배경에 `h1` + `p` 한 줄. 휑하고 색 0, 시각 앵커 0.

**변경**: 아이브로우 배지(primary 틴트 pill) → 강한 헤드라인(핵심어 primary 강조) → 보조문구 → **우측 시각 앵커 미니 스탯 카드**(가장 싼 요금제 강조). 2열 그리드(lg+), 모바일 1열 스택. 배경은 토큰 그대로 회색이되, **앵커 카드가 색·숫자를 담아 휑함을 제거**한다.

`HomePage`는 서버 컴포넌트 유지. 시각 앵커에 쓸 최저가 plan은 이미 계산하는 `initialPlans[0]`(가장 싼 요금제)을 재사용 → 추가 연산 0.

```tsx
import { Suspense } from 'react';
import { Sparkles } from 'lucide-react';
import { seedPlans } from '@/shared/db';
import { formatKrw, formatData } from '@/entities/plan';
import { PlanList, INITIAL_PLAN_COUNT } from '@/widgets/plan-list';
import { Skeleton } from '@/shared/ui';

export const revalidate = 3600;

const TOTAL_PLAN_COUNT = seedPlans.length; // 253 — 정적, 서버 상수

export default function HomePage() {
  const sorted = [...seedPlans].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  const initialPlans = sorted.slice(0, INITIAL_PLAN_COUNT);
  const cheapest = sorted[0]; // 시각 앵커용 — 가장 싼 요금제

  return (
    <div className="space-y-8 pb-24 sm:space-y-12">
      {/* === 히어로: 좌 카피 / 우 시각 앵커 === */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        {/* 좌: 카피 */}
        <div className="space-y-5">
          {/* 아이브로우 배지 — primary 틴트 pill. 실시간 N개 신뢰 신호 */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
            실시간 {TOTAL_PLAN_COUNT}개 알뜰폰 요금제 비교
          </span>

          <h1 className="text-[2rem] font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
            가장 싼 요금제부터,
            <br />
            <span className="text-primary">정직하게</span> 보여드려요
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
            프로모가와 <span className="font-semibold text-foreground">종료 후 정가</span>를 함께.
            가입·광고 없이 필터로 내게 맞는 요금제를 3초 만에 찾으세요.
          </p>
        </div>

        {/* 우: 시각 앵커 — "이번 주 최저가" 미니 카드 */}
        <aside className="lg:justify-self-end">
          <div className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-e2 sm:p-7">
            {/* 좌측 primary 액센트 레일(토스 패턴) */}
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1.5 bg-primary"
            />
            <p className="text-sm font-semibold text-primary">이번 주 최저가</p>
            <p className="mt-1 text-base font-semibold leading-snug text-foreground">
              {cheapest.name}
            </p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-sm font-medium text-foreground-secondary">월</span>
              <span className="nums text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                {formatKrw(cheapest.monthlyPrice)}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground-secondary">
              {cheapest.carrier} · {cheapest.network}망 · {formatData(cheapest)}
            </p>
          </div>
        </aside>
      </section>

      <Suspense fallback={<Skeleton className="h-[60vh] w-full" />}>
        <PlanList initialPlans={initialPlans} />
      </Suspense>
    </div>
  );
}
```

**핵심 결정**:
- 헤드라인 핵심어 "정직하게"만 `text-primary` → 컬러 1포인트로 위계.
- 우측 앵커 카드 = `shadow-e2` + 좌측 primary 레일 + 큰 가격 숫자 → **첫 화면에서 색·숫자·깊이가 동시에 등장**, 휑함 제거.
- 앵커 데이터는 `cheapest`(이미 정렬한 배열 재사용) → 연산·페이로드 추가 0. 텍스트만(이미지 0) → LCP는 헤드라인 유지, CLS 0.
- 보라/글로우 0. 토스st 절제된 단색 포인트.

CLS 가드: 앵커 카드는 고정 패딩·텍스트(이미지 없음). lg 미만에서 1열 스택이라 레이아웃 점프 없음.

---

## 3. 필터 / 툴바 리디자인 — `src/widgets/filter-bar/index.tsx` + `plan-list`

현재 문제: ① 결과수("253개의 결과")가 필터바 **밖 아래**에 따로 떠 있음. ② 정렬 드롭다운이 빈 공간에 **외롭게 우측 부유**. ③ 퀵칩 → 정렬 → 입력 3개 순서가 정렬 어색.

**목표 구조(토스 리스트 헤더 패턴)**:
```
┌ 필터 카드 (sm+ rounded-2xl bg-card shadow-e1) ─────────────┐
│ [결과 N개]                              [정렬 ▾]   ← 한 줄 헤더 │
│ ───────────────────── (hairline) ─────────────────────────  │
│ [퀵칩] [퀵칩] [퀵칩] [퀵칩]          [상세 필터] (모바일)      │
│ (lg+) 가격 입력 | 데이터 입력 | 망 select  ← 정돈된 3열        │
└────────────────────────────────────────────────────────────┘
```

### 3-1. 결과수를 필터바 헤더로 이동

`plan-list/index.tsx`에서 별도 `<p>...개의 결과` 줄을 **제거**하고, `resultCount`를 `FilterBar`에 prop으로 넘긴다.

`plan-list/index.tsx` 변경:
```tsx
// results 계산 직후
const resultCount = results.length;

// JSX:
<FilterBar state={state} onChange={onChange} resultCount={resultCount} />
{/* ▼ 아래 별도 결과수 <p> 삭제 (필터바 헤더로 이동) */}
{/* results.length === 0 ... 이하 동일 */}
```

### 3-2. FilterBar 재구성

```tsx
'use client';

import { useId } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { IFilterState } from '@/features/plan-filter';
import { SORT_OPTIONS, PRICE_RANGE, DATA_RANGE } from '@/shared/config';
import type { TPlanSort } from '@/shared/db';
import {
  Button, Input, Label, ScrollArea, ScrollBar,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/shared/ui';
import { QuickChips } from './quick-chips';

interface IFilterBarProps {
  readonly state: IFilterState;
  readonly onChange: (next: IFilterState) => void;
  readonly resultCount: number; // ← 추가
}

const NETWORKS = [ /* 동일 */ ] as const;

export const FilterBar = ({ state, onChange, resultCount }: IFilterBarProps): React.JSX.Element => {
  const priceId = useId();
  const dataId = useId();
  const networkId = useId();
  const sortId = useId();
  const set = (patch: Partial<IFilterState>): void => onChange({ ...state, ...patch });

  const detailFields = ( /* 동일 — 단 grid gap-4 sm:grid-cols-3 유지 */ );

  return (
    <div className="sticky top-16 z-30 -mx-5 bg-background/90 px-5 py-3 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:bg-card sm:px-5 sm:py-4 sm:shadow-e1">
      <div className="flex flex-col gap-3 sm:gap-4">

        {/* ① 한 줄 헤더: 결과수(좌) + 정렬(우) — 부유 드롭다운 제거, 한 행에 정착 */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground-secondary" aria-live="polite">
            <span className="nums text-base font-bold text-foreground">{resultCount}</span>
            <span className="ml-1">개 요금제</span>
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor={sortId} className="hidden text-sm text-foreground-secondary sm:inline">
              정렬
            </Label>
            <Select value={state.sort} onValueChange={(v) => set({ sort: v as TPlanSort })}>
              <SelectTrigger id={sortId} className="h-9 w-[8.5rem] rounded-lg" aria-label="정렬 기준">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* hairline 구분선 — 헤더와 필터 분리(토스 표면 구획) */}
        <div className="h-px bg-border" aria-hidden="true" />

        {/* ② 퀵칩 행 + 모바일 상세필터 버튼 */}
        <div className="flex items-center gap-2">
          <ScrollArea className="min-w-0 flex-1 whitespace-nowrap">
            <QuickChips value={state.chips} onChange={(chips) => set({ chips })} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="shrink-0 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersHorizontal aria-hidden="true" />
                  필터
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader><SheetTitle>상세 필터</SheetTitle></SheetHeader>
                <div className="mt-4">{detailFields}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ③ lg+ 인라인 상세필터(정돈된 3열) */}
        <div className="hidden lg:block">{detailFields}</div>
      </div>
    </div>
  );
};
```

**핵심 결정**:
- 정렬 드롭다운이 결과수와 **같은 행**에 정착 → "외롭게 부유" 해소. 토스 리스트 헤더 그대로.
- 결과수가 필터 카드 **안**으로 들어와 떠다니는 텍스트 제거.
- hairline(`h-px bg-border`)으로 헤더 ↔ 필터 영역 시각 구획 → 정돈감.
- 퀵칩 `flex-1` + 상세필터 버튼이 같은 행 우측 → 정렬 일관.

### 3-3. 활성 퀵칩 primary 채움 (이미 토큰 OK, 가시성만 확인)

`toggle.tsx`의 `data-[state=on]:bg-primary data-[state=on]:text-primary-foreground`가 이미 적용됨 → **활성 칩은 이미 토스블루 채움**. 단 off 상태가 `bg-card text-foreground-secondary shadow-e1`라 회색 카드 위(`sm:bg-card`)에서 대비가 약하다. **off 칩을 `bg-muted` 기반으로 바꿔** 카드 위에서 칩 경계가 보이게:

`src/shared/ui/toggle.tsx` — `chip` variant의 off 표면 조정(default variant 영향 주의 → chip만):
```tsx
// toggleVariants size.chip 라인을 다음으로:
chip: 'h-9 rounded-full border border-transparent bg-muted px-4 text-[13px] font-semibold text-foreground-secondary shadow-none data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-e1',
```
> 주의: 위 클래스가 base의 `data-[state=on]:bg-primary`와 중복돼도 무해(동일값). off=연회색 pill, on=토스블루 채움 → 활성/비활성 대비 명확. shadow-e1 부유 제거로 칩이 더 "버튼답게".

(만약 size variant에 색을 넣는 게 cva 구조상 부담이면, `quick-chips.tsx`의 `ToggleGroupItem`에 `className="bg-muted text-foreground-secondary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground shadow-none"`를 직접 부여해도 동일 효과.)

---

## 4. 카드 디테일 업 — `src/widgets/plan-card/index.tsx` + `price-block.tsx`

현재: 모든 배지가 회색(`default`), 가격은 검정 단색, hover는 살짝 뜸만. 평면적·무채색.

### 4-1. 통신사/망 브랜드 점 + 강조 배지

망 자체 색코딩은 tokens.md 규약상 금지(SKT=빨강 식 금지). 대신 **카드 상단 좌측에 통신사 이니셜 점(브랜드 도트)** 으로 미세한 색 구분 + **무약정/최저가류 강조 배지**를 primary/saving 틴트로.

`plan-card/index.tsx` 헤더 블록 교체:
```tsx
// import 추가
import { cn } from '@/shared/lib';

// 망별 브랜드 도트 색(미세 — 텍스트 색코딩 아님, 작은 점만 허용. 규약 위반 아님: 점은 식별 보조).
// 토큰 외 색을 쓰지 않기 위해 망 도트는 단일 primary 톤 + opacity로 절제하거나, 아래처럼 중립 처리.
// → 안전책: 도트는 통신사 이니셜 원형 칩(중립 muted)로, 색은 쓰지 않음. 색 존재감은 배지/가격이 담당.

<div className="flex flex-col gap-3">
  {/* 통신사 이니셜 칩 + 요금제명 한 행 */}
  <div className="flex items-center gap-2.5">
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-foreground-secondary"
    >
      {plan.carrier.slice(0, 2)}
    </span>
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground-secondary">{plan.carrier}</p>
      <h3 className="truncate text-base font-bold leading-snug tracking-tight text-foreground sm:text-[17px]">
        {plan.name}
      </h3>
    </div>
  </div>

  {/* 배지 행 — 강조 배지에 색 부여(무약정=saving 틴트, 알뜰폰=primary 틴트), 망/세대는 중립 */}
  <div className="flex flex-wrap items-center gap-1.5">
    {plan.contract === 'none' ? <Badge variant="saving">무약정</Badge> : null}
    {plan.mvno ? <Badge variant="mvno">알뜰폰</Badge> : null}
    <Badge variant="default">{plan.network}망</Badge>
    <Badge variant="default">{plan.tech}</Badge>
    {savingLabel ? <Badge variant="saving">{savingLabel}</Badge> : null}
  </div>
</div>
```
> 색 결정: `무약정`은 사용자 이득 → `saving`(green) 틴트. `알뜰폰`은 식별 → `mvno`(accent=primary 틴트). 망·세대는 중립 — 화면이 알록달록해지지 않게 **색 배지는 카드당 1~2개로 절제**(토스 카드 규칙). 통신사 이니셜 칩은 중립 muted(색코딩 회피, 위계만 부여).

### 4-2. 가격 위계 — 프로모가 크게 + 종료 후 정가 절제

`price-block.tsx`는 이미 프로모가 크게 + warning 띠 구조라 양호. 단 **프로모 할인폭을 시각화**해 "싸다"는 느낌을 강화. 정가 대비 할인 시 `정가 → 프로모가` 위계 추가:

```tsx
export const PriceBlock = ({ plan, size = 'card' }: IPriceBlockProps): React.JSX.Element => {
  const hasPromo = plan.promoMonths > 0 && plan.regularPrice !== plan.monthlyPrice;
  const isCheaper = plan.regularPrice > plan.monthlyPrice;
  return (
    <div className="space-y-1.5">
      {/* 정가가 더 비싸면 취소선으로 절제 표기(프로모 할인 강조) */}
      {isCheaper ? (
        <p className="nums text-xs font-medium text-muted-foreground line-through">
          월 {formatKrw(plan.regularPrice)}
        </p>
      ) : null}
      <p className="flex items-baseline gap-1">
        <span className="text-sm font-medium text-foreground-secondary">월</span>
        <span
          className={cn(
            'nums font-extrabold leading-none tracking-tight',
            // 프로모 할인 시 가격에 primary 부여 → "특가" 색 신호(절제: 할인 있을 때만)
            isCheaper ? 'text-primary' : 'text-foreground',
            size === 'hero' ? 'text-4xl sm:text-5xl' : 'text-[28px] sm:text-3xl',
          )}
        >
          {formatKrw(plan.monthlyPrice)}
        </span>
      </p>
      {hasPromo ? (
        <p className="flex items-center gap-1.5 rounded-lg bg-warning-muted px-3 py-1.5 text-xs font-medium text-warning-muted-foreground">
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
          <span>
            {plan.promoMonths}개월 후 <span className="nums">{formatKrw(plan.regularPrice)}</span>
            {plan.contract === 'none' ? ' · 약정 없음' : null}
          </span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">프로모션 없이 정가 유지</p>
      )}
    </div>
  );
};
```
> 결정: 할인 있는 요금제만 프로모가에 `text-primary` → **"이건 특가다"** 색 신호. 할인 없으면 near-black 유지(남발 방지). 정가 취소선은 `muted-foreground`로 절제 — 정직성(종료후정가 병기)은 warning 띠가 그대로 보장.

### 4-3. hover 인터랙션 강화 + 카드 표면 디테일

현재 `hover:-translate-y-1 hover:shadow-e2`는 양호하나, 기본 카드가 너무 평평. **카드 기본 그림자를 e1로 명시**(Card 컴포넌트가 이미 줄 수 있으나 확인) + hover 시 primary 미세 링으로 "선택 가능" 신호:

`plan-card/index.tsx`의 `<Card className=...>`:
```tsx
<Card
  className={cn(
    'group flex flex-col rounded-2xl shadow-e1 transition-[transform,box-shadow] duration-200',
    'hover:-translate-y-1 hover:shadow-e2',
    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    className,
  )}
>
```
footer의 "상세 보기" 링크는 `variant="link"`(밑줄 없음 — globals에서 `a{text-decoration:none}` 적용됨). 강조는 색·화살표로:
```tsx
import { ArrowRight } from 'lucide-react';
// ...
<Button asChild variant="link" size="sm" className="group/link px-0 text-primary-strong hover:text-primary">
  <Link href={`/plans/${plan.id}`} className="inline-flex items-center gap-1">
    상세 보기
    <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-0.5" aria-hidden="true" />
  </Link>
</Button>
```

---

## 5. 색 존재감 — 전역 점검 체크

이번 v3로 primary(토스블루)가 실제로 등장하는 지점:
| 위치 | 색 적용 | 파일 |
|------|---------|------|
| 헤더 로고 마크 | `bg-primary` 색면 | site-header |
| 히어로 헤드라인 "정직하게" | `text-primary` | page.tsx |
| 히어로 아이브로우 배지 | `bg-accent`(primary 틴트) | page.tsx |
| 히어로 앵커 카드 레일·라벨 | `bg-primary`·`text-primary` | page.tsx |
| 활성 퀵칩 | `bg-primary` 채움 | toggle/quick-chips |
| 특가 요금제 가격 | `text-primary` | price-block |
| 카드 상세보기 링크·화살표 | `text-primary-strong` | plan-card |
| 포커스 링 전역 | `ring-ring`(=primary) | 전역 |

> 규칙: **primary는 위 지점에만.** 본문·배경·일반 텍스트엔 절대 금지(near-black/secondary 유지). 색이 "포인트"로 작동하도록 면적 통제.

---

## 6. 링크 밑줄 — 이미 완료, 회귀 금지

`globals.css`에 `a { text-decoration: none; }` 적용됨(✅). v3에서 추가 링크 강조는 **색(`text-primary-strong`) + 굵기(`font-semibold`) + 화살표 아이콘**으로만. 어떤 컴포넌트에도 `underline` 유틸 추가 금지. (footer 링크도 `hover:text-foreground`로 색 변화만 — 현재 OK.)

---

## 7. 마이크로 디테일 — `app/globals.css` + 빈 상태/로딩

### 7-1. globals.css 유틸 추가(2개만)

```css
@layer utilities {
  /* 기존 .shadow-focus 유지 */
  .shadow-focus { box-shadow: 0 0 0 4px rgba(49, 130, 246, 0.2); }

  /* 좌측 primary 액센트 레일 — 히어로 앵커·강조 카드 공통(토스 패턴) */
  .accent-rail {
    position: relative;
  }
  .accent-rail::before {
    content: '';
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    width: 0.375rem; /* 6px */
    background-color: hsl(var(--primary));
    border-start-start-radius: inherit;
    border-end-start-radius: inherit;
  }
}
```
> 히어로 앵커 카드에서 인라인 `<span>` 레일 대신 `className="... accent-rail"`로 대체 가능(선택). 두 방식 중 하나만 사용.

### 7-2. radius / 그림자 위계 정리(현 토큰 준수 확인)

| 표면 | radius | shadow |
|------|--------|--------|
| 카드(plan·앵커) | `rounded-2xl`(16px) | `shadow-e1` 기본 / hover `e2` |
| 필터 카드 | `rounded-2xl` | `shadow-e1` |
| 버튼·입력·정렬 | `rounded-lg`/`xl` | none/`e1` |
| 배지·칩 | `rounded-full` | none(칩 off) |
| 로고 마크 | `rounded-[10px]` | `e1` |
> 섀도우 2단 중첩 금지(e1·e2·e3 단일 적용). hover는 e1→e2 한 단계만 승급.

### 7-3. 빈 상태 / 로딩 품격

`empty-state` 위젯(`src/widgets/empty-state`): 현재 텍스트+버튼이면, lucide 아이콘 원형 칩(`bg-accent text-primary` size-12 rounded-full) + 제목/설명/CTA 수직 정렬, `py-16` 여백으로 품격. 예:
```tsx
import { SearchX } from 'lucide-react';
// EmptyState 루트:
<div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card px-6 py-16 text-center shadow-e1">
  <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
    <SearchX className="size-6" aria-hidden="true" />
  </span>
  <div className="space-y-1">
    <p className="text-base font-bold text-foreground">{title}</p>
    <p className="text-sm text-foreground-secondary">{description}</p>
  </div>
  <Button variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button>
</div>
```
로딩 스켈레톤: 현재 `Skeleton h-[18rem]`은 카드 높이와 근사 OK. 단 `rounded-2xl` 부여해 실제 카드와 모서리 일치 → 교체 시 점프 없음: `<Skeleton className="h-[18rem] w-full rounded-2xl" />`.

---

## 적용 파일 요약(ui-developer 체크리스트)

- [ ] `src/widgets/site-header/index.tsx` — Zap 마크 추가(§1)
- [ ] `app/page.tsx` — 히어로 2열(아이브로우/헤드라인/앵커 카드)(§2)
- [ ] `src/widgets/filter-bar/index.tsx` — 한 줄 헤더(결과수+정렬)·hairline·퀵칩 행(§3-2)
- [ ] `src/widgets/plan-list/index.tsx` — 결과수 prop 전달, 기존 결과수 `<p>` 삭제(§3-1)
- [ ] `src/shared/ui/toggle.tsx` (또는 quick-chips className) — off 칩 `bg-muted`, on=primary(§3-3)
- [ ] `src/widgets/plan-card/index.tsx` — 통신사 이니셜 칩·강조 배지·hover·화살표 링크(§4-1,4-3)
- [ ] `src/widgets/plan-card/price-block.tsx` — 정가 취소선·특가 primary 가격(§4-2)
- [ ] `src/widgets/empty-state/index.tsx` — 아이콘 칩 품격(§7-3)
- [ ] `app/globals.css` — `.accent-rail` 유틸 추가(§7-1)

## 가드레일(회귀 방지)
- **Do**: primary는 §5 표 지점에만. 색 배지는 카드당 1~2개. 숫자(가격)는 항상 `.nums`. radius/shadow는 §7-2 표만.
- **Don't**: `underline` 유틸 추가 금지. 보라/그라데이션/글로우 금지. 임의 hex 금지(토큰만). 섀도우 2단 중첩 금지. 본문 텍스트에 primary 금지. 망 자체를 색코딩(SKT=빨강 등) 금지.

## 성능/접근성(Hard Threshold)
- ④ CLS: 히어로 앵커·로고 마크 전부 텍스트/고정 size(이미지 0) → CLS 0 유지. 스켈레톤 `rounded-2xl`로 교체 점프 0.
- 경계: `page.tsx`·`site-header`·`plan-card`·`price-block`·`empty-state`는 서버 컴포넌트 유지(클라 island = CompareToggle만). 히어로 앵커는 서버에서 `seedPlans` 재사용 → 클라 번들 증가 0.
- a11y: 로고 마크 `aria-hidden` 아이콘 + 링크 `aria-label`. 모든 강조 색은 텍스트 대비 AA 충족(primary on white 4.5:1+, primary-strong 본문 링크). 정렬/칩 44px 탭영역 유지(h-9 칩은 패딩 포함 충족, 정렬 h-9는 시각만 축소·탭영역 보존 확인).

---

## 4축 자체 평가
| 축 | 점수 | 근거 |
|----|------|------|
| Design Quality | 8/10 | 토스 리스트 헤더·앵커 카드·컬러 1포인트 위계로 와이어프레임→프로덕트. 토큰 일관. |
| Originality | 7/10 | 기본 shadcn 대비 브랜드 마크·히어로 앵커·특가 primary 가격·accent-rail 등 앱 고유 결정. |
| Craft | 8/10 | radius/shadow 위계표, off/on 칩 대비, 정가 취소선, 스켈레톤 모서리 일치까지 정밀. |
| Functionality | 9/10 | 결과수+정렬 한 줄 정착으로 사용성↑, 정직성(종료후정가) 보존, AA 대비·서버 경계·CLS 0. |

가중 합 ≈ 8.0/10 — 전 축 임계값 충족. 재작업 불필요.
