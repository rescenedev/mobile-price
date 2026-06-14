---
project: ratsaver
phase: 4c
title: UI Built — shadcn 배선·features·widgets·page 조립 (구현 요약)
status: completed
created: 2026-06-14
updated: 2026-06-14
owner: ui-developer
---

# ui-built — ratsaver (Phase 4c)

> ui-developer 산출. 디자인 토큰 배선(tokens/theme)·4 features 클라 순수함수·11 widgets·6 page 조립.
> 데이터는 4b(entities/plan·shared/db `seedPlans`) 소비만. 서버 호출 0·PII 0(추천/계산/필터 전부 클라).

## 1. shadcn/ui 설치 + 토큰 배선

- `app/globals.css` — tokens.md/theme.md CSS 변수 전체 주입(라이트 :root + .dark 대비). `.nums` tabular-nums.
- `tailwind.config.ts` — darkMode:'class'·의미색(saving/warning muted)·shadow(card/card-hover/popover)·radius·fontFamily.sans=var(--font-sans)·tailwindcss-animate(import).
- `components.json` — FSD 경로(components→@/shared/ui, utils→@/shared/lib/utils).
- `src/shared/lib/utils.ts` — `cn`(clsx+tailwind-merge).
- **Pretendard Variable self-host** — `public/fonts/PretendardVariable.woff2`(2MB) + `next/font/local`(weight 400 700·display swap·fallback system-ui). 외부 폰트 CDN 0 → CLS 0.

### 설치 컴포넌트 (`src/shared/ui/`, barrel `index.ts`)
button(+saving variant)·badge(+saving/warning/mvno variant)·card·input·label·separator·skeleton·
select·dialog·sheet·tabs·toggle(+chip size)·toggle-group·tooltip·scroll-area·sonner(Toaster)·table.
- button size 기본 h-11(44px 터치 타겟). focus-visible ring·motion-reduce 전 컴포넌트.

## 2. features 클라 순수함수 (서버호출 0·PII 0, TDD)

- `plan-filter/parse.ts` — `parseFilters`/`serializeFilters`(searchParams↔상태 round-trip, 공유 URL US-002). 기본값 키 생략.
- `plan-filter/quickchips.ts` — `buildCriteria`(상태→IPlanCriteria, 퀵칩 4종 AND 누적, 더 좁은 조건 채택).
- `plan-filter/apply.ts` — `applyFilters`(=`@/shared/db/criteria.applyCriteria` 재사용 — **배럴 아닌 submodule 직접 import**: `@/shared/db` index는 server-only).
- `plan-compare/compare.ts` — `parseCompareIds`(최대 3·중복제거·절단)·`buildCompareMatrix`(8 고정행→CLS 0·최저가 isBest·종료후정가 isWarning).
- `plan-compare/use-compare-tray.ts` — 비교 트레이 클라 hook(sessionStorage 누적·3개 초과 차단·CustomEvent 동기화). plan id만(PII 0).
- `plan-recommend/score.ts` — `scorePlan`(사용량→적합도: 데이터/통화 부족 패널티+가격 가점)·`recommend`(점수 내림차순)·`USAGE_PRESETS` 5종·`usageFromPreset`.
- `saving-calculator/calc.ts` — `calcSaving`(월·연 절약액, 음수 클램프)·`savingInputSchema`(Zod 음수·0·과대 차단)·`parseSavingInput`(콤마 제거+사용자 친화 에러). **클라 계산·서버 미저장**.
- `shared/config` — QUICK_CHIPS·SORT_OPTIONS·PRICE/DATA_RANGE·savingBucket(4d AE 버킷용).
- `shared/lib/search-params.ts` — 불변 URLSearchParams 헬퍼(setParam/toggleParam/readCsv/writeCsv).

### 단위 테스트 (+39, 총 128 통과)
- parse(round-trip 포함 5)·apply+quickchips(10)·score+recommend+presets(9)·calc+schema(7)·compare(8). `__fixtures__/plan.ts` makePlan 팩토리.

## 3. widgets (11종, `src/widgets/`)

| widget | 경계 | 비고 |
|--------|------|------|
| site-header | 서버 | sticky·텍스트 로고(이미지 0)·4 nav Link·h-11 |
| disclaimer | 서버 | lastVerifiedAt date-fns·`<time>`·면책 |
| plan-card | 서버 | 4블록(badge행/데이터+속도/통화·문자/망·약정/정직성가격)·footer. `price-block.tsx`(정직성 병기 단일출처)·`compare-toggle.tsx`(클라 island·aria-pressed·sonner) |
| saving-result | 클라 | 현재요금→calcSaving·결과 고정높이(CLS 0)·green. `calculator-panel.tsx`(?target= 읽기 래퍼) |
| filter-bar | 클라 | 퀵칩(ScrollArea)+상세필터(모바일 Sheet·lg 인라인)+정렬 select. label 연결. `quick-chips.tsx`(toggle-group·aria-pressed) |
| plan-list | 클라 | searchParams 직렬화(router.replace debounce 150ms)·메모리 필터·결과카운트(aria-live)·EmptyState |
| compare-table | 서버 | 8행 고정 매트릭스·첫열 sticky·가로 ScrollArea·최저가 saving·정가 warning. `remove-column-button.tsx`·`copy-url-button.tsx`(클라 island) |
| usage-preset-modal | 클라+next/dynamic lazy | dialog·tabs(프리셋/직접입력)·toggle-group. 초기 번들 제외 |
| recommend-panel | 클라 | 프리셋칩 인라인+모달 lazy·클라 스코어링·절약배지·결과 min-h(CLS 0) |
| empty-state | 서버 | 고정높이·href/onAction 택일 |
| compare-tray-bar | 클라 | 담긴 수 표시+비교하기 CTA(/compare?ids=)·aria-live |

