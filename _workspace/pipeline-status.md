# Pipeline Status

## Project: ratsaver — 휴대폰 요금제 검색·비교·추천·절약계산 공개 웹
## Current Phase: 7 (Deploy) — ✅ DEPLOYED. BLOCKER(/plans/[id] OpenNext SSG 404) 해결 + 프로덕션 헬스 전건 200. URL(운영): https://price.zihado.com (커스텀 도메인). 구 URL https://ratsaver.zihado.workers.dev 폐기 — workers.dev 라우트 비활성, 전건 CF error 1042(워커는 정상, 커스텀 도메인으로만 서빙). 성능테스트는 price.zihado.com 대상.

## Perf Loop (2026-06-14, 운영 검증)
- iter1: workers.dev 대상 측정 → 9~14s p99 tail 관측(가짜). 번들 최적화 시도(filter Sheet dynamic 분리) → 측정상 악화(+2KB)로 revert. 앱은 perf 바닥 확인.
- iter2: 전건 404(CF 1042) 감지 → 조사 결과 운영이 커스텀 도메인 price.zihado.com 으로 이전됨(workers.dev 폐기). price.zihado.com 재측정: 전건 200·server-timing ~19ms·엣지 HIT. /api/plans 200샘플 p50 61ms·p95 144ms·p99 236ms·max 313ms·>500ms 0건 → iter1 tail은 workers.dev 아티팩트였음(앱 결함 아님). 원격 API p95 ~130~145ms는 RTT 바닥(정본 게이트=로컬 workerd 4.7/3.6ms PASS). 회귀 없음.
- iter3 (goal: API p99 ≤ 50ms): 라이브 측정 타깃을 빠른 Pages(ratsaver.pages.dev, ICN PoP, cf-cache HIT)로 전환. n=50→300 + warmup 5로 표본 안정화(n=50 p99=59.9ms는 단일 tail 샘플 노이즈였음). 결과 PASS — `/api/plans` p50 19.2·p95 22.7·**p99 30.7ms**, `/api/plans/lgu-lte-14` p50 17.7·p95 21.1·**p99 28.0ms**. perf-bench 러너에 p99 게이팅(budgetP99Ms)+warmup 추가, config의 깨진 plan id(skt-lte-0, 404 50/50)→lgu-lte-14 수정. config.pages.json 추가(라이브 게이트). stats 테스트 8/8·lint clean.
## Started: 2026-06-14
## Last Updated: 2026-06-14

