'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-destructive">Something went wrong: {error.message}</p>
      <button onClick={reset} className="text-sm underline text-muted-foreground hover:text-foreground transition-colors">
        Try again
      </button>
    </div>
  )
}
