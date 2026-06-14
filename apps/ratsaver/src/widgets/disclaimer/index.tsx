import { formatVerifiedDate } from '@/entities/plan';

interface IDisclaimerProps {
  /** 데이터 검증일(ISO `YYYY-MM-DD`). 없으면 검증일 문구 생략. */
  readonly lastVerifiedAt?: string;
  readonly className?: string;
}

/**
 * 면책·검증일(서버 컴포넌트). date-fns 포맷(`.split('T')` 0).
 * 톤: text-xs muted, 비강조. 검증일은 시맨틱 <time>.
 */
export const Disclaimer = ({ lastVerifiedAt, className }: IDisclaimerProps): React.JSX.Element => (
  <p className={`text-xs leading-relaxed text-muted-foreground ${className ?? ''}`}>
    {lastVerifiedAt ? (
      <>
        데이터 검증일{' '}
        <time dateTime={lastVerifiedAt} className="nums">
          {formatVerifiedDate(lastVerifiedAt)}
        </time>{' '}
        ·{' '}
      </>
    ) : null}
    요금은 수시로 변동될 수 있는 큐레이션 스냅샷입니다. 가입 전 통신사에서 최종 조건을 확인하세요.
  </p>
);
