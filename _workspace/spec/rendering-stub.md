# 렌더링 전략 stub — ratsaver (cf-architect 확정 대상)

> Phase 2.5 (spec-planner) 산출물. PRD §4 라우트 IA + fsd-map app/ 표를 **구체적 Next 구현**으로 변환한 초안.
> cf-architect(Phase 3.5)가 이 stub을 검증·보강해 `_workspace/arch/rendering-matrix.md`(단일 출처)로 **승격**한다.
> 모든 구현 에이전트(4a~4d)는 승격된 rendering-matrix.md를 따른다. 본 stub은 그 입력일 뿐.

---

## 전제 (OpenNext / Cloudflare Workers)
- **라우트별 `export const runtime = 'edge'` 명시 금지.** OpenNext(`@opennextjs/cloudflare`) 환경에서 Worker 자체가 엣지 실행되므로, 라우트 단위 edge runtime 선언은 불필요하며 빌드 호환 이슈를 유발한다. (커밋 `2e0f19e` 정책 준수)
- "SSR(edge)"는 **Worker 엣지 런타임에서의 동적 SSR**을 의미하며, Next 구현상으로는 `runtime` 선언 없이 `dynamic`/`revalidate=0` 또는 동적 데이터 접근으로 표현한다.
- D1/KV 접근은 전부 `@/shared/env` 경유, 데이터 호출은 `@/shared/perf.trackFetch()` 래핑 (Hard Threshold ②④⑤).

---

## 라우트 렌더링 stub

| 라우트 | 전략 | Next 구현 | 캐시 계층 | 인증 |
|--------|------|-----------|-----------|------|
| `/` | SSG | 기본(동적 API·searchParams 미사용). 계산기는 클라 컴포넌트로 hydrate | - | - |
| `/plans` | ISR + 클라 필터 | `export const revalidate = 3600`. 초기 전체목록 서버 페치(빌드/ISR), 필터·정렬·퀵칩은 클라에서 searchParams 기반 적용 | KV/Cache(목록, TTL 3600s) | - |
| `/plans/[id]` | SSG | `export const generateStaticParams`로 전 plan 프리렌더. `export const dynamicParams = false` (시드 외 id는 404) | - (빌드 시 정적) | - |
| `/compare` | ISR + 클라 조립 | `export const revalidate = 3600`. `?ids=a,b,c` searchParams로 대상 선택, 매트릭스는 클라 조립 | KV/Cache(목록 재사용) | - |
| `/recommend` | SSG 셸 + 클라 스코어링 | 정적 셸 + 클라 컴포넌트. 사용량 프리셋/입력→`scorePlan` 순수함수 클라 실행 (서버 호출 0, PII 0) | - | - |
| `/calculator` | SSG 셸 + 클라 계산 | 정적 셸 + 클라 컴포넌트. 현재요금 입력→`calcSaving` 순수함수 클라 실행 (서버 미저장) | - | - |
| `/api/plans` (GET) | SSR(edge) + 캐시 | Route Handler. `export const dynamic = 'force-dynamic'` (쿼리 의존). `@/shared/cache`(KV, TTL 3600s) 경유 후 `@/shared/db` 조회, 전부 `trackFetch` 래핑 | KV/Cache(TTL 3600s) | - |
| `/api/plans/[id]` (GET) | SSR(edge) + 캐시 | Route Handler. 단건 PK 조회. `@/shared/cache`(KV, TTL 3600s)→`@/shared/db`. `trackFetch` 래핑 | KV/Cache(TTL 3600s) | - |

---

## 라우트별 캐시·데이터 계약 메모

- **`/plans` ISR vs `/api/plans`**: `/plans` 페이지는 ISR로 초기 전체목록을 정적 제공(150건 클라 필터 가능). `/api/plans`는 클라 필터가 서버 데이터를 1회 요청할 때(또는 SSR 폴백)의 캐시된 JSON 공급용. 둘 다 동일 D1 소스 → 반드시 `@/shared/cache`(KV) 통과해 D1 반복호출 0 (Hard Threshold ④).
- **`/plans/[id]` 정적 vs `/api/plans/[id]`**: 페이지는 SSG 프리렌더(런타임 D1 접근 0). API는 외부/클라 단건 조회용 캐시 JSON. N+1 0 — 단건 PK 조회만.
- **추천·계산기·비교 조립**: 모두 클라이언트 순수함수(`features/plan-recommend`·`saving-calculator`·`plan-compare`). 서버 왕복 0, PII 0, API 불요.
- **쓰기 경로 0**: Server Action·POST/PUT/DELETE 핸들러 없음 → CSRF 표면 0 (Hard Threshold ③ 해당 항목 N/A).

---

## 쿼리 파라미터 계약 (모요 패턴 차용, searchParams 직렬화)

| 라우트 | searchParams | 책임 모듈 |
|--------|--------------|----------|
| `/plans` | `network` · `data_min` · `data_max` · `price_max` · `mvno` · `unlimited` · `contract` · `sort`(price\|data\|recommend) + 퀵칩 토글 | `features/plan-filter` (`parseFilters`/`serializeFilters`) |
| `/compare` | `ids=a,b,c` (최대 3) | `features/plan-compare` (`parseCompareIds`) |
| `/api/plans` | `?network=&data_min=&data_max=&price_max=&mvno=&unlimited=&contract=&sort=` | Route Handler → `@/shared/db` filter |

> 모든 searchParams는 공유가능 URL 보장 (US-002). 필터 상태 직렬화는 `features/plan-filter` 단일 출처.
