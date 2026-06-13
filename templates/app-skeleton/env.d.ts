/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  CACHE: KVNamespace;
  SESSION: KVNamespace;
  BUCKET: R2Bucket;
  PERF: AnalyticsEngineDataset;
}
