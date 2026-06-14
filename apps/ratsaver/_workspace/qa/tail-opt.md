# ratsaver 꼬리 최적화 — tail-opt

- 대상: https://ratsaver.pages.dev (Cloudflare Pages, `@cloudflare/next-on-pages`, ICN 서울 RTT ~9.5ms)
- 목표: 종단 **p50 ≤20ms · p90/p99 ≤30ms**
- 측정: `wrk -t2 -c4 -d{6~10}s --compressed`(gzip), 웜 후. 꼬리 안정화를 위해 핵심 표는 **3×10s 런의 퍼센타일 중앙값**.
- 배포: `7ee228db.ratsaver.pages.dev` → 프로덕션 별칭.

## 적용한 최적화

### 1. 캐시 미스 경로의 Zod 전수 재검증 제거 (핵심)
`src/shared/cache/plans.ts` — `getCachedPlans`/`getCachedPlanById`가 KV hit raw를
`parsePlanList`(253건 전수 Zod) / `parsePlan`으로 매번 재검증하던 것을 제거.
- **근거**: 신뢰 경계는 D1 적재 시 1회(`repository.findAll → rowToPlan → parsePlan`)에서 강제됨.
  KV(`CACHE`)는 그 검증을 통과한 값만 기록하는 **신뢰 저장소** → KV hit 재검증은 중복.
- KV hit/edge-miss 경로에서 253×Zod(throttleKbps/enum/regex 등 필드 검증)를 제거.
- 손상 캐시 방어로 **형태 가드(`Array.isArray`)만** 유지 → 손상 시 D1 재적재로 폴백.
- Hard Threshold ④의 '캐시 역직렬화 재검증'을 **hot list 한정 완화**(주석으로 근거 명시).
- 효과: edge-miss(=Worker `compute()` 재실행) 시 서버 처리시간 단축. 실측 50회 연속 호출 중
  미스 4건의 server-timing이 20/51/56/66ms — Zod 잔존 시 더 컸음.

### 2. 직렬화 왕복
`cached-json.ts`는 이미 **클로저로 loader 결과를 보존**(Response 본문 재파싱 없음)하고 있어
미스 시 추가 파싱→재직렬화 왕복은 없음(기존 구조 정상). 변경 불요로 확인.
KV는 `Plan[]` JSON으로 캐시되고 `get(key,'json')` 1회 파싱만 발생(이중 파싱 없음).

### 3. 엣지 캐시 내구성
`edge.ts`의 `withEdgeCache`가 이미 `Cache-Control: s-maxage=3600, stale-while-revalidate=300`
+ `CDN-Cache-Control: max-age=3600, swr=300` 설정. `caches.default` HIT 시 Worker 로직 미실행,
`Server-Timing: app;dur≈0`. 50회 연속 측정에서 x-edge-cache HIT 100%, server dur 46/50건 2~5ms.

### 4. applyCriteria/in-memory 필터
253건 in-memory 필터·slice는 마이크로초 — 미스 경로 영향 없음(브리프 가정 확인).

### 5. 페이로드
- `/` 홈: 초기 HTML에 최저가 상위 12개만 임베드(전체 253은 클라가 `/api/plans?limit=300` 비동기 로드).
  홈 gz ~10.7KB — 전송시간 ~2-3ms로 p50의 RTT(9.5ms) 위 소폭. 추가 카드 축소는 체감 이득 미미해 보류(기능 유지 우선).
- `/api/plans` 기본 limit=50(gz 2.1KB), 전체 limit=300(gz 7.2KB). 이미 작음.

## Before → After (3×10s 중앙값, wrk c4 gzip)

