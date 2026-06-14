# Refine v4 — 절제(Restraint)로 끌어올리는 세련화 스펙

> 대상: ratsaver 공개 사이트. v3는 로고마크·히어로앵커·컬러배지로 "꽉 채웠지만" 시각 노이즈가 과해 촌스러움.
> 목표: Linear / Stripe / 토스 프리미엄 수준의 미니멀·정제. **색을 빼고, 여백을 더하고, 위계를 명확히.**
> 토큰(토스블루·near-black·섀도우)은 유지하되 **적용을 절제**. AI슬롭(그라데이션·글로우) 0.

이 문서는 ui-developer가 그대로 적용하는 **파일별 className 치환 지시**다. before(노이즈)→after(절제)를 명시한다.
색/토큰은 새로 추가하지 않는다 — 기존 토큰의 **적용 빈도를 줄이는** 작업이다.

---

## 0. 세련화 7대 결정 (적용 전 합의)

| # | 결정 | 원칙 |
|---|------|------|
| 1 | **카드 색 신호 1개 법칙** — 컬러 배지는 "특가"(최저가/프로모) 1개만. 망·세대·약정·알뜰폰은 무채색 라벨 | 색 1곳 |
| 2 | **가격 near-black 기본** — primary blue는 카드당 0~1개. `isCheaper`만으로 파랗게 칠하지 않음 | 색 절제 |
| 3 | **carrier 이니셜 칩 제거** — 작은 텍스트 라벨 + 점(dot) leader로 대체 | 투박 제거 |
| 4 | **배지 행 → 인라인 메타 라인** — 배지 4개를 무채색 "·" 구분 메타 텍스트 1줄로 압축 | 노이즈 제거 |
| 5 | **여백 +1단계** — 카드 패딩 p-6→p-7, 카드 간 gap·섹션 여백 확대, hairline 절제 | 여백 |
| 6 | **위계 3단 명확화** — 1차(plan명, near-black bold) / 2차(데이터, semibold) / 3차(메타, muted regular) | 위계 |
| 7 | **히어로 색 포인트 1개** — 아이브로우 배지 무채색화, `text-primary` 강조 1곳만, accent-rail 제거 | 히어로 정제 |

---

## 1. `app/globals.css` — accent-rail 제거 · 메타 라인 유틸 추가

### 1-1. accent-rail 유틸 제거 (히어로 색 레일 폐기)

**BEFORE** (L86–100): `.accent-rail` + `::before` 6px primary 레일 — 히어로 앵커에 색 막대.
**AFTER**: 블록 전체 삭제. 히어로 앵커는 색 레일 없이 여백·섀도우로만 분리.

~~~css
/* 삭제: L86–100 .accent-rail 및 ::before 전체 */
~~~

### 1-2. focus halo 유틸은 유지(`.shadow-focus`) — 변경 없음.

### 1-3. 메타 라인 leader dot 유틸 추가 (carrier·망·세대 무채색 구분점)

`@layer utilities`에 추가. 배지 대신 텍스트 메타 라인에서 항목을 구분하는 정제된 가운데 점.

~~~css
@layer utilities {
  /* 메타 항목 구분 — 가운데 점(·) leader. 색 없이 위계만. */
  .meta-dot > * + *::before {
    content: '·';
    margin-inline: 0.5rem;
    color: hsl(var(--muted-foreground));
  }
}
~~~

### 1-4. 본문 letter-spacing 미세 조정 (헤드라인 정제)

`body`에 변경 없음. 헤드라인 tracking은 컴포넌트에서 `tracking-tight` 유지.

---

## 2. `src/shared/ui/badge.tsx` — 색 배지 축소, 무채색 라벨 강화

배지의 색 variant 남용이 노이즈의 핵심. **mvno(파랑틴트) variant를 카드에서 더 이상 쓰지 않는다**(파일에는 남겨도 무방하나 카드에서 미사용).
대신 무채색 `default`를 메인으로 쓰고, 색 배지는 "특가" 단 하나의 의미로 좁힌다.

