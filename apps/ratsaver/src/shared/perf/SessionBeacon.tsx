'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from './event-beacon';
import { EVENTS } from './events';

const SESSION_FLAG = 'ratsaver:session-started';

/** 진입 경로를 라우트 패턴으로 정규화 — 절대 id·쿼리 제거(PII 0). */
const routeKind = (pathname: string): string => {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/plans/')) return 'plan_detail';
  if (pathname.startsWith('/plans')) return 'plans';
  if (pathname.startsWith('/compare')) return 'compare';
  if (pathname.startsWith('/recommend')) return 'recommend';
  if (pathname.startsWith('/calculator')) return 'calculator';
  return 'other';
};

/** document.referrer를 종류로만 분류 — 원본 URL·쿼리 금지(kpis referrer_kind 규칙). */
const referrerKind = (): string => {
  if (typeof document === 'undefined' || !document.referrer) return 'direct';
  try {
    const host = new URL(document.referrer).hostname;
    if (host === location.hostname) return 'internal';
    if (/google|bing|naver|daum|duckduckgo|yahoo/.test(host)) return 'search';
    if (/facebook|instagram|twitter|x\.com|threads|kakao|t\.co/.test(host)) return 'social';
    return 'other';
  } catch {
    return 'other';
  }
};

/**
 * 세션 첫 페이지뷰에 session_start를 1회 발화하는 클라 leaf(렌더 출력 0).
 * 루트 layout에 마운트. sessionStorage 플래그로 세션당 1회 보장.
 * 재방문(D7 프록시)은 익명 returning 불리언만 — 개인 식별 ID 0(PII 0).
 */
export function SessionBeacon(): null {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let started = false;
    try {
      started = window.sessionStorage.getItem(SESSION_FLAG) === '1';
    } catch {
      return; // 스토리지 차단 환경 — 조용히 스킵.
    }
    if (started) return;
    const returning = (() => {
      try {
        return window.localStorage.getItem('ratsaver:seen') === '1';
      } catch {
        return false;
      }
    })();
    try {
      window.sessionStorage.setItem(SESSION_FLAG, '1');
      window.localStorage.setItem('ratsaver:seen', '1');
    } catch {
      // 무시.
    }
    trackEvent(EVENTS.SESSION_START, {
      entry_route: routeKind(pathname),
      referrer_kind: referrerKind(),
      returning,
    });
    // 세션당 1회 — pathname은 첫 진입 경로 스냅샷, 의존성 의도적으로 비움.
  }, []);
  return null;
}
