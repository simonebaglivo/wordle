import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('test setup', () => {
  it('renders with jsdom and RTL', () => {
    render(<div>ciao</div>)
    expect(screen.getByText('ciao')).toBeInTheDocument()
  })
})
