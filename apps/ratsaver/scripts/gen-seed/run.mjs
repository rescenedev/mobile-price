// 시드 SQL 생성기: seedPlans(TS 단일 소스) → src/shared/db/seed.sql.
// 실행: npm run db:seed:gen  (Node 26 네이티브 TS strip + @/ alias 로더)
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { seedPlans } from '../../src/shared/db/seed-data.ts';
import { buildSeedSql } from '../../src/shared/db/seed-sql.ts';

const out = path.resolve(import.meta.dirname, '../../src/shared/db/seed.sql');
const sql = buildSeedSql(seedPlans);
writeFileSync(out, sql, 'utf8');
process.stdout.write(`seed.sql written: ${seedPlans.length} plans → ${out}\n`);
