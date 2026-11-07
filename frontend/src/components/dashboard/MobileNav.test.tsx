import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MobileNav from './MobileNav'

describe('MobileNav', () => {
  it('renders the main mobile navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MobileNav />
      </MemoryRouter>,
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Mobile navigation',
    })

    expect(navigation).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Home/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Workouts/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Exercises/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Progress/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /AI Coach/ })).toBeInTheDocument()
  })

  it('marks the current navigation link as active', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/progress']}>
        <MobileNav />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: /Progress/ }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('opens the More menu when clicked', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MobileNav />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'More navigation options' }),
    )

    expect(screen.getByText('More sections')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /AI Camera Coach/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Nutrition/ }),
    ).toBeInTheDocument()
  })

  it('closes the More menu using the close button', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'More navigation options' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))

    expect(screen.queryByText('More sections')).not.toBeInTheDocument()
  })

  it('closes the More menu after selecting a section', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MobileNav />
      </MemoryRouter>,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'More navigation options' }),
    )

    fireEvent.click(screen.getByRole('link', { name: /Nutrition/ }))

    expect(screen.queryByText('More sections')).not.toBeInTheDocument()
  })
})