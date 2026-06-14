---
project: ratsaver
phase: 4b
title: Data Layer — entities/plan · D1/Drizzle · KV 캐시 · 시드 (구현 요약)
status: completed
created: 2026-06-14
updated: 2026-06-14
owner: edge-data-integrator
---

# data-layer — ratsaver (Phase 4b)

> edge-data-integrator 산출. 데이터 단일 통로(env)·plan 도메인·D1 시드(120건)·KV read-through 캐시·API 핸들러 데이터 배선.
> 인증/세션/CSRF는 무인증·무쓰기로 N/A — `shared/auth`(스켈레톤)·`SESSION`/`BUCKET` 바인딩 미참조.

## 1. entities/plan (도메인 단일 출처)

- `src/entities/plan/types.ts` — `Plan` 20필드(id 포함). enum: `TNetwork`(SKT|KT|LGU)·`TTech`(LTE|5G)·`TContract`(none|12m|24m)·`TSignupType`(online|offline|both). 모든 필드 `readonly`(immutable).
  - 정직성 wedge 4필드: `regularPrice`·`promoMonths`·`throttleKbps`·`lastVerifiedAt`.
- `src/entities/plan/schema.ts` — Zod `planSchema` (`satisfies z.ZodType<Plan>`로 타입 표류 차단), `planListSchema`, `parsePlan`/`parsePlanList`. `lastVerifiedAt`는 `YYYY-MM-DD` regex.
- `src/entities/plan/format.ts` — **date-fns** 포맷터: `formatVerifiedDate`(`format(parseISO(x),'yyyy년 M월 d일')` — `.split('T')` 0), `formatHonestPrice`(프로모+정가 병기·정가 숨김 0), `formatKrw/Data/Throttle/Call/Sms`.
- `src/entities/plan/index.ts` — barrel.

## 2. shared/db (Drizzle/D1 + repository + 시드)

- `schema.ts` — Drizzle `plans` 테이블(21 컬럼). boolean→`integer{mode:'boolean'}`, dataGb→`real`(nullable=무제한), 검증일→`text`(ISO). users/notes 스켈레톤 테이블 제거.
- `client.ts` — `createDb(d1)`(주입형) + `getDb()`(서버: `getCloudflareContext().env`→`createEnvAccessor.get('DB')` 단일 통로). `import 'server-only'`.
- `mapper.ts` — `rowToPlan`(row→Plan, **Zod 경계 재검증**)·`planToInsert`.
- `criteria.ts` — `IPlanCriteria`·`applyCriteria`(in-memory 필터+정렬, immutable)·`parseCriteria`(searchParams→criteria, Zod 안전 폴백). 정렬: price_asc·data_desc·recommend(가성비).
- `repository.ts` — `createPlanRepository(db)`: `findAll`(단일 SELECT)·`findById`(단건 PK)·`filter`(findAll 1회 후 메모리 필터). **N+1 0**. `import 'server-only'`.
- `seed-data.ts` — 결정론적(mulberry32 시드 고정) `seedPlans` **120건**. `parsePlanList`로 검증된 값만 노출.
- `seed-sql.ts` — `buildSeedSql(plans)`(DELETE+단일 multi-row INSERT, SQL 이스케이프).
- `seed.sql` — 생성 산출물(`npm run db:seed:gen`). `wrangler d1 execute ratsaver-db --file=src/shared/db/seed.sql [--local|--remote]`로 적재.
- `index.ts` — barrel(server-only).

### 시드 분포(계약 충족)
| 항목 | 값 | 목표 |
|------|-----|------|
| 총 건수 | 120 | 50~150 ✅ |
| 망 분포 | SKT 40 / KT 40 / LGU 40 | 3망 균등 ✅ |
| 알뜰폰(mvno) | 99/120 = 82.5% | ~80% ✅ |
| 7개월 프로모 | 40/120 = 33% (regular>monthly) | 30~40% ✅ |
| 가격대 | 3,600~87,000원 | 저~중 집중 ✅ |
| 데이터 | 1.5/7/11/15/71/100/110GB + 완전무제한 7건 | 대표값 분포 ✅ |
| id 유일성 | 120/120 | 충돌 0 ✅ |

