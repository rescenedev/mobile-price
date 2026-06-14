/**
 * 서버/클라 공용 상수 — 'use client' 경계 밖(plain 모듈).
 *
 * 이 값을 'use client' 모듈에서 export하면 Server Component(page.tsx)가 import할 때
 * 실제 숫자가 아닌 client-reference 프록시를 받는다. 그 경우 `slice(0, INITIAL_PLAN_COUNT)`가
 * `slice(0, NaN)` → 빈 배열이 되어 정적 HTML에 카드가 0개가 되는 SSR 버그가 생긴다.
 * → 상수는 반드시 plain 모듈에서 정의해 서버가 리터럴 값을 받게 한다.
 */

/** 서버가 초기 HTML에 직렬화하는 plan 수 — 최저가 상위 N개(첫 화면 충분). 전체는 클라가 비동기 로드.
 *  12개로 초기 HTML/전송 최소화(brotli ~6KB) → 종단 지연↓. 나머지는 마운트 후 /api/plans로 채움. */
export const INITIAL_PLAN_COUNT = 12;
