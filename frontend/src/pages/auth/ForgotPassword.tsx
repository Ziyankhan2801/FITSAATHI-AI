import { useState, type FormEvent } from 'react'
import { Activity, ArrowLeft, Mail, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await requestPasswordReset(email.trim())
      setSuccess(response.message)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to process your request. Please try again.',
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
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c5f66a]/10 text-[#c5f66a]">
              <Mail size={26} />
            </span>

            <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-[#c5f66a]">
              ACCOUNT RECOVERY
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Forgot password?
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/50">
              No worries! Enter your registered email address and we'll
              help you reset your password.
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

          {success && (
            <div
              role="status"
              className="mb-5 rounded-xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 px-4 py-3 text-sm leading-6 text-[#c5f66a]"
            >
              {success}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm text-white/75"
                >
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
                    placeholder="Enter your registered email"
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-white/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3.5 font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={17} />
                {loading ? 'Sending request...' : 'Send reset link'}
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
          Your account security matters to us.
        </p>
      </section>
    </main>
  )
}