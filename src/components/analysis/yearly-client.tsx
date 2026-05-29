'use client'

import {
  endOfMonth,
  getDaysInMonth,
  getDay,
} from 'date-fns'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DailyData {
  date: string
  total: number
}

interface YearlyClientProps {
  year: number
  dailyData: DailyData[]
  maxDay: number
  currency: string
  onYearChange: (year: number) => void
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_LABELS = ['M','T','W','T','F','S','S']

function dayColor(amount: number, max: number): string {
  if (amount === 0 || max === 0) return 'transparent'
  const intensity = Math.min(1, amount / max)
  const r = Math.round(228 + (37  - 228) * intensity)
  const g = Math.round(230 + (99  - 230) * intensity)
  const b = Math.round(235 + (235 - 235) * intensity)
  return `rgb(${r},${g},${b})`
}

export function YearlyClient({ year, dailyData, maxDay, currency, onYearChange }: YearlyClientProps) {
  const navigate = (newYear: number) => onYearChange(newYear)
  const dayMap = new Map(dailyData.map((d) => [d.date, d.total]))

  return (
    <div className="page-enter flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 mb-2 rounded-full text-[10px] font-bold
            uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-save)' }}>
            Analysis
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--ink)]">
            Yearly heatmap
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(year - 1)}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)]
              text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors">
            ← {year - 1}
          </button>
          <span className="px-3 py-1.5 text-sm font-semibold tabular-nums text-[var(--ink)]">{year}</span>
          <button onClick={() => navigate(year + 1)}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)]
              text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors">
            {year + 1} →
          </button>
        </div>
      </div>

      {/* 12-month grid
          overflow-visible: lets cell tooltips escape the card boundary.
          apple-card normally clips with overflow:hidden, but none of the static
          content overflows so border-radius/shadow are unaffected. */}
      <div className="apple-card p-5 !overflow-visible">
        <div className="flex items-center gap-2 mb-5">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
          <h2 className="font-display text-base font-medium text-[var(--ink)]">Daily spend intensity</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, mi) => {
            const monthNum  = mi + 1
            const monthStart = new Date(year, mi, 1)
            const days      = getDaysInMonth(monthStart)
            const startDow  = (getDay(monthStart) + 6) % 7

            return (
              <div key={mi}>
                <h3 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider mb-2">
                  {MONTH_NAMES[mi]}
                </h3>
                {/* Day-of-week labels */}
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {DAY_LABELS.map((d, i) => (
                    <div key={i} className="text-center text-[9px] text-[var(--ink-subtle)]">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: startDow }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: days }, (_, di) => {
                    const dateStr = `${year}-${String(monthNum).padStart(2,'0')}-${String(di + 1).padStart(2,'0')}`
                    const total   = dayMap.get(dateStr) ?? 0
                    const color   = dayColor(total, maxDay)

                    return (
                      <div
                        key={dateStr}
                        className="group/cell relative aspect-square rounded-[1px] border cursor-default"
                        style={{
                          backgroundColor: color || 'var(--elevated)',
                          borderColor: total > 0 ? 'transparent' : 'var(--border)',
                        }}
                      >
                        {/* Tooltip — absolute so it's never clipped by transforms or
                            scroll containers. Centered above the cell via left-1/2 +
                            -translate-x-1/2, and lifted above via bottom-[calc(100%+6px)]. */}
                        <div
                          className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2
                            -translate-x-1/2 z-50 whitespace-nowrap
                            hidden group-hover/cell:block
                            rounded-[var(--radius-md)] border border-[var(--border)]
                            shadow-lg px-3 py-2 text-xs space-y-0.5"
                          style={{ backgroundColor: 'var(--elevated)' }}
                        >
                          <div className="text-[var(--ink-muted)]">
                            {formatDate(dateStr, 'EEE, dd MMM yyyy')}
                          </div>
                          <div
                            className="font-semibold tabular-nums"
                            style={{ color: total > 0 ? 'var(--c-need)' : 'var(--ink-subtle)' }}
                          >
                            {total > 0 ? formatCurrency(total, currency) : 'No spend'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--border)]">
          <span className="text-xs text-[var(--ink-muted)]">Less</span>
          <div className="flex gap-0.5">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
              <div
                key={intensity}
                className="w-3 h-3 rounded-[1px]"
                style={{ backgroundColor: intensity === 0 ? 'var(--elevated)' : dayColor(intensity, 1) }}
              />
            ))}
          </div>
          <span className="text-xs text-[var(--ink-muted)]">More</span>
        </div>
      </div>
    </div>
  )
}
