import * as React from 'react';
import { cn } from '@/shared/lib/utils';

/** 고정 높이 스켈레톤(CLS 0). 애니메이션은 prefers-reduced-motion 존중. */
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element => (
  <div
    className={cn('animate-pulse rounded-2xl bg-muted motion-reduce:animate-none', className)}
    {...props}
  />
);

export { Skeleton };
