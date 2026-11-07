import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ErrorState from './ErrorState'

describe('ErrorState', () => {
  it('renders the default title', () => {
    render(<ErrorState message="Something failed." />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders the provided error message', () => {
    render(<ErrorState message="Unable to load your workouts." />)

    expect(
      screen.getByText('Unable to load your workouts.'),
    ).toBeInTheDocument()
  })

  it('renders a custom title', () => {
    render(
      <ErrorState
        title="Network error"
        message="Please check your internet connection."
      />,
    )

    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is missing', () => {
    render(<ErrorState message="Something failed." />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the default retry button label', () => {
    const onRetry = vi.fn()

    render(
      <ErrorState
        message="Something failed."
        onRetry={onRetry}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()
  })

  it('renders a custom retry button label', () => {
    render(
      <ErrorState
        message="Something failed."
        onRetry={vi.fn()}
        retryLabel="Reload data"
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Reload data' }),
    ).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn()

    render(
      <ErrorState
        message="Something failed."
        onRetry={onRetry}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('has an accessible alert role', () => {
    render(<ErrorState message="Something failed." />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})