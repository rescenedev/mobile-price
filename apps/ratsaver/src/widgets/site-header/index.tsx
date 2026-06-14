import Link from 'next/link';
import { Zap } from 'lucide-react';
import { cn } from '@/shared/lib';
import { CommandPaletteHint } from '@/features/command-palette';

interface INavItem {
  readonly href: string;
  readonly label: string;
}

const NAV: readonly INavItem[] = [
  { href: '/', label: '요금제' },
  { href: '/compare', label: '비교' },
  { href: '/recommend', label: '추천' },
  { href: '/calculator', label: '계산기' },
];

/**
 * 전역 헤더(서버 컴포넌트) — sticky, 텍스트 로고(이미지 미사용 → LCP/CLS 안전).
 * 모바일은 핵심 4링크 압축 가로 배치, lg+ 인라인.
 */
export const SiteHeader = (): React.JSX.Element => (
  <header className="sticky top-0 z-40 bg-card/80 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-card/70">
    <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
      <Link
        href="/"
        aria-label="최저가 요금제 홈"
        className="group flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {/* 브랜드 마크 — emerald price 액센트(브랜드 단일 색 포인트). size 고정(32px)으로 CLS 0. */}
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-price text-price-foreground">
          <Zap className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <span className="text-lg font-bold tracking-tight text-foreground">최저가 요금제</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-1 sm:gap-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium text-foreground-secondary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-3',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <CommandPaletteHint />
      </div>
    </div>
  </header>
);
