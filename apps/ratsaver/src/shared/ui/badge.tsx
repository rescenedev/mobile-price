import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

/**
 * 배지 variant — tokens.md 3색 의미 규약.
 * default(중립: 망·세대·태그) · saving(green: 절약·무료) · warning(amber: 약정·종료후정가) · outline · mvno(알뜰폰 식별).
 * 망(SKT/KT/LGU)은 색 코드화 금지 — 텍스트 default 배지로만.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // 무채색 라벨 — 망·세대·약정 등 메타(채움 없이 텍스트만, 노이즈 0).
        default: 'bg-transparent px-0 text-foreground-secondary',
        // 무채색 채움 — 격납이 필요한 중립 태그(드물게).
        muted: 'bg-muted text-foreground-secondary',
        // 색 신호 — "절약" 컨텍스트 전용(emerald 틴트). 카드당 0~1개.
        saving: 'bg-saving-muted text-saving-muted-foreground',
        // 정직성 경고 — 종료후정가(PriceBlock 내부 전용).
        warning: 'bg-warning-muted text-warning-muted-foreground',
        outline: 'bg-card text-foreground-secondary shadow-e1',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface IBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: IBadgeProps): React.JSX.Element => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
