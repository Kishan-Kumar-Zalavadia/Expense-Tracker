import { formatCurrency } from '@/lib/utils'
import type { MonthSummary } from '@/lib/types'

interface BudgetCardsProps {
  summary: MonthSummary
  currency: string
}

const TYPES = [
  {
    key: 'need' as const,
    label: 'Needs',
    color: 'var(--c-need)',
    tint: 'var(--tint-need)',
    pct: 50,
  },
  {
    key: 'want' as const,
    label: 'Wants',
    color: 'var(--c-want)',
    tint: 'var(--tint-want)',
    pct: 30,
  },
  {
    key: 'save' as const,
    label: 'Savings',
    color: 'var(--c-save)',
    tint: 'var(--tint-save)',
    pct: 20,
  },
]

export function BudgetCards({ summary, currency }: BudgetCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {TYPES.map(({ key, label, color, tint }) => {
        const spent = summary[`${key}_spent`]
        const budget = summary[`${key}_budget`]
        const progress = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
        const over = spent > budget
        const overBy = spent - budget

        return (
          <div
            key={key}
            className="rounded-[var(--radius-lg)] overflow-hidden"
            style={{
              backgroundColor: tint,
              border: `1px solid ${color}40`,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
                  {label}
                </span>
                {over && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-[var(--radius-md)]"
                    style={{ backgroundColor: color + '20', color }}>
                    Over by {formatCurrency(overBy, currency)}
                  </span>
                )}
              </div>

              <div className="mb-2">
                <span className="font-display text-xl tabular-nums font-medium text-[var(--ink)]">
                  {formatCurrency(spent, currency)}
                </span>
                <span className="text-sm text-[var(--ink-muted)] ml-1">
                  / {formatCurrency(budget, currency)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: color + '25' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              <p className="text-xs text-[var(--ink-muted)] mt-2 tabular-nums">
                {progress.toFixed(0)}% used
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
