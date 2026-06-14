import { describe, it, expect } from 'vitest';
import { scorePlan, recommend, usageFromPreset, USAGE_PRESETS } from './score';
import { makePlan } from '../__fixtures__/plan';

describe('scorePlan', () => {
  it('데이터가 사용량을 충족하는 plan이 부족한 plan보다 높은 점수', () => {
    const usage = { dataGb: 15, callMinutes: 100 };
    const enough = makePlan({ id: 'enough', dataGb: 15, monthlyPrice: 20000 });
    const short = makePlan({ id: 'short', dataGb: 3, monthlyPrice: 20000 });
    expect(scorePlan(enough, usage)).toBeGreaterThan(scorePlan(short, usage));
  });

  it('동일 데이터면 저렴한 plan이 더 높은 점수', () => {
    const usage = { dataGb: 7, callMinutes: 100 };
    const cheap = makePlan({ id: 'cheap', dataGb: 7, monthlyPrice: 9000 });
    const pricey = makePlan({ id: 'pricey', dataGb: 7, monthlyPrice: 30000 });
    expect(scorePlan(cheap, usage)).toBeGreaterThan(scorePlan(pricey, usage));
  });

  it('무제한 데이터는 큰 사용량도 충족한다', () => {
    const usage = { dataGb: 100, callMinutes: 100 };
    const unlimited = makePlan({
      id: 'u',
      dataGb: null,
      dataUnlimited: true,
      monthlyPrice: 33000,
    });
    const limited = makePlan({ id: 'l', dataGb: 11, monthlyPrice: 33000 });
    expect(scorePlan(unlimited, usage)).toBeGreaterThan(scorePlan(limited, usage));
  });

  it('통화 부족도 감점된다', () => {
    const usage = { dataGb: 7, callMinutes: 500 };
    const callOk = makePlan({ id: 'co', dataGb: 7, callUnlimited: true, monthlyPrice: 15000 });
    const callShort = makePlan({
      id: 'cs',
      dataGb: 7,
      callUnlimited: false,
      callMinutes: 100,
      monthlyPrice: 15000,
    });
    expect(scorePlan(callOk, usage)).toBeGreaterThan(scorePlan(callShort, usage));
  });
});

describe('recommend', () => {
  it('점수 내림차순으로 정렬한다', () => {
    const usage = { dataGb: 7, callMinutes: 100 };
    const plans = [
      makePlan({ id: 'a', dataGb: 1, monthlyPrice: 30000 }),
      makePlan({ id: 'b', dataGb: 7, monthlyPrice: 9000 }),
      makePlan({ id: 'c', dataGb: 7, monthlyPrice: 20000 }),
    ];
    const ranked = recommend(plans, usage);
    expect(ranked[0]?.plan.id).toBe('b');
    const scores = ranked.map((r) => r.score);
    expect(scores).toEqual([...scores].sort((x, y) => y - x));
  });

  it('limit으로 결과 수를 제한한다', () => {
    const usage = { dataGb: 7, callMinutes: 100 };
    const plans = Array.from({ length: 10 }, (_, i) => makePlan({ id: `p${i}` }));
    expect(recommend(plans, usage, 3)).toHaveLength(3);
  });

  it('입력 배열을 변형하지 않는다', () => {
    const plans = [makePlan({ id: 'a' }), makePlan({ id: 'b' })];
    const snapshot = plans.map((p) => p.id);
    recommend(plans, { dataGb: 7, callMinutes: 100 });
    expect(plans.map((p) => p.id)).toEqual(snapshot);
  });
});

describe('USAGE_PRESETS', () => {
  it('5종 프리셋을 제공한다', () => {
    expect(USAGE_PRESETS).toHaveLength(5);
  });

  it('usageFromPreset이 프리셋 키를 사용량으로 변환한다', () => {
    expect(usageFromPreset('web_7g')?.dataGb).toBe(7);
    expect(usageFromPreset('unknown')).toBeUndefined();
  });
});
