'use client';

import { useEffect } from 'react';
import { reportWebVitals } from './vitals';

/**
 * Core Web Vitals 비콘을 배선하는 클라이언트 컴포넌트(관측 ⑤).
 * 루트 layout에 마운트한다. 렌더 출력은 없다.
 */
export function WebVitals(): null {
  useEffect(() => {
    reportWebVitals();
  }, []);
  return null;
}
