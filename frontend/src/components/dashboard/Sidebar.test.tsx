import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar'

describe('Sidebar', () => {
  it('renders all main navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Main navigation',
    })

    expect(navigation).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /My Workouts/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Exercise Library/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Workout History/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Progress/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /AI Fitness Coach/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /AI Camera Coach/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Nutrition/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /My Schedule/ })).toBeInTheDocument()
  })

  it('renders the Settings link', () => {
    render(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/dashboard/settings',
    )
  })

  it('marks the current route as active', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/workouts']}>
        <Sidebar isOpen={false} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: /My Workouts/ }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('calls onClose when a navigation link is clicked', () => {
    const onClose = vi.fn()

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isOpen onClose={onClose} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: /My Workouts/ }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the overlay and closes when it is clicked', () => {
    const onClose = vi.fn()

    render(
      <MemoryRouter>
        <Sidebar isOpen onClose={onClose} />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Close navigation overlay' }),
    )

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})