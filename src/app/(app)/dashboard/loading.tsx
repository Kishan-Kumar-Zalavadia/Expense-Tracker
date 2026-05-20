export default function Loading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-full bg-[var(--elevated)]" />
          <div className="h-8 w-36 rounded-[var(--radius-md)] bg-[var(--elevated)]" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-[var(--radius-xl)] bg-[var(--elevated)]" />
          <div className="h-10 w-28 rounded-[var(--radius-xl)] bg-[var(--elevated)]" />
        </div>
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[var(--radius-lg)] bg-[var(--elevated)]" />
        ))}
      </div>
      {/* Budget cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 rounded-[var(--radius-lg)] bg-[var(--elevated)]" />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-64 rounded-[var(--radius-lg)] bg-[var(--elevated)]" />
        <div className="h-64 rounded-[var(--radius-lg)] bg-[var(--elevated)]" />
      </div>
      {/* Recent activity */}
      <div className="h-48 rounded-[var(--radius-lg)] bg-[var(--elevated)]" />
    </div>
  )
}
