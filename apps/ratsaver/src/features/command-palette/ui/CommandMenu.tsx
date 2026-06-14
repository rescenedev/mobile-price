'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { trackEvent, EVENTS } from '@/shared/perf';
import { OPEN_PALETTE_EVENT } from '../model/events';

/** 팔레트 오픈을 CORE_ACTION 신호로 기록(이벤트명 카탈로그 단일 출처, surface 열거값만). */
const PALETTE_SURFACE = { surface: 'command_palette' } as const;

// 무거운 cmdk 팔레트는 초기 번들에서 제외 — 첫 오픈 시점에만 lazy chunk 로드(ssr:false).
const CommandPalette = dynamic(
  () => import('./CommandPalette').then((m) => m.CommandPalette),
  { ssr: false },
);

/**
 * 전역 커맨드 메뉴(가벼운 상주 leaf) — ⌘K/Ctrl+K + 헤더 버튼 이벤트로 팔레트를 연다.
 * 팔레트 자체(cmdk)는 mounted 이후에만 dynamic import → 초기 번들 미포함.
 */
export const CommandMenu = (): React.JSX.Element | null => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const openPalette = useCallback((): void => {
    setMounted(true);
    setOpen(true);
    trackEvent(EVENTS.CORE_ACTION, PALETTE_SURFACE);
  }, []);

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setOpen((prev) => {
          const next = !prev;
          if (next) {
            setMounted(true);
            trackEvent(EVENTS.CORE_ACTION, PALETTE_SURFACE);
          }
          return next;
        });
      }
    };
    const onRequest = (): void => openPalette();

    window.addEventListener('keydown', onKeydown);
    window.addEventListener(OPEN_PALETTE_EVENT, onRequest);
    return () => {
      window.removeEventListener('keydown', onKeydown);
      window.removeEventListener(OPEN_PALETTE_EVENT, onRequest);
    };
  }, [openPalette]);

  if (!mounted) return null;
  return <CommandPalette open={open} onOpenChange={setOpen} />;
};
