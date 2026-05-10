'use client'

import { useRouter } from 'next/navigation'
import { AddExpenseButton } from '@/components/add-expense-button'
import type { Category, PaymentMode } from '@/lib/types'

interface DashboardRefresherProps {
  categories: Category[]
  paymentModes: PaymentMode[]
}

export function DashboardRefresher({ categories, paymentModes }: DashboardRefresherProps) {
  const router = useRouter()

  return (
    <AddExpenseButton
      categories={categories}
      paymentModes={paymentModes}
      onSuccess={() => router.refresh()}
      variant="sidebar"
    />
  )
}
