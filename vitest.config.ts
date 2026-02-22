// vitest.config.ts
// Purpose: Vitest configuration for unit and integration tests

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['qa/tests/**/*.test.ts', 'qa/tests/**/*.test.tsx'],
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
