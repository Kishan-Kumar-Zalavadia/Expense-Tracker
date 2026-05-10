import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { currentYearMonth } from '@/lib/utils'
import { MonthPicker } from '@/components/dashboard/month-picker'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { BudgetCards } from '@/components/dashboard/budget-cards'
import { CategoryPie } from '@/components/dashboard/category-pie'
import { DailyBar } from '@/components/dashboard/daily-bar'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { DashboardRefresher } from '@/components/dashboard/dashboard-refresher'
import type { MonthSummary, CategorySpend, DailySpend } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const monthParam = sp.month

  let year: number, month: number
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    [year, month] = monthParam.split('-').map(Number)
  } else {
    ;({ year, month } = currentYearMonth())
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch salary config for this year
  const { data: salaryRow } = await supabase
    .from('salary_config')
    .select('*')
    .eq('user_id', user.id)
    .eq('year', year)
    .single()

  const salary = salaryRow?.salary ?? 0
  const needsPct = salaryRow?.needs_pct ?? 50
  const wantsPct = salaryRow?.wants_pct ?? 30
  const savingsPct = salaryRow?.savings_pct ?? 20

  const needBudget  = (salary * needsPct)  / 100
  const wantBudget  = (salary * wantsPct)  / 100
  const saveBudget  = (salary * savingsPct) / 100
  const monthBudget = salary

  // Fetch user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const currency = settings?.currency ?? '₹'
  const weeklyLimit = settings?.weekly_limit ?? 10000
  const dailyLimit  = weeklyLimit / 7

  // Month date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate   = new Date(year, month, 0)  // last day of month
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  // Fetch expenses for the month with joins
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, category:categories(*), payment_mode:payment_modes(*)')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDateStr)
    .order('date', { ascending: false })

  const expenseList = expenses ?? []

  // Aggregate totals by type
  let needSpent = 0, wantSpent = 0, saveSpent = 0
  for (const e of expenseList) {
    if (e.type === 'Need')   needSpent  += Number(e.amount)
    if (e.type === 'Want')   wantSpent  += Number(e.amount)
    if (e.type === 'Saving') saveSpent  += Number(e.amount)
  }
  const totalSpent = needSpent + wantSpent + saveSpent

  const summary: MonthSummary = {
    total_spent:    totalSpent,
    monthly_budget: monthBudget,
    need_spent:     needSpent,
    want_spent:     wantSpent,
    save_spent:     saveSpent,
    need_budget:    needBudget,
    want_budget:    wantBudget,
    save_budget:    saveBudget,
  }

  // Category spend aggregation
  const catMap = new Map<string, CategorySpend>()
  for (const e of expenseList) {
    if (!e.category) continue
    const existing = catMap.get(e.category_id)
    if (existing) {
      existing.total += Number(e.amount)
    } else {
      catMap.set(e.category_id, {
        category_id:   e.category_id,
        category_name: e.category.name,
        color:         e.category.color,
        total:         Number(e.amount),
      })
    }
  }
  const categorySpend: CategorySpend[] = Array.from(catMap.values()).sort((a, b) => b.total - a.total)

  // Daily spend (Need + Want only, excluding Saving per spec)
  const dayMap = new Map<string, { need: number; want: number }>()
  for (const e of expenseList) {
    if (e.type === 'Saving') continue
    const entry = dayMap.get(e.date) ?? { need: 0, want: 0 }
    if (e.type === 'Need') entry.need += Number(e.amount)
    if (e.type === 'Want') entry.want += Number(e.amount)
    dayMap.set(e.date, entry)
  }
  const dailySpend: DailySpend[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { need, want }]) => ({ date, need, want, total: need + want }))

  // Fetch categories and payment modes for the modal
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('sort_order')

  const { data: paymentModes } = await supabase
    .from('payment_modes')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)

  const recent6 = expenseList.slice(0, 6)

  return (
    <div className="page-enter flex flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 mb-2 rounded-full text-[10px] font-bold
            uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-primary)' }}>
            Dashboard
          </div>
          <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--ink)]">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <MonthPicker year={year} month={month} />
          </Suspense>
          <DashboardRefresher
            categories={categories ?? []}
            paymentModes={paymentModes ?? []}
          />
        </div>
      </div>

      {/* KPI row */}
      <KpiCards summary={summary} currency={currency} />

      {/* Budget cards */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-primary)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Budget split</h2>
        </div>
        <BudgetCards summary={summary} currency={currency} />
      </section>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="apple-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="section-bar" style={{ backgroundColor: 'var(--c-berry)' }} />
            <h2 className="font-display text-base font-medium text-[var(--ink)]">By category</h2>
          </div>
          <CategoryPie data={categorySpend} currency={currency} />
        </section>

        <section className="apple-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="section-bar" style={{ backgroundColor: 'var(--c-need)' }} />
            <h2 className="font-display text-base font-medium text-[var(--ink)]">Daily spend</h2>
            <span className="text-xs text-[var(--ink-muted)] ml-1">(Need + Want)</span>
          </div>
          <DailyBar data={dailySpend} dailyLimit={dailyLimit} currency={currency} />
        </section>
      </div>

      {/* Recent activity */}
      <section className="apple-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
          <h2 className="font-display text-base font-medium text-[var(--ink)]">Recent activity</h2>
          <span className="text-xs text-[var(--ink-muted)] ml-1">Last 6 transactions</span>
        </div>
        <RecentActivity
          expenses={recent6}
          categories={categories ?? []}
          paymentModes={paymentModes ?? []}
          currency={currency}
        />
      </section>
    </div>
  )
}
