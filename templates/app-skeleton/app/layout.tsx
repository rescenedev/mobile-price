import './globals.css';
import type { ReactNode } from 'react';
import { WebVitals } from '@/shared/perf/WebVitals';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  );
}
