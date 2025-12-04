import { defineConfig, mergeConfig } from 'vitest/config'
import rootConfig from '../../vitest.config'

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      name: '@khipu/api',
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.spec.ts',
          'src/__tests__/**',
          'src/index.ts',
        ],
        all: true,
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      setupFiles: ['./src/__tests__/setup.ts'],
    },
  })
)
