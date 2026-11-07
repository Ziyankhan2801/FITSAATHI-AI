
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-400/10 text-red-300">
        <AlertCircle size={24} />
      </div>

      <h3 className="mt-4 font-semibold text-white">{title}</h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-200/70">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#c5f66a] px-5 py-2.5 text-sm font-semibold text-[#10120f] transition hover:bg-[#d6ff8c]"
        >
          <RefreshCw size={16} />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
