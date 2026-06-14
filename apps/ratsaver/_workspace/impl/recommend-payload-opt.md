# 추천(`/recommend`) 초기 페이로드 급감 — 셸 SSR + 전체 비동기 로드

작업자: ui-developer (Phase 4c) · 일자: 2026-06-14

## 목표
`/recommend`의 초기 페이로드(149KB)를 급감. 근본 원인은 홈과 동일: `seedPlans` 전체(253)를 클라
`RecommendPanel`에 props로 전량 임베드 → Next가 HTML/RSC에 직렬화. 홈에 적용한 "SSR 셸 + 마운트 후
`/api/plans?limit=300` 비동기 로드" 패턴을 동일 적용.

## 변경 아키텍처
- **`app/recommend/page.tsx`** (Server Component, 정적 SSG)
  - `seedPlans` import 및 `RecommendPanel`에 전달하던 `plans`(253) 제거.
  - 셸(제목/설명/프리셋 UI)만 정적 SSR → 임베드 plan **0개**.
  - `RecommendPanel`이 더 이상 `useSearchParams`를 쓰지 않으므로 `Suspense` 경계 제거(홈과 동일) →
    셸이 정적 HTML에 그대로 출력(바일아웃 0).
- **`src/widgets/recommend-panel/index.tsx`** (`'use client'` leaf 유지)
  - prop `plans`(253) 제거 — props 없는 컴포넌트.
  - 마운트 후 `useEffect`에서 `GET /api/plans?limit=300`(엣지캐시·서버 ~3ms) 비동기 fetch →
    응답 `.plans`를 `parsePlanList`(Zod 경계 검증)로 검증 후 `fullPlans` 상태에 저장.
    추천 스코어링은 전체 목록을 요구하므로 부분 로드가 아닌 전체(limit=300) 로드.
  - 스코어 소스 = `usage && fullPlans ? recommend(fullPlans, usage, 12) : []`. 로드 완료 후에만 스코어.
  - **로딩 표면(CLS 0)**: 사용량은 선택됐는데 전체 미로드면 "없음"이 아니라 고정 높이 스켈레톤 6개
    (`h-[18rem]`, `role=status`·`aria-live=polite`·`aria-busy`·sr-only "불러오는 중") 표시.
    결과 섹션 `min-h-[320px]` 유지 → 레이아웃 시프트 0.
  - **Graceful degrade**: fetch 실패·abort·부적합 응답 시 `fullPlans=null` 유지 → 빈 결과 + 안내(화면 안 깨짐).
  - **URL 딥링크 보존**: `useSearchParams`/`useRouter`/`usePathname`(`next/navigation`) 제거.
    초기 preset/사용량은 마운트 후 `window.location.search`로 읽고(딥링크), 직렬화는
    `window.history.replaceState`로 직접 반영, 뒤로/앞으로가기는 `popstate` 리스너로 동기화.
  - 기존 프리셋 선택·직접입력 모달(lazy)·이벤트 발화(`select_usage_preset`·`recommend_run`·
    `core_action`) 전부 유지.
  - server-only 배럴(`@/shared/db`) import 0 — `parsePlanList`(`@/entities/plan`, 순수 Zod),
    `recommend`/`usageFromPreset`(`@/features/plan-recommend`, 순수)만 소비.
- 클라 fetch는 표준 `fetch`(클라 비콘과 동일, 서버 `trackFetch` 대상 아님). 데이터/캐시/API/디자인 토큰 무수정.

## Before → After (next build, `/recommend` SSG prerender)

| 지표 | Before (253 임베드) | After (0 임베드) | 감소 |
|---|---|---|---|
| 프리렌더 HTML (`.next/server/app/recommend.html`) | 149 KB (152,576 B) | 23 KB (23,168 B) | **−85%** (−126 KB) |
| RSC 페이로드 (`recommend.rsc`) | 127 KB | 10 KB (10,368 B) | **−92%** (−117 KB) |
| HTML 내 직렬화 plan 수 (`monthlyPrice`) | 253 | **0** | −253 |
| `/recommend` 렌더 유형 | ○ Static | ○ Static | 동일 |
| `/recommend` First Load JS | 186 KB | 186 KB | 동일(< 200 KB 예산) |
| `/recommend` page Size | 3.4 kB | 3.4 kB | 동일 |

→ 초기 HTML 149KB→23KB(−85%). 셸(제목/프리셋 UI)은 정적 HTML에 그대로 존재, 임베드 plan 253→0.

## 게이트 결과
- `npm run typecheck`: **0 오류**
- `npm run lint`: **0 에러**
- `npm run test`: **147/147 통과** (25 파일)
- `npm run build`: **성공** (261 페이지), `/recommend` ○ Static · 186 KB First Load JS < 200 KB

## Hard Threshold 점검
- ② 렌더링: SSG 셸 유지(전략 불변), `runtime='edge'` 미선언 유지. 서버 전용 코드 클라 유출 0
  (클라는 `/api/plans` HTTP만 소비, `@/shared/db` import 0).
- ③ 보안: 시크릿/DB 클라 유출 0. 클라 fetch는 공개 GET 엔드포인트. PII 0(GB/분만 직렬화, 금액 0).
- ④ 성능: CLS 0(고정 높이 스켈레톤 + `min-h-[320px]`). 번들 예산 이내(186 KB). 초기 HTML −85%.
- ① 품질: `any` 0, FSD 단방향(widget→features/entities/shared), `I*Props` 불필요(무프롭),
  매직값 상수화(`FULL_PLANS_ENDPOINT`·`RECOMMEND_LIMIT`), 링크 밑줄 0, a11y(`aria-live`·sr-only) 유지.

## 스코프
- `/calculator`·`/compare`·`/plans/[id]`·`/` 및 데이터/캐시/API/디자인 토큰 미변경.
