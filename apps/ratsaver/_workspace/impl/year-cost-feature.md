# 1년 총비용 기능 UI (Phase 4c · ui-developer)

정직성 wedge의 정점: 표시 월요금(프로모가)은 미끼일 수 있다. "월 10원(6개월)" 플랜도 1년 환산하면
99,060원으로, "월 5,000원 평생"(1년 60,000원)보다 비싸다. 1년 총비용으로 진짜 최저가를 드러낸다.

데이터/계산/정렬 로직은 기존 산출물 그대로 소비(`firstYearCost`·`formatFirstYearCost`·`year_cost_asc`).
표시·정렬옵션 UI만 추가.

## 변경 파일 (표시·정렬옵션 UI 한정)

### 1. 정렬 드롭다운 옵션 추가
`src/shared/config/index.ts`
- `ISortOption.value` 유니온에 `'year_cost_asc'` 추가 (TPlanSort 집합과 정합).
- `SORT_OPTIONS` 배열에 `{ value: 'year_cost_asc', label: '1년 총비용 낮은순' }` 추가 (price_asc 다음, data_desc 앞).
- `@/shared/config`는 import 0인 순수 상수 모듈 → 클라(FilterBar)에서 안전 소비. server-only 미접촉.
- FilterBar(`src/widgets/filter-bar/index.tsx`)는 `SORT_OPTIONS`를 map하므로 코드 변경 없이 신규 옵션 노출.
- 정렬 적용/round-trip은 이미 `criteria.ts`·`parse.ts`에 배선됨(parse.ts SORT_KEYS에 year_cost_asc 포함) → URL 공유·정렬 동작 자동.

### 2. PlanCard 1년 총비용 표시
`src/widgets/plan-card/price-block.tsx` (카드·상세 단일 출처 UI)
- 가격 블록 최하단에 보조 텍스트 `1년 총 <강조>{formatFirstYearCost(plan)}</강조>` 추가.
- 시각 위계 유지: 월 프로모가(extrabold, primary 신호) > 종료후정가 경고(앰버 띠) > 1년 총비용(xs, foreground-secondary 라벨 + foreground 금액).
- 절제: 한 줄, 색 남발 0, 고정 영역(항상 렌더) → CLS 0.

### 3. 상세 페이지 1년 총비용 행
`app/plans/[id]/page.tsx`
- 가격 섹션(PriceBlock hero) 하단에 hairline 구분 후 "1년 총비용" 행 추가.
- 금액(lg/bold) + 짧은 설명: 프로모 플랜이면 `프로모 N개월 + 정가 M개월, 12개월 환산`, 아니면 `12개월 환산`.
- 설명 분기는 PriceBlock의 hasPromo 판정(promoMonths>0 && regularPrice!==monthlyPrice)과 동일 규칙.

### 4. 홈 히어로 "이번 주 최저가" 앵커 카드 (선택 — 적용)
`app/page.tsx`
- 월 프로모가 아래에 `1년 기준 {formatFirstYearCost(cheapest)}` 작게 병기(text-sm, foreground-secondary).
- 과밀 방지: 한 줄, 기존 carrier·망·data 줄 위에 배치.

## 제약 준수
- `any` 0 / 매직값 0(전부 `formatFirstYearCost` 소비) / 밑줄 0 / CLS 0(고정 영역, 조건부 누락 없음).
- FSD 단방향: app·widgets → entities(plan format) / widgets → shared(config·ui). 역방향·동일레이어 cross 0.
- 정렬 라벨은 client-safe 순수 모듈(`@/shared/config`), server-only 배럴 클라 import 0.
- a11y: 시맨틱 유지, 신규 텍스트 대비 AA(foreground-secondary on card/background 토큰), 신규 인터랙티브 0.
- 번들: 신규 import는 기존 entities/plan 포맷터 재사용 → 추가 번들 사실상 0. 빌드 First Load 홈 187kB·상세 181kB(예산 내).
- 데이터/캐시/API/calc 로직 미접촉.

## 게이트 결과
- `bun run typecheck` → 0 오류
- `bun run lint` → 0 에러
- `bun run test` → 147 passed / 25 files (정렬·포맷 테스트 포함 전부 통과, 보정 불필요)
- `bun run build` → 성공 (261 static pages, 렌더링 전략 불변: 홈 ISR 1h · 상세 SSG)
