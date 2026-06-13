# Rendering Matrix — 라우트별 렌더링/캐시 단일 출처 (계약)

> **이 파일은 cf-architect가 Phase 3.5에서 작성하고, 모든 구현 에이전트(4a~4d)가 따른다.**
> 여기 없는 라우트를 구현하면 Hard Threshold ② 위반. 선언 전략과 실제 코드(`runtime`/`revalidate`/`dynamic`)가 불일치하면 위반.

| 라우트 | 유형 | 전략 | Next 구현 | 캐시 계층 | perf 예산 | 비고 |
|--------|------|------|-----------|-----------|-----------|------|
| `/` | 페이지 | SSG | (기본) | — | LCP<1.5s | 예시 |
| `/api/<x>` | Route Handler | SSR-edge | `runtime='edge'` | KV(TTL 60s) | p95<200ms | 예시 |
| `/dashboard` | 페이지 | SSR-edge | dynamic | — | LCP<1.5s | 인증 필요 |

## 전략 선택 기준
- **SSG**: 동적 데이터 없음 → 빌드 타임 생성
- **ISR** (`revalidate=N`): 주기 갱신 콘텐츠
- **SSR-edge** (`runtime='edge'`): 요청별 개인화/인증
- **SSR + 캐시 계층**: 빈번한 동일 업스트림 → `@/shared/cache`(KV/Cache API) 경유

## 캐시 계층 표기
- `KV(TTL Ns)` — KV 네임스페이스 캐시, N초 TTL
- `Cache API(TTL Ns)` — Cloudflare Cache API
- `—` — 캐시 없음 (개인화/실시간)
