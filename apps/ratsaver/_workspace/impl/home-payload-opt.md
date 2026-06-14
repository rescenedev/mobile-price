# 홈(`/`) 초기 페이로드 급감 — 하이브리드 렌더 데이터 흐름

## 목표
홈 p50 189ms의 근본 원인(전체 seedPlans 253개를 클라 `PlanList`에 props로 전달 → Next가 약 118KB JSON을 HTML/RSC에 직렬화 → OpenNext가 150KB HTML 서빙)을 제거하여 응답시간 50ms 목표에 기여.

## 변경 아키텍처: 하이브리드(초기 작게 + 전체 비동기)
- **`app/page.tsx`** (Server Component, `revalidate=3600` 유지)
  - 전체(253) 임베드 제거. `seedPlans`를 월요금 오름차순 정렬 후 `slice(0, INITIAL_PLAN_COUNT=24)` → 최저가 상위 24개만 `initialPlans`로 SSR 공급.
  - 정렬은 복사본(`[...seedPlans]`)에서 — readonly 단일 출처 불변.
- **`src/widgets/plan-list/index.tsx`** (`'use client'` leaf 유지)
  - prop `plans` → `initialPlans`(24, SSR)로 변경. 초기 렌더·필터 소스는 initialPlans → 첫 페인트/LCP 빠름, CLS 0.
  - 마운트 후 `useEffect`에서 `GET /api/plans?limit=300`(엣지캐시·서버 ~3ms) 비동기 fetch → 응답 `.plans`를 `parsePlanList`(Zod 경계 검증)로 검증 후 `fullPlans` 상태에 저장.
  - 필터 소스 = `fullPlans ?? initialPlans`. 로드 완료 전엔 24개로 필터/표시, 완료 후 전체 253으로 자동 교체. 기존 메모리 필터/정렬/퀵칩/딥링크(searchParams)/aria-live 결과 카운트/기본정렬 price_asc 전부 그대로.
  - **Graceful degrade**: fetch 실패·abort·부적합 응답 시 `fullPlans`는 null 유지 → initialPlans로 화면 정상 동작(깨지지 않음).
  - **CLS 0**: 전체 로드 전 그리드 하단에만 고정 높이 스켈레톤(`h-[18rem]`) `pendingCount`개 추가(기존 카드는 이동 없음, 추가는 항상 아래쪽). 실 카드로 교체돼도 위 콘텐츠 안정.
  - **로딩 깜빡임 방지**: `results.length === 0`이라도 `fullPlans === null`이면 EmptyState 대신 로딩(스켈레톤) 표시 — "없음→있음" 플래시 제거.
- 클라 fetch는 표준 `fetch`(클라 비콘과 동일, 서버 `trackFetch` 대상 아님). 데이터/캐시/API 레이어 무수정.

## Before → After (next build, `/` SSG prerender)

| 지표 | Before (253 임베드) | After (24 임베드) | 감소 |
|---|---|---|---|
| 프리렌더 HTML (`.next/server/app/index.html`) | 150,582 B (~150 KB) | 16,537 B (~16 KB) | **−89%** (−134 KB) |
| RSC 페이로드 (`index.rsc`) | 128,492 B (~128 KB) | 9,670 B (~9.7 KB) | **−92%** (−119 KB) |
| HTML 내 직렬화 plan 수 (`monthlyPrice`) | 253 | 24 | −229 |
| `/` First Load JS | 186 KB | 186 KB | 동일(번들 예산 200KB 이내) |
| `/` page Size | 3.61 KB | 3.63 KB | +0.02 KB(useEffect 로직) |

→ 초기 HTML 150KB→16KB로 약 89% 축소. OpenNext가 읽어 서빙할 본문이 1/9로 줄어 전송·서빙 시간 직접 단축. JS 번들은 불변(상호작용 leaf 유지, 'use client' 신규 0).

## 게이트 결과
- `npm run typecheck`: **0 오류**
- `npm run lint`: **0 에러**
- `npm run test`: **147/147 통과**
- `npm run build`: **성공** (261 페이지 생성), `/` First Load JS 186 KB < 200 KB 예산

## Hard Threshold 점검
- ② 렌더링: `revalidate=3600` 유지(rendering-matrix 일치), `runtime='edge'` 미선언 유지. 서버 전용 코드 클라 유출 0(클라는 `/api/plans` HTTP만 소비).
- ③ 보안: 시크릿/DB 클라 유출 0. 클라 fetch는 공개 GET 엔드포인트.
- ④ 성능: CLS 0(고정 높이 스켈레톤, 그리드 하단 추가만). `next/image` 미사용(텍스트 LCP) 그대로. 번들 예산 이내.
- ① 품질: `any` 0, FSD 단방향(widget→features/entities/shared), `I*Props`, 매직값 상수화(`INITIAL_PLAN_COUNT`, `FULL_PLANS_ENDPOINT`).

## 스코프 외 관찰(보고만, 미수정)
- **`/recommend`** (`app/recommend/page.tsx`)도 `seedPlans` 전체 253개를 `RecommendPanel`(클라)에 props로 공급 → 동일하게 초기 HTML/RSC에 전량 직렬화됨. 이번 스코프는 홈만이라 미변경. 동일 하이브리드 패턴(초기 N + 클라 `/api/plans?limit=300` 비동기) 적용 가능하나, 추천 스코어링이 전체 목록을 요구하므로 "초기 셸 + 전체 비동기 로드 후 스코어" 형태로의 검토가 별도 필요.
