
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#171a15]/60 px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/65">
        <Inbox size={27} />
      </div>

      <h3 className="mt-4 font-semibold text-white/85">{title}</h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-full bg-[#c5f66a] px-5 py-2.5 text-sm font-semibold text-[#10120f] transition hover:bg-[#d6ff8c]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
