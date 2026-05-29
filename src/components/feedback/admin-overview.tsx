'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow, isAfter, subDays, subMonths } from 'date-fns'
import { Users, TrendingUp, Activity, AlertCircle, Receipt, Wallet, IndianRupee, ChevronUp, ChevronDown } from 'lucide-react'
import type { AdminData, UserStats } from '@/app/(app)/dashboard/actions/feedback'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNumber(n: number) {
  return n.toLocaleString('en-IN')
}

function formatAmount(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function getActivityDot(lastActivity: string | null): { color: string; label: string } {
  if (!lastActivity) return { color: 'var(--ink-subtle)', label: 'Never active' }
  const date = new Date(lastActivity)
  if (isAfter(date, subDays(new Date(), 7)))  return { color: 'var(--c-save)', label: 'Active within 7 days' }
  if (isAfter(date, subDays(new Date(), 30))) return { color: 'var(--c-warn)', label: 'Active within 30 days' }
  return { color: 'var(--ink-subtle)', label: 'Inactive >30 days' }
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

function formatJoined(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return '—'
  }
}

function isNew(joinedAt: string): boolean {
  return isAfter(new Date(joinedAt), subDays(new Date(), 14))
}

function isPowerUser(u: UserStats): boolean {
  return (u.expense_count + u.income_count) > 50
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  subtext,
}: {
  icon: React.ElementType
  iconColor: string
  iconBg: string
  value: string | number
  label: string
  subtext?: string
}) {
  return (
    <div className="apple-card p-4 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center"
        style={{ backgroundColor: iconBg }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="font-display text-2xl font-semibold text-[var(--ink)] tracking-tight leading-none">
          {typeof value === 'number' ? formatNumber(value) : value}
        </p>
        <p className="text-xs font-medium text-[var(--ink-muted)] mt-1">{label}</p>
        {subtext && (
          <p className="text-[11px] text-[var(--ink-subtle)] mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function FeatureBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--ink-muted)]">{label}</span>
        <span className="text-xs font-medium text-[var(--ink)]">{pct}% <span className="text-[var(--ink-subtle)]">({count})</span></span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ─── Sort state ───────────────────────────────────────────────────────────────
type SortKey = 'last_activity' | 'joined_at' | 'entries' | 'expense_count' | 'income_count' | 'total_spend'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronUp size={12} className="opacity-20" />
  return dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AdminOverview({ data }: { data: AdminData }) {
  const { totals, users } = data
  const [sortKey, setSortKey] = useState<SortKey>('last_activity')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      if (sortKey === 'last_activity') {
        aVal = a.last_activity ?? ''
        bVal = b.last_activity ?? ''
      } else if (sortKey === 'joined_at') {
        aVal = a.joined_at
        bVal = b.joined_at
      } else if (sortKey === 'entries') {
        aVal = a.expense_count + a.income_count
        bVal = b.expense_count + b.income_count
      } else if (sortKey === 'total_spend') {
        aVal = a.total_spend
        bVal = b.total_spend
      } else {
        aVal = a[sortKey] as number
        bVal = b[sortKey] as number
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [users, sortKey, sortDir])

  const activeMonthPct = totals.user_count > 0
    ? Math.round((totals.active_this_month / totals.user_count) * 100)
    : 0

  return (
    <div className="page-enter flex flex-col gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full">

      {/* Section 1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          iconColor="var(--c-primary)"
          iconBg="color-mix(in srgb, var(--c-primary) 12%, transparent)"
          value={totals.user_count}
          label="Total Users"
          subtext={`${totals.new_this_month} new this month`}
        />
        <KpiCard
          icon={TrendingUp}
          iconColor="var(--c-berry)"
          iconBg="color-mix(in srgb, var(--c-berry) 12%, transparent)"
          value={totals.total_entries}
          label="Total Entries"
          subtext="Expenses + incomes"
        />
        <KpiCard
          icon={Activity}
          iconColor="var(--c-save)"
          iconBg="color-mix(in srgb, var(--c-save) 12%, transparent)"
          value={totals.active_this_month}
          label="Active This Month"
          subtext={`${activeMonthPct}% of users`}
        />
        <KpiCard
          icon={AlertCircle}
          iconColor="var(--ink-muted)"
          iconBg="var(--surface-2)"
          value={totals.never_active}
          label="Never Active"
          subtext="Registered but no entries"
        />
      </div>

      {/* Section 2: Activity Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          icon={Receipt}
          iconColor="var(--c-need)"
          iconBg="var(--tint-need)"
          value={totals.expense_count}
          label="Total Expenses"
        />
        <KpiCard
          icon={Wallet}
          iconColor="var(--c-save)"
          iconBg="var(--tint-save)"
          value={totals.income_count}
          label="Total Incomes"
        />
        <KpiCard
          icon={IndianRupee}
          iconColor="var(--c-want)"
          iconBg="var(--tint-want)"
          value={formatAmount(totals.total_spend)}
          label="Total Spend Tracked"
        />
      </div>

      {/* Section 3: Feature Adoption */}
      <div className="apple-card p-4 sm:p-5">
        <h2 className="font-display text-base font-medium text-[var(--ink)] mb-4">Feature Adoption</h2>
        <div className="flex flex-col gap-3">
          <FeatureBar
            label="Users with budgets"
            count={totals.with_budgets}
            total={totals.user_count}
            color="var(--c-primary)"
          />
          <FeatureBar
            label="Users with recurring items"
            count={totals.with_recurring}
            total={totals.user_count}
            color="var(--c-warn)"
          />
        </div>
      </div>

      {/* Section 4: User Table */}
      <div className="apple-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border)]">
          <h2 className="font-display text-base font-medium text-[var(--ink)]">Users</h2>
          <p className="text-xs text-[var(--ink-muted)] mt-0.5">{users.length} total — click headers to sort</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]" style={{ backgroundColor: 'var(--surface-2)' }}>
                <th className="text-left px-4 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap min-w-[200px]">
                  User
                </th>
                <th
                  className="text-left px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap cursor-pointer hover:text-[var(--ink)] transition-colors"
                  onClick={() => toggleSort('joined_at')}
                >
                  <span className="flex items-center gap-1">
                    Joined <SortIcon active={sortKey === 'joined_at'} dir={sortDir} />
                  </span>
                </th>
                <th
                  className="text-left px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap cursor-pointer hover:text-[var(--ink)] transition-colors"
                  onClick={() => toggleSort('last_activity')}
                >
                  <span className="flex items-center gap-1">
                    Last Active <SortIcon active={sortKey === 'last_activity'} dir={sortDir} />
                  </span>
                </th>
                <th
                  className="text-right px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap cursor-pointer hover:text-[var(--ink)] transition-colors"
                  onClick={() => toggleSort('entries')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Entries <SortIcon active={sortKey === 'entries'} dir={sortDir} />
                  </span>
                </th>
                <th className="text-right px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap">Exp / Inc</th>
                <th className="text-right px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap">Cat / Sub</th>
                <th className="text-right px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap">Modes</th>
                <th className="text-right px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap">Budgets</th>
                <th className="text-right px-3 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap">Recur</th>
                <th
                  className="text-right px-4 py-2.5 font-medium text-[var(--ink-muted)] whitespace-nowrap cursor-pointer hover:text-[var(--ink)] transition-colors"
                  onClick={() => toggleSort('total_spend')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Spend <SortIcon active={sortKey === 'total_spend'} dir={sortDir} />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u, idx) => {
                const dot = getActivityDot(u.last_activity)
                const power = isPowerUser(u)
                const newUser = isNew(u.joined_at)
                const entries = u.expense_count + u.income_count

                return (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--surface-2)]"
                  >
                    {/* User cell */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: dot.color }}
                          title={dot.label}
                        />
                        <span
                          className="text-[var(--ink)] truncate max-w-[160px]"
                          title={u.email}
                        >
                          {u.email}
                        </span>
                        {power && (
                          <span
                            className="shrink-0 text-[10px] font-bold px-1 py-0.5 rounded leading-none"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--c-warn) 15%, transparent)', color: 'var(--c-warn)' }}
                            title="Power user (50+ entries)"
                          >
                            PWR
                          </span>
                        )}
                        {newUser && (
                          <span
                            className="shrink-0 text-[10px] font-bold px-1 py-0.5 rounded leading-none"
                            style={{ backgroundColor: 'var(--tint-save)', color: 'var(--c-save)' }}
                          >
                            New
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-[var(--ink-muted)] whitespace-nowrap">
                      {formatJoined(u.joined_at)}
                    </td>

                    <td className="px-3 py-3 text-[var(--ink-muted)] whitespace-nowrap">
                      {formatRelative(u.last_activity)}
                    </td>

                    <td className="px-3 py-3 text-right font-semibold text-[var(--ink)]">
                      {entries}
                    </td>

                    <td className="px-3 py-3 text-right text-[var(--ink-muted)]">
                      {u.expense_count} / {u.income_count}
                    </td>

                    <td className="px-3 py-3 text-right text-[var(--ink-muted)]">
                      {u.category_count} / {u.subcategory_count}
                    </td>

                    <td className="px-3 py-3 text-right text-[var(--ink-muted)]">
                      {u.payment_mode_count}
                    </td>

                    <td className="px-3 py-3 text-right text-[var(--ink-muted)]">
                      {u.budget_count}
                    </td>

                    <td className="px-3 py-3 text-right text-[var(--ink-muted)]">
                      {u.recurring_count}
                    </td>

                    <td className="px-4 py-3 text-right text-[var(--ink-muted)] whitespace-nowrap">
                      {u.total_spend > 0 ? formatAmount(u.total_spend) : '—'}
                    </td>
                  </tr>
                )
              })}
              {sortedUsers.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-[var(--ink-muted)]">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