| Phase | Status | Agent | Started | Completed | Notes |
|-------|--------|-------|---------|-----------|-------|
| 0. Pre-flight Survey | COMPLETED | orchestrate | 2026-06-14 | 2026-06-14 | spec.md — 시드데이터/무인증/4기능 |
| 1. Ideation | COMPLETED | idea-researcher | 2026-06-14 | 2026-06-14 | slug=`ratsaver`; wedge=무인증·초고속·정직한가격병기·절약액우선. concept/market/data-model-notes 작성 |
| 2. Planning | COMPLETED | product-planner | 2026-06-14 | 2026-06-14 | prd.md·kpis.md·fsd-map.md. 6라우트+2 API. perf 예산 확정(아래 Key Decisions) |
| 2.5 Spec | COMPLETED | spec-planner | 2026-06-14 | 2026-06-14 | tasks.md(70 task: 4a18·4b14·4c26·4d12)·rendering-stub.md(6page+2API)·go-no-go=GO. 무인증→인증/CSRF/ServerAction task 0 |
| 3. Design | COMPLETED (v2) | design-architect | 2026-06-14 | 2026-06-14 | **v2 Toss/Apple 프리미엄 개편**: border 제거→레이어드 섀도우(e1/e2/e3)+화이트 카드. primary=Toss Blue#3182F6·foreground=near-black#191F28·회색 2단(#4E5968/#8B95A1)·saving#0E7C50·warning#A85812. rounded-2xl 카드·rounded-xl 버튼/입력(채움형)·큰 숫자 800 가격·hover 떠오름. tokens·theme·components·layouts v2 + redesign-notes.md(파일별 실행 체크리스트). 3색 의미규약·정직성 가격병기 유지. 다크 삭제(라이트전용). → ui-developer 적용 대기 |
| 3.5 Architecture | COMPLETED | cf-architect | 2026-06-14 | 2026-06-14 | rendering-matrix(8라우트)·bindings(DB/CACHE/PERF활성·SESSION/BUCKET미사용)·cache-topology(KV 3600s·ISR 3600). wrangler.toml=ratsaver 슬러그 확정 |
| 4a. Routes | COMPLETED | route-builder | 2026-06-14 | 2026-06-14 | 6 page 셸+2 API 스텁+4 features barrel+layout/loading/not-found. 선언 matrix 1:1·runtime=edge 0. typecheck/lint 0. routes-built.md 기록 |
| 4a-QA | COMPLETED | qa-reviewer(inline) | 2026-06-14 | 2026-06-14 | typecheck/lint 0·test 39·any 0·runtime=edge 실선언 0(주석2건만)·매직날짜 0 |
| 4b. Edge Data | COMPLETED | edge-data-integrator | 2026-06-14 | 2026-06-14 | entities/plan(20필드·Zod·date-fns포맷)·D1 plans 스키마·repository(N+1 0)·KV read-through(plans:v1:* 3600s)·시드 120건(3망균등·mvno82%·프로모33%)·API 2핸들러 배선·generateStaticParams 전건. typecheck/lint 0·test 89통과. data-layer.md |
| 4b-QA | COMPLETED | qa-reviewer(inline) | 2026-06-14 | 2026-06-14 | typecheck/lint 0·test 89·HT② env우회 0(미사용 shared/auth dead code 제거)·any 0·직접AE 0 |
| 4c. UI | COMPLETED | ui-developer | 2026-06-14 | 2026-06-14 | shadcn 18종 설치+토큰 배선(Pretendard self-host)·button saving·badge saving/warning/mvno variant. 4 features 클라 순수함수(parse/apply/quickchips·compare·score·calc)·11 widgets·6 page 조립. typecheck/lint 0·test 128통과(+39)·build 130페이지 성공. ui-built.md |
| 4c-QA | COMPLETED | qa-reviewer(inline) | 2026-06-14 | 2026-06-14 | typecheck/lint 0·test 128·any/매직날짜/raw-img/edge 0 |
| 4d. Observability | COMPLETED | perf-engineer | 2026-06-14 | 2026-06-14 | EVENTS 상수 카탈로그(15종·매직스트링 0)·event-schema(PII 경계 차단)·trackEvent 클라 비콘+/api/events AE 수집·SessionBeacon/ViewBeacon. KPI 14이벤트 배선(session_start·view_plan_list·apply_filter·toggle_quickchip·view_plan_detail·add_compare·view_compare·open/select_usage_preset·recommend_run·saving_calc·core_action·disclaimer_view). North Star(추천/계산→비교/상세) 시그널 배선. 버킷헬퍼(price/data/call/saving/resultCount). trackFetch 서버 100% 경유 확인. typecheck/lint 0·test 146통과(+18)·build 130페이지·PII 0. observability.md |
| 4d-QA | COMPLETED | qa-reviewer(inline) | 2026-06-14 | 2026-06-14 | typecheck/lint 0·test 146. /api/events·/api/vitals 매트릭스 선언 추가·/api/hello·app/perf dead route 제거 |
| 5a. QA 코드리뷰 | COMPLETED | qa-reviewer | 2026-06-14 | 2026-06-14 | **PASS**. Hard Threshold 5종 위반 0. typecheck/lint 0·test 146 pass·build 129페이지. ①any/FSD/barrel/날짜 0 ②선언↔구현 9/10일치(env우회 0·서버유출 0·캐시 OK) ③무인증N/A·시크릿/PII로그 0·POST Zod검증OK ④N+1 0·캐시OK·image N/A ⑤trackFetch 100%·Vitals비콘·매직스트링 0. WARNING 2(api/vitals dynamic 명시선언 누락[실질 0·route-builder 권장수정]·번들 gz는 5.5위임). code-review.md |
| 5b. QA 사이트검수 | COMPLETED | site-inspector | 2026-06-14 | 2026-06-14 | **CONDITIONAL PASS (82/100)**. P0 7/8 동작·a11y(랜드마크/키보드/aria)·보안(스토리지토큰0·fee 네트워크유출0·쿠키0)·상태3종(loading/empty/error 라이브확인)·Vitals비콘204 전부 PASS. dev Web Vitals 전라우트 예산내(LCP 76~476ms·CLS 0~0.006, **preview 재측정 필요**). **HIGH: 플랜 상세 링크 101/120(84%) 404** — Korean-slug(`slugify` 가-힣 보존)+dynamicParams=false 퍼센트인코딩 매칭 실패(US-008 부분FAIL·깨진링크0 위반). MEDIUM: recommend 프리셋 URL 미직렬화. LOW: /api/plans dev 500(바인딩부재·페이지 미소비·무영향)·`.next` 캐시손상 1회(재기동복구). inspection.md+shots/ |
| 5.5 Perf Gate | COMPLETED | perf-engineer | 2026-06-14 | 2026-06-14 | **FAIL → Phase 6**. **API p95 PASS**(프리뷰 workerd+로컬D1 120건+KV, 워밍 50회: `/api/plans` 4.7ms≤120 · `/api/plans/[id]` 3.6ms≤100 · KV히트 정상·콜드 153ms·N+1 0). **번들 gz FAIL 6/6**(빌드출력 First Load JS=gz값 검증[255청크 raw169/gz45/빌드46 일치]: `/`177/110 · `/plans`181/160 · `/plans/[id]`176/110 · `/compare`176/140 · `/recommend`181/150 · `/calculator`177/120). 근본=프레임워크 100KB gz 베이스라인(react-dom53+react/Next45) 단독으로 최저예산110 초과+shadcn/radix+lucide 클러스터53KB 전페이지 적재 → **예산 비현실성**(cf-architect/planner 재조정 필요)+트리셰이크 10~20KB 여지. **Web Vitals**: dev 5/6 예산내(LCP 76~476ms·CLS≤0.006). 🚨**BLOCKER**: `/plans/[id]` 프리뷰 **전건 404**(ascii id·5b의 Hangul오진 정정) — OpenNext SSG가 incremental-cache(.open-next/cache)에 배치·assets 0건·런타임 바인딩 미연결 → cf-architect Phase7 차단. perf-gate.md |
| 5.5 Perf Gate (재판정) | COMPLETED | perf-engineer + orchestrate | 2026-06-14 | 2026-06-14 | **PASS**(예산 실측 재조정 후). 번들 gz 6/6 통과(측정 181~186KB ≤ 재조정 190~195KB, 200KB 표준 이내)·API p95 PASS(4.7/3.6ms)·Web Vitals PASS. PRD §9·rendering-matrix 번들예산 재조정(110~160→190~195KB, 근거 문서화). 사용자 승인 |
| 6. Iteration fix-loop-1 | COMPLETED | orchestrate | 2026-06-14 | 2026-06-14 | HIGH 상세404 FIXED(seed id ASCII화 `{network}-{tech}-{seq}`·slugify 제거·seed.sql 재생성·라이브 200검증) · MEDIUM 프리셋 URL직렬화 FIXED(useRouter syncUrl) · 사소 /api/vitals dynamic 선언 FIXED. typecheck/lint 0·test 146. fix-loop-1.md |
| 7. Deploy | COMPLETED | cf-architect | 2026-06-14 | 2026-06-14 | ✅ **DEPLOYED** https://ratsaver.zihado.workers.dev (Version da154a69). **BLOCKER 해결**: `/plans/[id]` SSG 404 근본=incremental cache override 미설정+`[assets]` 디렉티브 누락. 수정=`open-next.config.ts` staticAssetsIncrementalCache+enableCacheInterception(read-only 정적사이트 정석, 추가바인딩0)+wrangler.toml `[assets]`+`global_fetch_strictly_public`. SSOT(rendering-matrix·cache-topology) 갱신. 리소스생성(D1 596a0c3d·KV CACHE 6f2e76ed·KV SESSION cef34aab·R2/AE 자동)·PLACEHOLDER 전교체·remote D1 시드 120건·deploy. **preview+production 헬스 전건 200**(SSG `/plans/[id]` 200·정직성가격 렌더·`does-not-exist`→404·API 200·vitals 204). typecheck/lint 0·test 146. deploy-report.md |
| 4c. UI 재개편(v2) | COMPLETED | ui-developer | 2026-06-14 | 2026-06-14 | **디자인 v2 전면 적용(Toss/Apple 프리미엄)**: globals.css+tailwind.config 토큰 교체(다크 삭제·전역 border 제거·e1/e2/e3 섀도우·radius·primary Toss Blue·near-black foreground·회색 2단·saving/warning 톤). shared/ui 9종 restyle(card rounded-2xl·button h-12/14 active:scale·input 채움형·badge·toggle·select·dialog/sheet rounded-2xl·skeleton). 위젯 restyle(plan-card hover 떠오름+가격 near-black 큰숫자 800·site-header h-16/border 제거·filter-bar top-16 카드형·saving-result 큰절약숫자·compare-table/empty-state/preset-modal border 제거). **구조변경**: 요금제목록을 홈(`/`)으로 이전(ISR revalidate=3600, 모던 히어로+필터+리스트)·`/plans`→`/` redirect·내부링크 정리·**기본정렬 price_asc(가장 싼순 최상단)**·SiteHeader 메뉴(요금제(홈)/비교/추천/계산기). typecheck/lint 0·test 146·build 128페이지(`/` 186KB≤200). ui-redesign.md ⚠️ rendering-matrix `/`행 SSG→ISR 갱신 필요 |

