import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { currentYearMonth, findActiveBudget } from '@/lib/utils'
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

  // Fetch budget periods and find the one covering the selected month
  const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`
  const { data: budgetPeriods } = await supabase
    .from('budget_periods')
    .select('*')
    .eq('user_id', user.id)
    .order('start_month', { ascending: true })

  const activePeriod = findActiveBudget(budgetPeriods ?? [], currentMonthStr)
  const monthBudget = activePeriod?.monthly_amount ?? 0
  const needBudget  = (monthBudget * (activePeriod?.needs_pct   ?? 50)) / 100
  const wantBudget  = (monthBudget * (activePeriod?.wants_pct   ?? 30)) / 100
  const saveBudget  = (monthBudget * (activePeriod?.savings_pct ?? 20)) / 100

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

  // Fetch expenses and incomes for the month
  const [{ data: expenses }, { data: monthIncomes }] = await Promise.all([
    supabase
      .from('expenses')
      .select('*, category:categories(*), payment_mode:payment_modes(*)')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDateStr)
      .order('date', { ascending: false }),
    supabase
      .from('incomes')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDateStr),
  ])

  const expenseList = expenses ?? []

  // Aggregate totals by type
  let needSpent = 0, wantSpent = 0, saveSpent = 0
  for (const e of expenseList) {
    if (e.type === 'Need')   needSpent  += Number(e.amount)
    if (e.type === 'Want')   wantSpent  += Number(e.amount)
    if (e.type === 'Saving') saveSpent  += Number(e.amount)
  }
  const totalSpent = needSpent + wantSpent + saveSpent
  const incomeTotal = (monthIncomes ?? []).reduce((s, r) => s + Number(r.amount), 0)

  const summary: MonthSummary = {
    total_spent:    totalSpent,
    monthly_budget: monthBudget,
    need_spent:     needSpent,
    want_spent:     wantSpent,
    save_spent:     saveSpent,
    need_budget:    needBudget,
    want_budget:    wantBudget,
    save_budget:    saveBudget,
    income_total:   incomeTotal,
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
    <div className="page-enter flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold
            uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-primary)' }}>
            Dashboard
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Suspense>
            <MonthPicker year={year} month={month} />
          </Suspense>
          <DashboardRefresher
            categories={categories ?? []}
            paymentModes={paymentModes ?? []}
            currency={currency}
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
