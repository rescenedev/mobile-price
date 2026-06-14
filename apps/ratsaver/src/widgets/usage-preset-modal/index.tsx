'use client';

import { useId, useState } from 'react';
import {
  USAGE_PRESETS,
  type IUsage,
  type TUsagePresetKey,
} from '@/features/plan-recommend';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from '@/shared/ui';
import { cn } from '@/shared/lib';
import { trackEvent, EVENTS } from '@/shared/perf';

interface IUsagePresetModalProps {
  /** 적용된 사용량을 부모(추천 패널)로 전달. */
  readonly onApply: (usage: IUsage) => void;
  /** 트리거 버튼 라벨. */
  readonly triggerLabel?: string;
}

/**
 * 사용량 프리셋 모달(클라, next/dynamic lazy 대상).
 * 탭: [프리셋 5종 toggle-group] / [직접입력]. 선택→onApply(usage). Dialog 포커스 트랩(Radix).
 */
export const UsagePresetModal = ({
  onApply,
  triggerLabel = '사용량 선택하기',
}: IUsagePresetModalProps): React.JSX.Element => {
  const dataId = useId();
  const callId = useId();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<TUsagePresetKey | ''>('');
  const [dataGb, setDataGb] = useState('');
  const [callMin, setCallMin] = useState('');

  const onOpenChange = (next: boolean): void => {
    setOpen(next);
    if (next) trackEvent(EVENTS.OPEN_USAGE_PRESET);
  };

  const applyPreset = (key: string): void => {
    setPreset(key as TUsagePresetKey);
    const found = USAGE_PRESETS.find((p) => p.key === key);
    if (found) {
      trackEvent(EVENTS.SELECT_USAGE_PRESET, { preset_id: key });
      onApply(found.usage);
      setOpen(false);
    }
  };

  const applyDirect = (): void => {
    const d = Number.parseInt(dataGb, 10);
    const c = Number.parseInt(callMin, 10);
    onApply({
      dataGb: Number.isFinite(d) && d >= 0 ? d : 0,
      callMinutes: Number.isFinite(c) && c >= 0 ? c : 0,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>내 사용량 선택</DialogTitle>
          <DialogDescription>
            평소 사용 패턴을 고르면 가장 잘 맞는 요금제를 추천해 드려요.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="preset">
          <TabsList className="w-full">
            <TabsTrigger value="preset">프리셋</TabsTrigger>
            <TabsTrigger value="direct">직접 입력</TabsTrigger>
          </TabsList>

          <TabsContent value="preset">
            <ToggleGroup
              type="single"
              value={preset}
              onValueChange={applyPreset}
              className="grid grid-cols-1 gap-2"
              aria-label="사용량 프리셋"
            >
              {USAGE_PRESETS.map((p) => (
                <ToggleGroupItem
                  key={p.key}
                  value={p.key}
                  className={cn(
                    'h-auto w-full justify-start gap-3 rounded-xl bg-muted px-4 py-3.5 text-left shadow-none data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:shadow-none data-[state=on]:ring-2 data-[state=on]:ring-primary',
                  )}
                >
                  <span className="text-xl" aria-hidden="true">
                    {p.emoji}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{p.label}</span>
                    <span className="nums text-xs text-foreground-secondary">
                      데이터 {p.usage.dataGb}GB · 통화 {p.usage.callMinutes}분
                    </span>
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </TabsContent>

          <TabsContent value="direct">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={dataId}>월 데이터 사용량 (GB)</Label>
                <Input
                  id={dataId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="예: 15"
                  value={dataGb}
                  onChange={(e) => setDataGb(e.target.value)}
                  className="nums"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={callId}>월 통화량 (분)</Label>
                <Input
                  id={callId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="예: 200"
                  value={callMin}
                  onChange={(e) => setCallMin(e.target.value)}
                  className="nums"
                />
              </div>
              <Button onClick={applyDirect} className="w-full">
                이 사용량으로 추천받기
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
