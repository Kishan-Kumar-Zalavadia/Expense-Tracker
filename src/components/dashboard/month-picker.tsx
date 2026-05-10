'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'

interface MonthPickerProps {
  year: number
  month: number
}

export function MonthPicker({ year, month }: MonthPickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const current = new Date(year, month - 1, 1)
  const label = format(current, 'MMMM yyyy')

  const navigate = (date: Date) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', format(date, 'yyyy-MM'))
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => navigate(subMonths(current, 1))}
        className="p-1.5 rounded-sm text-[var(--ink-muted)] hover:text-[var(--ink)]
          hover:bg-[var(--surface)] transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="tabular-nums text-sm font-medium text-[var(--ink)] min-w-[120px] text-center">
        {label}
      </span>
      <button
        onClick={() => navigate(addMonths(current, 1))}
        className="p-1.5 rounded-sm text-[var(--ink-muted)] hover:text-[var(--ink)]
          hover:bg-[var(--surface)] transition-colors"
        aria-label="Next month"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