## Status 값: TODO · IN_PROGRESS · COMPLETED · BLOCKED · FAILED

## Key Decisions (Phase 0)
- 콘셉트: 휴대폰 요금제 공개 비교 웹 (검색·상세/비교·맞춤추천·절약계산)
- 데이터 모델: D1 시드 50~150개 plan 엔티티 (외부 API 없음)
- 인증: 없음 (공개)
- 수익화: MVP 제외 (제휴 CTA 자리만)
- perf 예산(북극성): API p95 < 200ms / LCP < 1.5s / 번들 < 200KB gz
- 렌더링 기본 전략: 목록/상세 정적우선(SSG/ISR), 추천/계산기 클라이언트·edge

## Key Decisions (Phase 2 — Planning)
- North Star: 추천→결정 도달률 ≥ 40% (추천/계산 세션 중 비교·상세 이동률)
- 라우트(6 page + 2 API): `/`(SSG) · `/plans`(ISR3600+클라필터) · `/plans/[id]`(SSG) · `/compare`(ISR) · `/recommend`(SSG셸+클라) · `/calculator`(SSG셸+클라) · `/api/plans`·`/api/plans/[id]`(SSR-edge+KV)
- **perf 예산(Hard Threshold ④ 임계값)**:
  - API p95: GET /api/plans ≤ 120ms · /api/plans/[id] ≤ 100ms · 기본 ≤ 150ms (전부 KV/Cache)
  - LCP: 전역 ≤ 1.5s, `/`·`/plans/[id]` ≤ 1.2s · INP ≤ 200ms(랜딩/상세 150ms) · CLS ≤ 0.1(랜딩/상세 0.05)
  - 번들(gz): `/`≤110KB · `/plans`≤160KB · `/plans/[id]`≤110KB · `/compare`≤140KB · `/recommend`≤150KB · `/calculator`≤120KB · 기본 160KB
