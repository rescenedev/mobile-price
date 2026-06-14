/**
 * 타입드 JSON KV 헬퍼. KVNamespace 위에 JSON 직렬화/역직렬화를 얹는다.
 * 바인딩은 `@/shared/env`의 createEnvAccessor(env).get('CACHE'|'SESSION')로 얻는다.
 */

export const kvGetJson = async <T>(kv: KVNamespace, key: string): Promise<T | null> => {
  const value = await kv.get(key, 'json');
  return (value as T | null) ?? null;
};

export const kvSetJson = async <T>(
  kv: KVNamespace,
  key: string,
  value: T,
  ttlSec?: number,
): Promise<void> => {
  const options = ttlSec !== undefined ? { expirationTtl: ttlSec } : undefined;
  await kv.put(key, JSON.stringify(value), options);
};

export const kvDelete = async (kv: KVNamespace, key: string): Promise<void> => {
  await kv.delete(key);
};
