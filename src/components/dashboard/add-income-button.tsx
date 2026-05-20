'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { IncomeModal } from '@/components/income/income-modal'
import type { BudgetPeriod, PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AddIncomeButtonProps {
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  onSuccess?: () => void
  currency?: string
  fullWidth?: boolean
}

export function AddIncomeButton({
  paymentModes,
  budgetPeriods,
  onSuccess,
  currency,
  fullWidth,
}: AddIncomeButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn('btn-primary', fullWidth ? 'w-full justify-center' : 'shrink-0')}
        style={{ backgroundColor: 'var(--c-save)' }}
        aria-label="Add income"
      >
        <Plus size={16} />
        <span>Add income</span>
      </button>
      <IncomeModal
        open={open}
        onOpenChange={setOpen}
        paymentModes={paymentModes}
        budgetPeriods={budgetPeriods}
        onSuccess={() => { onSuccess?.(); window.location.reload() }}
        currency={currency}
      />
    </>
  )
}
