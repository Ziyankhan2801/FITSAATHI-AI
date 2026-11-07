import { useState, type FormEvent } from 'react'
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../../services/api'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const uid = searchParams.get('uid') ?? ''
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!uid || !token) {
      setError('This password reset link is invalid or incomplete.')
      return
    }

    if (password !== passwordConfirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const response = await confirmPasswordReset({
        uid,
        token,
        password,
        password_confirm: passwordConfirm,
      })

      navigate('/login', {
        replace: true,
        state: { message: response.message },
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reset your password. The link may have expired.',
      )
    } finally {
      setLoading(false)
    }
  }

  const invalidLink = !uid || !token

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#10120f] px-4 py-10 text-[#f4f5f0]">
      <section className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#c5f66a] text-[#10120f]">
            <Activity size={24} />
          </span>
          <span className="text-xl font-bold">
            FitSaathi<span className="text-[#c5f66a]">.ai</span>
          </span>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#191c17] p-6 shadow-2xl sm:p-9">
          <div className="mb-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c5f66a]/10 text-[#c5f66a]">
              <LockKeyhole size={26} />
            </span>

            <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-[#c5f66a]">
              ACCOUNT SECURITY
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Create new password
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Choose a strong password to secure your FitSaathi account.
            </p>
          </div>

          {invalidLink ? (
            <div
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm leading-6 text-red-300"
            >
              This password reset link is invalid or incomplete. Please
              request a new reset link.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm text-white/75"
                >
                  New password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10120f] px-4 focus-within:border-[#c5f66a]/60">
                  <LockKeyhole
                    size={18}
                    className="shrink-0 text-white/40"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-white/30"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-white/45 transition hover:text-[#c5f66a]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="passwordConfirm"
                  className="mb-2 block text-sm text-white/75"
                >
                  Confirm new password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10120f] px-4 focus-within:border-[#c5f66a]/60">
                  <LockKeyhole
                    size={18}
                    className="shrink-0 text-white/40"
                  />

                  <input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={passwordConfirm}
                    onChange={(event) =>
                      setPasswordConfirm(event.target.value)
                    }
                    placeholder="Confirm new password"
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-white/30"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordConfirm((visible) => !visible)
                    }
                    aria-label={
                      showPasswordConfirm
                        ? 'Hide confirmation password'
                        : 'Show confirmation password'
                    }
                    className="text-white/45 transition hover:text-[#c5f66a]"
                  >
                    {showPasswordConfirm ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs leading-5 text-white/40">
                Use at least 8 characters. Your password must also meet
                FitSaathi's password security requirements.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3.5 font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={17} />
                {loading ? 'Updating password...' : 'Reset password'}
              </button>
            </form>
          )}

          <Link
            to="/login"
            className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-white/55 transition hover:text-[#c5f66a]"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>

        <p className="mt-6 text-center text-xs leading-6 text-white/35">
          Your journey, your pace. Keep your account secure.
        </p>
      </section>
    </main>
  )
}