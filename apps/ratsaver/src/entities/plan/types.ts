/**
 * plan 도메인 타입 — 단일 출처(entities/plan).
 * Drizzle row(`src/shared/db/schema`)와 1:1로 매핑되며, repository는 row→Plan으로 정규화한다.
 *
 * 정직성 계약 4필드: regularPrice·promoMonths·throttleKbps·lastVerifiedAt
 * (PRD wedge — 프로모션 종료 후 정가 병기·검증일 면책).
 */

/** 임대 망(MVNO 포함). 모요 실데이터 근사: 3망 균등 분포. */
export type TNetwork = 'SKT' | 'KT' | 'LGU';

/** 통신 세대. */
export type TTech = 'LTE' | '5G';

/** 약정 유형. */
export type TContract = 'none' | '12m' | '24m';

/** 가입 형태(참고용). */
export type TSignupType = 'online' | 'offline' | 'both';

/**
 * 요금제 도메인 모델 (18 표시필드).
 * 파생값(절약액·추천점수)은 저장하지 않고 런타임 클라 순수함수로 계산한다.
 */
export interface Plan {
  /** PK · URL 슬러그 (예: `hello-15g-lifelong`). */
  readonly id: string;
  /** 통신사(브랜드)명. 예: "헬로모바일", "SKT". */
  readonly carrier: string;
  /** 임대 망. */
  readonly network: TNetwork;
  /** 통신 세대. */
  readonly tech: TTech;
  /** 알뜰폰 여부(true=MVNO / false=MNO 직영). */
  readonly mvno: boolean;
  /** 요금제명. */
  readonly name: string;
  /** 월 기본 데이터(GB). 완전 무제한이면 null. */
  readonly dataGb: number | null;
  /** 데이터 완전 무제한 여부. */
  readonly dataUnlimited: boolean;
  /** 기본 데이터 소진 후 속도(Kbps). 차단/추가과금이면 null. */
  readonly throttleKbps: number | null;
  /** 통화 무제한 여부. */
  readonly callUnlimited: boolean;
  /** 월 음성통화(분). 무제한이면 null. */
  readonly callMinutes: number | null;
  /** 문자 무제한 여부. */
  readonly smsUnlimited: boolean;
  /** 월 문자(건). 무제한이면 null. */
  readonly smsCount: number | null;
  /** 현재(프로모션) 월요금(원). */
  readonly monthlyPrice: number;
  /** 프로모션 종료 후 정가(원). 프로모션 없으면 monthlyPrice와 동일. */
  readonly regularPrice: number;
  /** 프로모션 유지 개월. 0=평생(프로모션 없음). */
  readonly promoMonths: number;
  /** 약정 유형. */
  readonly contract: TContract;
  /** 가입 형태(참고). */
  readonly signupType: TSignupType;
  /** 사은품 개수(없으면 0). */
  readonly giftCount: number;
  /** 비고/프로모션 조건. */
  readonly notes: string | null;
  /** 데이터 검증일(ISO date `YYYY-MM-DD`). 정직성·면책용. */
  readonly lastVerifiedAt: string;
}
