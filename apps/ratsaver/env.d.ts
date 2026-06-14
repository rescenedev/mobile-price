// Cloudflare 바인딩 타입의 단일 출처.
// 런타임 타입(D1Database/KVNamespace/R2Bucket/AnalyticsEngineDataset)은 @cloudflare/workers-types에서 제공된다.
// 플랫폼: Cloudflare Pages(@cloudflare/next-on-pages). getRequestContext().env가 이 shape를 반환한다.
// 활성 바인딩(Pages wrangler.toml): DB·CACHE·PERF. SESSION·BUCKET은 타입만 유지(코드 미참조, 스켈레톤 일관성).
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSION: KVNamespace;
  BUCKET: R2Bucket;
  PERF: AnalyticsEngineDataset;
}
