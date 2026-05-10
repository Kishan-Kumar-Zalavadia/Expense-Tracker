'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { CategorySpend } from '@/lib/types'

interface CategoryPieProps {
  data: CategorySpend[]
  currency: string
}

export function CategoryPie({ data, currency }: CategoryPieProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--ink-muted)]">
        No expenses this month
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
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
          formatter={(value: unknown) => [formatCurrency(Number(value), currency), '']}
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
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: 'var(--ink-muted)', fontSize: '12px' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
