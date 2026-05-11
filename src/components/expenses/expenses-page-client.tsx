'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ExpenseListClient } from './expense-list-client'
import { AddExpenseButton } from '@/components/add-expense-button'
import type { Category, Expense, PaymentMode } from '@/lib/types'

interface ExpensesPageClientProps {
  initialExpenses: Expense[]
  totalCount: number
  categories: Category[]
  paymentModes: PaymentMode[]
  currency: string
  initialPage: number
  initialFilters: {
    search: string
    categoryId: string
    type: string
    paymentModeId: string
    sort: string
  }
}

export function ExpensesPageClient({
  initialExpenses,
  totalCount,
  categories,
  paymentModes,
  currency,
  initialPage,
  initialFilters,
}: ExpensesPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const handleFilterChange = (key: string, value: string) => {
    const urlKey = key === 'categoryId' ? 'category'
                 : key === 'paymentModeId' ? 'payment'
                 : key
    updateUrl({ [urlKey]: value })
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleRefresh = () => router.refresh()

  return (
    <div className="page-enter flex flex-col gap-4 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center px-2 py-0.5 mb-1 rounded-full text-[10px] font-bold
            uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-berry)' }}>
            Expenses
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
            All expenses
          </h1>
        </div>
        <AddExpenseButton
          categories={categories}
          paymentModes={paymentModes}
          onSuccess={handleRefresh}
          currency={currency}
        />
      </div>

      {/* List */}
      <div className="apple-card p-3 sm:p-5">
        <ExpenseListClient
          expenses={initialExpenses}
          totalCount={totalCount}
          categories={categories}
          paymentModes={paymentModes}
          currency={currency}
          page={initialPage}
          filters={initialFilters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}
