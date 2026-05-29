'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CategorySpend } from '@/lib/types'

interface CategoryPieProps {
  data: CategorySpend[]
  currency: string
}

function CustomTooltip({
  active, payload, currency, total,
}: {
  active?: boolean
  payload?: { value: number; payload: CategorySpend }[]
  currency: string
  total: number
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] shadow-lg px-3 py-2.5 text-xs space-y-1"
      style={{ backgroundColor: 'var(--elevated)', minWidth: 140 }}
    >
      <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: item.payload.color }}
        />
        {item.payload.category_name}
      </div>
      <div className="flex justify-between gap-4 text-[var(--ink-muted)]">
        <span>Amount</span>
        <span className="tabular-nums font-medium text-[var(--ink)]">
          {formatCurrency(item.value, currency)}
        </span>
      </div>
      <div className="flex justify-between gap-4 text-[var(--ink-muted)]">
        <span>Share</span>
        <span className="tabular-nums font-medium text-[var(--ink)]">{pct}%</span>
      </div>
    </div>
  )
}

export function CategoryPie({ data, currency }: CategoryPieProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--ink-muted)]">
        No expenses this month
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.total, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Donut chart — fixed height, no built-in legend (it overlaps on mobile) */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="total"
            nameKey="category_name"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.category_id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            animationDuration={0}
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as unknown as { value: number; payload: CategorySpend }[]}
                currency={currency}
                total={total}
              />
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend — rendered outside the SVG so it never overlaps the chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {data.map((item) => {
          const pct = total > 0 ? ((item.total / total) * 100).toFixed(1) : '0'
          return (
            <div key={item.category_id} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-[var(--ink-muted)] truncate flex-1">
                {item.category_name}
              </span>
              <span className="text-xs tabular-nums font-medium text-[var(--ink)] shrink-0">
                {formatCurrency(item.total, currency)}
              </span>
              <span className="text-[10px] tabular-nums text-[var(--ink-subtle)] shrink-0 w-9 text-right">
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
