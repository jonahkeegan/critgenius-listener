import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App Component', () => {
  it('should render without crashing', () => {
    render(<App />)
    expect(document.body).toBeDefined()
  })

  it('should render the main application', () => {
    const { container } = render(<App />)
    // This is a basic smoke test - we'll expand it as we build the actual App component
    expect(container.firstChild).toBeDefined()
  })
})
