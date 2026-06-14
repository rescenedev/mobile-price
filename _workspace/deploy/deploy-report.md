---
project: ratsaver
phase: 7
title: Deploy Report — Cloudflare Workers (OpenNext) 배포 및 BLOCKER 해결
status: DEPLOYED
owner: cf-architect
created: 2026-06-14
updated: 2026-06-14
deploy_url: https://ratsaver.zihado.workers.dev
version_id: da154a69-2ca9-486d-bd8e-819b8511af13
---

# Deploy Report — ratsaver (Phase 7)

## 종합 결과: ✅ DEPLOYED (BLOCKER 해결 + 프로덕션 헬스 전건 200)

- **배포 URL**: https://ratsaver.zihado.workers.dev
- **Version ID**: `da154a69-2ca9-486d-bd8e-819b8511af13`
- **Phase 5.5 BLOCKER**(`/plans/[id]` OpenNext SSG preview 전건 404) **해결 완료** — preview·production 모두 200.
- QA 게이트: typecheck=0 · lint=0 · test 146/146 pass.

---

## 1. BLOCKER 해결 — `/plans/[id]` SSG 서빙 404 (근본 원인 2개)

### 근본 원인 분석
OpenNext Cloudflare는 `generateStaticParams`+`dynamicParams=false` SSG 페이지(120건)와 ISR 페이지(`/plans`·`/compare`)의 프리렌더 산출물을 빌드 시 `.open-next/cache/`에 둔다. 런타임에 이를 서빙하려면 **incremental cache override**가 필요한데, 스켈레톤 `open-next.config.ts`는 `defineCloudflareConfig()` 기본값(override 없음)이었다. 추가로 `wrangler.toml`에 **`[assets]` 디렉티브가 누락**되어 `env.ASSETS` 바인딩 자체가 없었다.

| # | 결함 | 증상 |
|---|------|------|
| A | `open-next.config.ts`에 `incrementalCache` override 미설정 | 프리렌더 값이 `.open-next/cache`에만 존재, 런타임 서빙 불가 → `dynamicParams=false`가 `notFound()` → 전건 404 |
| B | `wrangler.toml`에 `[assets]` 블록·`global_fetch_strictly_public` 플래그 누락 | `env.ASSETS` 미바인딩 → 정적 에셋·incremental cache 서빙 경로 부재 |

### 적용한 수정 (공식 OpenNext 문서 기준 — https://opennext.js.org/cloudflare/caching)
ratsaver는 **무인증·읽기전용·런타임 쓰기 0** 앱이므로, OpenNext가 read-only 정적 사이트에 권장하는 **Static Assets Incremental Cache**를 채택했다 (R2/KV 캐시 백엔드 불요 → 추가 바인딩 0).

**`apps/ratsaver/open-next.config.ts`**
```ts
import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
});
```
- `staticAssetsIncrementalCache`: 빌드타임 프리렌더 값을 `env.ASSETS`의 `cdn-cgi/_next_cache/{buildId}/{key}.cache`에서 서빙(read-only).
- `enableCacheInterception: true`: 라우팅 이전에 캐시 조회를 가로채 SSG/ISR 페이지를 정적 에셋에서 직접 응답.

**`apps/ratsaver/wrangler.toml`** (추가)
```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"
```

### SSOT 갱신 (변경 근거 기록)
- `_workspace/arch/rendering-matrix.md` — 전제 6에 "SSG/ISR 서빙 = Static Assets Incremental Cache" 추가. read-only 캐시이므로 ISR `revalidate=3600` 런타임 `set()`은 no-op → 시드 갱신은 **재배포로만 반영**(cache-topology 무효화 전략과 일치).
- `_workspace/arch/cache-topology.md` — 계층 2(Next ISR) 백엔드를 Static Assets Incremental Cache로 명시.

### 검증 증거
- 빌드 로그: 이전 `Incremental cache does not need populating` → 수정 후 **`Populating Workers static assets... Successfully populated static assets cache`**.
- 배포 로그: SSG 캐시가 `/cdn-cgi/_next_cache/{buildId}/plans/*.cache`로 업로드됨(160 에셋).
- preview·production 모두 `/plans/<id>` 200, 정직성 가격(프로모가 9,900 + 7개월 후 정가 24,200) 렌더 확인.

---

## 2. Preview 검증 (로컬 OpenNext workerd + 로컬 D1 시드)

`npm run preview` (port 8788) · 로컬 D1 시드 120건 적재 후:

| route | 상태코드 | 비고 |
|-------|---------|------|
| `/plans/skt-lte-0` | **200** | SSG (BLOCKER 해소) |
| `/plans/kt-lte-1` | **200** | SSG · 정직성 가격(9,900→7개월 후 24,200) 렌더 확인 |
| `/plans/lgu-lte-2` | **200** | SSG |
| `/plans/kt-5g-7` | **200** | SSG |
| `/` | **200** | SSG |
| `/plans` | **200** | ISR |
| `/compare` | **200** | searchParams → dynamic |
| `/recommend` | **200** | SSG 셸 |
| `/calculator` | **200** | SSG 셸 |
| `/api/plans` | **200** | KV read-through |
| `/api/plans/skt-lte-0` | **200** | 단건 |
| `/plans/does-not-exist` | **404** | `dynamicParams=false` 정상 동작(시드 외 id 거부) |

---

## 3. 생성한 Cloudflare 리소스

