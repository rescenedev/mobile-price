/**
 * 순수 퍼센타일/요약 통계. 외부 의존 없음 — node 런타임에서 직접 import.
 */

/**
 * 선형보간 퍼센타일(R-7, Excel/numpy 기본). p는 0..100.
 * @param {number[]} samples
 * @param {number} p
 * @returns {number}
 */
export const percentile = (samples, p) => {
  if (samples.length === 0) return 0;
  if (p <= 0) return Math.min(...samples);
  if (p >= 100) return Math.max(...samples);
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  const weight = rank - low;
  return sorted[low] * (1 - weight) + sorted[high] * weight;
};

/**
 * 지속시간 배열을 요약한다.
 * @param {number[]} durations
 * @returns {{p50:number,p95:number,p99:number,min:number,max:number,count:number}}
 */
export const summarize = (durations) => {
  if (durations.length === 0) {
    return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, count: 0 };
  }
  return {
    p50: percentile(durations, 50),
    p95: percentile(durations, 95),
    p99: percentile(durations, 99),
    min: Math.min(...durations),
    max: Math.max(...durations),
    count: durations.length,
  };
};
