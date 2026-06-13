import { describe, it, expect } from 'vitest';
import { createEnvAccessor } from './index';

describe('createEnvAccessor', () => {
  it('returns the binding for a known key', () => {
    const fakeDB = { name: 'd1' } as unknown as CloudflareEnv['DB'];
    const env = { DB: fakeDB } as CloudflareEnv;
    const accessor = createEnvAccessor(env);
    expect(accessor.get('DB')).toBe(fakeDB);
  });

  it('throws a clear error when a binding is missing', () => {
    const env = {} as CloudflareEnv;
    const accessor = createEnvAccessor(env);
    expect(() => accessor.get('DB')).toThrowError(/binding "DB" is not available/);
  });
});