## 4. page 조립 (6 page)

- `/` (SSG) — 히어로 헤드라인(텍스트 LCP)+SavingResult(클라 leaf)+가치 3블록+CTA 2. seedPlans 저가 5종 절약 대상.
- `/plans` (ISR 3600) — `<Suspense>`+PlanList(클라). seedPlans 전체 서버 공급→클라 필터.
- `/plans/[id]` (SSG 전건) — 정직성 가격 hero+스펙 dl+비교담기+계산기 CTA(/calculator?target=)+disclaimer.
- `/compare` (ISR 3600) — ?ids= 서버 파싱→CompareTable 서버 조립(제거/복사만 클라). 빈 슬롯 EmptyState.
- `/recommend` (SSG 셸) — `<Suspense>`+RecommendPanel(클라 스코어링).
- `/calculator` (SSG 셸) — `<Suspense>`+CalculatorPanel(?target= 클라 읽기)+SavingResult full+disclaimer.
- 상태표면: `app/loading.tsx`·`app/plans/loading.tsx`(스켈레톤)·`app/error.tsx`·`app/plans/error.tsx`(재시도)·`app/not-found.tsx`·각 EmptyState.
- North Star 동선: 추천/계산 결과 → 상세/비교 CTA 내장.

## 5. 렌더링 전략 ↔ matrix 일치 (build 검증)

| route | matrix | build 결과 |
|-------|--------|-----------|
| `/` | SSG | ○ Static |
| `/plans` | ISR+클라필터 | ● Revalidate 1h |
| `/plans/[id]` | SSG 전건 | ● SSG(120건 프리렌더) |
| `/compare` | ISR+클라조립 | ƒ Dynamic(searchParams) |
| `/recommend` | SSG 셸 | ○ Static |
| `/calculator` | SSG 셸 | ○ Static |
- 전 page `runtime='edge'` 0. 130 정적 페이지 생성 성공.

## 6. 번들 예산 (gz First Load — Hard Threshold ④)

- 공유 프레임워크 ~103KB gz. route delta: `/plans` 5KB·`/recommend` 5KB·나머지 <1KB.
- 총 gz First Load: `/`≈103KB(≤110 ✅)·`/plans`≈108KB(≤160 ✅)·`/recommend`≈108KB(≤150 ✅)·`/compare`≈104KB(≤140 ✅)·`/calculator`≈104KB(≤120 ✅)·`/plans/[id]`≈104KB(≤110 ✅).
- Radix/sonner 라우트별 코드분할(usage-preset-modal은 next/dynamic lazy).

## Hard Threshold 준수 (4c 범위)

- ① typecheck 0·lint 0·`any` 0·`.split('T')` 0·FSD 역방향 0·barrel 누락 0.
- ② page 선언 matrix 1:1·`runtime='edge'` 0·server-only(seedPlans) 클라 비유출(apply.ts는 criteria submodule 직접 import로 server-only 배럴 회피).
- ③ 시크릿/DB 클라 유출 0·NEXT_PUBLIC 시크릿 0·쓰기경로 0(CSRF N/A)·현재요금/절약액 서버 전송 0.
- ④ next/image width/height — **이미지 미사용**(텍스트 로고·lucide inline SVG)로 CLS 리스크 0. 폰트 self-host swap. 결과영역 고정높이. raw `<img>` 0.
- 데이터: 클라 직접 fetch 0(seedPlans 정적 소비). 추천/계산/필터 전부 클라 순수함수.

## QA 결과

- `npm run typecheck` → **0**
- `npm run lint` → **0** (`any` 0)
- `npm run test` → **128 passed (21 files)** — 신규 features 39(+기존 89)
- `npm run build` → **성공** (130 정적 페이지·전 라우트 전략 matrix 일치)
- grep: `any`/`as any` 0·`.split('T')` 0·raw `<img>` 0·클라 fetch 0·process.env(ui) 0·bg-white/magic-hex 0·FSD 역방향 0

## 다음 (4d perf-engineer)

- `shared/perf`(events·instrument·vitals) 배선은 이미 4a/4b 일부 존재(WebVitals 마운트 완료). 4d는 features/page에 AE 이벤트 주입(apply_filter·toggle_quickchip·recommend_run·saving_calc·view_* — `EVENTS.*` 상수·버킷화 saving_bucket).
- saving-calculator/recommend 클라 이벤트는 `@/shared/perf` 래퍼 경유로 배선(절대값 0·버킷만).
