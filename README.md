# mobile-price

Next.js + Cloudflare **AI Agent Harness** — 아이디어부터 배포까지 풀스택 Next.js(App Router, on Cloudflare Workers) 앱을 양산하는 7-Phase 파이프라인. Feature-Sliced Design(FSD)과 정량 Hard Threshold 게이트로 "실패할 수 없게" 설계되었다.

대표 산출물: [`apps/ratsaver`](apps/ratsaver) — 한국 모바일 요금제 비교·추천 웹앱.

**라이브** — https://ratsaver.pages.dev (Cloudflare Pages, ICN PoP, TTFB ~50ms)
> 같은 앱의 OpenNext Worker 배포 https://price.zihado.com 는 롤백 안전망으로 유지(상대적으로 느림).

## 리포 구성

| 경로 | 설명 |
|------|------|
| `.claude/agents/` | 전문 에이전트 11명 (route-builder · edge-data-integrator · cf-architect · perf-engineer · qa-reviewer 등) |
| `.claude/skills/` | `orchestrate` 7-Phase 파이프라인 + 단계별 스킬 |
| `templates/app-skeleton/` | 생성앱 스타터 (Next 15 + OpenNext + D1/KV/R2 + perf 계측) |
| `_workspace/` | 에이전트 간 블랙보드 (idea · plan · spec · design · arch · impl · qa · deploy) |
| `apps/ratsaver/` | 파이프라인으로 생성된 플래그십 앱 |

## Tech Stack (생성앱 기본값)

- **Framework**: Next.js 15 (App Router, React 19)
- **Runtime/Deploy**: Cloudflare Workers/Pages via `@opennextjs/cloudflare` · `@cloudflare/next-on-pages`
- **Data**: D1(SQLite) + Drizzle ORM · KV(SESSION·CACHE) · Cache API · R2
- **Observability**: Cloudflare Analytics Engine + Web Vitals 비콘
- **Auth**: better-auth (httpOnly 쿠키 세션)
- **Styling**: Tailwind CSS + shadcn/ui · **Validation**: Zod · **TypeScript**: strict

## Hard Threshold 게이트 (위반 시 FAIL)

코드 품질(`typecheck`/`lint`/`any` 0, FSD 의존성 위반 0), 렌더링·Cloudflare(`rendering-matrix.md` 전략 선언 강제, 바인딩은 `@/shared/env` 단일 통로), 인증·보안(httpOnly+Secure+SameSite 쿠키, 시크릿 클라이언트 노출 0), 성능(API p95·LCP/INP/CLS·번들 예산), 관측(모든 데이터 호출은 `@/shared/perf` 경유) 5종을 정량 검증한다. 상세는 [`CLAUDE.md`](CLAUDE.md).

## 7-Phase 파이프라인 (`orchestrate` 스킬)

```
Phase 0  Pre-flight    1  Ideation      2  Planning(PRD+perf예산)   2.5 Spec
Phase 3  Design        3.5 Architecture  4  Implementation(4a~4d)
Phase 5  QA(병렬)       5.5 Perf Gate     6  최적화 루프(≤3)          7  Deploy
```

데이터 흐름: `_workspace/` 블랙보드 + `pipeline-status.md` 진행추적.

## apps/ratsaver — 모바일 요금제 비교/추천

한국 통신 3사 요금제를 비교·추천하고 연간 비용을 계산하는 앱. 라이브 https://ratsaver.pages.dev (롤백용 Worker https://price.zihado.com)

라우트: `/` 홈 · `/plans` 요금제 목록 · `/plans/[id]` 상세 · `/compare` 비교 · `/recommend` 추천 · `/calculator` 연간비용 계산기 · `/api/*` (plans · vitals · events).

```bash
cd apps/ratsaver
npm install            # 또는 bun install
npm run dev            # 정적 데이터 동기화 + next dev
npm run typecheck && npm run lint && npm run test
npm run perf:bench     # perf 벤치 러너 (퍼센타일 통계)
npm run deploy         # next-on-pages 빌드 → Cloudflare Pages 배포
```

## app-skeleton 검증

```bash
cd templates/app-skeleton
npm install
npm run typecheck && npm run test && npm run build
npx opennextjs-cloudflare build   # Workers 번들 생성
```

배포: D1/KV/R2 리소스 생성 + `wrangler.toml`의 PLACEHOLDER id 교체 후 `npm run deploy`.
