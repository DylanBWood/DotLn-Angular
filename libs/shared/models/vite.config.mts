import { defineConfig } from 'vitest/config';
export default defineConfig({
  root: import.meta.dirname,
  test: {
    name: 'models',
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    maxWorkers: 2,
  },
});
