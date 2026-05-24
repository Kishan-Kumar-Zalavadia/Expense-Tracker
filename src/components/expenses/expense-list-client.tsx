'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, typeColor, typeTint } from '@/lib/utils'
import { ExpenseModal } from '@/components/expenses/expense-modal'
import type { Category, CategorySummaryItem, Expense, PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CategorySpendCards } from '@/components/category-spend-cards'

const PAGE_SIZE = 50

interface ExpenseListClientProps {
  expenses: Expense[]
  totalCount: number
  categories: Category[]
  paymentModes: PaymentMode[]
  categorySummary: CategorySummaryItem[]
  currency: string
  page: number
  filters: {
    search: string
    categoryId: string
    type: string
    paymentModeId: string
    sort: string
    dateFrom: string
    dateTo: string
  }
  onFilterChange: (key: string, value: string) => void
  onPageChange: (page: number) => void
  onRefresh: () => void
}

export function ExpenseListClient({
  expenses,
  totalCount,
  categories,
  paymentModes,
  categorySummary,
  currency,
  page,
  filters,
  onFilterChange,
  onPageChange,
  onRefresh,
}: ExpenseListClientProps) {
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const supabase = createClient()

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const handleEdit = (expense: Expense) => {
    setEditTarget(expense)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Expense deleted')
    onRefresh()
  }

  const selectCls = cn(
    'px-3 py-1.5 text-xs bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-sm)]',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  return (
    <>
      {/* Category spend cards */}
      {categorySummary.some((i) => i.show_in_cards) && (
        <div className="mb-4">
          <CategorySpendCards items={categorySummary} currency={currency} accentColor="var(--c-berry)" />
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input
          type="search"
          placeholder="Search description, notes..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="px-3 py-1.5 text-xs bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-sm)]
            text-[var(--ink)] placeholder:text-[var(--ink-subtle)]
            focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] flex-1 min-w-40"
        />

        <select value={filters.categoryId} onChange={(e) => onFilterChange('categoryId', e.target.value)} className={selectCls}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={filters.type} onChange={(e) => onFilterChange('type', e.target.value)} className={selectCls}>
          <option value="">All types</option>
          <option value="Need">Need</option>
          <option value="Want">Want</option>
          <option value="Saving">Saving</option>
        </select>

        <select value={filters.paymentModeId} onChange={(e) => onFilterChange('paymentModeId', e.target.value)} className={selectCls}>
          <option value="">All payment modes</option>
          {paymentModes.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
        </select>

        <select value={filters.sort} onChange={(e) => onFilterChange('sort', e.target.value)} className={selectCls}>
          <option value="date_desc">Newest first</option>
          <option value="date_asc">Oldest first</option>
          <option value="amount_desc">Largest first</option>
          <option value="amount_asc">Smallest first</option>
        </select>
      </div>

      {/* Summary line */}
      <p className="text-xs text-[var(--ink-muted)] mb-3 tabular-nums">
        {totalCount} expense{totalCount !== 1 ? 's' : ''}
        {totalCount > 0 && (
          <> · Total: <strong className="text-[var(--ink)]">
            {formatCurrency(expenses.reduce((s, e) => s + Number(e.amount), 0), currency)}
          </strong> (this page)</>
        )}
      </p>

      {expenses.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--ink-muted)]">
          No expenses found
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
                  {['Date', 'Category', 'Description', 'Amount', 'Payment', 'Type'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold
                      text-[var(--ink-muted)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="group bg-[var(--elevated)] hover:bg-[var(--surface)] cursor-pointer transition-colors"
                    onClick={() => handleEdit(expense)}
                  >
                    <td className="px-4 py-3 text-xs tabular-nums text-[var(--ink-muted)] whitespace-nowrap">
                      {formatDate(expense.date, 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--ink-muted)] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: expense.category?.color ?? 'var(--ink-subtle)' }} />
                        {expense.category?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink)] max-w-[180px]">
                      <div className="truncate text-[var(--ink-muted)] text-xs">{expense.description}</div>
                      {expense.notes && (
                        <div className="text-xs text-[var(--ink-subtle)] truncate mt-0.5">{expense.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--ink)] tabular-nums whitespace-nowrap">
                      {formatCurrency(Number(expense.amount), currency)}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--ink-muted)] whitespace-nowrap">
                      {expense.payment_mode?.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-sm)]"
                        style={{ backgroundColor: typeTint(expense.type), color: typeColor(expense.type) }}
                      >
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(expense) }}
                          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-subtle)] hover:text-[var(--c-primary)]
                            hover:bg-[var(--elevated)] transition-colors"
                          title="Edit"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(expense.id) }}
                          className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                            hover:bg-[var(--tint-want)] transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-[var(--border)]">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center gap-3 py-3 rounded-[var(--radius-md)] transition-colors cursor-pointer"
                onClick={() => handleEdit(expense)}
              >
                <span className="w-2 h-2 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: expense.category?.color ?? 'var(--ink-subtle)' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)] truncate">
                      {expense.category?.name}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-xs)] shrink-0"
                      style={{ backgroundColor: typeTint(expense.type), color: typeColor(expense.type) }}
                    >
                      {expense.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {expense.description && (
                      <span className="text-xs text-[var(--ink-muted)] truncate">{expense.description}</span>
                    )}
                    {expense.description && <span className="text-xs text-[var(--ink-subtle)]">·</span>}
                    <span className="text-xs text-[var(--ink-subtle)] tabular-nums whitespace-nowrap">
                      {formatDate(expense.date, 'dd MMM')}
                    </span>
                    {expense.payment_mode?.name && (
                      <>
                        <span className="text-xs text-[var(--ink-subtle)]">·</span>
                        <span className="text-xs text-[var(--ink-subtle)]">{expense.payment_mode.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-[var(--ink)]">
                    {formatCurrency(Number(expense.amount), currency)}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(expense) }}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-subtle)] hover:text-[var(--c-primary)] transition-colors"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(expense.id) }}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ink-subtle)] hover:text-[var(--c-want)] transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-[var(--ink-muted)] tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--ink-muted)]
                hover:text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--ink-muted)]
                hover:text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <ExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        expense={editTarget}
        categories={categories}
        paymentModes={paymentModes}
        onSuccess={onRefresh}
        currency={currency}
      />
    </>
  )
}
