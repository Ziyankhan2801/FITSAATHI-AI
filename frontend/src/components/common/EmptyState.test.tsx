import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders the default title', () => {
    render(<EmptyState description="No workouts found." />)

    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })

  it('renders a custom title and description', () => {
    render(
      <EmptyState
        title="No workouts"
        description="Start your first workout."
      />,
    )

    expect(screen.getByText('No workouts')).toBeInTheDocument()
    expect(screen.getByText('Start your first workout.')).toBeInTheDocument()
  })

  it('does not render an action button by default', () => {
    render(<EmptyState description="No data available." />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders the action button when label and callback are provided', () => {
    const onAction = vi.fn()

    render(
      <EmptyState
        description="No workouts found."
        actionLabel="Create workout"
        onAction={onAction}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Create workout' }),
    ).toBeInTheDocument()
  })

  it('calls the action callback when button is clicked', () => {
    const onAction = vi.fn()

    render(
      <EmptyState
        description="No workouts found."
        actionLabel="Create workout"
        onAction={onAction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Create workout' }))

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('does not render the button when callback is missing', () => {
    render(
      <EmptyState
        description="No workouts found."
        actionLabel="Create workout"
      />,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})