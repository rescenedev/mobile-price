# 구현 노트 — 디자인 폴리시 v3 + 홈 SSR 카드 렌더 버그 수정

작업자: ui-developer (Phase 4c) · 일자: 2026-06-14

## (B) 홈 SSR 카드 렌더 버그 — 근본원인 정정 + 수정

### 증상
`/`의 정적 프리렌더 HTML(`.next/server/app/index.html`)에 요금제 카드 0개. 그리드(`<ul>`)는 렌더되나 24개 `<li>`가 전부 스켈레톤(`aria-hidden`). RSC 페이로드(`index.rsc`)에 plan 데이터 0건.

### 근본원인 (지시받은 가설과 다름 — 정정)
지시 가설은 "`useSearchParams()` 바일아웃"이었다. 그것도 제거했으나(아래) **그것만으로는 카드가 0개로 유지**됐다. 실제 근본원인은 다음이었다:

- `INITIAL_PLAN_COUNT`(= 24)가 **`'use client'` 모듈**(`plan-list/index.tsx`)에서 `export const`로 노출돼 있었다.
- Server Component(`app/page.tsx`)가 이 값을 import하면 React는 **리터럴 24가 아니라 client-reference 프록시**를 넘긴다.
- `sorted.slice(0, INITIAL_PLAN_COUNT)` → `slice(0, <proxy>)` → 길이 인자가 `NaN`으로 강제 → **빈 배열** 반환.
- 그 결과 `PlanList`에 `initialPlans=[]`가 전달 → `results.length === 0` → 그리드가 스켈레톤만 출력.
- 히어로(`cheapest = sorted[0]`)는 `seedPlans`를 직접 써서 정상 렌더됐기에 "데이터는 있는데 카드만 0"인 혼란스러운 증상이 됐다.

### 수정
1. **상수를 plain 모듈로 분리**: `src/widgets/plan-list/constants.ts` 신설 → `export const INITIAL_PLAN_COUNT = 24` ('use client' 경계 밖).
2. **컴포넌트 파일 분리**: `plan-list/index.tsx` → `plan-list/plan-list.tsx`('use client' 컴포넌트). 상수는 `./constants`에서 import.
3. **서버-안전 배럴**: `plan-list/index.ts` 신설 — `INITIAL_PLAN_COUNT`(plain)·`PlanList`(client)를 각각 올바른 형태로 재노출. 서버는 리터럴 24를, 클라는 client-reference를 받는다.
4. **useSearchParams/useRouter/usePathname 제거**(`next/navigation` 의존 0):
   - 초기 상태 = URL 비의존 상수 `DEFAULT_FILTER_STATE = parseFilters(new URLSearchParams())`(price_asc) → 서버/클라 첫 렌더 동일(hydration mismatch 0).
   - 마운트 후 `useEffect`에서 `window.location.search`로 URL 필터/정렬 반영(딥링크 보존).
   - 뒤로/앞으로가기는 `popstate` 리스너로 동기화.
   - URL 직렬화는 `window.history.replaceState`로(기존 `router.replace` 대체) — debounce 150ms 유지.
5. **Suspense 경계 제거**(`app/page.tsx`): `PlanList`가 더 이상 suspend하지 않으므로 fallback이 정적 HTML을 가리지 않게 함.

### 검증 (정적 HTML grep)
| 지표 | before | after |
|------|--------|-------|
| `/plans/{id}` 고유 링크 | **0** | **24** |
| "상세 보기" 링크 | 0 | 24 |
| 가격(`원`) | 4(히어로만) | 97 |
| 카드 `<li>` (그리드) | 0 | 24 (+ 24 스켈레톤 = pendingCount, CLS 0) |
| `index.html` 존재 | (동적 바일아웃) | ○ Static prerender |

딥링크/뒤로가기/URL 직렬화 동작 보존. `/` 라우트는 ISR(revalidate 1h) 유지(rendering-matrix 일치).

## (A) 디자인 폴리시 v3 — polish-v3.md 그대로 적용

- **§1 헤더 로고 마크**: `site-header` — lucide `Zap`을 `bg-primary` rounded-[10px] 흰 아이콘으로. 워드마크 앞 배치, size-8 고정(CLS 0), group hover scale.
- **§2 히어로 리디자인**: `app/page.tsx` — 2열 그리드(lg+). 좌: 아이브로우 pill(`bg-accent` + Sparkles + 실시간 N개) → 헤드라인("정직하게"만 `text-primary`) → 보조문구. 우: "이번 주 최저가" 앵커 카드(`.accent-rail` primary 레일 + 큰 가격 숫자 + `shadow-e2`). `cheapest` 재사용(연산 0, 이미지 0 → CLS 0).
- **§3 필터 툴바**: `filter-bar` — 결과수(좌)+정렬(우) 한 줄 헤더로 정착(부유 드롭다운 제거) → hairline → 퀵칩 행(`flex-1`)+모바일 상세필터 버튼. `resultCount` prop 추가. `plan-list`의 별도 결과수 `<p>` 삭제(헤더로 이동).
- **§3-3 퀵칩**: `toggle.tsx` chip variant off=`bg-muted text-foreground-secondary shadow-none`, on=`bg-primary text-primary-foreground shadow-e1` → 활성/비활성 대비 명확, h-9.
- **§4 카드 디테일**: `plan-card` — 통신사 이니셜 칩(중립 muted, 색코딩 회피) + 요금제명 한 행, 강조 배지 색(무약정=saving, 알뜰폰=mvno/accent), hover `e1→e2` + `focus-within` ring, "상세 보기"에 `text-primary-strong` + ArrowRight(hover translate). `price-block`: 정가>프로모가 시 정가 취소선(`muted-foreground line-through`) + 프로모가 `text-primary`(특가 신호, 할인 있을 때만).
- **§7 마이크로**: `empty-state` 아이콘 칩(`bg-accent` size-12 rounded-full) + py-16, `globals.css` `.accent-rail` 유틸 추가, 스켈레톤 `rounded-2xl`로 카드 모서리 일치.

### 색 존재감 (primary 등장 지점, 본문/배경 금지)
헤더 마크 · 헤드라인 강조어 · 아이브로우 pill · 앵커 레일/라벨 · 활성 퀵칩 · 특가 가격 · 상세보기 링크/화살표 · 포커스 링. AI 슬롭(보라/그라데이션/글로우) 0, 매직 hex 0(토큰만), 밑줄 0.

## 게이트 결과
- `npm run typecheck`: **0 errors**
- `npm run lint`: **0 errors**
- `npm run test`: **147 passed / 25 files**
- `npm run build`: **success** — `/` ○ Static, 186 kB First Load JS (< 200 KB 예산)
- `any` 0 · FSD 단방향(`app → widgets → features → entities → shared`) · barrel(`plan-list/index.ts`) · `@/` alias · `I*Props` 준수
- 데이터/캐시/API 레이어(`src/shared/cache`·`src/shared/db`·`app/api`) 미변경
