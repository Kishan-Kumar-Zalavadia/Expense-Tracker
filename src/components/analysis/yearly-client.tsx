'use client'

import {
  eachDayOfInterval,
  startOfMonth, endOfMonth,
  format, parseISO, getDaysInMonth,
  getDay,
} from 'date-fns'
import { useState } from 'react'
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

// Interpolate from background to coral based on intensity
function dayColor(amount: number, max: number): string {
  if (amount === 0 || max === 0) return 'transparent'
  const intensity = Math.min(1, amount / max)
  // From --border (#E4E6EB) toward --c-primary (#2563EB)
  const r = Math.round(228 + (37  - 228) * intensity)
  const g = Math.round(230 + (99  - 230) * intensity)
  const b = Math.round(235 + (235 - 235) * intensity)
  return `rgb(${r},${g},${b})`
}

export function YearlyClient({ year, dailyData, maxDay, currency, onYearChange }: YearlyClientProps) {
  const [tooltip, setTooltip] = useState<{ date: string; total: number; x: number; y: number } | null>(null)

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

      {/* 12-month grid */}
      <div className="apple-card p-5 relative">
        <div className="flex items-center gap-2 mb-5">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
          <h2 className="font-display text-base font-medium text-[var(--ink)]">Daily spend intensity</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, mi) => {
            const monthNum = mi + 1
            const monthStart = new Date(year, mi, 1)
            const monthEnd   = endOfMonth(monthStart)
            const days       = getDaysInMonth(monthStart)
            // Day of week of month start (Mon=0)
            const startDow = (getDay(monthStart) + 6) % 7  // convert Sun=0 to Mon=0

            return (
              <div key={mi}>
                <h3 className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wider mb-2">
                  {MONTH_NAMES[mi]}
                </h3>
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                  {DAY_LABELS.map((d, i) => (
                    <div key={i} className="text-center text-[9px] text-[var(--ink-subtle)]">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Empty cells for offset */}
                  {Array.from({ length: startDow }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {/* Day cells */}
                  {Array.from({ length: days }, (_, di) => {
                    const dateStr = `${year}-${String(monthNum).padStart(2,'0')}-${String(di + 1).padStart(2,'0')}`
                    const total   = dayMap.get(dateStr) ?? 0
                    const color   = dayColor(total, maxDay)

                    return (
                      <div
                        key={dateStr}
                        className="relative aspect-square rounded-[1px] border cursor-default"
                        style={{
                          backgroundColor: color || 'var(--elevated)',
                          borderColor: total > 0 ? 'transparent' : 'var(--border)',
                        }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setTooltip({ date: dateStr, total, x: rect.left, y: rect.top })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
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

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-[var(--radius-md)] border border-[var(--border)]
            shadow-lg px-3 py-2 text-xs space-y-1"
          style={{
            backgroundColor: 'var(--elevated)',
            top: tooltip.y - 64,
            left: tooltip.x,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-[var(--ink-muted)] whitespace-nowrap">
            {formatDate(tooltip.date, 'EEE, dd MMM yyyy')}
          </div>
          <div
            className="font-semibold tabular-nums"
            style={{ color: tooltip.total > 0 ? 'var(--c-need)' : 'var(--ink-subtle)' }}
          >
            {tooltip.total > 0 ? formatCurrency(tooltip.total, currency) : 'No spend'}
          </div>
        </div>
      )}
    </div>
  )
}
