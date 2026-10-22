import { defineConfig } from 'vitest/config';

// Firestore ve Storage güvenlik kuralı testleri — emülatör gerektirir (npm run test:rules).
export default defineConfig({
  test: {
    root: __dirname,
    include: ['*.test.ts'],
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
