'use client'

import { useCallback, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { IncomeListClient } from './income-list-client'
import type { BudgetPeriod, Category, CategorySummaryItem, Income, PaymentMode } from '@/lib/types'
import { Plus } from 'lucide-react'
import { IncomeModal } from './income-modal'
import { PeriodFilter, defaultPeriod, type PeriodValue } from '@/components/ui/period-filter'

interface IncomePageClientProps {
  initialIncomes: Income[]
  totalCount: number
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  categories: Category[]
  categorySummary: CategorySummaryItem[]
  currency: string
  initialPage: number
  initialFilters: {
    search: string
    paymentIds: string[]
    categoryIds: string[]
    types: string[]
    sort: string
    dateFrom: string
    dateTo: string
  }
}

export function IncomePageClient({
  initialIncomes,
  totalCount,
  paymentModes,
  budgetPeriods,
  categories,
  categorySummary,
  currency,
  initialPage,
  initialFilters,
}: IncomePageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)
  const initPeriod = defaultPeriod()
  const [period, setPeriod] = useState<PeriodValue>(initPeriod)

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const handleFilterChange = (key: string, value: string | string[]) => {
    const urlKey = key === 'paymentIds' ? 'payment'
                 : key === 'categoryIds' ? 'category'
                 : key === 'types' ? 'type'
                 : key
    updateUrl({ [urlKey]: Array.isArray(value) ? value.join(',') : value })
  }

  const handlePeriodChange = (p: PeriodValue) => {
    setPeriod(p)
    updateUrl({ dateFrom: p.dateFrom, dateTo: p.dateTo })
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleRefresh = () => router.refresh()

  return (
    <>
      <div className="page-enter flex flex-col gap-4 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold
              uppercase tracking-widest text-white"
              style={{ backgroundColor: 'var(--c-save)' }}>
              Income
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
              All Income
            </h1>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary shrink-0"
            style={{ backgroundColor: 'var(--c-save)' }}
          >
            <Plus size={16} />
            <span>Add income</span>
          </button>
        </div>

        {/* Period filter */}
        <div className="apple-card px-3 sm:px-5 py-3">
          <PeriodFilter value={period} onChange={handlePeriodChange} accentColor="var(--c-save)" />
        </div>

        {/* List */}
        <div className="apple-card p-3 sm:p-5">
          <IncomeListClient
            incomes={initialIncomes}
            totalCount={totalCount}
            paymentModes={paymentModes}
            budgetPeriods={budgetPeriods}
            categories={categories}
            categorySummary={categorySummary}
            currency={currency}
            page={initialPage}
            filters={initialFilters}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onRefresh={handleRefresh}
          />
        </div>
      </div>

      <IncomeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        paymentModes={paymentModes}
        budgetPeriods={budgetPeriods}
        categories={categories}
        onSuccess={handleRefresh}
        currency={currency}
      />
    </>
  )
}
