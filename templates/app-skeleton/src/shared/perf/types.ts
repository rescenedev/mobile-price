export type TCacheOutcome = 'hit' | 'miss' | 'none';

export interface IPerfSample {
  route: string;
  method: string;
  durationMs: number;
  status: number;
  cache: TCacheOutcome;
  at: number; // epoch ms, 호출자가 주입
}

export interface IPerfSink {
  record(sample: IPerfSample): void;
}

export interface ITrackOptions {
  route: string;
  method: string;
  cache?: TCacheOutcome;
  /** 테스트 주입용 시계 (ms). 기본은 호출 시 performance.now() */
  now?: () => number;
}
