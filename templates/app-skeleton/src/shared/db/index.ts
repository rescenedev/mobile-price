import 'server-only';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

/**
 * D1 바인딩으로 Drizzle 클라이언트를 만든다.
 * 바인딩은 `@/shared/env`의 createEnvAccessor(env).get('DB')로만 얻는다(Hard Threshold ②).
 */
export const createDb = (d1: D1Database) => drizzle(d1, { schema });

export type TDb = ReturnType<typeof createDb>;

export { schema };
export * from './schema';
