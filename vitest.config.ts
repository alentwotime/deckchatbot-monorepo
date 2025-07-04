import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  // Test configuration
  test: {
    // Node environment
    environment: 'node',
    
    // Global test settings
    globals: true,
    
    // Setup files
    setupFiles: [
      './tests/setup.ts',
      './tests/mocks/azure.ts',
      './tests/mocks/database.ts'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/tests/**',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/mocks/**',
        '**/fixtures/**',
        '_archived_unused_code/**',
        '.github/**',
        'scripts/**',
        'docs/**'
      ],
      include: [
        'src/**/*.{js,ts}',
        'apps/**/*.{js,ts}',
        'shared/**/*.{js,ts}'
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
    
    // Test file patterns
    include: [
      '**/*.{test,spec}.{js,ts}',
      '**/tests/**/*.{js,ts}',
      '**/__tests__/**/*.{js,ts}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'build',
      '_archived_unused_code',
      '.github',
      'nginx-*'
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Concurrent tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Watch mode
    watch: false,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/results.html'
    }
  },
  
  // Path aliases (same as vite.config.ts)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'shared'),
      '@apps': resolve(__dirname, 'apps'),
      '@backend': resolve(__dirname, 'apps/backend'),
      '@frontend': resolve(__dirname, 'apps/frontend'),
      '@ai-service': resolve(__dirname, 'apps/ai-service'),
      '@docs': resolve(__dirname, 'docs'),
      '@scripts': resolve(__dirname, 'scripts'),
      '@tests': resolve(__dirname, 'tests')
    }
  },
  
  // Environment variables for testing
  define: {
    __TEST__: true,
    __DEV__: false,
    __PROD__: false
  },
  
  // External dependencies for testing
  external: [
    '@azure/identity',
    '@azure/openai',
    '@azure/cosmos',
    '@azure/storage-blob',
    '@azure/keyvault-secrets'
  ]
})
