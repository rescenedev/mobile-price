import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Next는 server-only를 'react-server' 조건에서 empty.js로 해석한다.
      // vitest(node)에는 그 조건이 없어 throwing index.js가 잡히므로 동일하게 빈 스텁으로 치환.
      'server-only': path.resolve(__dirname, './node_modules/server-only/empty.js'),
    },
  },
});
