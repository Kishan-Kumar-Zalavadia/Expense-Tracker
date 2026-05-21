'use client'

import * as Popover from '@radix-ui/react-popover'
import { useState, useEffect } from 'react'
import {
  format, parseISO, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, addMonths, subMonths,
  getDay, isValid, isBefore, isAfter, startOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface DatePickerProps {
  value: string           // YYYY-MM-DD or ''
  onChange: (val: string) => void
  min?: string            // YYYY-MM-DD
  max?: string            // YYYY-MM-DD
  placeholder?: string
  hasError?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = 'Select date',
  hasError,
  className,
}: DatePickerProps) {
  const parsed  = value ? parseISO(value) : null
  const isValid_ = parsed && isValid(parsed)

  const [open, setOpen]           = useState(false)
  const [viewMonth, setViewMonth] = useState<Date>(isValid_ ? startOfMonth(parsed!) : startOfMonth(new Date()))

  // Sync view month when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseISO(value)
      if (isValid(d)) setViewMonth(startOfMonth(d))
    }
  }, [value])

  const minDate = min ? startOfDay(parseISO(min)) : null
  const maxDate = max ? startOfDay(parseISO(max)) : null

  const firstOfMonth = startOfMonth(viewMonth)
  const lastOfMonth  = endOfMonth(viewMonth)
  const days         = eachDayOfInterval({ start: firstOfMonth, end: lastOfMonth })

  // Pad to Monday-aligned grid (0=Mon … 6=Sun)
  const leadingBlanks = (getDay(firstOfMonth) + 6) % 7

  const isDisabled = (d: Date) => {
    if (minDate && isBefore(d, minDate)) return true
    if (maxDate && isAfter(d, maxDate))  return true
    return false
  }

  const select = (d: Date) => {
    if (isDisabled(d)) return
    onChange(format(d, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const label = isValid_ ? format(parsed!, 'dd MMM yyyy') : placeholder

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'apple-input text-sm flex items-center gap-2 text-left cursor-pointer',
            !isValid_ && 'text-[var(--ink-subtle)]',
            hasError && 'error',
            className,
          )}
        >
          <CalendarDays size={14} className="shrink-0 text-[var(--ink-muted)]" />
          <span className="flex-1">{label}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          align="start"
          className="z-[200] select-none"
          style={{
            backgroundColor: 'var(--elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px',
            width: '252px',
          }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)]
                text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold text-[var(--ink)]">
              {format(viewMonth, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-[var(--radius-sm)]
                text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {DOW.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-[var(--ink-subtle)] py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {/* Leading blanks */}
            {Array.from({ length: leadingBlanks }).map((_, i) => (
              <div key={`blank-${i}`} />
            ))}

            {days.map((d) => {
              const selected  = isValid_ && isSameDay(d, parsed!)
              const disabled  = isDisabled(d)
              const isToday   = isSameDay(d, new Date())

              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => select(d)}
                  disabled={disabled}
                  className={cn(
                    'relative h-8 w-full flex items-center justify-center text-xs rounded-[var(--radius-sm)] transition-colors',
                    selected
                      ? 'text-white font-semibold'
                      : disabled
                        ? 'text-[var(--ink-subtle)] cursor-not-allowed opacity-40'
                        : 'text-[var(--ink)] hover:bg-[var(--surface-2)]',
                    !selected && isToday && 'font-semibold',
                  )}
                  style={selected ? { backgroundColor: 'var(--c-primary)' } : undefined}
                >
                  {d.getDate()}
                  {/* Today dot when not selected */}
                  {isToday && !selected && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: 'var(--c-primary)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Today shortcut */}
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => select(new Date())}
              className="w-full text-xs font-medium py-1.5 rounded-[var(--radius-sm)]
                hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: 'var(--c-primary)' }}
            >
              Today
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
