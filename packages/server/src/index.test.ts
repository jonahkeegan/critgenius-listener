import { describe, it, expect, vi } from 'vitest'

describe('Server Index Module', () => {
  it('should define basic environment variables in test setup', () => {
    expect(process.env.NODE_ENV).toBe('test')
    expect(process.env.PORT).toBe('3001')
    expect(process.env.ASSEMBLYAI_API_KEY).toBe('test-api-key')
  })

  it('should have console available for logging', () => {
    expect(global.console).toBeDefined()
    expect(typeof console.log).toBe('function')
  })

  it('should mock dotenv config', async () => {
    // Test that dotenv is mocked (from test-setup.ts)
    const dotenv = vi.mocked(await import('dotenv'))
    expect(dotenv.config).toBeDefined()
    expect(vi.isMockFunction(dotenv.config)).toBe(true)
  })
})
