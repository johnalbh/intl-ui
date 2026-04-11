import { defineProjectConfig } from '@intl-ui/vitest-config/base';

export default defineProjectConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
