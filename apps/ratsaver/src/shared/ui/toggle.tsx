'use client';

import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

/**
 * 토글 — 퀵필터 칩(aria-pressed) 베이스.
 * on 상태 = 행동색(primary). 칩 높이 h-9 + 좌우 패딩으로 44px 탭영역 확보.
 */
const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-price data-[state=on]:text-price-foreground data-[state=on]:shadow-none motion-reduce:transition-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-card text-foreground-secondary shadow-e1',
        ghost: 'bg-transparent',
      },
      size: {
        // off = 투명 + hairline(채움 0, 노이즈↓) / on = emerald price 액센트(비비드 신호)
        chip: 'h-9 rounded-full border border-border bg-transparent px-4 text-[13px] font-medium text-muted-foreground shadow-none transition-colors hover:border-foreground-secondary/30 hover:text-foreground-secondary data-[state=on]:border-price data-[state=on]:bg-price data-[state=on]:text-price-foreground data-[state=on]:shadow-none',
        default: 'h-10 px-4',
        sm: 'h-8 px-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));
Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };
