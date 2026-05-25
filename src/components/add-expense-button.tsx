'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ExpenseModal } from '@/components/expenses/expense-modal'
import type { Category, Expense, PaymentMode, Subcategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AddExpenseButtonProps {
  categories: Category[]
  paymentModes: PaymentMode[]
  subcategories?: Subcategory[]
  enableSubcategories?: boolean
  onSuccess?: () => void
  currency?: string
  fullWidth?: boolean
}

export function AddExpenseButton({
  categories,
  paymentModes,
  subcategories = [],
  enableSubcategories = false,
  onSuccess,
  currency,
  fullWidth,
}: AddExpenseButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn('btn-primary', fullWidth ? 'w-full justify-center' : 'shrink-0')}
        aria-label="Add expense"
      >
        <Plus size={16} />
        <span>Add expense</span>
      </button>
      <ExpenseModal
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        paymentModes={paymentModes}
        subcategories={subcategories}
        enableSubcategories={enableSubcategories}
        onSuccess={(_e: Expense, _isEdit: boolean) => { onSuccess?.() }}
        currency={currency}
      />
    </>
  )
}
