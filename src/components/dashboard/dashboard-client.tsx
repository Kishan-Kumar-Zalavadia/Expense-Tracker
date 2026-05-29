'use client'

import { useState, useTransition, useEffect, useRef, useCallback } from 'react'
import { useAppShell } from '@/hooks/use-app-shell'

// Dashboard section
import { MonthPicker } from '@/components/dashboard/month-picker'
import { KpiCards } from '@/components/dashboard/kpi-cards'
import { BudgetCards } from '@/components/dashboard/budget-cards'
import { CategoryPie } from '@/components/dashboard/category-pie'
import { DailyBar } from '@/components/dashboard/daily-bar'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { AccountBalances } from '@/components/dashboard/account-balances'
import { AddIncomeButton } from '@/components/dashboard/add-income-button'
import { AddExpenseButton } from '@/components/add-expense-button'
import { getDashboardData, type DashboardMonthData } from '@/app/(app)/dashboard/actions'

// Other section actions
import { fetchExpenses, type ExpensesData, type ExpensesFilters } from '@/app/(app)/dashboard/actions/expenses'
import { fetchIncome, type IncomeData, type IncomeFilters } from '@/app/(app)/dashboard/actions/income'
import { PeriodFilter, defaultPeriod, computePeriodDates, type PeriodValue } from '@/components/ui/period-filter'
import { fetchWeekly, type WeeklyData } from '@/app/(app)/dashboard/actions/weekly'
import { fetchYearly, type YearlyData } from '@/app/(app)/dashboard/actions/yearly'
import { fetchSettingsData, type SettingsData } from '@/app/(app)/dashboard/actions/settings-data'

// Section UI components
import { ExpenseListClient } from '@/components/expenses/expense-list-client'
import { AddExpenseButton as AddExpBtn } from '@/components/add-expense-button'
import { IncomeListClient } from '@/components/income/income-list-client'
import { IncomeModal } from '@/components/income/income-modal'
import { WeeklyClient } from '@/components/analysis/weekly-client'
import { YearlyClient } from '@/components/analysis/yearly-client'
import { SettingsClient } from '@/components/settings/settings-client'
import { FeedbackPanel } from '@/components/feedback/feedback-panel'
import { AdminPanel } from '@/components/feedback/admin-panel'

import type { Category, PaymentMode, BudgetPeriod, Subcategory } from '@/lib/types'
import { Plus } from 'lucide-react'

// ─── Cross-section refresh hook ──────────────────────────────────
// When any section mutates data it calls triggerRefresh(source).
// All OTHER sections react and reload their data automatically.
function useSectionRefresh(mySource: string, onRefresh: () => void) {
  const { refreshKey, refreshSource } = useAppShell()
  const cbRef     = useRef(onRefresh)
  cbRef.current   = onRefresh
  const prevKeyRef = useRef(refreshKey)

  useEffect(() => {
    if (prevKeyRef.current !== refreshKey) {
      prevKeyRef.current = refreshKey
      if (refreshSource !== mySource) cbRef.current()
    }
  }, [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps
}

// ─── Spinner ─────────────────────────────────────────────────────
function SectionSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <span className="animate-spin w-8 h-8 border-2 border-[var(--c-primary)] border-t-transparent rounded-full" />
    </div>
  )
}

