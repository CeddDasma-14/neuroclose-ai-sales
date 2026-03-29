export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-2">
      <h2 className="text-xl font-semibold">Page Not Found</h2>
      <a href="/" className="text-sm text-muted-foreground underline hover:text-foreground transition-colors">
        Back to Dashboard
      </a>
    </div>
  )
}
