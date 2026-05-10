import { formatCurrency, computeScore, scoreColor } from '@/lib/utils'
import type { MonthSummary } from '@/lib/types'

interface KpiCardsProps {
  summary: MonthSummary
  currency: string
}

export function KpiCards({ summary, currency }: KpiCardsProps) {
  const {
    total_spent, monthly_budget,
    need_spent, need_budget,
    want_spent, want_budget,
    save_spent, save_budget,
  } = summary

  const remaining = monthly_budget - total_spent
  const score = computeScore(need_spent, need_budget, want_spent, want_budget, save_spent, save_budget)
  const sColor = scoreColor(score)

  const cards = [
    {
      label: 'Total Spent',
      value: formatCurrency(total_spent, currency),
      color: 'var(--c-want)',
      sub: null,
    },
    {
      label: 'Monthly Budget',
      value: formatCurrency(monthly_budget, currency),
      color: 'var(--c-primary)',
      sub: null,
    },
    {
      label: 'Remaining',
      value: formatCurrency(Math.abs(remaining), currency),
      prefix: remaining < 0 ? '-' : '',
      color: remaining >= 0 ? 'var(--c-save)' : 'var(--c-want)',
      sub: remaining < 0 ? 'Over budget' : 'Available',
    },
    {
      label: 'Score',
      value: `${score.toFixed(1)} / 10`,
      color: sColor,
      sub: score >= 8 ? 'On track' : score >= 6 ? 'Watch it' : 'Over limit',
    },
  ]

  const topColors = [
    'var(--c-want)',
    'var(--c-primary)',
    remaining >= 0 ? 'var(--c-save)' : 'var(--c-want)',
    sColor,
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="apple-card overflow-hidden"
        >
          <div className="h-[3px]" style={{ backgroundColor: topColors[i] }} />
          <div className="p-4">
            <p className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-2">
              {card.label}
            </p>
            <p
              className="font-display text-2xl font-medium tabular-nums"
              style={{ color: card.color }}
            >
              {card.value}
            </p>
            {card.sub && (
              <p className="text-xs text-[var(--ink-subtle)] mt-1">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
