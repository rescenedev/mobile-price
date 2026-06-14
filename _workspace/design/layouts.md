---
project: ratsaver
phase: 3
version: 2
title: 라우트별 레이아웃 폴리시 v2 — Toss/Apple Premium
status: completed
created: 2026-06-14
updated: 2026-06-14
supersedes: layouts.md v1
---

# ratsaver — 라우트별 레이아웃 명세 v2

> ui-developer(4c)가 page 조립 시 따르는 폴리시. **라우트/데이터/렌더링 전략 변경 0** — 여백·컨테이너·표면(섀도우)·타이포 위계만 토스st로 교체.
> 렌더링 전략은 `_workspace/arch/rendering-matrix.md` 유지. 컴포넌트 상세 `components.md`. CLS 가드(next/image·next/font·고정높이 스켈레톤) 전부 유지.

---

## 공통 폴리시 (전 라우트 적용)

| 항목 | v1 | v2 |
|------|----|----|
| 페이지 좌우 패딩 | `px-4 sm:px-6 lg:px-8` | **`px-5 sm:px-6 lg:px-8`** |
| 섹션 세로 리듬 | `py-8 sm:py-12` | **`py-12 sm:py-16 lg:py-20`** |
| 섹션 간 간격 | `space-y-12 sm:space-y-16` | **`space-y-16 sm:space-y-24`** |
| 카드 그리드 gap | `gap-3 sm:gap-4` | **`gap-4 sm:gap-5`** |
| 표면 분리 | `border bg-card shadow-card` | **`bg-card shadow-e1 rounded-2xl`(border 0)** |
| 폼 중심 컨테이너 | `max-w-md` | `max-w-xl` 중앙(계산기·추천 입력) |

