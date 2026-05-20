export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-6xl mx-auto w-full animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-20 rounded-full bg-[var(--elevated)]" />
          <div className="h-8 w-32 rounded-[var(--radius-md)] bg-[var(--elevated)]" />
        </div>
        <div className="h-10 w-28 rounded-[var(--radius-xl)] bg-[var(--elevated)]" />
      </div>
      <div className="h-10 rounded-[var(--radius-md)] bg-[var(--elevated)]" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-[var(--radius-md)] bg-[var(--elevated)]" />
        ))}
      </div>
    </div>
  )
}
