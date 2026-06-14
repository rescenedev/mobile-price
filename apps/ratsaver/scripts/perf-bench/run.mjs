#!/usr/bin/env node
/**
 * perf 벤치 러너 — config.json의 라우트를 N회 호출해 p50/p95/p99를 요약하고
 * 라우트별 예산(budgetP95Ms)과 비교해 perf-gate.md(PASS/FAIL)를 출력한다.
 *
 * 사용: BASE_URL=https://my-app.dev node scripts/perf-bench/run.mjs [config.json]
 * 종료코드: 모든 게이트 통과 시 0, 하나라도 FAIL이면 1 (CI 게이트).
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { summarize } from './lib/stats.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const joinUrl = (baseUrl, route) => {
  const base = baseUrl.replace(/\/+$/, '');
  const p = route.startsWith('/') ? route : `/${route}`;
  return `${base}${p}`;
};

const timeOnce = async (url) => {
  const start = performance.now();
  try {
    const res = await fetch(url);
    await res.arrayBuffer(); // 본문 소진 — 정확한 종단 시간
    return { ms: performance.now() - start, ok: res.ok, status: res.status };
  } catch {
    return { ms: performance.now() - start, ok: false, status: 0 };
  }
};

const benchRoute = async (baseUrl, route, iterations, warmup) => {
  const url = joinUrl(baseUrl, route.path);
  // warmup: 커넥션/엣지 캐시 워밍 — 첫 콜드 샘플이 p99 tail을 오염시키지 않게 측정에서 제외.
  for (let i = 0; i < warmup; i += 1) await timeOnce(url);
  const durations = [];
  let failures = 0;
  for (let i = 0; i < iterations; i += 1) {
    const r = await timeOnce(url);
    if (!r.ok) failures += 1;
    durations.push(r.ms);
  }
  const stats = summarize(durations);
  const budgetP95 = route.budgetP95Ms ?? Infinity;
  const budgetP99 = route.budgetP99Ms ?? Infinity;
  const pass = stats.p95 <= budgetP95 && stats.p99 <= budgetP99 && failures === 0;
  return { path: route.path, stats, budgetP95, budgetP99, failures, pass };
};

const fmt = (n) => `${n.toFixed(1)}ms`;

const renderReport = (results, baseUrl) => {
  const allPass = results.every((r) => r.pass);
  const lines = [
    '# Perf Gate',
    '',
    `- Base URL: \`${baseUrl}\``,
    `- Generated: ${new Date().toISOString()}`,
    `- Result: ${allPass ? '✅ PASS' : '❌ FAIL'}`,
    '',
    '| Route | Status | p50 | p95 | p99 | Budget(p95) | Budget(p99) | Fails |',
    '|-------|--------|-----|-----|-----|-------------|-------------|-------|',
  ];
  for (const r of results) {
    const status = r.pass ? '✅ PASS' : '❌ FAIL';
    const bP95 = r.budgetP95 === Infinity ? '—' : `${r.budgetP95}ms`;
    const bP99 = r.budgetP99 === Infinity ? '—' : `${r.budgetP99}ms`;
    lines.push(
      `| \`${r.path}\` | ${status} | ${fmt(r.stats.p50)} | ${fmt(r.stats.p95)} | ${fmt(
        r.stats.p99,
      )} | ${bP95} | ${bP99} | ${r.failures} |`,
    );
  }
  lines.push('');
  return { md: lines.join('\n'), allPass };
};

const main = async () => {
  const configPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(__dirname, 'config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  const baseUrl = process.env.BASE_URL ?? config.baseUrl;
  const iterations = Number(process.env.ITERATIONS ?? config.iterations ?? 20);
  const warmup = Number(process.env.WARMUP ?? config.warmup ?? 5);

  if (!baseUrl) {
    console.error('BASE_URL이 필요합니다 (env 또는 config.baseUrl).');
    process.exit(2);
  }

  console.log(`perf-bench: ${baseUrl} × ${iterations} iterations (warmup ${warmup})`);
  const results = [];
  for (const route of config.routes ?? []) {
    process.stdout.write(`  probing ${route.path} ... `);
    const r = await benchRoute(baseUrl, route, iterations, warmup);
    console.log(`p95=${fmt(r.stats.p95)} p99=${fmt(r.stats.p99)} ${r.pass ? 'PASS' : 'FAIL'}`);
    results.push(r);
  }

  const { md, allPass } = renderReport(results, baseUrl);
  const outPath = path.join(process.cwd(), 'perf-gate.md');
  await writeFile(outPath, md, 'utf8');
  console.log(`\nperf-gate.md written → ${outPath}`);
  console.log(allPass ? '✅ ALL GATES PASS' : '❌ GATE FAILURE');
  process.exit(allPass ? 0 : 1);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
