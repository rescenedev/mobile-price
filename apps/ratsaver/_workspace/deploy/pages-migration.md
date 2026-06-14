# ratsaver: OpenNext(Workers) → Cloudflare Pages(next-on-pages) 마이그레이션

**완료일**: 2026-06-14
**목표**: 무료로 종단 <50ms (Pages 대역이 이 네트워크에서 ICN 서울 PoP로 라우팅)
**결과**: ✅ 달성 — 종단 p50 홈 27ms · 상세 30ms · API 17ms, colo=ICN

## WHY (측정 확정)

- 이 네트워크에서 Cloudflare **Pages 대역(172.66.x)은 ICN(서울) PoP, RTT 8-10ms**.
- Workers 대역(172.67/104.21)은 NRT(도쿄 38ms)/HKG(52ms).
- Pages로 이전 → 종단 ~20-30ms로 50ms 목표 압도. 유료 Argo 불필요.

## 무엇을 바꿨나

### 1. 의존성
- 추가(devDep): `@cloudflare/next-on-pages@1.13.16`, `vercel@54.13.0`.
- `@opennextjs/cloudflare`는 코드에서 더 이상 import하지 않음(패키지는 남겨둠 — 롤백 안전망).

### 2. 런타임 컨텍스트 교체 (단일 shim)
- 신규 `src/shared/env/context.ts` → `getServerContext()`가 next-on-pages `getRequestContext()`를 래핑.
  - 반환 shape `{ env, ctx }`가 OpenNext `getCloudflareContext()`와 동일 → 흡수.
  - `env`가 `CloudflareEnv`로 타입되어 기존 `as CloudflareEnv` 캐스트 전부 제거.
- 교체된 호출처: `src/shared/db/client.ts`, `app/api/plans/route.ts`, `app/api/plans/[id]/route.ts`, `app/api/vitals/route.ts`, `app/api/events/route.ts`.
- `src/shared/cache/edge.ts`는 `globalThis.caches.default` + `ctx.waitUntil`만 쓰므로 변경 불필요(Pages에서 그대로 동작).

### 3. edge runtime (OpenNext '금지' → Pages '필수'로 반전)
- 모든 Route Handler(`/api/plans`·`/api/plans/[id]`·`/api/vitals`·`/api/events`)에 `export const runtime = 'edge'` 추가.
- 동적 페이지 `/compare`(searchParams `?ids=` 읽음)에 `export const runtime = 'edge'` 추가.

### 4. ISR → 순수 SSG
- next-on-pages는 on-demand revalidate 미지원. 데이터가 번들 시드(정적)라 revalidate 불필요.
- `app/page.tsx`·`app/compare/page.tsx`에서 `export const revalidate = 3600` 제거.
- `/plans/[id]`는 기존 SSG(`generateStaticParams` + `dynamicParams = false`) 유지 → 빌드 결과 253건 전건 프리렌더.

### 5. 설정 파일
- `next.config.ts`: `initOpenNextCloudflareForDev()` 제거 → `setupDevPlatform()`(`@cloudflare/next-on-pages/next-dev`, dev 전용 동적 import)로 교체.
- `wrangler.toml`: Workers 형식 → **Pages 형식**. `main`/`[assets]`/`routes` 제거, `pages_build_output_dir = ".vercel/output/static"` 추가. 바인딩 DB/CACHE/PERF만 유지(SESSION/BUCKET 제외 — 코드 미참조).
- `open-next.config.ts`: 삭제(Pages 불요).
- `env.d.ts`: 코멘트만 Pages 기준으로 갱신(타입은 superset 유지).
- `eslint.config.mjs`: `.vercel/**` ignore 추가(빌드 산출물 린트 방지).
- `.gitignore`(repo root): `.vercel/` 추가.
- `package.json` scripts: `pages:build`(`next-on-pages`), `pages:deploy`(`wrangler pages deploy`), `preview`(`wrangler pages dev`), `deploy`=build+deploy.

### 6. 바인딩 (기존 리소스 재사용)
- D1 `DB` = `596a0c3d-3334-434d-a0da-1488ede7b629` (`ratsaver-db`, remote 시드 완료).
- KV `CACHE` = `6f2e76edc9bf4093a9a62ed24bd3c080`.
- AE `PERF` = `ratsaver_perf`.
- `wrangler pages deploy`가 `wrangler.toml`의 바인딩을 deploy마다 자동 attach. 실측: `/api/plans`가 D1+KV에서 실데이터 반환 확인.

