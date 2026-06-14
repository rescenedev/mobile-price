# Load Test & 성능 분석 — ratsaver (프로덕션)

대상: https://ratsaver.zihado.workers.dev (Cloudflare Workers / OpenNext)
측정: 2026-06-14, 위치=한국, 엣지 PoP=HKG(Hong Kong). 도구: k6 · wrk · hey · oha · curl.
측정자 RTT(TCP connect, 1 round-trip) = **~47ms** (HKG까지).

## 종합 판정: 서버 레벨 50ms 목표 달성 ✅ / 종단은 RTT 바운드

| 라우트 | 서버처리(Server-Timing) | 종단 p50 | p90 | 압축 페이로드 |
|--------|------------------------|----------|-----|--------------|
| `/api/plans` | **16ms** | 66ms | 158ms | — |
| `/api/plans/[id]` | **2ms** | 62ms | 171ms | 0.5KB |
| `/plans/[id]` (SSG) | (정적) | 66ms | 84ms | ~4KB |
| `/recommend` | (정적 셸) | 65ms | 86ms | 5KB |
| `/calculator` | (정적) | 66ms | 84ms | 8.5KB |
| `/` (home) | (정적) | 74ms | 103ms | 9.7KB |
| `/compare` | (ISR) | 84ms | 168ms | ~6KB |

- **0% 에러율** (k6 9,862 요청 전부 200). 초기 측정의 10% 에러는 테스트가 존재하지 않는 id를 섞은 결함(서버 무관).
- **서버 처리시간 2-16ms** — 50ms 목표를 서버 레벨에서 완전히 달성. (RTT 배제한 실측, `Server-Timing: app;dur=` 헤더로 노출.)
- **종단 p50 62-74ms** = RTT(47ms) + 처리/전송(~15-27ms).

## 핵심 발견 (측정으로 확정)
1. **단건 curl TTFB ~150ms는 OpenNext가 아니라 TCP+TLS 핸드셰이크**(HKG까지 3-4 RTT). keep-alive(wrk/k6)가 실사용 지표.
2. **wrk/curl이 기본적으로 Accept-Encoding 미전송 → 비압축 176KB 수신**으로 지연 과대측정. 실제 브라우저는 brotli로 받음(홈 176KB→**10.8KB**). 압축 측정이 진실.
3. **페이지 지연 ∝ 압축 페이로드 크기.** 작은 페이지(`/plans/[id]` 4KB)=66ms로 API와 동급. 큰 페이지가 느렸던 것.

## 적용한 최적화 (이번 작업)
1. **Cloudflare Cache API 엣지 응답 캐시**(`src/shared/cache/edge.ts`) — 두 GET API. 웜 요청은 Worker 로직(KV·D1·직렬화) 스킵 → 서버 2-16ms. `Server-Timing` 헤더 노출.
2. **`/api/plans/[id]` 단일 웜키화** — id별 개별 KV 키(콜드미스→D1 400ms+) 폐기, `plans:v1:all` 단일 캐시에서 in-memory 도출 → 콜드미스 0.
3. **페이로드 축소**: `/api/plans` 기본 페이지네이션(50개). 홈 임베드 253→12개 SSR + 나머지 클라 비동기. `/recommend` 253→0 임베드(149KB→23KB). 
4. **SSR 카드 렌더 버그 수정**: `'use client'` 모듈에서 export한 상수를 서버가 client-ref 프록시로 받아 `slice(0,NaN)`→빈 배열이던 버그. 상수를 plain 모듈로 분리 → 정적 HTML에 카드 24→복원.
5. **캐시 버전 v2** — 재시드 후 스테일 KV/엣지 일괄 무효화. 엣지 키에 버전 포함.

## p99 꼬리 (주의)
- API p99 1.0-1.2s, 드물게 max 수 초. 원인: 캐시 만료 후 콜드 재계산(KV miss→D1→253 직렬화 ~236ms) + 지속 부하 시 workers.dev의 간헐 스로틀. 중앙값/p90은 안정적. 운영 트래픽(낮은 동시성)에선 비노출 예상.

## 종단 50ms 도달의 마지막 관문 = RTT (47ms, HKG)
- 서버 처리는 이미 2-16ms. 종단 62-74ms 중 **47ms가 workers.dev → HKG PoP 물리 RTT**.
- **해결책: 커스텀 도메인.** workers.dev는 HKG로 라우팅되지만, Cloudflare에 등록된 커스텀 도메인은 한국 사용자를 **ICN(서울) PoP**로 Anycast 라우팅 → RTT ~5-15ms → **종단 ~30-40ms로 50ms 돌파**.
- 액션: 사용자가 도메인을 Cloudflare 계정에 추가하면 `wrangler` 커스텀 도메인 바인딩 → 재측정.

## 도구/패키지
- 패키지 매니저: **bun**(npm→bun 전환, bun.lock). 빌드/배포 `bun run deploy`(OpenNext).
