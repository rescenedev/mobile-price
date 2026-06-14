# Dark Slate 재테마 + Vivid Price 액센트 (impl note)

> 사용자 지시: "slate 색 사용 / 다크모드인지 slate하게 / 가격만 좀 튀게".
> 레퍼런스: Linear / Vercel / Railway 다크 — 깊은 슬레이트, 무채색 UI, 단 하나의 비비드 포인트(=가격).
> 동시에 refine-v4(절제) 적용: 색 1곳·메타 1줄·여백·위계 3단. AI슬롭(그라데이션·글로우) 0.

## 1. 팔레트 (Tailwind slate 스케일, HSL 토큰 — 매직 hex 0)

`app/globals.css` `:root` 전면 교체 + `color-scheme: dark`.

| 토큰 | slate | HSL | 용도 |
|------|-------|-----|------|
| `--background` | slate-950 `#020617` | 222 47% 5% | 페이지 |
| `--background-subtle` | slate-950↔900 | 222 47% 8% | 교차 섹션·푸터 |
| `--card` | slate-900 `#0F172A` | 222 47% 11% | 카드/팝오버 표면 |
| `--card-elevated` | slate-800 `#1E293B` | 217 33% 17% | hover/상승 표면 |
| `--muted` / `--input` | slate-800 `#1E293B` | 217 33% 17% | 입력 채움·비활성 |
| `--border` | slate-800/700 | 217 33% 20% | 저대비 hairline |
| `--foreground` | slate-50 `#F8FAFC` | 210 40% 98% | 1차 텍스트 |
| `--foreground-secondary` | slate-400 `#94A3B8` | 215 20% 65% | 2차 텍스트 |
| `--muted-foreground` | slate-500↑ | 215 16% 57% | 3차/placeholder (다크 AA 보정) |
| `--primary` | slate-300 `#CBD5E1` | 213 27% 84% | **무채색** 강조(가격 외 절제) |
| `--accent` | slate-800 | 217 33% 17% | hover 활성 표면 |

- 섀도우: 흰 글로우 0. 깊은 검정 알파(e1 0.30/0.36 … e3 0.55)로만 약하게 분리. `tailwind.config.ts` boxShadow 재정의.
- 기존 Toss Blue primary → 무채색 slate-300으로 강등(가격만 색이라는 원칙). 링크/로고/칩의 "행동색"도 무채 또는 price로 이전.

## 2. 가격 = 유일한 비비드 액센트

- **새 토큰 `--price` = emerald-400 `#34D399` (158 64% 52%)** + `--price-foreground`(slate-900). `tailwind.config.ts`에 `price` 컬러·`card-elevated` 추가. `--ring`·`.shadow-focus`도 emerald로 통일.
- `price-block.tsx`: 월 프로모가(큰 숫자) → `text-price` + `font-bold` + `nums`(tabular). `isCheaper` 파랑 분기 **삭제** — 항상 emerald. "월" 라벨·취소선 정가·1년총비용은 무채색 보조. **카드 컬러는 이 가격 하나만.**
- 히어로 "이번 주 최저가" 앵커 가격도 `text-price`. 헤더 로고 마크 `bg-price`(브랜드 단일 색 포인트). 퀵칩 on=`bg-price`.
- `--saving`(절약 CTA 버튼/계산결과)은 price보다 톤다운한 emerald-500로 분리 — 가격(emerald-400)과 위계 구분. 종료후정가 띠는 다크 앰버.

## 3. refine-v4 절제 동시 적용

- **컬러 배지 폐기 → 무채색 메타 1줄**: plan-card·상세·compare-table 모두 `망 · 세대 · 약정 · 알뜰폰`을 `.meta-dot` 가운데점 무채색 라인으로. `badge.tsx` `default`=transparent/px-0 라벨, `mvno` variant 제거, `muted` 추가.
- carrier 이니셜 원형 칩 제거 → plan명 위 작은 eyebrow(muted).
- 여백 +1단계: 카드 `p-5/6→p-6/7`, `gap-4→5`, 히어로 `space-y/ gap` 확대.
- 위계 3단: plan명 bold(slate-50) → 데이터 semibold → 메타·통화 muted.
- 퀵칩 off=투명+hairline, on=emerald(`toggle.tsx`). filter-bar hairline divider 제거(여백 구획). hover lift 1→0.5px·섀도우 약. 히어로 강조어 무채색화 + price dot 1개.

## 4. 변경 파일

globals.css · tailwind.config.ts · shared/ui/{badge,toggle}.tsx · widgets/plan-card/{index,price-block}.tsx · widgets/{site-header,filter-bar,compare-table}/index.tsx · app/page.tsx · app/plans/[id]/page.tsx

## 5. 제약 준수

- 데이터/캐시/API/렌더링 전략 **미변경**. rendering-matrix 일치(/ ISR 1h, /plans/[id] SSG, /compare·API dynamic).
- `any` 0, FSD 단방향, barrel 경유, 매직 hex 0(전 토큰 경유), 링크 밑줄 0, `'use client'` leaf 유지, next/image·CLS 0 가드 유지(`.nums` tabular, 고정 높이).
- a11y: slate-50 on slate-950 / slate-400 본문 / emerald price·amber·saving-muted 텍스트 모두 다크 위 WCAG AA. 터치 44px·focus-visible 링 유지.

## 6. 게이트 결과 (bun)

| 게이트 | 결과 |
|--------|------|
| `bun run typecheck` | 0 errors |
| `bun run lint` | 0 errors |
| `bun run test` | 147 passed (25 files) |
| `bun run build` | success · 261 static pages |
| 번들 (First Load JS) | 최대 186 KB (/ · /recommend) < 200 KB 예산 |

브라우저(gstack /browse) 시각 확인: 홈·상세 다크 슬레이트 + emerald 가격 단일 색 포인트 정상 렌더.
