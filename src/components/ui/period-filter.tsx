'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PeriodPreset = 'this_month' | 'last_month' | 'last_3m' | 'this_year' | 'last_year' | 'all' | 'custom'

export interface PeriodValue {
  preset: PeriodPreset
  dateFrom: string
  dateTo: string
}

interface PeriodFilterProps {
  value: PeriodValue
  onChange: (value: PeriodValue) => void
  accentColor?: string
}

function pad2(n: number) { return String(n).padStart(2, '0') }

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

export function computePeriodDates(preset: PeriodPreset, customFrom = '', customTo = ''): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1

  if (preset === 'this_month') {
    return {
      dateFrom: `${y}-${pad2(m)}-01`,
      dateTo: `${y}-${pad2(m)}-${pad2(lastDayOfMonth(y, m))}`,
    }
  }
  if (preset === 'last_month') {
    const d = new Date(y, m - 2, 1)
    const ly = d.getFullYear()
    const lm = d.getMonth() + 1
    return {
      dateFrom: `${ly}-${pad2(lm)}-01`,
      dateTo: `${ly}-${pad2(lm)}-${pad2(lastDayOfMonth(ly, lm))}`,
    }
  }
  if (preset === 'last_3m') {
    const from = new Date(y, m - 4, 1)
    const fy = from.getFullYear()
    const fm = from.getMonth() + 1
    return {
      dateFrom: `${fy}-${pad2(fm)}-01`,
      dateTo: `${y}-${pad2(m)}-${pad2(lastDayOfMonth(y, m))}`,
    }
  }
  if (preset === 'this_year') {
    return { dateFrom: `${y}-01-01`, dateTo: `${y}-12-31` }
  }
  if (preset === 'last_year') {
    return { dateFrom: `${y - 1}-01-01`, dateTo: `${y - 1}-12-31` }
  }
  if (preset === 'custom') {
    return { dateFrom: customFrom, dateTo: customTo }
  }
  // 'all' — no date filter
  return { dateFrom: '', dateTo: '' }
}

export function defaultPeriod(): PeriodValue {
  const dates = computePeriodDates('this_month')
  return { preset: 'this_month', ...dates }
}

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'last_3m',    label: 'Last 3M' },
  { id: 'this_year',  label: 'This Year' },
  { id: 'last_year',  label: 'Last Year' },
  { id: 'all',        label: 'All Time' },
  { id: 'custom',     label: 'Custom' },
]

function periodLabel(v: PeriodValue): string {
  const found = PRESETS.find((p) => p.id === v.preset)
  if (v.preset === 'custom' && v.dateFrom && v.dateTo) {
    const fmt = (s: string) => {
      const [y, m, d] = s.split('-')
      return `${d} ${new Date(+y, +m - 1).toLocaleString('en', { month: 'short' })} ${y}`
    }
    return `${fmt(v.dateFrom)} – ${fmt(v.dateTo)}`
  }
  return found?.label ?? 'Period'
}

export function PeriodFilter({ value, onChange, accentColor = 'var(--c-primary)' }: PeriodFilterProps) {
  const [customFrom, setCustomFrom] = useState(value.preset === 'custom' ? value.dateFrom : '')
  const [customTo,   setCustomTo]   = useState(value.preset === 'custom' ? value.dateTo   : '')

  const selectPreset = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      onChange({ preset: 'custom', dateFrom: customFrom, dateTo: customTo })
    } else {
      const dates = computePeriodDates(preset)
      onChange({ preset, ...dates })
    }
  }

  const applyCustom = () => {
    if (customFrom && customTo && customFrom <= customTo) {
      onChange({ preset: 'custom', dateFrom: customFrom, dateTo: customTo })
    }
  }

  const isActive = value.preset !== 'this_month'

  return (
    <div className="space-y-2">
      {/* Pill row — scrollable on mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 -mx-0.5 px-0.5">
        <Calendar size={13} className="shrink-0 text-[var(--ink-muted)]" />
        {PRESETS.map((p) => {
          const active = value.preset === p.id
          return (
            <button
              key={p.id}
              onClick={() => selectPreset(p.id)}
              className={cn(
                'shrink-0 px-3 py-1 text-xs font-medium rounded-full border transition-all whitespace-nowrap',
                active
                  ? 'text-white border-transparent'
                  : 'text-[var(--ink-muted)] border-[var(--border)] hover:border-[var(--ink-muted)] hover:text-[var(--ink)]',
              )}
              style={active ? { backgroundColor: accentColor, borderColor: accentColor } : {}}
            >
              {p.label}
            </button>
          )
        })}
        {isActive && value.preset !== 'custom' && (
          <button
            onClick={() => {
              const dates = computePeriodDates('this_month')
              onChange({ preset: 'this_month', ...dates })
            }}
            className="shrink-0 p-1 rounded-full text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors"
            title="Reset to this month"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Custom range inputs */}
      {value.preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
            <span className="font-medium">From</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2 py-1 text-xs bg-[var(--elevated)] border border-[var(--border)]
                rounded-[var(--radius-sm)] text-[var(--ink)] focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
            <span className="font-medium">To</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2 py-1 text-xs bg-[var(--elevated)] border border-[var(--border)]
                rounded-[var(--radius-sm)] text-[var(--ink)] focus:outline-none focus:ring-1"
            />
          </div>
          <button
            onClick={applyCustom}
            disabled={!customFrom || !customTo || customFrom > customTo}
            className="px-3 py-1 text-xs font-medium rounded-full text-white disabled:opacity-40 transition-all"
            style={{ backgroundColor: accentColor }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
