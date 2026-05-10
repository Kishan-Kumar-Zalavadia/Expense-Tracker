'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ExpenseModal } from '@/components/expenses/expense-modal'
import type { Category, PaymentMode } from '@/lib/types'

interface AddExpenseButtonProps {
  categories: Category[]
  paymentModes: PaymentMode[]
  onSuccess?: () => void
  variant?: 'sidebar' | 'fab'
}

export function AddExpenseButton({
  categories,
  paymentModes,
  onSuccess,
  variant = 'sidebar',
}: AddExpenseButtonProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    onSuccess?.()
    // Trigger a router refresh so server components re-fetch
    window.location.reload()
  }

  if (variant === 'fab') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full
            flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--c-primary)', color: '#fff', boxShadow: 'var(--shadow-lg)' }}
          aria-label="Add expense"
        >
          <Plus size={22} />
        </button>
        <ExpenseModal
          open={open}
          onOpenChange={setOpen}
          categories={categories}
          paymentModes={paymentModes}
          onSuccess={handleSuccess}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full justify-center"
      >
        <Plus size={14} />
        Add expense
      </button>
      <ExpenseModal
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        paymentModes={paymentModes}
        onSuccess={handleSuccess}
      />
    </>
  )
}
