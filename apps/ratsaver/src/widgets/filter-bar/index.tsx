'use client';

import { useId } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import type { IFilterState } from '@/features/plan-filter';
import { SORT_OPTIONS, PRICE_RANGE, DATA_RANGE } from '@/shared/config';
import type { TPlanSort } from '@/shared/db';
import {
  Button,
  Input,
  Label,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui';
import { QuickChips } from './quick-chips';

interface IFilterBarProps {
  readonly state: IFilterState;
  readonly onChange: (next: IFilterState) => void;
  readonly resultCount: number;
}

const NETWORKS = [
  { value: 'all', label: '전체 망' },
  { value: 'SKT', label: 'SKT' },
  { value: 'KT', label: 'KT' },
  { value: 'LGU', label: 'LGU' },
] as const;

/**
 * FilterBar(클라) — 퀵칩 + 상세필터(가격·데이터·망) + 정렬.
 * 상세필터는 모바일에서 Sheet(바텀)로 격납. 상태는 부모(page)가 searchParams에 직렬화.
 * 각 컨트롤 label 연결(a11y).
 */
export const FilterBar = ({
  state,
  onChange,
  resultCount,
}: IFilterBarProps): React.JSX.Element => {
  const priceId = useId();
  const dataId = useId();
  const networkId = useId();
  const sortId = useId();

  const set = (patch: Partial<IFilterState>): void => onChange({ ...state, ...patch });

  const detailFields = (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label htmlFor={priceId}>최대 월요금 (원)</Label>
        <Input
          id={priceId}
          type="number"
          inputMode="numeric"
          min={PRICE_RANGE.min}
          max={PRICE_RANGE.max}
          step={PRICE_RANGE.step}
          placeholder="제한 없음"
          value={state.priceMax ?? ''}
          onChange={(e) =>
            set({ priceMax: e.target.value === '' ? null : Number.parseInt(e.target.value, 10) })
          }
          className="nums"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={dataId}>최소 데이터 (GB)</Label>
        <Input
          id={dataId}
          type="number"
          inputMode="numeric"
          min={DATA_RANGE.min}
          max={DATA_RANGE.max}
          step={DATA_RANGE.step}
          placeholder="제한 없음"
          value={state.dataMin ?? ''}
          onChange={(e) =>
            set({ dataMin: e.target.value === '' ? null : Number.parseInt(e.target.value, 10) })
          }
          className="nums"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={networkId}>통신망</Label>
        <Select
          value={state.network ?? 'all'}
          onValueChange={(v) =>
            set({ network: v === 'all' ? null : (v as IFilterState['network']) })
          }
        >
          <SelectTrigger id={networkId} aria-label="통신망 선택">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((n) => (
              <SelectItem key={n.value} value={n.value}>
                {n.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="sticky top-16 z-30 -mx-5 bg-background/90 px-5 py-3 shadow-[0_1px_0_0_hsl(var(--border))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:bg-card sm:px-5 sm:py-4 sm:shadow-e1">
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* ① 한 줄 헤더: 결과수(좌) + 정렬(우) — 부유 드롭다운 제거, 한 행에 정착(토스 리스트 헤더) */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-foreground-secondary" aria-live="polite">
            <span className="nums text-base font-bold text-foreground">{resultCount}</span>
            <span className="ml-1">개 요금제</span>
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor={sortId} className="hidden text-sm text-foreground-secondary sm:inline">
              정렬
            </Label>
            <Select value={state.sort} onValueChange={(v) => set({ sort: v as TPlanSort })}>
              <SelectTrigger id={sortId} className="h-9 w-[8.5rem] rounded-lg" aria-label="정렬 기준">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 구분선 제거 — 여백(gap-4)으로만 구획(refine §6-1) */}

        {/* ② 퀵칩 행 + 모바일 상세필터 버튼 */}
        <div className="flex items-center gap-2">
          <ScrollArea className="min-w-0 flex-1 whitespace-nowrap">
            <QuickChips value={state.chips} onChange={(chips) => set({ chips })} />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="shrink-0 lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <SlidersHorizontal aria-hidden="true" />
                  필터
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom">
                <SheetHeader>
                  <SheetTitle>상세 필터</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{detailFields}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* ③ lg+ 인라인 상세필터(정돈된 3열) */}
        <div className="hidden lg:block">{detailFields}</div>
      </div>
    </div>
  );
};
