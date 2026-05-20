'use client'

import { useRouter } from 'next/navigation'
import { AddExpenseButton } from '@/components/add-expense-button'
import { AddIncomeButton } from '@/components/dashboard/add-income-button'
import type { BudgetPeriod, Category, PaymentMode } from '@/lib/types'

interface DashboardRefresherProps {
  categories: Category[]
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  currency: string
}

export function DashboardRefresher({ categories, paymentModes, budgetPeriods, currency }: DashboardRefresherProps) {
  const router = useRouter()
  const refresh = () => router.refresh()

  return (
    <div className="flex items-center gap-2">
      <AddIncomeButton
        paymentModes={paymentModes.filter((pm) => !pm.archived)}
        budgetPeriods={budgetPeriods}
        onSuccess={refresh}
        currency={currency}
      />
      <AddExpenseButton
        categories={categories}
        paymentModes={paymentModes}
        onSuccess={refresh}
        currency={currency}
      />
    </div>
  )
}
