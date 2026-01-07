import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, './src/common'),
      '@main': path.resolve(__dirname, './src/main'),
    },
  },
});