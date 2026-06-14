'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * 토스트 Toaster — "URL 복사됨"·"비교는 3개까지" 등. 라이트 고정(MVP), 토큰 색.
 * aria-live는 sonner 내부에서 제공.
 */
const Toaster = (props: React.ComponentProps<typeof SonnerToaster>): React.JSX.Element => (
  <SonnerToaster
    theme="light"
    position="bottom-center"
    toastOptions={{
      classNames: {
        toast:
          'group rounded-md border border-border bg-popover text-popover-foreground shadow-e3',
        description: 'text-muted-foreground',
      },
    }}
    {...props}
  />
);

export { Toaster };