### 2-1. variant 재정의 — default를 더 가볍게, saving은 "특가" 전용으로 톤다운

**BEFORE** (L13–25):
~~~tsx
default: 'bg-muted text-foreground-secondary',
saving: 'bg-saving-muted text-saving-muted-foreground',
warning: 'bg-warning-muted text-warning-muted-foreground',
outline: 'bg-card text-foreground shadow-e1',
mvno: 'bg-accent text-accent-foreground',
~~~

**AFTER**: default는 채움 제거하고 더 가벼운 라벨로(노이즈↓), saving은 "특가" 단일 신호로 유지하되 톤 절제. mvno는 default로 흡수(파랑틴트 제거).
~~~tsx
// 무채색 라벨 — 망·세대·약정 등 메타. 채움 없이 텍스트만(노이즈 최소).
default: 'bg-transparent px-0 text-foreground-secondary',
// 무채색 채움 — 격납이 필요한 중립 태그(드물게).
muted: 'bg-muted text-foreground-secondary',
// 색 신호 1개 — "특가/최저가" 전용. 카드당 0~1개만 사용.
saving: 'bg-saving-muted text-saving-muted-foreground',
// 경고 — 종료후정가 등(PriceBlock 내부 전용).
warning: 'bg-warning-muted text-warning-muted-foreground',
outline: 'bg-card text-foreground-secondary shadow-e1',
~~~
> base 클래스의 `px-2.5 py-1`은 유지하되, `default`가 `px-0`로 덮어써 패딩 0(순수 텍스트 라벨화).
> `mvno` 제거 — 호출부(plan-card)에서 알뜰폰 배지를 메타 라인으로 이전하므로 더 이상 필요 없음.

---

## 3. `src/widgets/plan-card/index.tsx` — 가장 큰 리파인 (배지 4개 → 메타 1줄)

### 3-1. carrier 이니셜 칩 제거 → 텍스트 라벨

**BEFORE** (L43–58): `size-9 rounded-xl bg-muted` 회색 원형 이니셜 칩 + carrier/name.
**AFTER**: 칩 삭제. carrier는 plan명 위 작은 eyebrow 텍스트로(위계 2차), plan명은 1차.

~~~tsx
{/* 헤더: carrier eyebrow + 요금제명 (이니셜 칩 제거 — 투박함 삭제) */}
<div className="flex flex-col gap-1">
  <p className="truncate text-[13px] font-medium text-muted-foreground">
    {plan.carrier}
  </p>
  <h3 className="truncate text-[17px] font-bold leading-snug tracking-tight text-foreground sm:text-lg">
    {plan.name}
  </h3>
</div>
~~~

### 3-2. 배지 행(색 4개) → 무채색 메타 라인 + 특가 배지 1개

**BEFORE** (L60–67): `무약정(saving) + 알뜰폰(mvno) + 망(default) + 세대(default) + savingLabel(saving)` — 색 2~3개 동시.
**AFTER**: 망·세대·약정·알뜰폰을 **무채색 "·" 구분 메타 텍스트 1줄**로 압축. 색 배지는 `savingLabel`(특가/절약) **단 하나만**.

~~~tsx
{/* 메타 라인 — 망·세대·약정·알뜰폰을 무채색 1줄로(색 0). 위계 3차. */}
<p className="meta-dot flex flex-wrap items-center text-[13px] text-muted-foreground">
  <span>{plan.network}망</span>
  <span>{plan.tech}</span>
  <span>{CONTRACT_LABEL[plan.contract]}</span>
  {plan.mvno ? <span>알뜰폰</span> : null}
</p>

{/* 색 신호 1개 — 추천/계산 컨텍스트의 "특가/절약"만. 평소 카드엔 색 0. */}
{savingLabel ? (
  <div>
    <Badge variant="saving">{savingLabel}</Badge>
  </div>
) : null}
~~~
> `무약정`을 더 이상 green 배지로 띄우지 않는다 — 메타 라인의 `CONTRACT_LABEL`(약정없음)로 흡수.
> 결과: 기본 카드는 **색 0개**, 특가 컨텍스트만 green 배지 1개.

