/**
 * URLSearchParams 불변 헬퍼 — features(plan-filter·plan-compare)가 공유가능 URL을 만든다.
 * 모든 함수는 입력을 변형하지 않고 새 URLSearchParams를 반환한다(immutable).
 */

/** 값을 설정(빈 값이면 키 제거)한 새 params를 반환. */
export const setParam = (
  params: URLSearchParams,
  key: string,
  value: string | null | undefined,
): URLSearchParams => {
  const next = new URLSearchParams(params);
  if (value === null || value === undefined || value === '') {
    next.delete(key);
  } else {
    next.set(key, value);
  }
  return next;
};

/** 키를 제거한 새 params를 반환. */
export const deleteParam = (params: URLSearchParams, key: string): URLSearchParams => {
  const next = new URLSearchParams(params);
  next.delete(key);
  return next;
};

/** boolean 플래그를 토글(on이면 '1', off면 제거)한 새 params를 반환. */
export const toggleParam = (params: URLSearchParams, key: string): URLSearchParams => {
  const isOn = params.get(key) === '1';
  return isOn ? deleteParam(params, key) : setParam(params, key, '1');
};

/** CSV searchParam(`ids=a,b,c`)을 배열로 읽기(빈 항목 제거). */
export const readCsv = (params: URLSearchParams, key: string): readonly string[] => {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

/** 배열을 CSV searchParam으로 쓴 새 params를 반환(빈 배열이면 키 제거). */
export const writeCsv = (
  params: URLSearchParams,
  key: string,
  values: readonly string[],
): URLSearchParams =>
  values.length === 0 ? deleteParam(params, key) : setParam(params, key, values.join(','));
