/**
 * 통신사 외부 링크 헬퍼.
 * carrier 데이터에 공식 URL이 없으므로, 모든 통신사에 안전하게 동작하는
 * 네이버 검색 링크로 연결한다(매직 URL을 도메인 레이어 단일 출처로 격리).
 */

/** 네이버 통합검색 베이스. */
const NAVER_SEARCH_BASE = 'https://search.naver.com/search.naver';

/** 검색어 접미사 — "<통신사> 요금제". */
const CARRIER_QUERY_SUFFIX = ' 요금제';

/** 통신사명을 네이버 검색 URL로 변환. */
export const carrierSearchUrl = (carrier: string): string =>
  `${NAVER_SEARCH_BASE}?query=${encodeURIComponent(carrier + CARRIER_QUERY_SUFFIX)}`;