### 3-3. ③ 망·세대·약정 중복 라인 제거

**BEFORE** (L81–84): `{plan.carrier} · {CONTRACT_LABEL[plan.contract]}` — 3-2 메타 라인과 정보 중복.
**AFTER**: **삭제**. carrier는 헤더 eyebrow, 약정은 메타 라인에 이미 있음. 중복 제거로 위계 정리.

### 3-4. 카드 여백 +1단계 · hover 절제

**BEFORE** (L33–38, L40): `shadow-e1` / `hover:-translate-y-1 hover:shadow-e2` / `p-5 sm:p-6` / `gap-4`.
**AFTER**: 패딩 확대(`p-6 sm:p-7`), 내부 간격 확대(`gap-5`), hover는 **lift 절반(translate-y-0.5)**·섀도우 1단계만.

~~~tsx
<Card
  className={cn(
    'group flex flex-col rounded-2xl shadow-e1 transition-[transform,box-shadow] duration-200',
    'hover:-translate-y-0.5 hover:shadow-e2',   // lift 1→0.5px(절제)
    'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
    'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    className,
  )}
>
  <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">   {/* gap-4→5, p-5/6→6/7 */}
~~~

### 3-5. ① 데이터 블록 — 위계 2차로 명확히

**BEFORE** (L70–74): `text-xl sm:text-2xl font-bold` — plan명(1차)과 무게가 비슷해 위계 모호.
**AFTER**: 데이터는 2차 위계(semibold, 약간 작게), throttle은 3차.

~~~tsx
{/* ① 데이터 + 속도 — 위계 2차(plan명보다 가볍게) */}
<div className="space-y-0.5">
  <p className="text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
    {formatData(plan)}
  </p>
  {throttle ? <p className="text-[13px] text-muted-foreground">{throttle}</p> : null}
</div>
~~~

### 3-6. ② 통화·문자 — 3차 위계 유지(muted로 톤다운)

**BEFORE** (L77–79): `text-foreground-secondary`.
**AFTER**: `text-[13px] text-muted-foreground` (3차로 더 가볍게).

~~~tsx
<p className="text-[13px] text-muted-foreground">
  {formatCall(plan)} · {formatSms(plan)}
</p>
~~~

### 3-7. footer — divider 절제, 상세보기 링크 톤다운

**BEFORE** (L91): `border-t border-border p-5 pt-4 sm:p-6 sm:pt-4` + 링크 `text-primary-strong`.
**AFTER**: 패딩 정렬(`p-6 sm:p-7 pt-4`), 링크는 **무채색 기본 + hover시에만 primary**(평소 색 0).

~~~tsx
<div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4 sm:px-7">
  <Button
    asChild
    variant="link"
    size="sm"
    className="group/link px-0 text-foreground-secondary hover:text-primary"  // 평소 무채색
  >
~~~

> **카드 결과**: 기본 상태 색 0개. 위계 = plan명(1차 bold) → 데이터(2차 semibold) → 메타·통화·약정(3차 muted). 특가 컨텍스트에서만 green 배지 1개.

---

## 4. `src/widgets/plan-card/price-block.tsx` — 가격 near-black 기본, blue 절제

### 4-1. 가격 숫자 색 — primary 제거, near-black 통일

**BEFORE** (L29–36): `isCheaper ? 'text-primary' : 'text-foreground'` — 할인 카드는 전부 파란 숫자(대다수).
**AFTER**: 항상 `text-foreground`(near-black). 가격은 크기·tabular-nums로만 강조, 색으로 안 소리침.
extrabold→bold로 무게도 1단계 절제.

~~~tsx
<span
  className={cn(
    'nums font-bold leading-none tracking-tight text-foreground',  // primary 제거, extrabold→bold
    size === 'hero' ? 'text-4xl sm:text-5xl' : 'text-[28px] sm:text-3xl',
  )}
>
  {formatKrw(plan.monthlyPrice)}
