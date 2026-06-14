'use client';

import { Search } from 'lucide-react';
import { cn } from '@/shared/lib';
import { requestOpenPalette } from '../model/events';
import { PALETTE_LABEL } from '../model/constants';

/**
 * 헤더 힌트 버튼(가벼운 client leaf) — 검색 아이콘 + ⌘K kbd. 클릭 시 전역 팔레트를 연다.
 * 다크 톤 절제: hairline 보더 + muted 배경. CLS 0(고정 높이 44px 터치 타겟).
 */
export const CommandPaletteHint = (): React.JSX.Element => (
  <button
    type="button"
    onClick={requestOpenPalette}
    aria-label={`${PALETTE_LABEL} 열기 (단축키 Command 또는 Control K)`}
    aria-keyshortcuts="Meta+K Control+K"
    className={cn(
      'inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 text-sm text-foreground-secondary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    )}
  >
    <Search className="size-4" aria-hidden="true" />
    <span className="hidden sm:inline">검색</span>
    <kbd
      aria-hidden="true"
      className="nums hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex"
    >
      ⌘K
    </kbd>
  </button>
);