| 리소스 | 타입 | 이름 | ID |
|--------|------|------|-----|
| DB | D1 | `ratsaver-db` | `596a0c3d-3334-434d-a0da-1488ede7b629` |
| CACHE | KV | `ratsaver-CACHE` | `6f2e76edc9bf4093a9a62ed24bd3c080` |
| SESSION | KV | `ratsaver-SESSION` | `cef34aaba3014371927b3b51a9f32a42` |
| BUCKET | R2 | `ratsaver-assets` | (deploy 시 자동 프로비저닝) |
| PERF | Analytics Engine | `ratsaver_perf` | (wrangler.toml 선언만으로 생성) |
| ASSETS | Static Assets | (OpenNext 내장) | (deploy 시 자동) |

> `wrangler.toml`의 `PLACEHOLDER_*` ID **전부 교체 완료**(잔존 0). `SESSION`·`BUCKET`은 무인증·에셋없음으로 코드 미참조이나 스켈레톤 일관성·타입 일치 위해 바인딩 유지.

### 재현용 리소스 생성 명령 (이미 실행 완료)
```bash
# 작업 디렉토리: apps/ratsaver
wrangler d1 create ratsaver-db                  # → database_id
wrangler kv namespace create ratsaver-CACHE     # → CACHE id
wrangler kv namespace create ratsaver-SESSION   # → SESSION id
# R2(ratsaver-assets)·AE(ratsaver_perf)는 deploy 시 wrangler.toml 선언으로 자동 생성
# 출력 ID로 wrangler.toml의 PLACEHOLDER_D1_ID / PLACEHOLDER_KV_CACHE_ID / PLACEHOLDER_KV_SESSION_ID 교체
```

---

## 4. 시드 적재 절차 (REMOTE D1 — 실행 완료)

```bash
# 1) 스키마(plans 테이블) 적용
wrangler d1 execute ratsaver-db --remote --file=drizzle/0000_striped_mother_askani.sql
# 2) 시드 데이터(120건) 적재
wrangler d1 execute ratsaver-db --remote --file=src/shared/db/seed.sql
# 3) 검증
wrangler d1 execute ratsaver-db --remote --command="SELECT COUNT(*) AS n FROM plans"   # → 120
```
- 검증 결과: **120건** 적재 확인, `skt-lte-0` 등 ASCII id 정상.

---

## 5. 배포 플로우 (실행 완료)

```bash
npm run cf-typegen     # wrangler.toml ID 교체 후 타입 재생성 → CloudflareEnv 보강(ASSETS 포함)
npm run typecheck      # 0 (배포 전 확인)
npm run deploy         # opennextjs-cloudflare build && deploy
```
- 결과: `Uploaded ratsaver (14.18 sec)` · `https://ratsaver.zihado.workers.dev` · Version `da154a69-2ca9-486d-bd8e-819b8511af13`.
- 6개 바인딩 전부 연결 확인(CACHE·SESSION·DB·BUCKET·PERF·ASSETS). R2 `ratsaver-assets` deploy 중 자동 프로비저닝.

---

## 6. 프로덕션 헬스 체크 (https://ratsaver.zihado.workers.dev)

| route | 상태코드 | 비고 |
|-------|---------|------|
| `/plans/skt-lte-0` · `/plans/kt-lte-1` · `/plans/lgu-lte-2` · `/plans/kt-5g-7` | **200** | SSG (BLOCKER 해소 — 프로덕션 확인) |
| `/` · `/plans` · `/compare` · `/recommend` · `/calculator` | **200** | 전 페이지 |
| `/api/plans` · `/api/plans/skt-lte-0` | **200** | remote D1 + KV read-through |
| `/api/vitals` (POST) | **204** | Web Vitals 수집기(AE append) |
| `/plans/does-not-exist` | **404** | `dynamicParams=false` 정상 |

- **콘텐츠 검증**: `/plans/kt-lte-1` 정직성 가격(프로모가 9,900 / 7개월 후 정가 24,200 / 7개월) 프로덕션 렌더 확인.
- **데이터 검증**: `/api/plans/skt-lte-0`이 remote D1 시드(`이야기모바일 110G` 등) 실데이터 직렬화 응답.

---

## 7. 보안·게이트 사전 차단 확인

- `PLACEHOLDER_*` 잔존: **0** (grep 확인).
- `NEXT_PUBLIC_*` 시크릿 노출: **0** (wrangler.toml·open-next.config.ts 무관).
- 시크릿 하드코딩: **0**. 리소스 ID는 시크릿 아님(공개 바인딩 식별자).
- `ASSETS`는 OpenNext 워커 내부(이미지·incremental cache)용 — 앱 데이터 경로 아님 → `@/shared/env` 단일 통로 규약 무영향(앱 코드는 ASSETS 미참조). Hard Threshold ② 유지.

---

## 8. 남은 수동 단계 / 권고

- **없음 (배포 완료)**. 추가 작업 불요.
- (선택) 커스텀 도메인 연결: `wrangler.toml`에 `routes`/`custom_domain` 추가 후 재배포.
- (운영) 시드 갱신 시: `seed.sql` 갱신 → `wrangler d1 execute ratsaver-db --remote --file=src/shared/db/seed.sql` 재적용 → `npm run deploy`(SSG/ISR 정적 캐시는 재배포로 갱신 — read-only 캐시 정책).
- (관측) 프로덕션 RUM: `/api/vitals` 비콘 → AE(`ratsaver_perf`)로 LCP/INP/CLS 실사용자 데이터 사후 확인 권장(Phase 5.5에서 INP는 dev 측정 불가로 이관).
