// 빌드 전 정적 데이터 동기화: seedPlans 소스(moyo-plans.json)를 ASSETS로 서빙될 public/data/plans.json에 복사.
// 클라(홈/추천)가 Worker API(/api/plans, ~54ms) 대신 이 정적 에셋(/data/plans.json, ~47ms·cf-cache·Worker 스킵)에서 전체목록을 받는다.
import { readFileSync, writeFileSync } from 'node:fs';
const src = new URL('../src/shared/db/moyo-plans.json', import.meta.url);
const dst = new URL('../public/data/plans.json', import.meta.url);
const data = JSON.parse(readFileSync(src, 'utf8'));
// 리스트 카드/필터는 notes 미사용(상세 SSG 페이지가 별도 표시) → null로 빼 페이로드 축소(전송시간↓).
// Zod planSchema는 notes: string|null이라 통과. 스키마 외 필드 추가 없음.
const lean = data.map((p) => ({ ...p, notes: null }));
writeFileSync(dst, JSON.stringify(lean));
console.log(`[sync-static-data] ${lean.length} plans (lean, notes stripped) → public/data/plans.json (${JSON.stringify(lean).length}B)`);
