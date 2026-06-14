import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import localFont from 'next/font/local';
import { WebVitals } from '@/shared/perf/WebVitals';
import { SessionBeacon } from '@/shared/perf/SessionBeacon';
import { SiteHeader } from '@/widgets/site-header';
import { Disclaimer } from '@/widgets/disclaimer';
import { CommandMenu } from '@/features/command-palette';
import { Toaster, TooltipProvider } from '@/shared/ui';

// Pretendard Variable self-host(CLS 0). 외부 폰트 CDN 호출 0.
const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  variable: '--font-sans',
  weight: '400 800',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  title: '최저가 요금제 — 정직한 알뜰폰 요금제 비교',
  description:
    '프로모가와 종료 후 정가를 함께 보여주는 정직한 알뜰폰 요금제 비교·추천·절약 계산기. 가입·광고 없이 3초 만에.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body className="font-sans antialiased">
        <TooltipProvider delayDuration={200}>
          <SiteHeader />
          <main className="mx-auto min-h-[calc(100vh-7.5rem)] max-w-screen-xl px-5 py-12 sm:px-6 sm:py-16 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-border bg-background-subtle">
            <div className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8">
              <Disclaimer />
              <nav aria-label="푸터 메뉴" className="mt-3">
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <li>
                    <Link href="/" className="hover:text-foreground">
                      요금제
                    </Link>
                  </li>
                  <li>
                    <Link href="/recommend" className="hover:text-foreground">
                      추천
                    </Link>
                  </li>
                  <li>
                    <Link href="/calculator" className="hover:text-foreground">
                      절약 계산기
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </footer>
          <Toaster />
          <CommandMenu />
        </TooltipProvider>
        <WebVitals />
        <SessionBeacon />
      </body>
    </html>
  );
}
