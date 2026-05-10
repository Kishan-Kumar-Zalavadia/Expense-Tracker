'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DailySpend } from '@/lib/types'

interface DailyBarProps {
  data: DailySpend[]
  dailyLimit: number
  currency: string
}

function CustomTooltip({
  active, payload, label, currency, dailyLimit,
}: {
  active?: boolean
  payload?: { value: number; dataKey: string; payload: DailySpend & { label: string } }[]
  label?: string
  currency: string
  dailyLimit: number
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const overLimit = d.total > dailyLimit && dailyLimit > 0

  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--border)] shadow-lg px-3 py-2.5 text-xs space-y-1.5"
      style={{ backgroundColor: 'var(--elevated)', minWidth: 150 }}
    >
      <p className="font-semibold text-[var(--ink)]">
        {formatDate(d.date, 'EEE, dd MMM')}
      </p>
      <div className="space-y-1 pt-0.5">
        <div className="flex justify-between gap-4 text-[var(--ink-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-need)' }} />
            Needs
          </span>
          <span className="tabular-nums font-medium text-[var(--ink)]">
            {formatCurrency(d.need, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4 text-[var(--ink-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--c-want)' }} />
            Wants
          </span>
          <span className="tabular-nums font-medium text-[var(--ink)]">
            {formatCurrency(d.want, currency)}
          </span>
        </div>
      </div>
      <div className="border-t border-[var(--border)] pt-1.5 flex justify-between gap-4">
        <span className="font-medium" style={{ color: overLimit ? 'var(--c-want)' : 'var(--ink-muted)' }}>
          Total {overLimit ? '· Over limit' : ''}
        </span>
        <span
          className="tabular-nums font-semibold"
          style={{ color: overLimit ? 'var(--c-want)' : 'var(--ink)' }}
        >
          {formatCurrency(d.total, currency)}
        </span>
      </div>
    </div>
  )
}

export function DailyBar({ data, dailyLimit, currency }: DailyBarProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--ink-muted)]">
        No spend data this month
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDate(d.date, 'dd'),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: 'var(--ink-subtle)', fontFamily: 'var(--font-jetbrains)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: 'var(--ink-subtle)', fontFamily: 'var(--font-jetbrains)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`}
          width={36}
        />
        <Tooltip
          animationDuration={0}
          content={(props) => (
            <CustomTooltip
              active={props.active}
              payload={props.payload as unknown as { value: number; dataKey: string; payload: DailySpend & { label: string } }[]}
              label={props.label != null ? String(props.label) : undefined}
              currency={currency}
              dailyLimit={dailyLimit}
            />
          )}
          cursor={{ fill: 'var(--border)', opacity: 0.4 }}
        />
        <ReferenceLine
          y={dailyLimit}
          stroke="var(--c-warn)"
          strokeDasharray="4 3"
          strokeWidth={1.5}
          label={{
            value: 'Daily limit',
            position: 'insideTopRight',
            fontSize: 10,
            fill: 'var(--c-warn)',
          }}
        />
        <Bar dataKey="need" stackId="a" fill="var(--c-need)" radius={[0, 0, 0, 0]} maxBarSize={20} />
        <Bar dataKey="want" stackId="a" fill="var(--c-want)" radius={[1, 1, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}
