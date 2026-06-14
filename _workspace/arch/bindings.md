---
project: ratsaver
phase: 3.5
title: Cloudflare 바인딩 인벤토리 (env 단일 통로 계약)
status: confirmed
created: 2026-06-14
updated: 2026-06-14
owner: cf-architect
---

# Bindings — ratsaver (Cloudflare 바인딩 인벤토리)

> **단일 통로 강제 (Hard Threshold ②)**: 모든 코드는 `@/shared/env`의 `createEnvAccessor(env).get('DB')` 로만 바인딩에 접근한다.
> `process.env`·전역 직접 접근·`getCloudflareContext().env.DB` 직접 사용 0. 서버 컨텍스트 진입점은 `getCloudflareContext().env` → 즉시 `createEnvAccessor(env)`로 감싼다.
> 본 인벤토리는 `templates/app-skeleton/wrangler.toml` 실제 바인딩 및 `env.d.ts`의 `CloudflareEnv`와 1:1 일치한다.

---

## 사용 바인딩 (ratsaver 활성)

| 바인딩 | 타입 | env 접근 키 | 용도 | wrangler.toml 블록 | TTL/비고 |
|--------|------|-------------|------|---------------------|----------|
| `DB` | D1 (SQLite) | `.get('DB')` | 요금제(plan) 시드 데이터 50~150건 저장·조회. Drizzle ORM 경유(`@/shared/db`). 읽기 100%·쓰기 0 | `[[d1_databases]]` `database_name="ratsaver-db"` | 단일 쿼리(N+1 0). 목록=filter, 상세=PK 단건 |
| `CACHE` | KV | `.get('CACHE')` | 목록/상세 D1 조회 결과 read-through 캐시(`@/shared/cache`). 동일 업스트림 반복호출 0 보장 | `[[kv_namespaces]]` `binding="CACHE"` | TTL 3600s. 키 스킴은 cache-topology.md |
| `PERF` | Analytics Engine | `.get('PERF')` | Web Vitals 비콘·AE 커스텀 이벤트·`trackFetch` latency 계측 수집(`@/shared/perf`). 직접 호출 0 | `[[analytics_engine_datasets]]` `dataset="ratsaver_perf"` | PII 0 (버킷화만). 이벤트명=`EVENTS.*` 상수 |

---

## 미사용 바인딩 (ratsaver 비활성 — 스켈레톤 유지, 코드 미참조)

| 바인딩 | 타입 | 상태 | 사유 |
|--------|------|------|------|
| `SESSION` | KV | **미사용** | 무인증 앱(세션·쿠키·계정 0). better-auth 미탑재. `@/shared/env`에서 키 노출은 하되 어떤 코드도 `.get('SESSION')` 호출 0 |
| `BUCKET` | R2 | **미사용** | 정적 에셋·업로드 없음. 이미지는 `next/image`(빌드 에셋)로 처리. R2 접근 0 |

> **정책**: 스켈레톤 `wrangler.toml`의 `SESSION`·`BUCKET` 블록과 `env.d.ts`의 해당 타입은 **유지**한다(스켈레톤 일관성·향후 확장). 단 ratsaver 구현 코드는 두 바인딩을 **절대 참조하지 않는다**. Phase 7 배포 시 SESSION KV는 생성하되(타입 일치), R2 버킷도 선언상 생성된다 — 비용 0(미사용).

---

## wrangler.toml 확정 상태 (Phase 3.5 적용)

```toml
name = "ratsaver"
main = ".open-next/worker.js"
compatibility_date = "2024-12-30"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "ratsaver-db"
database_id = "PLACEHOLDER_D1_ID"        # Phase 7에서 wrangler d1 create 후 교체

[[kv_namespaces]]
binding = "CACHE"
id = "PLACEHOLDER_KV_CACHE_ID"           # Phase 7에서 wrangler kv namespace create 후 교체

[[kv_namespaces]]
binding = "SESSION"                       # 미사용(무인증) — 스켈레톤 일관성 위해 유지
id = "PLACEHOLDER_KV_SESSION_ID"

[[r2_buckets]]
binding = "BUCKET"                         # 미사용 — 스켈레톤 일관성 위해 유지
bucket_name = "ratsaver-assets"

[[analytics_engine_datasets]]
binding = "PERF"
dataset = "ratsaver_perf"
```

> `database_name`·`bucket_name`·`dataset`을 앱 슬러그(`ratsaver`)로 교체. `PLACEHOLDER_*` ID는 Phase 7에서 전부 교체(잔존 0이어야 배포 성공).

---

## 바인딩 추가/변경 프로토콜 (신규 바인딩 시)

1. `wrangler.toml`에 바인딩 블록 추가
2. `npm run cf-typegen` 실행 → `worker-configuration.d.ts`로 `CloudflareEnv` 타입 보강
3. `env.d.ts`의 `CloudflareEnv` 인터페이스에 키 추가(타입 단일 출처)
4. `bindings.md`(본 파일)에 용도 명시
5. `npm run typecheck` 0 확인

> ratsaver는 위 신규 바인딩 추가 없음 — 스켈레톤 기본(DB/CACHE/PERF 활성, SESSION/BUCKET 비활성)으로 충분.

---

## 검증 체크리스트

- [x] bindings.md가 `wrangler.toml` 실제 바인딩(DB/CACHE/SESSION/BUCKET/PERF)과 일치
- [x] `env.d.ts` `CloudflareEnv`와 키 일치(DB·CACHE·SESSION·BUCKET·PERF)
- [x] 활성 바인딩(DB·CACHE·PERF) 용도·접근 키 명시
- [x] 미사용 바인딩(SESSION·BUCKET) 비참조 정책 명시
- [x] 단일 통로 규약(`createEnvAccessor(env).get(key)`) 명문화 — `process.env`/전역 접근 금지