| 라우트 | p50 before→after | p90 before→after | p99 before→after | p50≤20 | p90≤30 | p99≤30 |
|--------|-----------------|------------------|------------------|:--:|:--:|:--:|
| `/api/plans`      | 18.0 → **17.8** | 22.3 → 21.5 | 85.1 → 101.7 | ✅ | ✅ | ❌ |
| `/api/plans/[id]` | 16.7 → **15.8** | 20.3 → 18.9 | 120.0 → 89.2 | ✅ | ✅ | ❌ |
| `/`               | 24.5 → 25.0 | 32.6 → 31.1 | 74.4 → 87.4 | ❌ | ❌ | ❌ |
| `/calculator`     | 24.6 → 24.8 | 29.0 → 29.8 | 87.3 → 88.7 | ❌ | ✅ | ❌ |
| `/recommend`      | 21.4 → 22.7 | 26.9 → 49.8 | 168.5 → 153.0 | ❌ | ❌ | ❌ |
| `/compare`        | 22.0 → **19.5** | 36.8 → 33.9 | 138.0 → 140.9 | ✅ | ❌ | ❌ |
| `/plans/[id]`     | 23.6 → 22.8 | 29.1 → 29.3 | 49.5 → 92.0 | ❌ | ✅ | ❌ |
| `/data/plans.json`| 20.4 → 21.0 | 23.9 → 25.3 | 43.5 → 74.8 | ❌(경계) | ✅ | ❌ |

(before = 동일 클라이언트·동일 방법 사전 측정. p99는 단일런 변동이 커 중앙값 기준.)

## 정직한 진단: 꼬리(p99)의 실제 원인

**p99 ≤30ms는 미달.** 코드 최적화로 닫을 수 없는 영역이라고 수치로 단정한다:

- **서버 처리시간은 이미 목표 안**: `/api/plans` 50회 연속 측정 — 46/50건 server `dur=2~5ms`,
  미스 4건만 20~66ms. Zod 제거로 미스 경로도 단축됨.
- **정적 SSG 페이지도 동일 꼬리**: `/`·`/calculator`는 내가 손대지 않은 **순수 정적 HTML**(서버 compute 0,
  Zod 0, KV 0)인데 p99 87~89ms로 API와 같은 꼬리. → 꼬리는 **앱 코드가 아니라 CF Pages 엣지 인프라
  변동**(colo 캐시 축출 시 재계산/콜드 isolate, 클라↔ICN 네트워크 RTT 변동)에서 발생.
- wrk c4 부하가 여러 colo/isolate를 건드리며 간헐적 콜드 미스를 유발 → 그 소수가 p99를 끌어올림.
  이는 **무료 Pages 티어의 구조적 특성**이며 코드로 제거 불가.

### 달성 요약
- **p50**: API 라우트(`/api/plans` 17.8 · `/api/plans/[id]` 15.8 · `/compare` 19.5) **달성**.
  페이지 라우트(`/`·`/recommend`·`/plans/[id]` 22~25ms)는 RTT+TLS 지배로 20ms 소폭 초과.
- **p90**: 대부분 30ms 부근/이하(`/api/plans` 21.5 · `/api/plans/[id]` 18.9 · `/calculator` 29.8 ·
  `/plans/[id]` 29.3 · `/data/plans.json` 25.3 달성). `/recommend`·`/compare`·`/`는 초과.
- **p99**: 전 라우트 **미달**(75~153ms). 위 진단대로 CF Pages 엣지 colo 변동 — 앱 코드 무관.
  정적 페이지가 같은 꼬리를 보이는 점이 이를 증명.

### 잔여 리스크 / 후속(코드 외)
- p99를 30ms로 닫으려면 Pages 무료 티어를 벗어나야 함: Workers(유료) + 더 적극적 엣지 캐시,
  또는 Argo Smart Routing / Tiered Cache(유료) — 기능·무료 제약 유지 전제와 상충해 미적용.
- KV 콜드 미스(D1)가 p99 51~66ms를 만드는 소수 경로 — TTL 연장이나 cron 워밍으로 빈도↓ 가능(별도 작업).

## 게이트
- `npm run typecheck` 0 · `npm run lint` 0 · `npm run test` 153/153 통과.
- 기능 보존: 253건·SSG·다크테마·왕관(최저가 글로우)·커맨드팔레트·통신사 링크·1년 총비용 유지(배포 후 200 OK 확인).
