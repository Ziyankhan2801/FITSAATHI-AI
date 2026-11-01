
import { useState, type FormEvent } from 'react'
import {
  Activity,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../../services/api'

export default function Register() {
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== passwordConfirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirm: passwordConfirm,
      })

      navigate('/login', {
        replace: true,
        state: { message: 'Account created successfully. Please log in.' },
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create your account. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

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
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c5f66a]">
              YOUR JOURNEY STARTS HERE
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Create your account
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Set up your account to begin your personal fitness journey.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm text-white/75">
                Username
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10120f] px-4 focus-within:border-[#c5f66a]/60">
                <UserRound size={18} className="shrink-0 text-white/40" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  minLength={1}
                  maxLength={150}
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Choose a username"
                  className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-white/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-white/75">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10120f] px-4 focus-within:border-[#c5f66a]/60">
                <Mail size={18} className="shrink-0 text-white/40" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-white/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-white/75">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10120f] px-4 focus-within:border-[#c5f66a]/60">
                <LockKeyhole size={18} className="shrink-0 text-white/40" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
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
                Confirm password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10120f] px-4 focus-within:border-[#c5f66a]/60">
                <LockKeyhole size={18} className="shrink-0 text-white/40" />
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="Re-enter your password"
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center rounded-full bg-[#c5f66a] px-5 py-3.5 font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#c5f66a] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs leading-6 text-white/35">
          Start at your own pace. Your fitness journey is personal.
        </p>
      </section>
    </main>
  )
}
