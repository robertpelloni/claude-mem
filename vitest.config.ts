import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Exclude node:test format files (they use node's native test runner)
      'tests/strip-memory-tags.test.ts',
      'tests/user-prompt-tag-stripping.test.ts',
      // Exclude bun:test format files (they use bun's test runner)
      'tests/security/command-injection.test.ts',
      'tests/services/chroma-sync-errors.test.ts',
      // Exclude tests that require bun integration
      'tests/integration/hook-execution-environments.test.ts'
    ],
  },
});
