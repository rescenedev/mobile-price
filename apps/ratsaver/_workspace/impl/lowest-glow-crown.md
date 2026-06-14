# 최저가 강조 방식 변경 — 히어로 앵커 제거 → 하단 카드 글로우 + 왕관 뱃지

사용자 지시: "이번주 최저가(히어로 앵커카드) 여기 보여주지 말고, 하단 카드 섹션에서 글로우 처리 해줘, 그리고 뱃지 왕관."

## 변경 파일

### 1) `app/page.tsx` — 히어로 앵커 카드 제거
- 우측 "이번 주 최저가" `<aside>` 박스(emerald 큰 가격 + 1년기준 + carrier 줄) **완전 제거**.
- 히어로를 2열 그리드(`lg:grid-cols-[1.15fr_1fr]`)에서 **단일 컬럼**(`max-w-2xl space-y-5`)으로 전환 — 아이브로우(● 실시간 N개) + 헤드라인("정직하게" 강조) + 보조문구만 남김.
- 섹션 간 세로 여백 `space-y-16 → space-y-14`로 균형 정리(앵커 제거로 빈 공간 축소).
- 미사용이 된 import 제거: `formatKrw`, `formatData`, `formatFirstYearCost`.
- `cheapest` 객체 대신 `cheapestId = sorted[0].id`만 계산 → `PlanList`에 전달.

### 2) `src/widgets/plan-list/plan-list.tsx` — cheapestId 스레딩
- `IPlanListProps`에 `readonly cheapestId: string` 추가.
- `results.map`에서 `<PlanCard ... isLowest={plan.id === cheapestId} />` — id 기준이라 정렬/필터로 위치가 바뀌어도 같은 plan만 강조.

### 3) `src/widgets/plan-card/index.tsx` — 글로우 + 왕관 뱃지
- `IPlanCardProps`에 `readonly isLowest?: boolean` (기본 false) 추가.
- 글로우(`isLowest`일 때만, 절제된 발광):
  - `bg-card-elevated` (slate-800, `--card-elevated` 토큰) — 배경을 살짝 상승시켜 분리.
  - `ring-1 ring-[hsl(var(--price))]/40` + `shadow-[0_0_28px_-4px_hsl(var(--price)/0.45)]` (hover `0_0_32px_-4px /0.55`) — emerald `--price` 토큰 기반. 과한 네온 금지(짧은 spread, 40~55% alpha).
- 왕관 뱃지: lucide `Crown`(`text-price`) + "최저가" 라벨. `bg-saving-muted`/`text-saving-muted-foreground` 토큰.
  - **절대배치** `absolute right-4 top-4 z-10` → 카드 높이 불변(**CLS 0**), 다른 카드와 어긋나지 않음.
  - **a11y**: 뱃지 `<span>`에 `aria-label="최저가"`, Crown 아이콘 `aria-hidden`.
  - 겹침 방지: 최저가 카드 헤더 텍스트 컬럼에 `pr-20`(truncate 유지)로 carrier/요금제명이 뱃지 밑으로 안 들어가게.
- `Card`에 `relative` 추가(뱃지 절대배치 기준).
- `recommend-panel`의 PlanCard 사용처는 `isLowest` 미전달 → 기본 false, 글로우 없음(그 1장만 강조 보장).

## 제약 준수
- 다크 슬레이트 + emerald 단일 액센트 유지: 글로우/왕관 모두 `--price`/`--saving-muted` 토큰만 사용, **매직 hex 0**.
- 밑줄 0, CLS 0(절대배치 뱃지), 'use client' leaf 유지(PlanCard는 서버 컴포넌트 그대로).
- 데이터/캐시/API/렌더링 전략 미변경 — `/`는 여전히 Static + revalidate 1h.
- 글로우는 `isLowest` 1장만(이전 'glow 금지'는 이 카드에 한해 사용자 명시 요청으로 해제).

## 게이트 결과
- `bun run typecheck` — **0 에러**
- `bun run lint` — **0 에러**
- `bun run test` — **147/147 통과** (25 파일)
- `bun run build` — **성공**. `/` First Load JS **187 kB** (예산 200 kB 이내), Static + revalidate 1h 유지.
