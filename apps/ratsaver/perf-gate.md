# Perf Gate

- Base URL: `https://price.zihado.com`
- Generated: 2026-06-14T04:41:23.980Z
- Result: ✅ PASS

| Route | Status | p50 | p95 | p99 | Budget(p95) | Fails |
|-------|--------|-----|-----|-----|-------------|-------|
| `/api/plans` | ✅ PASS | 51.2ms | 59.2ms | 254.5ms | 120ms | 0 |
| `/api/plans/lgu-lte-14` | ✅ PASS | 49.9ms | 54.2ms | 60.4ms | 100ms | 0 |
| `/` | ✅ PASS | 58.3ms | 73.4ms | 104.9ms | 1500ms | 0 |
| `/plans/lgu-lte-14` | ✅ PASS | 54.4ms | 59.5ms | 61.6ms | 1200ms | 0 |
| `/compare` | ✅ PASS | 53.9ms | 91.0ms | 295.7ms | 1500ms | 0 |
| `/recommend` | ✅ PASS | 53.3ms | 60.5ms | 136.4ms | 1500ms | 0 |
| `/calculator` | ✅ PASS | 57.0ms | 160.7ms | 211.8ms | 1500ms | 0 |
