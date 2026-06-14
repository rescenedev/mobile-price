'use client';

import { useCallback, useEffect, useState } from 'react';
import { MAX_COMPARE } from './compare';

const STORAGE_KEY = 'ratsaver:compare';
const EVENT = 'ratsaver:compare-change';

/** sessionStorage에서 비교 id 목록 읽기(브라우저 외 환경 안전). */
const read = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const write = (ids: readonly string[]): void => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT));
};

interface ICompareTray {
  readonly ids: readonly string[];
  readonly has: (id: string) => boolean;
  readonly toggle: (id: string) => { ok: boolean; reason?: 'limit' };
  readonly clear: () => void;
  readonly isFull: boolean;
}

/**
 * 비교 트레이(클라) — 비교담기 누적 상태(최대 3). sessionStorage 동기화.
 * PII 아님(plan id만). 서버 미전송. 같은 탭 내 컴포넌트 간 CustomEvent로 동기화.
 */
export const useCompareTray = (): ICompareTray => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = (): void => setIds(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const toggle = useCallback((id: string): { ok: boolean; reason?: 'limit' } => {
    const current = read();
    if (current.includes(id)) {
      write(current.filter((x) => x !== id));
      return { ok: true };
    }
    if (current.length >= MAX_COMPARE) {
      return { ok: false, reason: 'limit' };
    }
    write([...current, id]);
    return { ok: true };
  }, []);

  const clear = useCallback((): void => write([]), []);
  const has = useCallback((id: string): boolean => ids.includes(id), [ids]);

  return { ids, has, toggle, clear, isFull: ids.length >= MAX_COMPARE };
};
