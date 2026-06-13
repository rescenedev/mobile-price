import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Build output, deps, and hand-written ambient type declarations.
    ignores: [
      '.next/**',
      '.open-next/**',
      'node_modules/**',
      'next-env.d.ts',
      'worker-configuration.d.ts',
      'env.d.ts',
    ],
  },

  // Base recommended rule sets.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Next.js plugin: recommended + core-web-vitals (flat-config presets that
  // already register the @next/next plugin).
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  // Hard Threshold: the project bans `any`.
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // Test files: allow double-casting (`as unknown as T`) for test doubles.
  // no-explicit-any stays an error — tests here don't need it.
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },

  // Must be last: turn off rules that conflict with Prettier formatting.
  prettier,
);
