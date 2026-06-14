/**
 * AE 커스텀 이벤트 카탈로그 — 이벤트명 단일 출처(매직 스트링 0 · Hard Threshold ⑤).
 * kpis.md 커스텀 이벤트 카탈로그와 1:1. 모든 발화는 `@/shared/perf`의 trackEvent 래퍼 경유.
 *
 * 규칙: snake_case · 동사_명사. 파라미터는 PII 0 — 절대값 금지, 버킷/열거형만(kpis.md 버킷화 규칙).
 */
export const EVENTS = {
  SESSION_START: 'session_start',
  VIEW_PLAN_LIST: 'view_plan_list',
  APPLY_FILTER: 'apply_filter',
  TOGGLE_QUICKCHIP: 'toggle_quickchip',
  VIEW_PLAN_DETAIL: 'view_plan_detail',
  ADD_COMPARE: 'add_compare',
  VIEW_COMPARE: 'view_compare',
  OPEN_USAGE_PRESET: 'open_usage_preset',
  SELECT_USAGE_PRESET: 'select_usage_preset',
  RECOMMEND_RUN: 'recommend_run',
  SAVING_CALC: 'saving_calc',
  CORE_ACTION: 'core_action',
  CTA_CLICK: 'cta_click',
  DISCLAIMER_VIEW: 'disclaimer_view',
  WEB_VITAL: 'web_vital',
} as const;

/** 정의된 이벤트명 유니온 — 매직 스트링 차단(이 타입 밖의 문자열은 trackEvent 거부). */
export type TEventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * 이벤트 파라미터 — PII 0. 값은 버킷/열거형/불리언/소건수만 허용.
 * 절대값(현재요금·절약액·정확한 가격/데이터/통화)은 절대 담지 않는다(버킷 헬퍼 경유).
 */
export type TEventParams = Readonly<Record<string, string | number | boolean>>;

/** North Star("추천→결정 도달률") 분자 측정용 — 추천/계산 의도 시그널. */
export const INTENT_EVENTS: readonly TEventName[] = [
  EVENTS.RECOMMEND_RUN,
  EVENTS.SAVING_CALC,
];

/** North Star 분자의 "결정 도달" 시그널 — 비교/상세 진입. */
export const DECISION_EVENTS: readonly TEventName[] = [
  EVENTS.VIEW_COMPARE,
  EVENTS.VIEW_PLAN_DETAIL,
];
