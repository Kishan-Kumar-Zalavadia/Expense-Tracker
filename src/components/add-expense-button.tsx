'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ExpenseModal } from '@/components/expenses/expense-modal'
import type { Category, PaymentMode } from '@/lib/types'

interface AddExpenseButtonProps {
  categories: Category[]
  paymentModes: PaymentMode[]
  onSuccess?: () => void
  currency?: string
}

export function AddExpenseButton({
  categories,
  paymentModes,
  onSuccess,
  currency,
}: AddExpenseButtonProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    onSuccess?.()
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary shrink-0"
        aria-label="Add expense"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Add expense</span>
      </button>
      <ExpenseModal
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        paymentModes={paymentModes}
        onSuccess={handleSuccess}
        currency={currency}
      />
    </>
  )
}
