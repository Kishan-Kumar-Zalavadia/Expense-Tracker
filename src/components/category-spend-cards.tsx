'use client'

import { formatCurrency } from '@/lib/utils'
import type { CategorySummaryItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategorySpendCardsProps {
  items: CategorySummaryItem[]
  currency: string
  /** accent color for total bar fill */
  accentColor?: string
}

export function CategorySpendCards({ items, currency, accentColor = 'var(--c-primary)' }: CategorySpendCardsProps) {
  const visible = items.filter((i) => i.show_in_cards)
  if (visible.length === 0) return null

  const grandTotal = visible.reduce((s, i) => s + i.total, 0)

  return (
    <div className="relative">
      {/* Horizontal scroll container */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-0.5 px-0.5">
        {visible.map((item) => {
          const pct = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0
          return (
            <div
              key={item.category_id}
              className="shrink-0 w-36 sm:w-40 rounded-[var(--radius-md)] border border-[var(--border)]
                bg-[var(--elevated)] overflow-hidden"
            >
              {/* Color bar */}
              <div className="h-0.5 w-full" style={{ backgroundColor: item.color }} />
              <div className="p-2.5">
                {/* Name + dot */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-[var(--ink)] truncate leading-tight">
                    {item.category_name}
                  </span>
                </div>
                {/* Amount */}
                <p className="text-sm font-semibold tabular-nums text-[var(--ink)] leading-tight">
                  {formatCurrency(item.total, currency)}
                </p>
                {/* Share bar */}
                <div className="mt-2 h-1 rounded-full bg-[var(--surface)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: item.color, opacity: 0.7 }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-[var(--ink-subtle)] tabular-nums">
                  {pct.toFixed(0)}% of total
                </p>
              </div>
            </div>
          )
        })}
      </div>
      {/* Fade hint on right when scrollable */}
      <div
        className="pointer-events-none absolute right-0 top-0 bottom-1 w-8"
        style={{
          background: 'linear-gradient(to right, transparent, var(--bg))',
          display: visible.length > 3 ? 'block' : 'none',
        }}
      />
    </div>
  )
}