// ─── Dashboard section ───────────────────────────────────────────
function DashboardSection({
  initialData, initialYear, initialMonth,
  categories: initCategories, paymentModes: initPaymentModes,
  budgetPeriods: initBudgetPeriods, currency: initCurrency,
  subcategories: initSubcategories, enableSubcategories: initEnableSubcategories,
  userId,
}: {
  initialData: DashboardMonthData
  initialYear: number
  initialMonth: number
  categories: Category[]
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  subcategories: Subcategory[]
  enableSubcategories: boolean
  currency: string
  userId: string
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [data, setData] = useState(initialData)
  // Shared data lives in state so settings changes propagate here too
  const [categories, setCategories] = useState(initCategories)
  const [paymentModes, setPaymentModes] = useState(initPaymentModes)
  const [budgetPeriods, setBudgetPeriods] = useState(initBudgetPeriods)
  const [currency, setCurrency] = useState(initCurrency)
  const [subcategories, setSubcategories] = useState(initSubcategories)
  const [enableSubcategories, setEnableSubcategories] = useState(initEnableSubcategories)
  const [isPending, startTransition] = useTransition()
  const { triggerRefresh } = useAppShell()

  // Keep refs so the cross-section refresh callback always has current values
  const yearRef  = useRef(year)
  const monthRef = useRef(month)
  yearRef.current  = year
  monthRef.current = month

  // Refreshes only dashboard stats (after add/edit expense or income)
  const silentRefresh = useCallback(() => {
    getDashboardData(yearRef.current, monthRef.current).then(result => {
      if (result) setData(result)
    })
    triggerRefresh('dashboard')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Full refresh — also re-fetches categories/paymentModes (triggered by settings changes)
  const fullRefresh = useCallback(() => {
    getDashboardData(yearRef.current, monthRef.current).then(result => {
      if (result) setData(result)
    })
    fetchSettingsData().then(sd => {
      if (!sd) return
      setCategories(sd.categories)
      setPaymentModes(sd.paymentModes)
      setBudgetPeriods(sd.budgetPeriods)
      setCurrency(sd.settings.currency)
      setSubcategories(sd.subcategories)
      setEnableSubcategories(sd.settings.enable_subcategories)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const navigateMonth = (date: Date) => {
    const newYear = date.getFullYear()
    const newMonth = date.getMonth() + 1
    setYear(newYear)
    setMonth(newMonth)
    startTransition(async () => {
      const result = await getDashboardData(newYear, newMonth)
      if (result) setData(result)
    })
    triggerRefresh('dashboard')
  }

  // Use fullRefresh so categories/paymentModes update when settings change
  useSectionRefresh('dashboard', fullRefresh)

  return (
    <div className="page-enter flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: 'var(--c-primary)' }}>Dashboard</div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">Overview</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <MonthPicker year={year} month={month} onNavigate={navigateMonth} isPending={isPending} />
            <div className="hidden md:flex items-center gap-2">
              <AddIncomeButton paymentModes={paymentModes} budgetPeriods={budgetPeriods} categories={categories} subcategories={subcategories} enableSubcategories={enableSubcategories} currency={currency} onSuccess={silentRefresh} />
              <AddExpenseButton categories={categories} paymentModes={paymentModes} subcategories={subcategories} enableSubcategories={enableSubcategories} currency={currency} onSuccess={silentRefresh} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:hidden">
          <AddIncomeButton paymentModes={paymentModes} budgetPeriods={budgetPeriods} categories={categories} subcategories={subcategories} enableSubcategories={enableSubcategories} currency={currency} fullWidth onSuccess={silentRefresh} />
          <AddExpenseButton categories={categories} paymentModes={paymentModes} subcategories={subcategories} enableSubcategories={enableSubcategories} currency={currency} fullWidth onSuccess={silentRefresh} />
        </div>
      </div>

      <div style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 200ms' }}>
        <div className="flex flex-col gap-4 sm:gap-6">
          <KpiCards summary={data.summary} currency={currency} />
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="section-bar" style={{ backgroundColor: 'var(--c-primary)' }} />
              <h2 className="font-display text-lg font-medium text-[var(--ink)]">Budget split</h2>
            </div>
            <BudgetCards summary={data.summary} currency={currency} />
          </section>
          <section className="apple-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="section-bar" style={{ backgroundColor: 'var(--c-berry)' }} />
              <h2 className="font-display text-base font-medium text-[var(--ink)]">By category</h2>
            </div>
            <CategoryPie data={data.categorySpend} currency={currency} />
          </section>
          <AccountBalances balances={data.balances} creditCardTotal={data.creditCardTotal} paymentModes={paymentModes} currency={currency} userId={userId} onSuccess={silentRefresh} />
          <section className="apple-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="section-bar" style={{ backgroundColor: 'var(--c-need)' }} />
              <h2 className="font-display text-base font-medium text-[var(--ink)]">Daily spend</h2>
              <span className="text-xs text-[var(--ink-muted)] ml-1">(Need + Want)</span>
            </div>
            <DailyBar data={data.dailySpend} dailyLimit={data.dailyLimit} currency={currency} />
          </section>
          <section className="apple-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
              <h2 className="font-display text-base font-medium text-[var(--ink)]">Recent activity</h2>
              <span className="text-xs text-[var(--ink-muted)] ml-1">Last 6 transactions</span>
            </div>
            <RecentActivity expenses={data.recent6} categories={categories} paymentModes={paymentModes} currency={currency} />
          </section>
        </div>
      </div>
    </div>
  )
}

// ─── Expenses section ────────────────────────────────────────────
function ExpensesSection() {
  const [data, setData] = useState<ExpensesData | null>(null)
  const initPeriod = defaultPeriod()
  const [period, setPeriod] = useState<PeriodValue>(initPeriod)
  const [filters, setFilters] = useState<ExpensesFilters>({
    search: '', categoryIds: [], types: [], paymentModeIds: [], subcategoryIds: [], sort: 'date_desc',
    dateFrom: initPeriod.dateFrom, dateTo: initPeriod.dateTo,
  })
  const [page, setPage] = useState(1)
  const { triggerRefresh } = useAppShell()

  const filtersRef = useRef(filters)
  const pageRef    = useRef(page)
  filtersRef.current = filters
  pageRef.current    = page

  const load = async (f: ExpensesFilters, p: number) => {
    const result = await fetchExpenses(f, p)
    if (result) setData(result)
  }

  useEffect(() => { load(filters, page) }, [])

  useSectionRefresh('expenses', () => load(filtersRef.current, pageRef.current))

  const handlePeriodChange = async (p: PeriodValue) => {
    setPeriod(p)
    const newFilters = { ...filters, dateFrom: p.dateFrom, dateTo: p.dateTo }
    setFilters(newFilters)
    setPage(1)
    await load(newFilters, 1)
  }

  const handleFilterChange = async (key: string, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(1)
    await load(newFilters, 1)
  }

  const handlePageChange = async (p: number) => {
    setPage(p)
    await load(filters, p)
  }

  const handleRefresh = () => { load(filters, page); triggerRefresh('expenses') }

  if (!data) return <SectionSpinner />

  return (
    <div className="page-enter flex flex-col gap-4 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-berry)' }}>Expenses</div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">All expenses</h1>
        </div>
        <AddExpBtn categories={data.categories} paymentModes={data.paymentModes} subcategories={data.subcategories} enableSubcategories={data.enableSubcategories} onSuccess={handleRefresh} currency={data.currency} />
      </div>
      {/* Period filter */}
      <div className="apple-card px-3 sm:px-5 py-3">
        <PeriodFilter value={period} onChange={handlePeriodChange} accentColor="var(--c-berry)" />
      </div>
      <div className="apple-card p-3 sm:p-5">
        <ExpenseListClient
          expenses={data.expenses}
          totalCount={data.totalCount}
          categories={data.categories}
          paymentModes={data.paymentModes}
          categorySummary={data.categorySummary}
          subcategories={data.subcategories}
          enableSubcategories={data.enableSubcategories}
          currency={data.currency}
          page={page}
          filters={filters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}

// ─── Income section ──────────────────────────────────────────────
function IncomeSection() {
  const [data, setData] = useState<IncomeData | null>(null)
  const initPeriod = defaultPeriod()
  const [period, setPeriod] = useState<PeriodValue>(initPeriod)
  const [filters, setFilters] = useState<IncomeFilters>({
    search: '', paymentIds: [], categoryIds: [], types: [], subcategoryIds: [], sort: 'date_desc',
    dateFrom: initPeriod.dateFrom, dateTo: initPeriod.dateTo,
  })
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const { triggerRefresh } = useAppShell()

  const filtersRef = useRef(filters)
  const pageRef    = useRef(page)
  filtersRef.current = filters
  pageRef.current    = page

  const load = async (f: IncomeFilters, p: number) => {
    const result = await fetchIncome(f, p)
    if (result) setData(result)
  }

  useEffect(() => { load(filters, page) }, [])

  useSectionRefresh('income', () => load(filtersRef.current, pageRef.current))

  const handlePeriodChange = async (p: PeriodValue) => {
    setPeriod(p)
    const newFilters = { ...filters, dateFrom: p.dateFrom, dateTo: p.dateTo }
    setFilters(newFilters)
    setPage(1)
    await load(newFilters, 1)
  }

  const handleFilterChange = async (key: string, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setPage(1)
    await load(newFilters, 1)
  }

  const handlePageChange = async (p: number) => {
    setPage(p)
    await load(filters, p)
  }

  const handleRefresh = () => { load(filters, page); triggerRefresh('income') }

  if (!data) return <SectionSpinner />

  return (
    <>
      <div className="page-enter flex flex-col gap-4 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
              style={{ backgroundColor: 'var(--c-save)' }}>Income</div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">All Income</h1>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary shrink-0" style={{ backgroundColor: 'var(--c-save)' }}>
            <Plus size={16} />
            <span>Add income</span>
          </button>
        </div>
        {/* Period filter */}
        <div className="apple-card px-3 sm:px-5 py-3">
          <PeriodFilter value={period} onChange={handlePeriodChange} accentColor="var(--c-save)" />
        </div>
        <div className="apple-card p-3 sm:p-5">
          <IncomeListClient
            incomes={data.incomes}
            totalCount={data.totalCount}
            paymentModes={data.paymentModes}
            budgetPeriods={data.budgetPeriods}
            categories={data.categories}
            categorySummary={data.categorySummary}
            subcategories={data.subcategories}
            enableSubcategories={data.enableSubcategories}
            currency={data.currency}
            page={page}
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
      <IncomeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        paymentModes={data.paymentModes}
        budgetPeriods={data.budgetPeriods}
        categories={data.categories}
        subcategories={data.subcategories}
        enableSubcategories={data.enableSubcategories}
        onSuccess={() => handleRefresh()}
        currency={data.currency}
      />
    </>
  )
}

// ─── Weekly section ──────────────────────────────────────────────
function WeeklySection() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const currentYear = new Date().getFullYear()
  const displayYearRef = useRef(currentYear)

  const load = async (year: number) => {
    displayYearRef.current = year
    const result = await fetchWeekly(year)
    if (result) setData(result)
  }

  useEffect(() => { load(currentYear) }, [])

  useSectionRefresh('weekly', () => load(displayYearRef.current))

  if (!data) return <SectionSpinner />

  return (
    <WeeklyClient
      weeklyData={data.weeklyData}
      weeklyLimit={data.weeklyLimit}
      currency={data.currency}
      year={data.year}
      onYearChange={load}
    />
  )
}

// ─── Yearly section ──────────────────────────────────────────────
function YearlySection() {
  const [data, setData] = useState<YearlyData | null>(null)
  const currentYear = new Date().getFullYear()
  const displayYearRef = useRef(currentYear)

  const load = async (year: number) => {
    displayYearRef.current = year
    const result = await fetchYearly(year)
    if (result) setData(result)
  }

  useEffect(() => { load(currentYear) }, [])

  useSectionRefresh('yearly', () => load(displayYearRef.current))

  if (!data) return <SectionSpinner />

  return (
    <YearlyClient
      year={data.year}
      dailyData={data.dailyData}
      maxDay={data.maxDay}
      currency={data.currency}
      onYearChange={load}
    />
  )
}

// ─── Settings section ─────────────────────────────────────────────
function SettingsSection() {
  const [data, setData] = useState<SettingsData | null>(null)
  const { triggerRefresh } = useAppShell()

  const dataRef = useRef(data)
  dataRef.current = data

  const load = useCallback(async () => {
    const result = await fetchSettingsData()
    if (result) setData(result)
  }, [])

  // After any settings save, also notify other sections
  const handleRefresh = useCallback(async () => {
    await load()
    triggerRefresh('settings')
  }, [load, triggerRefresh])

  useEffect(() => { load() }, [load])

  useSectionRefresh('settings', load)

  if (!data) return <SectionSpinner />

  return (
    <SettingsClient
      userId={data.userId}
      settings={data.settings}
      categories={data.categories}
      paymentModes={data.paymentModes}
      budgetPeriods={data.budgetPeriods}
      recurringItems={data.recurringItems}
      subcategories={data.subcategories}
      usedCategoryIds={data.usedCategoryIds}
      usedPaymentModeIds={data.usedPaymentModeIds}
      usedSubcategoryIds={data.usedSubcategoryIds}
      onRefresh={handleRefresh}
    />
  )
}

// ─── Feedback section ─────────────────────────────────────────────
function FeedbackSection() {
  return <FeedbackPanel />
}

// ─── Admin section ────────────────────────────────────────────────
function AdminSection() {
  return <AdminPanel />
}

// ─── Main shell ───────────────────────────────────────────────────
interface DashboardClientProps {
  initialData: DashboardMonthData
  initialYear: number
  initialMonth: number
  categories: Category[]
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  subcategories: Subcategory[]
  enableSubcategories: boolean
  currency: string
  userId: string
}

export function DashboardClient(props: DashboardClientProps) {
  const { activeTab, isAdmin } = useAppShell()

  return (
    <>
      <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
        <DashboardSection {...props} />
      </div>
      <div style={{ display: activeTab === 'expenses' ? 'block' : 'none' }}>
        <ExpensesSection />
      </div>
      <div style={{ display: activeTab === 'income' ? 'block' : 'none' }}>
        <IncomeSection />
      </div>
      <div style={{ display: activeTab === 'weekly' ? 'block' : 'none' }}>
        <WeeklySection />
      </div>
      <div style={{ display: activeTab === 'yearly' ? 'block' : 'none' }}>
        <YearlySection />
      </div>
      <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
        <SettingsSection />
      </div>
      <div style={{ display: activeTab === 'feedback' ? 'block' : 'none' }}>
        <FeedbackSection />
      </div>
      {isAdmin && (
        <div style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
          <AdminSection />
        </div>
      )}
    </>
  )
}
