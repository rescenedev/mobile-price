import { describe, it, expect } from 'vitest';
import { readAeConfig } from './ae-query';

describe('readAeConfig', () => {
  it('returns null when token is missing (graceful unconfigured)', () => {
    expect(readAeConfig({ CF_ACCOUNT_ID: 'acc' })).toBeNull();
  });

  it('returns null when account id is missing', () => {
    expect(readAeConfig({ CF_AE_API_TOKEN: 'tok' })).toBeNull();
  });

  it('builds config with default dataset', () => {
    expect(readAeConfig({ CF_ACCOUNT_ID: 'acc', CF_AE_API_TOKEN: 'tok' })).toEqual({
      accountId: 'acc',
      apiToken: 'tok',
      dataset: 'app_skeleton_perf',
    });
  });

  it('honors an explicit dataset name', () => {
    expect(
      readAeConfig({ CF_ACCOUNT_ID: 'acc', CF_AE_API_TOKEN: 'tok', PERF_DATASET: 'custom' }),
    ).toMatchObject({ dataset: 'custom' });
  });
});
