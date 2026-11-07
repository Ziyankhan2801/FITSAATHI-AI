import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingState from './LoadingState'

describe('LoadingState', () => {
  it('renders the default loading title', () => {
    render(<LoadingState />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders a custom title', () => {
    render(<LoadingState title="Loading dashboard" />)

    expect(screen.getByText('Loading dashboard')).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <LoadingState
        title="Please wait"
        description="Your data is being loaded."
      />,
    )

    expect(
      screen.getByText('Your data is being loaded.'),
    ).toBeInTheDocument()
  })

  it('does not render a description when not provided', () => {
    render(<LoadingState />)

    expect(screen.queryByText('Your data is being loaded.')).not.toBeInTheDocument()
  })

  it('has an accessible status role', () => {
    render(<LoadingState />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('applies fullscreen styling when enabled', () => {
    render(<LoadingState fullScreen />)

    expect(screen.getByRole('status')).toHaveClass('min-h-[60vh]')
  })
})