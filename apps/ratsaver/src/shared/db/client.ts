import 'server-only';
import { drizzle } from 'drizzle-orm/d1';
import { getServerContext } from '@/shared/env/context';
import { createEnvAccessor } from '@/shared/env';
import * as schema from './schema';

/**
 * D1 바인딩으로 Drizzle 클라이언트를 만든다(주입 가능 — 테스트 용이).
 * 바인딩은 @/shared/env 통로(createEnvAccessor(env).get('DB'))로만 얻는다(Hard Threshold ②).
 */
export const createDb = (d1: D1Database) => drizzle(d1, { schema });

export type TDb = ReturnType<typeof createDb>;

/**
 * 서버 컨텍스트에서 D1 Drizzle 클라이언트를 얻는다.
 * 진입점은 getServerContext().env(next-on-pages getRequestContext) → 즉시 createEnvAccessor로 감싼다(직접 접근 0).
 */
export const getDb = (): TDb => {
  const { env } = getServerContext();
  const d1 = createEnvAccessor(env).get('DB');
  return createDb(d1);
};
