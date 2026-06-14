import { z } from 'zod';

/**
 * Web Vitals 비콘 페이로드 스키마 — 클라이언트 비콘과 수집 라우트의 단일 출처.
 * 시스템 경계(POST 바디)에서 Zod로 검증한다(입력 검증 규칙).
 */
export const vitalsPayloadSchema = z.object({
  name: z.enum(['LCP', 'INP', 'CLS', 'TTFB']),
  value: z.number().finite().nonnegative(),
  route: z.string().min(1).max(512),
  id: z.string().min(1).max(128).optional(),
});

export type TVitalsPayload = z.infer<typeof vitalsPayloadSchema>;
export type TVitalName = TVitalsPayload['name'];
