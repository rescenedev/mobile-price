// Cloudflare 바인딩 타입의 단일 출처.
// 런타임 타입(D1Database/KVNamespace/R2Bucket/AnalyticsEngineDataset)은 @cloudflare/workers-types에서 제공된다.
// CF 계정 연결 후 `npm run cf-typegen`을 실행하면 wrangler.toml로부터 worker-configuration.d.ts가 생성되어 보강된다.
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSION: KVNamespace;
  BUCKET: R2Bucket;
  PERF: AnalyticsEngineDataset;
}
