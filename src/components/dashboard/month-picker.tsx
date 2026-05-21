'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface MonthPickerProps {
  year: number
  month: number
  onNavigate: (date: Date) => void
  isPending?: boolean
}

export function MonthPicker({ year, month, onNavigate, isPending }: MonthPickerProps) {
  const [open, setOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(year)
  const ref = useRef<HTMLDivElement>(null)

  const current = new Date(year, month - 1, 1)
  const label = format(current, 'MMM yyyy')

  const navigate = (date: Date) => {
    onNavigate(date)
    setOpen(false)
  }

  const openPicker = () => {
    setPickerYear(year)
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="flex items-center gap-0.5" ref={ref}>
      <button
        onClick={() => navigate(subMonths(current, 1))}
        disabled={isPending}
        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-muted)] hover:text-[var(--ink)]
          hover:bg-[var(--surface)] transition-colors disabled:opacity-40"
        aria-label="Previous month"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="relative">
        <button
          onClick={openPicker}
          disabled={isPending}
          className="flex items-center gap-1 px-2 py-1.5 rounded-[var(--radius-md)]
            text-sm font-medium text-[var(--ink)] hover:bg-[var(--surface)] transition-colors
            tabular-nums disabled:opacity-40"
          aria-label="Select month"
        >
          {isPending ? (
            <span className="animate-spin inline-block w-3 h-3 border-2 border-[var(--ink-muted)] border-t-transparent rounded-full mr-1" />
          ) : null}
          {label}
          <ChevronDown size={11} className="text-[var(--ink-muted)]" />
        </button>

        {open && (
          <div
            className="absolute top-full mt-1 right-0 z-50 rounded-[var(--radius-lg)]
              border border-[var(--border)] shadow-lg p-3 w-56"
            style={{ backgroundColor: 'var(--elevated)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setPickerYear((y) => y - 1)}
                className="p-1 rounded-[var(--radius-md)] text-[var(--ink-muted)]
                  hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-semibold tabular-nums text-[var(--ink)]">
                {pickerYear}
              </span>
              <button
                onClick={() => setPickerYear((y) => y + 1)}
                className="p-1 rounded-[var(--radius-md)] text-[var(--ink-muted)]
                  hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => {
                const isSelected = pickerYear === year && i + 1 === month
                return (
                  <button
                    key={m}
                    onClick={() => navigate(new Date(pickerYear, i, 1))}
                    className={cn(
                      'py-1.5 text-xs font-medium rounded-[var(--radius-md)] transition-colors',
                      isSelected
                        ? 'text-white'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)]',
                    )}
                    style={isSelected ? { backgroundColor: 'var(--c-primary)' } : undefined}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate(addMonths(current, 1))}
        disabled={isPending}
        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-muted)] hover:text-[var(--ink)]
          hover:bg-[var(--surface)] transition-colors disabled:opacity-40"
        aria-label="Next month"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
