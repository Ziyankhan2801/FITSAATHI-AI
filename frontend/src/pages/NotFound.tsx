
import { ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#c5f66a]">
          ERROR 404
        </p>

        <h1 className="mt-5 text-6xl font-bold tracking-tight sm:text-8xl">
          Lost your way?
        </h1>

        <p className="mx-auto mt-6 max-w-md leading-7 text-white/55">
          This page doesn't exist yet. Let's get you back to your fitness
          journey.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-6 py-3 font-semibold text-[#10120f] transition hover:bg-[#d6ff8c]"
          >
            <Home size={18} />
            Back to home
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3 text-white/80 transition hover:bg-white/5"
          >
            <ArrowLeft size={18} />
            Go back
          </button>
        </div>
      </div>
    </main>
  )
}
