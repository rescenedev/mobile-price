import { z } from 'zod';
import { EVENTS, type TEventName } from './events';

const EVENT_NAMES = Object.values(EVENTS) as [TEventName, ...TEventName[]];

/**
 * AE 커스텀 이벤트 비콘 페이로드 — 클라 발화와 수집 라우트(/api/events)의 단일 출처.
 * 경계(POST 바디)에서 Zod 검증(입력 검증 규칙).
 *
 * PII 차단(Hard Threshold ③⑤):
 * - 이벤트명은 EVENTS 화이트리스트만(매직 스트링 거부).
 * - 파라미터 값은 string|number|boolean만. number는 소정수(버킷 카운트·boolean 프록시)로 제한해
 *   현재요금·절약액 같은 절대 금액이 비콘에 실리지 못하게 한다(버킷 문자열만 허용).
 */
const PARAM_VALUE_MAX_LEN = 64;
const PARAM_NUMBER_MAX = 1000; // 소정수만(카운트·bool). 금액·요금 절대값 차단.

const paramValueSchema = z.union([
  z.string().min(1).max(PARAM_VALUE_MAX_LEN),
  z.number().int().nonnegative().max(PARAM_NUMBER_MAX),
  z.boolean(),
]);

export const eventPayloadSchema = z.object({
  name: z.enum(EVENT_NAMES),
  route: z.string().min(1).max(512),
  params: z.record(z.string().min(1).max(48), paramValueSchema).default({}),
});

export type TEventPayload = z.infer<typeof eventPayloadSchema>;
