'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, typeColor, typeTint } from '@/lib/utils'
import { ExpenseModal } from '@/components/expenses/expense-modal'
import type { Category, Expense, PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RecentActivityProps {
  expenses: Expense[]
  categories: Category[]
  paymentModes: PaymentMode[]
  currency: string
}

export function RecentActivity({
  expenses,
  categories,
  paymentModes,
  currency,
}: RecentActivityProps) {
  const router = useRouter()
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Expense deleted')
    router.refresh()
  }

  const handleEdit = (expense: Expense) => {
    setEditTarget(expense)
    setModalOpen(true)
  }

  if (!expenses.length) {
    return (
      <div className="py-10 text-center text-sm text-[var(--ink-muted)]">
        No expenses recorded this month
      </div>
    )
  }

  return (
    <>
      <div className="divide-y divide-[var(--border)]">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="group flex items-center gap-3 py-3 px-2 hover:bg-[var(--surface-2)] rounded-[var(--radius-md)]
              transition-colors cursor-pointer"
            onClick={() => handleEdit(expense)}
          >
            {/* Color dot */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: expense.category?.color ?? 'var(--ink-subtle)' }}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-[var(--ink)] truncate">
                  {expense.category?.name}
                </span>
                {/* Type badge */}
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-xs)]"
                  style={{
                    backgroundColor: typeTint(expense.type),
                    color: typeColor(expense.type),
                  }}
                >
                  {expense.type}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {expense.description && (
                  <>
                    <span className="text-xs text-[var(--ink-muted)] truncate">
                      {expense.description}
                    </span>
                    <span className="text-xs text-[var(--ink-subtle)]">·</span>
                  </>
                )}
                <span className="text-xs text-[var(--ink-muted)] tabular-nums">
                  {formatDate(expense.date, 'dd MMM')}
                </span>
              </div>
            </div>

            <span className="tabular-nums text-sm font-medium text-[var(--ink)] shrink-0">
              {formatCurrency(expense.amount, currency)}
            </span>

            {/* Action icons — visible on row hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(expense) }}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-primary)]
                  hover:bg-[var(--elevated)] transition-colors"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(expense.id) }}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                  hover:bg-[var(--tint-want)] transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        expense={editTarget}
        categories={categories}
        paymentModes={paymentModes}
        onSuccess={() => router.refresh()}
        currency={currency}
      />
    </>
  )
}
