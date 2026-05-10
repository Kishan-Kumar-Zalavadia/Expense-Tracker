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
          formatter={(value: unknown) => [formatCurrency(Number(value), currency), 'Spend']}
          contentStyle={{
            backgroundColor: 'var(--ink)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: '2px',
            fontSize: '12px',
            padding: '8px 12px',
          }}
          itemStyle={{ color: 'var(--bg)' }}
          labelStyle={{ color: 'var(--ink-subtle)', marginBottom: 4 }}
          cursor={{ fill: 'var(--border)', opacity: 0.5 }}
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
        <Bar
          dataKey="total"
          fill="var(--c-need)"
          radius={[1, 1, 0, 0]}
          maxBarSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
