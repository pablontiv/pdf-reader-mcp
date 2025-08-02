import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/**/*.test.ts',
      'src/**/*.spec.ts'
    ],
    exclude: [
      'node_modules', 
      'dist',
      'coverage',
      '**/*.d.ts'
    ],
    // Coverage configuration for comprehensive testing
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    // Timeout configuration for PDF processing tests
    testTimeout: 30000, // 30 seconds for PDF processing operations
    hookTimeout: 10000, // 10 seconds for setup/teardown
    // Security and performance settings
    maxConcurrency: 5, // Limit concurrent tests to avoid resource exhaustion
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    // Error handling
    bail: 0, // Don't stop on first failure for comprehensive testing
    // Logging
    reporter: ['verbose'],
    // TypeScript support
    typecheck: {
      checker: 'tsc',
      include: ['src/**/*.test.ts', 'src/**/*.spec.ts']
    }
  },
});