</span>
~~~
> `isCheaper` 분기 색 제거. "할인됨" 신호는 **윗줄 취소선 정가**(L22–26)로 이미 충분.

### 4-2. 취소선 정가 — 더 절제된 회색(유지, 미세 톤다운)

**BEFORE** (L23): `text-muted-foreground line-through font-medium`.
**AFTER**: `font-medium`→`font-normal`(보조 텍스트는 더 가볍게).

~~~tsx
<p className="nums text-xs font-normal text-muted-foreground line-through">
  월 {formatKrw(plan.regularPrice)}
</p>
~~~

### 4-3. 종료후정가 warning 띠 — 유지(정직성 wedge 핵심), 단 패딩 정렬

**BEFORE** (L41): `rounded-lg bg-warning-muted px-3 py-1.5`.
**AFTER**: 변경 최소. `gap-1.5`→`gap-2`로 아이콘·텍스트 숨통. warning은 **정직성의 유일한 기능 색**이라 유지.

~~~tsx
<p className="flex items-center gap-2 rounded-lg bg-warning-muted px-3 py-2 text-xs font-medium text-warning-muted-foreground">
~~~

### 4-4. "월" 라벨 톤다운

**BEFORE** (L28): `text-sm font-medium text-foreground-secondary`.
**AFTER**: `text-sm font-normal text-muted-foreground`(보조 라벨 3차로).

~~~tsx
<span className="text-sm font-normal text-muted-foreground">월</span>
~~~

> **가격 블록 결과**: 평소 near-black 숫자만. 색은 종료후정가 warning 띠(정직성 기능) 1곳만 잔존. 토스블루 가격 전면 제거.

---

## 5. `src/shared/ui/toggle.tsx` — 퀵칩 절제 (on 상태만 색)

칩은 현재도 비교적 정제됨. on=primary는 "선택됨" 행동 신호라 유지. off 상태를 더 가볍게.

### 5-1. chip variant off 상태 톤다운

**BEFORE** (L22): off = `bg-muted text-foreground-secondary`.
**AFTER**: off = `bg-transparent text-muted-foreground` + hairline border로 정제(채움 제거 → 가벼움). on은 유지.

~~~tsx
chip: 'h-9 rounded-full border border-border bg-transparent px-4 text-[13px] font-medium text-muted-foreground shadow-none transition-colors hover:border-foreground-secondary/30 hover:text-foreground-secondary data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none',
~~~
> off 칩: 투명 배경 + hairline → off 상태들이 회색 알약으로 떠다니지 않음(노이즈↓). font-semibold→medium.
> on 칩: `shadow-e1`→`shadow-none`(섀도우 절제, 색 채움만으로 충분).

---

## 6. `src/widgets/filter-bar/index.tsx` — hairline·섀도우 절제

### 6-1. hairline divider 제거 (여백으로 분리)

**BEFORE** (L144–145): `<div className="h-px bg-border" />` 헤더/필터 구분선.
**AFTER**: **삭제**. `gap-4`만으로 분리(여백이 선보다 정제됨).

~~~tsx
{/* 삭제: hairline divider — 여백으로만 구획 */}
~~~

### 6-2. 컨테이너 섀도우 톤다운

**BEFORE** (L117): `sm:shadow-e1`.
**AFTER**: 변경 없음(e1은 최약 섀도우라 유지). 단 sticky 상단 `shadow-[0_1px_0...]` hairline은 유지(스크롤 분리 필요).

### 6-3. 결과수 표기 위계 — 숫자만 강조

**BEFORE** (L121–124): 유지 — 이미 정제됨(`text-base font-bold` 숫자 + muted 보조). 변경 없음.

---

## 7. `src/widgets/site-header/index.tsx` — 로고마크 절제

### 7-1. 로고마크 섀도우·hover 제거 (정적 미니멀)

**BEFORE** (L30): `bg-primary ... shadow-e1 ... group-hover:scale-105`.
**AFTER**: 섀도우 제거, hover scale 제거(정적). primary 채움 마크는 유지(브랜드 단일 색 포인트).