- **모바일 우선**: base 1열·세로 stack → `sm/md/lg`에서 전개. 넉넉한 터치 타겟(버튼 h-12~14).
- **배경 리듬**: 페이지 `bg-background`(#F2F4F6) + 카드 순백(#FFFFFF) 대비로 깊이. 교차 섹션은 `bg-background-subtle`(#F9FAFB) 선택 사용.

---

## 공통 — 루트 레이아웃 (`app/layout.tsx`) [서버]
```
┌──────────────────────────────────────────────┐
│ Header (sticky h-16, bg-card/80 backdrop, border 0)│  ← border-b 삭제
│  [ratsaver  extrabold near-black]  [요금제][비교][추천][계산기]│
├──────────────────────────────────────────────┤
│            {children}  (main, max-w-screen-xl) │
│            py-12 sm:py-16  px-5 sm:px-6 lg:px-8 │
├──────────────────────────────────────────────┤
│ Footer (bg-background-subtle, 헤어라인 1px)      │  ← Disclaimer + 링크
└──────────────────────────────────────────────┘
```
- Header `h-14`→**`h-16`**, `border-b border-border` **제거**(필요 시 `shadow-[0_1px_0_0_hsl(var(--border))]`만). 로고 extrabold near-black.
- main `py-8 sm:py-12`→`py-12 sm:py-16`. `min-h-[calc(...)]` 푸터 밀림 방지 유지.
- footer `border-t bg-card`→`bg-background-subtle`(연회색) + 상단 헤어라인 1px. Disclaimer caption(#8B95A1).
- Web Vitals/SessionBeacon 마운트 유지. `pretendard.variable` weight 400 800.

---

## `/` 랜딩 (SSG) — LCP ≤ 1.2s · CLS ≤ 0.05 · 번들 ≤ 110KB
```
┌──────────────────────────────────────────────┐
│  HERO (text-center, py-16 sm:py-24)            │
│   가입·광고 없이, 3초 만에 내게 맞는 요금제        │  display text-4xl→5xl 800 tracking-tight
│   내 사용량 기준 가장 싼 요금제를 정직하게          │  body-secondary 회색
│   ┌── SavingResult 히어로 카드 (rounded-2xl shadow-e1, p-6 sm:p-8) ──┐ ← LCP 텍스트
│   │ 지금 내는 요금 [채움형 input] [계산하기 saving]                  │   고정높이 예약
│   │ → 월 N원 절약  text-4xl→5xl 800 saving-strong nums              │
│   └────────────────────────────────────────────────────────┘
│   [요금제 둘러보기 h-14] [맞춤 추천 받기 outline h-14]              │
├──────────────────────────────────────────────┤
│  가치 3블록 (grid md:grid-cols-3 gap-5)          │  rounded-2xl shadow-e1 hover 떠오름
│   [⚡초고속·무광고][🛡정직한 가격병기][💰절약우선]   │  아이콘 primary, border 0
└──────────────────────────────────────────────┘
```
**v2 변경**: 히어로 헤드라인 `text-3xl/4xl 700`→**`text-4xl sm:text-5xl font-extrabold tracking-tight`**(임팩트↑). 부제 `text-muted-foreground`→`text-foreground-secondary`. 히어로 카드 패딩 `max-w-md`→`max-w-xl`, `p-6 sm:p-8`. CTA `h-14`(큰 탭). 가치블록 `border` 제거→`shadow-e1 hover:-translate-y-1 hover:shadow-e2`, `p-5`→`p-6`.
**유지**: LCP=헤드라인 텍스트(이미지 회피), SavingResult 결과 placeholder 고정높이(CLS), 아이콘 lucide inline SVG 고정크기.

---

## `/plans` 목록 (ISR) — LCP ≤ 1.5s · CLS ≤ 0.1 · 번들 ≤ 160KB
```
┌──────────────────────────────────────────────┐
│ H1 "요금제 둘러보기"  text-2xl sm:text-3xl 700   │  page 상단 py-8
│ ResultCount  "N개"  숫자 bold + 라벨 회색         │
│ ┌ FilterBar (sticky top-16, sm+ rounded-2xl bg-card shadow-e1) ┐ │ border 0
│ │ [퀵칩 가로스크롤 흰pill/blue] ... [상세필터 outline][정렬 채움]│ │
│ └────────────────────────────────────────────┘ │
│ PlanCard 그리드 (grid-cols-1 md:2 lg:3, gap-4 sm:gap-5)         │
│  [토스 카드: border 0, shadow-e1, hover 떠오름, 큰 숫자 가격]      │
│  ... (EmptyState: bg-card rounded-2xl shadow-e1 p-10)            │
└──────────────────────────────────────────────┘
```
**v2 변경**: FilterBar `border-b`/`sm:border`→`sm:rounded-2xl sm:bg-card sm:shadow-e1`(sticky top-14→**top-16**, 헤더 높이 반영). 그리드 gap 확대. 카드 hover 떠오름. 입력/select 채움형.
**유지**: 필터=URL searchParams, `router.replace(scroll:false)`, 스켈레톤 고정높이(CLS), aria-live ResultCount.
> **주의**: FilterBar `sticky top-16`은 Header `h-16` 변경과 일치시킬 것(v1 top-14 → top-16).

---

## `/plans/[id]` 상세 (SSG/ISR)
```
┌──────────────────────────────────────────────┐
│ [망][세대][알뜰폰] pill · H1 요금제명 text-2xl/3xl 700 tracking-tight│
│ ┌ 가격 강조 카드 (rounded-2xl shadow-e1 p-6 sm:p-8) ─────────┐ │
│ │ 월 15,300원   PriceBlock hero: text-4xl/5xl 800 foreground │ │
│ │ ⚠ 7개월 후 43,000원   warning 띠 (항상 병기)                │ │
│ └────────────────────────────────────────────────────┘ │
│ 스펙 그리드 (데이터/속도/통화/문자/망/약정)  2열, 라벨 회색 위계   │
│ [비교담기][목록으로]  버튼 h-12                                  │
│ Disclaimer(가격블록 하단)                                       │
└──────────────────────────────────────────────┘
```
**v2 변경**: 가격 카드 border 제거→`shadow-e1 p-6 sm:p-8`, PriceBlock hero 큰 숫자 800 near-black. 스펙 라벨 `foreground-secondary`/값 `foreground`. 제목 tracking-tight.

---

## `/compare` 비교 (edge SSR + searchParams)
```
┌──────────────────────────────────────────────┐
│ H1 "요금제 비교"  + 안내(2~3개)                  │
│ CompareTable (ScrollArea rounded-2xl bg-card shadow-e1, border 0)│
│  첫열 sticky · 행 divide-y 헤어라인 · 최저가 saving✅ · 종료후정가 warning│
│ (빈 슬롯 → EmptyState "비교할 요금제를 담아주세요")│
│ CompareTrayBar (하단 고정, 담은 칩)              │
└──────────────────────────────────────────────┘
```
**v2 변경**: 표 외곽 `border` 제거→`shadow-e1 rounded-2xl`. 행 구분만 헤어라인 유지. 헤더 요금제명 tracking-tight. TrayBar `shadow-e3`(떠있는 바).

---

## `/recommend` 추천 (edge SSR or 클라)
```
┌──────────────────────────────────────────────┐
│ H1 "맞춤 추천"  (max-w-xl 중앙 폼)               │
│ RecommendPanel: 사용량 입력(프리셋/직접) 채움형   │
│  [PresetModal lazy: dialog/sheet rounded-2xl shadow-e3]│
│ → 추천 PlanCard 그리드 (절약 배지 saving 노출)    │
└──────────────────────────────────────────────┘
```
**v2 변경**: 입력 채움형, 프리셋 옵션 카드 off=`bg-muted` on=`bg-accent ring-2 ring-primary`(border 0). 추천 카드 = PlanCard v2(`savingLabel` 배지).

---

## `/calculator` 절약계산기 (SSG 셸 + 클라)
```
┌──────────────────────────────────────────────┐
│ H1 "절약 계산기"  (max-w-xl 중앙)                │
│ SavingResult variant=full (rounded-2xl shadow-e1 p-6 sm:p-8)│
│  현재요금 채움형 input + 대상 select 채움형      │
│  → 절약액 결과 (bg-saving-muted rounded-2xl, 큰 숫자 800 saving-strong)│
│  [이 요금제 상세][더 맞는 추천] 동선 CTA h-12     │
└──────────────────────────────────────────────┘
```
**v2 변경**: 카드 border 제거·패딩 확대, 결과 박스 `rounded-md`→`rounded-2xl`, 절약 숫자 토스 큰 숫자(`text-4xl sm:text-5xl 800`). 결과 placeholder 고정높이 유지(CLS).

---

## CLS / 성능 가드 (전 라우트 — 변경 없이 유지)
- **next/font**: Pretendard self-host(`weight 400 800`, swap, fallback) → 폰트 스왑 점프 0. 외부 폰트 CDN 호출 0.
- **이미지**: 로고/카드 텍스트·inline SVG 기본(이미지 LCP 회피). 이미지 사용 시 `next/image` width/height 명시. 캐리어 로고 미사용 기본.
- **고정 높이 예약**: SavingResult 결과 영역, 스켈레톤(`loading.tsx`)을 실제 카드와 동일 높이 `rounded-2xl`로 → CLS 0.
- **번들 경계**: `'use client'`는 인터랙션 leaf만. PresetModal `next/dynamic`. restyle은 className만이라 번들 영향 0.
- **모션**: transform/box-shadow/colors transition만(레이아웃 애니메이션 0). `prefers-reduced-motion` 무력화.
- **sticky 좌표**: Header `h-16` → FilterBar `sticky top-16`로 일치(겹침 방지).

---

## 4축 자체 평가 (layouts v2)
| 축 | 점수 | 근거 |
|----|------|------|
| Design Quality (≥7) | 8 | 넉넉한 여백 리듬·카드 떠오름·히어로 임팩트로 프리미엄 톤 일관. |
| Originality (≥6) | 7 | 폼 중심 max-w-xl 중앙·교차 배경(#F9FAFB)·sticky 좌표 정합 등 토스 레이아웃 패턴. |
| Craft (≥7) | 9 | 라우트별 before→after·sticky top-16 정합·CLS 가드 전부 유지 명시. |
| Functionality (≥8) | 9 | 렌더링 전략·a11y·정직성 병기 불변, 큰 탭 타겟, 정보 위계 강화. |

가중 합 ≈ 8.15 — 통과.