## 3. shared/cache (KV read-through — Hard Threshold ④)

- `keys.ts` — cache-topology SSOT 키 스킴: `planListKey()=plans:v1:all`·`planIdKey(id)=plans:v1:id:{id}`·`planKeyPrefix()`. `CACHE_TTL_SEC=3600`.
- `cached-json.ts` — 기존 `cachedJson` read-through(trackFetch로 hit/miss·latency 자동 계측). index.ts에서 분리(순환 import 방지).
- `plans.ts` — `getCachedPlans`/`getCachedPlanById`: 캐시 경유 적재 + 역직렬화 Zod 재검증(경계). loader=repository.
- `index.ts` — barrel(keys + plan helpers + cachedJson).
- **캐시 패턴**: cache-topology 권장대로 `plans:v1:all` 단일키로 전체 캐시 → 필터/정렬은 핸들러 메모리(`applyCriteria`). 키 폭발 0·히트율 극대화·D1 호출 사실상 3600s에 1회.

## 4. API 핸들러 데이터 배선 (4a 스텁 채움)

- `app/api/plans/route.ts` — `getCachedPlans(KV→repo.findAll)` → `applyCriteria(parseCriteria(searchParams))`. `{plans,total}`. `force-dynamic`·`runtime='edge'` 0.
- `app/api/plans/[id]/route.ts` — `getCachedPlanById(KV→repo.findById)`. 미존재 404. 단건 PK(N+1 0).
- `app/plans/[id]/page.tsx` — `generateStaticParams`를 `seedPlans`(빌드 타임 단일 소스) 전 id로 채움 → 전건 SSG(런타임 D1 0). 상세 셸에 정직성 가격·검증일 표시(UI 조립은 4c).

## 5. 마이그레이션

- `drizzle/0000_striped_mother_askani.sql` — `plans` 테이블(`npm run db:generate` 재생성). 적용은 cf-architect(`wrangler d1 migrations apply ratsaver-db`).
- 의존성: `date-fns@4.4.0` 추가(`--legacy-peer-deps` — 기존 better-auth↔drizzle-kit peer 충돌은 리포 정책).

## Hard Threshold 준수 (4b 범위)

- ② D1/KV 접근 100% `createEnvAccessor(env).get()` 통로. `process.env`/`env.<binding>` 직접 접근 0(스코프 내). DB 모듈 `server-only`. SESSION/BUCKET 미참조.
- ③ N/A(무인증·무쓰기). 토큰/PII 미저장·미노출.
- ④ N+1 0(목록 단일 SELECT·상세 단건 PK), 반복 업스트림 KV(`plans:v1:*`) 통과.
- ⑤ 전 D1 경로가 cachedJson→trackFetch 경유, `cache` 필드 hit/miss 반영.
- ① `any` 0, FSD 위반 0(QA grep 3종 통과), barrel 누락 0, date-fns(`.split('T')` 0).

## QA 결과

- `npm run typecheck` → **0**
- `npm run lint` → **0** (`any` 0)
- `npm run test` → **89 passed (16 files)** — 신규: plan format(10)·schema(8)·criteria(13)·seed-data(8)·seed-sql(3)·repository(4)·cache/plans(4) = 50 테스트
- grep: `: any`/`as any` 0 · `process.env`(스코프 내) 0 · `.split('T')` 코드 0 · FSD 위반 0

## 다음 (4c ui-developer)

- `entities/plan`(타입·Zod·포맷터)·`shared/db`(repository·criteria)·`shared/cache`(getCachedPlans) 소비.
- features 구현(plan-filter parse/apply는 `parseCriteria`/`applyCriteria` 재사용 가능)·widgets·page 조립.
- `/plans` 초기 전체목록은 ISR 페이지에서 `getCachedPlans` 또는 `seedPlans` 소스로 공급.
