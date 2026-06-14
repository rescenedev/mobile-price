import type { Plan } from '@/entities/plan';
import { parsePlanList } from '@/entities/plan';
import moyoPlans from './moyo-plans.json' with { type: 'json' };

/**
 * 모요(moyoplan.com) 실데이터 시드 — 실제로 스크랩·정제한 요금제 목록.
 *
 * 출처: `_workspace/data/`(scrape/parser). 합성 랜덤 생성기를 전부 걷어내고
 * `moyo-plans.json`(실제 통신사·실제 가격·실제 프로모)을 단일 소스로 삼는다.
 * 데이터 값은 JSON 그대로 보존(위변조 금지) — 여기서는 경계 검증만 수행한다.
 *
 * 검증: 시스템 경계에서 `parsePlanList`(Zod planSchema)로 전수 parse한다.
 * 부적합 행이 있으면 import/빌드 타임에 throw → 잘못된 데이터가 런타임에 새지 않는다.
 *
 * id는 ASCII·URL-safe(`{network}-{tech}-{idx}`)로 이미 유일 → `/plans/[id]`
 * generateStaticParams가 그대로 SSG 경로를 만든다(한글 슬러그 퍼센트인코딩 404 회피).
 * 파생값(절약·추천)은 저장하지 않는다.
 */

/** moyo 실데이터 시드 plan 목록. 경계 스키마(planSchema)를 통과한 값만 노출. */
export const seedPlans: readonly Plan[] = parsePlanList(moyoPlans);
