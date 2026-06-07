import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'tests/e2e/**',
      'tests/governance/**',
      'node_modules/**',
      'dist/**',
    ],
    setupFiles: ['./tests/unit/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/utils/**/*.ts', 'src/store/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'src/services/*.ts',
        'src/api/generated/**',
      ],
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