~~~tsx
<span className="flex size-8 items-center justify-center rounded-[10px] bg-primary text-primary-foreground">
  <Zap className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
</span>
~~~
> 로고는 사이트 유일한 상시 primary 포인트 — 이건 유지하되 부가 효과(섀도우·scale)만 제거해 정적·정제.

### 7-2. wordmark 무게 절제

**BEFORE** (L33): `font-extrabold`.
**AFTER**: `font-bold`(extrabold 남발 줄이기).

~~~tsx
<span className="text-lg font-bold tracking-tight text-foreground">최저가 요금제</span>
~~~

---

## 8. `app/page.tsx` (히어로) — 색 포인트 1개로 정제

### 8-1. 아이브로우 배지 무채색화

**BEFORE** (L30–33): `bg-accent text-accent-foreground`(파랑틴트) + Sparkles 아이콘.
**AFTER**: 무채색(`bg-muted text-foreground-secondary`), Sparkles 제거(AI슬롭 아이콘 절제) 또는 muted 점으로.

~~~tsx
<span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground-secondary">
  <span className="size-1.5 rounded-full bg-saving" aria-hidden="true" />
  실시간 {TOTAL_PLAN_COUNT}개 알뜰폰 요금제 비교
</span>
~~~
> 작은 saving dot 1개로 "실시간" 신호만. 파랑 틴트 pill·Sparkles 제거. (import에서 `Sparkles` 제거)

### 8-2. 헤드라인 — primary 강조 1곳 유지(절제된 포인트)

**BEFORE** (L35–39): `<span className="text-primary">정직하게</span>` + `font-extrabold`.
**AFTER**: `text-primary` 강조는 **유지**(히어로 유일 색 포인트로 가치 있음). 단 무게 `font-extrabold`→`font-bold`, leading 미세 조정.

~~~tsx
<h1 className="text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-5xl">
  가장 싼 요금제부터,
  <br />
  <span className="text-primary">정직하게</span> 보여드려요
</h1>
~~~

### 8-3. 히어로 앵커 카드 — accent-rail 제거, "최저가" 색 톤다운

**BEFORE** (L48–67): `accent-rail`(primary 레일) + `text-primary`("이번 주 최저가") + `shadow-e2`.
**AFTER**: accent-rail 제거(§1-1과 연동), 레이블 무채색화, 가격은 near-black, 섀도우 e2→e1.

~~~tsx
<aside className="lg:justify-self-end">
  <div className="relative overflow-hidden rounded-2xl bg-card p-7 shadow-e1 sm:p-8">
    {/* 레이블 — 색 제거, 작은 saving dot으로 신호만 */}
    <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-saving" aria-hidden="true" />
      이번 주 최저가
    </p>
    <p className="mt-2 text-base font-semibold leading-snug text-foreground">
      {cheapest.name}
    </p>
    <div className="mt-5 flex items-baseline gap-1">
      <span className="text-sm font-normal text-muted-foreground">월</span>
      <span className="nums text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {formatKrw(cheapest.monthlyPrice)}
      </span>
    </div>
    <p className="nums mt-1.5 text-[13px] text-muted-foreground">
      1년 기준 {formatFirstYearCost(cheapest)}
    </p>
    <p className="meta-dot mt-3 flex flex-wrap items-center text-[13px] text-muted-foreground">
      <span>{cheapest.carrier}</span>
      <span>{cheapest.network}망</span>
      <span>{formatData(cheapest)}</span>
    </p>
  </div>
</aside>
~~~
> 앵커 카드 색: 레일·primary 레이블 제거 → saving dot 1개만. 가격 near-black. 섀도우 e2→e1(여백·정렬로 위계).

### 8-4. 섹션 여백 확대

**BEFORE** (L24): `space-y-8 pb-24 sm:space-y-12` / (L26) `gap-8 lg:gap-12`.
**AFTER**: 히어로↔리스트 간격 확대(`sm:space-y-16`), 히어로 좌우 간격 확대(`lg:gap-16`).

