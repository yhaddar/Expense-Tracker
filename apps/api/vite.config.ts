import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@expense-tracker/db': resolve(
        __dirname,
        '../../packages/db/src/index.ts',
      ),
      '@expense-tracker/domain': resolve(
        __dirname,
        '../../packages/domain/src/index.ts',
      ),
    },
  },
  test: { environment: 'node' },
});
