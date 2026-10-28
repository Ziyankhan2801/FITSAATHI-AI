
import { ArrowLeft, Construction } from 'lucide-react'
import { Link } from 'react-router-dom'

type PlaceholderPageProps = {
  title: string
  description: string
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 text-[#c5f66a]">
        <Construction size={30} />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#c5f66a]">
        Under development
      </p>

      <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
        {title}
      </h2>

      <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
        {description}
      </p>

      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] transition hover:bg-[#d6ff8c]"
      >
        <ArrowLeft size={17} />
        Back to dashboard
      </Link>
    </section>
  )
}
