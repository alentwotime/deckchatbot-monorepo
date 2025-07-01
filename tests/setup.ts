import { vi } from 'vitest'

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'silent'
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  // Restore console methods
  vi.restoreAllMocks()
})

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})

afterEach(() => {
  // Clean up after each test
  vi.clearAllTimers()
})

// Global test utilities
global.testUtils = {
  // Helper function to create mock promises
  createMockPromise: <T>(value: T, shouldReject = false) => {
    return shouldReject ? Promise.reject(value) : Promise.resolve(value)
  },
  
  // Helper function to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper function to create mock functions with return values
  createMockFn: <T>(returnValue?: T) => {
    return vi.fn().mockReturnValue(returnValue)
  }
}

// Extend global types for TypeScript
declare global {
  var testUtils: {
    createMockPromise: <T>(value: T, shouldReject?: boolean) => Promise<T>
    waitFor: (ms: number) => Promise<void>
    createMockFn: <T>(returnValue?: T) => any
  }
}
