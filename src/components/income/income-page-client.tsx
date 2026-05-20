'use client'

import { useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { IncomeListClient } from './income-list-client'
import type { BudgetPeriod, Income, PaymentMode } from '@/lib/types'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { IncomeModal } from './income-modal'

interface IncomePageClientProps {
  initialIncomes: Income[]
  totalCount: number
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  currency: string
  initialPage: number
  initialFilters: {
    search: string
    paymentId: string
    sort: string
  }
}

export function IncomePageClient({
  initialIncomes,
  totalCount,
  paymentModes,
  budgetPeriods,
  currency,
  initialPage,
  initialFilters,
}: IncomePageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [modalOpen, setModalOpen] = useState(false)

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
    const urlKey = key === 'paymentId' ? 'payment' : key
    updateUrl({ [urlKey]: value })
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

        {/* List */}
        <div className="apple-card p-3 sm:p-5">
          <IncomeListClient
            incomes={initialIncomes}
            totalCount={totalCount}
            paymentModes={paymentModes}
            budgetPeriods={budgetPeriods}
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
        onSuccess={handleRefresh}
        currency={currency}
      />
    </>
  )
}
