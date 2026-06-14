'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from './event-beacon';
import type { TEventName, TEventParams } from './events';

interface IViewBeaconProps {
  /** 발화할 페이지뷰 이벤트(EVENTS.* 상수만 — 매직 스트링 0). */
  readonly event: TEventName;
  /** PII-free 파라미터(버킷/열거형/소건수만). */
  readonly params?: TEventParams;
}

/**
 * 페이지뷰 KPI 이벤트를 마운트 시 1회 발화하는 클라 leaf(렌더 출력 0).
 * 서버 컴포넌트(SSG/ISR) 페이지가 경계를 클라로 넘기지 않고 view_* 이벤트만 배선할 때 사용.
 * North Star "결정 도달"(view_compare·view_plan_detail) 측정의 단일 통로.
 */
export function ViewBeacon({ event, params }: IViewBeaconProps): null {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackEvent(event, params);
  }, [event, params]);
  return null;
}
