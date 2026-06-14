import type { IEnvAccessor, TBindingKey } from './types';

export const createEnvAccessor = (env: CloudflareEnv): IEnvAccessor => ({
  get<K extends TBindingKey>(key: K): CloudflareEnv[K] {
    const value = env[key];
    if (value === undefined || value === null) {
      throw new Error(`Cloudflare binding "${key}" is not available in this context`);
    }
    return value;
  },
});
