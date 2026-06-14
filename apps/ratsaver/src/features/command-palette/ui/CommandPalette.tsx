'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calculator,
  Columns3,
  ListFilter,
  Sparkles,
  Ban,
  Infinity as InfinityIcon,
  Smartphone,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { TQuickChipKey } from '@/shared/config';
import { formatKrw } from '@/entities/plan';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/shared/ui/command';
import { cn } from '@/shared/lib';
import {
  NAV_COMMANDS,
  FILTER_COMMANDS,
  PALETTE_LABEL,
  filterHref,
  planDetailHref,
} from '../model/constants';
import { searchPlans } from '../model/search';
import { usePlansSource } from '../model/usePlansSource';

interface ICommandPaletteProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/** 이동 명령 아이콘(라우트 단일 출처와 1:1). */
const NAV_ICON: Readonly<Record<string, LucideIcon>> = {
  'nav-plans': ListFilter,
  'nav-compare': Columns3,
  'nav-recommend': Sparkles,
  'nav-calculator': Calculator,
};

/** 빠른 필터 아이콘(칩 키와 1:1). */
const FILTER_ICON: Readonly<Record<TQuickChipKey, LucideIcon>> = {
  price_under_10k: Wallet,
  data_unlimited: InfinityIcon,
  mvno_only: Smartphone,
  no_contract: Ban,
};

/**
 * 커맨드 팔레트(⌘K) — cmdk 기반. next/dynamic(ssr:false)로 lazy-load되는 무거운 leaf.
 * Dialog(Radix)로 포커스 트랩·ESC·바깥클릭 닫힘. 검색 소스는 정적 plans.json(graceful).
 */
export const CommandPalette = ({ open, onOpenChange }: ICommandPaletteProps): React.JSX.Element => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { plans } = usePlansSource(open);
  const results = searchPlans(plans, query);

  const go = (href: string): void => {
    onOpenChange(false);
    setQuery('');
    router.push(href);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-label={PALETTE_LABEL}
          // 오토포커스를 CommandInput으로 고정 — Radix 기본은 Content(div)에 포커스를 둘 수 있고,
          // 그러면 keydown이 cmdk Command 루트(자식)로 전파되지 않아 ↑/↓ 네비가 죽는다.
          // 입력을 Command의 후손으로서 포커스시켜야 방향키가 cmdk 핸들러에 도달한다.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed left-1/2 top-[18%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-e3 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">{PALETTE_LABEL}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            요금제 이동·빠른 필터·요금제 검색을 키보드로 실행합니다.
          </DialogPrimitive.Description>

          <Command
            shouldFilter={false}
            className="rounded-none"
            loop
            label={PALETTE_LABEL}
          >
            <CommandInput
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="요금제·통신사 검색 또는 명령 실행…"
              aria-label="명령 또는 요금제 검색"
            />
            <CommandList>
              <CommandEmpty>일치하는 결과가 없어요.</CommandEmpty>

              <CommandGroup heading="이동">
                {NAV_COMMANDS.map((cmd) => {
                  const Icon = NAV_ICON[cmd.id] ?? ArrowRight;
                  return (
                    <CommandItem
                      key={cmd.id}
                      value={`이동 ${cmd.label}`}
                      onSelect={() => go(cmd.href)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{cmd.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="빠른 필터">
                {FILTER_COMMANDS.map((cmd) => {
                  const Icon = FILTER_ICON[cmd.chip];
                  return (
                    <CommandItem
                      key={cmd.id}
                      value={`필터 ${cmd.label}`}
                      onSelect={() => go(filterHref(cmd.chip))}
                    >
                      <Icon aria-hidden="true" />
                      <span>{cmd.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {results.length > 0 ? (
                <>
                  <CommandSeparator />
                  <CommandGroup heading="요금제 검색">
                    {results.map((plan) => (
                      <CommandItem
                        key={plan.id}
                        value={`plan-${plan.id}`}
                        onSelect={() => go(planDetailHref(plan.id))}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-medium text-foreground">{plan.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {plan.carrier} · {plan.network}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'nums ml-auto shrink-0 text-sm font-semibold text-price',
                          )}
                        >
                          월 {formatKrw(plan.monthlyPrice)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              ) : null}
            </CommandList>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default CommandPalette;
