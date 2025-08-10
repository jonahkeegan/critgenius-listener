import { describe, it, expect } from 'vitest'
import { version } from './version'

describe('Version Module', () => {
  it('should export a version string', () => {
    expect(version).toBeDefined()
    expect(typeof version).toBe('string')
  })

  it('should follow semantic versioning pattern', () => {
    // Basic semantic versioning pattern: X.Y.Z
    const semverPattern = /^\d+\.\d+\.\d+$/
    expect(version).toMatch(semverPattern)
  })
})
