export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded-full bg-[var(--elevated)]" />
          <div className="h-8 w-32 rounded-[var(--radius-md)] bg-[var(--elevated)]" />
        </div>
        <div className="h-10 w-28 rounded-[var(--radius-xl)] bg-[var(--elevated)]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-[var(--radius-lg)] bg-[var(--elevated)]" />
        ))}
      </div>
      <div className="h-64 rounded-[var(--radius-lg)] bg-[var(--elevated)]" />
    </div>
  )
}
