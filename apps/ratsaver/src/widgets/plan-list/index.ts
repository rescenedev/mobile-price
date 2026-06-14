// 서버-안전 배럴 — Server Component(page.tsx)가 INITIAL_PLAN_COUNT(plain 상수)을 리터럴로,
// PlanList(클라 컴포넌트)를 client-reference로 각각 올바르게 받게 한다.
// 상수를 'use client' 모듈에서 export하면 서버가 프록시를 받아 slice가 빈 배열이 되는 SSR 버그가 난다.
export { INITIAL_PLAN_COUNT } from './constants';
export { PlanList } from './plan-list';