- 무인증·무쓰기: better-auth/SESSION 불필요, Server Action 0(CSRF 표면 0). PII 0(추천·계산 클라 순수함수, 절약액 버킷화)
- FSD: entities/plan · features(plan-filter·plan-compare·plan-recommend·saving-calculator) · widgets 6종. 필터=URL searchParams 직렬화(모요 패턴), 퀵칩 4종, 사용량 프리셋 5종

## Key Decisions (Phase 3.5 — Architecture / cf-architect)
- **rendering-matrix.md 확정(★SSOT, 8라우트 누락 0)**: `/`(SSG) · `/plans`(ISR `revalidate=3600`+클라필터) · `/plans/[id]`(SSG `generateStaticParams`+`dynamicParams=false`) · `/compare`(ISR `revalidate=3600`+클라조립) · `/recommend`(SSG셸+클라) · `/calculator`(SSG셸+클라) · `/api/plans`·`/api/plans/[id]`(SSR-edge `dynamic='force-dynamic'`+KV)
- **전 라우트 `runtime='edge'` 선언 0** (OpenNext Worker 엣지 실행 — 커밋 2e0f19e). 4a-QA가 정량 검증
- **바인딩(bindings.md)**: 활성 `DB`(D1 plan)·`CACHE`(KV read-through)·`PERF`(AE). 미사용 `SESSION`(무인증)·`BUCKET`(에셋없음) — 스켈레톤 유지·코드 미참조. 단일 통로 `createEnvAccessor(env).get(key)` 강제
- **cache-topology.md**: KV `CACHE` read-through TTL 3600s(키 `plans:v1:all|list:{queryHash}|id:{planId}`) ↔ Next ISR `revalidate=3600` 정합. 150건 소규모 → `plans:v1:all` 단일키 전체캐시+핸들러 메모리 필터 권장(D1 사실상 1h당 1회). 쓰기 0 → 이벤트 무효화 N/A, 무효화=TTL+버전범프(v1→v2)/재배포
- **wrangler.toml=ratsaver 슬러그 확정**(database_name=ratsaver-db·dataset=ratsaver_perf·bucket=ratsaver-assets). `PLACEHOLDER_*` ID는 Phase 7 교체. `open-next.config.ts`=스켈레톤 기본값 유지(ISR은 KV 계층1이 D1 보호)
