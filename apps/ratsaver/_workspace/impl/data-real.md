# 데이터 레이어 — moyo 실데이터 교체 (Phase 4b 후속)

사용자 피드백("요금제 전부 합성이냐, 2,750원짜리 실제 요금제가 왜 없냐") 대응.
합성 랜덤 생성기를 전부 제거하고 moyo(moyoplan.com)에서 스크랩·정제한 **253개 실제 요금제**로 시드를 교체했다.

## 데이터 소스
- `src/shared/db/moyo-plans.json` — 253건, 이미 Plan 스키마 형태로 정제됨(전 필드 채워짐).
- 데이터 값은 위변조 없이 JSON 그대로 보존. 경계 검증(Zod planSchema)만 수행.

## 실데이터 분포 (2026-06-01 기준)
- **개수**: 253건
- **최저가**: 10원(이지모바일 "이지 쓰는만큼 4.5G+1") / 첫 항목 2,750원(이지 오래쓰는 무제한 4.5GB+1) / 최고가 76,000원
- **망**: KT 124 · LGU 94 · SKT 35 (SKT 13.8% — 균등 아님, 현실 분포)
- **MVNO**: 220/253 = 87.0%
- **프로모**: 190/253 = 75.1%, promoMonths 다양(4/6/7/10/12/18/24). 전부 정가>현재가(정직성 wedge).
- **통신사**: 19개 실제 통신사(이지모바일·쉐이크모바일·핀다이렉트·KG모바일·이야기모바일·고고모바일·너겟·요고·다이렉트 등)

## 변경 파일
- `src/shared/db/seed-data.ts` — 합성 생성기(mulberry32/buildPlan/CARRIERS/TIERS 등) 전부 삭제. `moyo-plans.json`을 `import ... with { type: 'json' }`로 읽어 `parsePlanList`(Zod)로 전수 검증 후 `seedPlans: readonly Plan[]` 노출. 부적합 시 import/빌드 타임 throw.
- `src/shared/db/criteria.ts` — `DEFAULT_SORT='price_asc'` 추가. `applyCriteria`가 sort 미지정 시 기본 price_asc 적용(최저가 최상단). barrel(`@/shared/db`)에 `DEFAULT_SORT` export.
- `src/features/plan-filter/parse.ts` — `parseFilters`/`serializeFilters` 기본 sort를 `recommend`→`price_asc`로. 기본값 URL 키 생략 로직도 price_asc 기준으로 정렬.
- `src/shared/db/seed.sql` — `npm run db:seed:gen`으로 253개 실데이터 SQL 재생성(멱등 DELETE+단일 multi-row INSERT). 로컬/원격 D1 재적재는 배포 단계.

## 기본 정렬 = 최저가 우선
- SSOT: `criteria.ts applyCriteria` — sort 미지정 → `price_asc`. API 경로(`/api/plans` → `parseCriteria`+`applyCriteria`)와 repository.filter, 위젯 in-memory(`apply.ts`→`applyCriteria`) 전부 동일 기본 적용.
- `parseCriteria`는 기존대로 미지정 sort를 `undefined`로 반환(URL 청결 유지) — 실제 정렬 기본값은 `applyCriteria`가 단일 지점에서 주입.
- `parseFilters`(UI 필터 상태) 기본 sort = `price_asc`. UI 컴포넌트 기본 sort 상태는 ui-developer가 price_asc로 일치시킴.

## 테스트 보정 (정직한 contract)
합성 가정(3망 균등≥25%·promoMonths===7 고정·50~150개)을 실데이터에 맞게 재작성:
- `seed-data.test.ts`: 개수 100~300 / 3망 모두 존재 + SKT≥5%(균등 가정 제거) / MVNO 0.7~0.95 / 프로모 플랜 존재 + 전부 정가>현재가 / promoMonths 종류 ≥2(7 고정 검사 제거) / no-promo는 정가==현재가 / lastVerifiedAt 일관 / 최저가<8000. 진짜 불변식(스키마 유효성·id 유일성·정직성 wedge)은 엄격 유지.
- `parse.test.ts`: 기본/폴백/직렬화-생략 sort를 price_asc로.
- `criteria.test.ts`: `filters by network`를 기본 price_asc 정렬 결과(`['d','b']`)로.

## 보존된 패턴 (변경 없음)
- repository N+1 0(단일 findAll, 단건 PK), `@/shared/env` 단일 통로(`getDb`), `server-only`.
- KV read-through 캐시(`plans:v1:all` 3600s, `plans:v1:id:{id}`) + `cachedJson` 내부 `trackFetch` hit/miss·latency 계측.
- id ASCII 유일(`{network}-{tech}-{idx}`) → `/plans/[id]` generateStaticParams SSG 자동 반영(253 경로).

## 게이트 결과
- `npm run typecheck` — 0 오류
- `npm run lint` — 0 에러
- `npm run test` — 147/147 통과(25 파일)
- `npm run build` — 성공. `/plans/[id]` SSG 253 경로. 최대 First Load JS 186 kB(<200 KB 예산). `any` 0.
