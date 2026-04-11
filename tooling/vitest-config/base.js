import { defineConfig, mergeConfig } from 'vitest/config';

/**
 * Shared Vitest configuration for @intl-ui packages.
 *
 * Each package extends this base via mergeConfig so it can override
 * environment, setup files, or coverage thresholds without duplicating
 * the core configuration.
 *
 * Kept as .js (not .ts) on purpose: Node cannot load .ts files via
 * package exports without a transpiler, and Vitest/Vite load their
 * config in a context where workspace-shared TS files fail to resolve
 * in CI even when they work locally. JSDoc types still flow through
 * editor tooling, so DX is unchanged.
 *
 * Usage:
 *
 *   // packages/<name>/vitest.config.ts
 *   import { baseConfig } from '@intl-ui/vitest-config/base';
 *   export default baseConfig;
 *
 *   // With overrides:
 *   import { defineProjectConfig } from '@intl-ui/vitest-config/base';
 *   export default defineProjectConfig({
 *     test: { environment: 'jsdom' },
 *   });
 */
export const baseConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.test.{ts,tsx}',
      'src/**/__tests__/**/*.test.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.*',
        '**/__tests__/**',
        '**/index.ts',
        'src/data/**',
        '**/*.d.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});

/**
 * Convenience helper for packages that need to add small overrides
 * without importing mergeConfig themselves.
 *
 * @param {import('vitest/config').UserConfig} [overrides]
 * @returns {import('vitest/config').UserConfig}
 */
export function defineProjectConfig(overrides = {}) {
  return mergeConfig(baseConfig, overrides);
}
