# Perf Gate

- Base URL: `https://ratsaver.pages.dev`
- Generated: 2026-06-14T09:08:48.138Z
- Result: ✅ PASS

| Route | Status | p50 | p95 | p99 | Budget(p95) | Budget(p99) | Fails |
|-------|--------|-----|-----|-----|-------------|-------------|-------|
| `/api/plans` | ✅ PASS | 19.2ms | 22.7ms | 30.7ms | 120ms | 50ms | 0 |
| `/api/plans/lgu-lte-14` | ✅ PASS | 17.7ms | 21.1ms | 28.0ms | 100ms | 50ms | 0 |
