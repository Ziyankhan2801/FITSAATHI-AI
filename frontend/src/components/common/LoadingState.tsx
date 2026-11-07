
import { LoaderCircle } from 'lucide-react'

interface LoadingStateProps {
  title?: string
  description?: string
  fullScreen?: boolean
}

export default function LoadingState({
  title = 'Loading...',
  description,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-center ${
        fullScreen ? 'min-h-[60vh]' : 'min-h-48 py-10'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5f66a]/10">
        <LoaderCircle
          size={25}
          className="animate-spin text-[#c5f66a]"
        />
      </div>

      <p className="text-sm font-semibold text-white/80">{title}</p>

      {description && (
        <p className="max-w-sm text-xs leading-5 text-white/45">
          {description}
        </p>
      )}
    </div>
  )
}
