import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';

/**
 * Shared Vitest configuration for @intl-ui packages.
 *
 * Each package extends this base via mergeConfig so it can override
 * environment, setup files, or coverage thresholds without duplicating
 * the core configuration.
 *
 * Usage:
 *
 *   // packages/<name>/vitest.config.ts
 *   import { mergeConfig } from 'vitest/config';
 *   import { baseConfig } from '@intl-ui/vitest-config/base';
 *
 *   export default mergeConfig(baseConfig, {
 *     test: {
 *       // package-specific overrides
 *     },
 *   });
 */
export const baseConfig = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
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
 * Convenience helper for packages that only need to add small overrides
 * without importing mergeConfig themselves.
 */
export function defineProjectConfig(overrides: UserConfig = {}): UserConfig {
  return mergeConfig(baseConfig, overrides);
}
