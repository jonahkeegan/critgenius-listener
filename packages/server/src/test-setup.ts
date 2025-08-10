import { vi } from 'vitest'

// Mock dotenv for testing
vi.mock('dotenv', () => ({
  config: vi.fn()
}))

// Setup test environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.ASSEMBLYAI_API_KEY = 'test-api-key'
