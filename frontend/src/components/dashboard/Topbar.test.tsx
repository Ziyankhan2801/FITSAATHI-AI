import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { logoutUser } from '../../services/api'
import Topbar from './Topbar'

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  logoutUser: vi.fn(),
}))

function LocationDisplay() {
  const location = useLocation()

  return <p>Current path: {location.pathname}</p>
}

describe('Topbar', () => {
  const refreshUser = vi.fn()
  const onMenuClick = vi.fn()

  beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(useAuth).mockReturnValue({
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    },
    isLoading: false,
    refreshUser,
  })
})

  function renderTopbar() {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Topbar onMenuClick={onMenuClick} />

        <Routes>
          <Route path="*" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('renders the dashboard heading', () => {
    renderTopbar()

    expect(screen.getByText('Welcome to FitSaathi')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your dashboard' })).toBeInTheDocument()
  })

  it('calls onMenuClick when navigation menu is clicked', () => {
    renderTopbar()

    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' }),
    )

    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })

  it('opens the profile menu and displays user details', () => {
    renderTopbar()

    fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }))

    expect(screen.getByText('testuser')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument()
  })

  it('navigates to Settings from the profile menu', () => {
    renderTopbar()

    fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))

    expect(screen.getByText('Current path: /dashboard/settings')).toBeInTheDocument()
  })

  it('logs out successfully and navigates to login', async () => {
    vi.mocked(logoutUser).mockResolvedValueOnce({
  status: 'success',
  message: 'Logged out successfully',
})

    renderTopbar()

    fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalledTimes(1)
      expect(refreshUser).toHaveBeenCalledTimes(1)
      expect(screen.getByText('Current path: /login')).toBeInTheDocument()
    })
  })

  it('shows an error when logout fails', async () => {
    vi.mocked(logoutUser).mockRejectedValueOnce(new Error('Network error'))

    renderTopbar()

    fireEvent.click(screen.getByRole('button', { name: 'Open profile menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Logout failed. Please try again.')
  })
})