## 빌드/배포 절차

```bash
export PATH="$HOME/.bun/bin:$PATH"
export CLOUDFLARE_API_TOKEN=...   # env만, 커밋 0
export CLOUDFLARE_ACCOUNT_ID=6d1f0d35fc1163abed871545006a582a
bun run pages:build               # sync-static-data + @cloudflare/next-on-pages
wrangler pages project create ratsaver --production-branch=main   # 최초 1회
bun run pages:deploy              # wrangler pages deploy .vercel/output/static
```

## 빌드 산출

- **Edge Function Routes (5)**: `/api/events` · `/api/plans` · `/api/plans/[id]` · `/api/vitals` · `/compare`.
- **Prerendered Routes (516)**: `/` · `/calculator` · `/plans`(리다이렉트) · `/plans/[id]` 253건 전부 + RSC.
- 비치명적 경고 `Invalid prerender config for /plans/[id]` — next-on-pages가 출력하지만 전건 프리렌더는 정상 수행됨(516개에 모든 plan 페이지 포함).

## 검증 결과

**URL**: https://ratsaver.pages.dev (production, deployment `d1423878`)
**colo**: **ICN** (loc=KR) ✅

### 라우트 상태
| route | status | 비고 |
|-------|--------|------|
| `/` | 200 | SSG, 요금제 카드 46개 가격 span + 최저가 마커 렌더 |
| `/plans` | 200 | meta-refresh로 `/` 리다이렉트 |
| `/plans/kt-5g-23` | 200 | SSG 상세, 통신사 외부링크 유지 |
| `/plans/does-not-exist` | 404 | dynamicParams=false 작동 |
| `/recommend` | 200 | SSG 셸 |
| `/calculator` | 200 | SSG 셸 |
| `/compare?ids=a,b` | 200 | edge SSR, 비교표 렌더 |
| `/compare` (빈) | 200 | 빈 상태 렌더 |
| `/api/plans` | 200 | D1+KV 실데이터, `x-edge-cache: HIT`, `server-timing: app;dur=3` |
| `/api/plans/kt-5g-23` | 200 | 단건 실데이터 |
| `/api/plans/nope` | 404 | 미존재 id |
| `/data/plans.json` | 200 | 106KB 정적 에셋 |

### 종단 p50 (wrk, t1/c1, 웜 캐시 — 진짜 종단)
| route | p50 | p90 | p99 |
|-------|-----|-----|-----|
| `/` | **27.6ms** | 31.8ms | 44.7ms |
| `/plans/[id]` | **29.6ms** | 33.9ms | 45.7ms |
| `/api/plans` | **17.1ms** | 19.2ms | 43.5ms |
| `/data/plans.json` | 22.1ms | 30.3ms | 131ms |

→ 전 라우트 p50 <50ms (목표 ~20-25ms 달성). 압축 페이로드: 홈 9.6KB · 상세 7.8KB · API 2.3KB.

### 게이트
- `bun run typecheck`: **0 errors** ✅
- `bun run lint`: **0 errors** ✅ (`.vercel/**` ignore 추가 후)
- `bun run test`: **153 passed / 26 files** ✅

## 막힌 기능 / 주의

- **`@cloudflare/next-on-pages` deprecated**: Cloudflare 공식 문서는 이 어댑터를 deprecated(미유지)로 표기하고 Workers(OpenNext) 또는 Vercel을 권장한다. 그러나 이 네트워크에서의 ICN 라우팅 이점이 실측 확정되어 의도적으로 Pages를 채택. Next 15.5 + App Router에서 빌드·배포·전 라우트 동작 확인됨. 향후 Next 메이저 업그레이드 시 호환성 리스크 존재 — 그때는 OpenNext 롤백(price.zihado.com Worker 유지 중) 또는 재평가.
- **ISR 불가**: 시드 갱신은 재배포로 반영(`sync-static-data` → `pages:build` → `pages:deploy`). 런타임 revalidate 필요 기능은 추가 불가.
- **기존 Worker 배포(price.zihado.com)**: 롤백 안전망으로 유지(파괴 작업 0).
