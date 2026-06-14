'use client';

import { ToggleGroup, ToggleGroupItem } from '@/shared/ui';
import { QUICK_CHIPS } from '@/shared/config';
import type { IFilterState } from '@/features/plan-filter';

interface IQuickChipsProps {
  readonly value: readonly string[];
  readonly onChange: (chips: IFilterState['chips']) => void;
}

/**
 * 퀵필터 칩 4종(클라) — toggle-group multiple. on=primary(행동색).
 * aria-pressed는 Radix toggle이 제공. 칩 h-9 + 패딩으로 44px 탭영역.
 */
export const QuickChips = ({ value, onChange }: IQuickChipsProps): React.JSX.Element => (
  <ToggleGroup
    type="multiple"
    size="chip"
    value={value as string[]}
    onValueChange={(next) => onChange(next as IFilterState['chips'])}
    aria-label="빠른 필터"
  >
    {QUICK_CHIPS.map((chip) => (
      <ToggleGroupItem key={chip.key} value={chip.key} className="shrink-0">
        {chip.label}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
);