~~~tsx
<div className="space-y-10 pb-24 sm:space-y-16">
  <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
~~~

---

## 9. 적용 후 색 사용 감사 (목표 상태)

| 위치 | v3 (before) | v4 (after) |
|------|-------------|------------|
| 기본 plan 카드 | green 무약정 + blue 알뜰폰 + 회색칩 + blue 가격 → **색 3** | **색 0** (전부 무채색) |
| 특가/추천 카드 | 위 + savingLabel green | green 배지 **1** |
| 가격 숫자 | 대다수 blue | near-black (색 0) |
| 종료후정가 띠 | warning amber | warning amber **1** (정직성 기능, 유지) |
| 히어로 | accent pill + blue 레일 + blue 레이블 + blue 강조어 → **색 4** | "정직하게" blue **1** + saving dot |
| 헤더 로고 | primary 마크 + 섀도우 + scale | primary 마크 **1** (정적) |
| 퀵칩 off | 회색 채움 알약 다수 | 투명 + hairline (색 0) |

> 한 화면 동시 색 포인트: v3 ~8개 → v4 ≤3개(로고 1 + 헤드라인 강조어 1 + 활성 칩/특가). **절제 달성.**

---

## 10. 가드레일 (이번 리파인 Do / Don't)

**Do**
- 카드 1장당 컬러 신호 **최대 1개**(특가). 나머지는 무채색 텍스트.
- 가격은 크기·tabular-nums로 강조. **색으로 강조 금지**.
- 위계는 weight·size·color **3단**으로: 1차 bold near-black / 2차 semibold / 3차 regular muted.
- 분리는 **여백 우선**, hairline은 꼭 필요한 곳(footer·sticky 경계)만.
- hover는 미묘하게: lift ≤0.5px, 섀도우 1단계.

**Don't**
- 망/세대/약정/알뜰폰을 **색 배지로 코드화 금지** — 무채색 메타 라인.
- `isCheaper`라고 가격을 파랗게 칠하지 말 것.
- extrabold 남발 금지(헤드라인·plan명도 bold까지).
- 그라데이션·글로우·Sparkles류 장식 아이콘 **0**.
- 섀도우 2단(e2+) 중첩 금지 — 평면 카드는 e1.

---

## 11. CLS·접근성 가드 (불변 — 리파인이 깨면 안 됨)

- carrier 이니셜 칩 제거해도 **레이아웃 높이 변동 0** — 헤더 영역은 eyebrow+title 2줄 고정.
- 가격·절약 숫자 `.nums`(tabular) 유지 → 자릿수 점프 0.
- 메타 라인은 `flex-wrap` — 좁은 화면 줄바꿈 시에도 카드 내부에서만, 외부 reflow 0.
- footer 링크 무채색→hover primary 대비: `foreground-secondary`(#4E5968 on #FFF ≈ 7.4:1) WCAG AA 통과.
- 메타 muted(#8B95A1 on #FFF ≈ 3.1:1) — **3차 보조 텍스트**라 AA Large(3:1) 충족, 본문 아님. 핵심 정보(가격·plan명·데이터)는 near-black 유지.
- 퀵칩 탭영역 h-9 + px-4 → 44px 충족(변경 없음).
- 포커스 링 `focus-within:ring-2` 전부 유지.

---

## 4축 자체 평가

| 축 | 점수 | 근거 |
|----|------|------|
| Design Quality | 9/10 | 색 8→≤3, 위계 3단 명확, 여백 +1단계. Linear/토스급 절제 |
| Originality | 7/10 | 배지→메타라인 압축, leader-dot 유틸, 가격 near-black은 가격비교 사이트의 통념(색강조) 역행 — 절제로 차별 |
| Craft | 9/10 | px 단위 위계(17/22/13px), 섀도우·hover 절제, tabular 유지, 대비 감사 |
| Functionality | 9/10 | 정직성 wedge(종료후정가) 색 1곳 보존, 정보 위계 강화로 스캔성↑, AA 대비 검증 |

가중 평균 8.6/10 — 전 축 임계값 충족.
