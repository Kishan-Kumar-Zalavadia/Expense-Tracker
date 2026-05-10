'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'
import { parseISO } from 'date-fns'

interface WeekData {
  week_number: number
  week_start: string
  week_end: string
  total: number
}

interface WeeklyClientProps {
  weeklyData: WeekData[]
  weeklyLimit: number
  currency: string
  year: number
}

export function WeeklyClient({ weeklyData, weeklyLimit, currency, year }: WeeklyClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = (newYear: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', String(newYear))
    router.push(`?${params.toString()}`)
  }

  const nonZeroWeeks = weeklyData.filter((w) => w.total > 0)

  return (
    <div className="page-enter flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 mb-2 rounded-sm text-[10px] font-bold
            uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-need)' }}>
            Analysis
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--ink)]">
            Weekly spend
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(year - 1)}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-sm
              text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors"
          >
            ← {year - 1}
          </button>
          <span className="px-3 py-1.5 text-sm font-semibold tabular-nums text-[var(--ink)]">{year}</span>
          <button
            onClick={() => navigate(year + 1)}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-sm
              text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors"
          >
            {year + 1} →
          </button>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-need)' }} />
          <h2 className="font-display text-base font-medium text-[var(--ink)]">52-week overview</h2>
          <span className="text-xs text-[var(--ink-muted)] ml-1">(Need + Want only)</span>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="week_number"
              tick={{ fontSize: 9, fill: 'var(--ink-subtle)', fontFamily: 'var(--font-jetbrains)' }}
              axisLine={false}
              tickLine={false}
              interval={3}
              tickFormatter={(v) => `W${v}`}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--ink-subtle)', fontFamily: 'var(--font-jetbrains)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`}
              width={36}
            />
            <Tooltip
              formatter={(value: unknown) => [
                formatCurrency(Number(value), currency),
                'Spend',
              ]}
              labelFormatter={(label) => {
                const week = weeklyData[Number(label) - 1]
                if (!week) return `Week ${label}`
                return `${formatDate(week.week_start, 'dd MMM')} – ${formatDate(week.week_end, 'dd MMM')}`
              }}
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
              cursor={{ fill: 'var(--border)', opacity: 0.4 }}
            />
            <ReferenceLine
              y={weeklyLimit}
              stroke="var(--c-warn)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              label={{
                value: 'Weekly limit',
                position: 'insideTopRight',
                fontSize: 10,
                fill: 'var(--c-warn)',
              }}
            />
            <Bar dataKey="total" radius={[1, 1, 0, 0]} maxBarSize={16}>
              {weeklyData.map((entry) => (
                <Cell
                  key={entry.week_number}
                  fill={entry.total > weeklyLimit ? 'var(--c-want)' : 'var(--c-need)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table of non-zero weeks */}
      {nonZeroWeeks.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="section-bar" style={{ backgroundColor: 'var(--c-need)' }} />
            <h2 className="font-display text-base font-medium text-[var(--ink)]">Week breakdown</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Week', 'Range', 'Spent', 'Limit', 'Ratio'].map((h) => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold
                      text-[var(--ink-muted)] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {nonZeroWeeks.map((week) => {
                  const ratio = weeklyLimit > 0 ? week.total / weeklyLimit : 0
                  const over  = ratio > 1
                  return (
                    <tr key={week.week_number} className="hover:bg-[var(--elevated)] transition-colors">
                      <td className="py-2.5 text-xs tabular-nums font-medium text-[var(--ink)]">
                        W{week.week_number}
                      </td>
                      <td className="py-2.5 text-xs text-[var(--ink-muted)] tabular-nums">
                        {formatDate(week.week_start, 'dd MMM')} – {formatDate(week.week_end, 'dd MMM')}
                      </td>
                      <td className="py-2.5 text-sm tabular-nums font-medium"
                        style={{ color: over ? 'var(--c-want)' : 'var(--ink)' }}>
                        {formatCurrency(week.total, currency)}
                      </td>
                      <td className="py-2.5 text-xs tabular-nums text-[var(--ink-muted)]">
                        {formatCurrency(weeklyLimit, currency)}
                      </td>
                      <td className="py-2.5 min-w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(100, ratio * 100)}%`,
                                backgroundColor: over ? 'var(--c-want)' : 'var(--c-need)',
                              }}
                            />
                          </div>
                          <span className="text-xs tabular-nums"
                            style={{ color: over ? 'var(--c-want)' : 'var(--ink-muted)' }}>
                            {(ratio * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
