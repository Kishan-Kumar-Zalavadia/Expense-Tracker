'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ExpenseType } from '@/lib/types'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { expenseSchema, type ExpenseFormValues } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { todayISO, typeColor, typeTint } from '@/lib/utils'
import type { Category, Expense, PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

const EXPENSE_TYPES: ExpenseType[] = ['Need', 'Want', 'Saving']

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  categories: Category[]
  paymentModes: PaymentMode[]
  onSuccess: () => void
  currency?: string
}

export function ExpenseModal({
  open,
  onOpenChange,
  expense,
  categories,
  paymentModes,
  onSuccess,
  currency = '₹',
}: ExpenseModalProps) {
  const isEdit = !!expense
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: todayISO(),
      description: '',
      category_id: '',
      type: 'Need',
      amount: '',
      payment_mode_id: '',
      notes: '',
    },
  })

  const watchCategory = watch('category_id')
  const watchType = (watch('type') || 'Need') as ExpenseType
  const accentColor = typeColor(watchType)

  // When category changes, suggest the matching type (user can still override)
  useEffect(() => {
    const cat = categories.find((c) => c.id === watchCategory)
    if (cat) {
      setValue('type', cat.type)
    }
  }, [watchCategory, categories, setValue])

  // Populate form when opening
  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          date: expense.date,
          description: expense.description ?? '',
          category_id: expense.category_id,
          type: expense.type,
          amount: String(expense.amount),
          payment_mode_id: expense.payment_mode_id,
          notes: expense.notes ?? '',
        })
      } else {
        reset({
          date: todayISO(),
          description: '',
          category_id: categories[0]?.id ?? '',
          type: categories[0]?.type ?? 'Need',
          amount: '',
          payment_mode_id: paymentModes[0]?.id ?? '',
          notes: '',
        })
      }
    }
  }, [open, expense, reset, categories, paymentModes])

  const onSubmit = async (values: ExpenseFormValues) => {
    const parsedAmount = parseFloat(values.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setLoading(false); return }

    const payload = {
      user_id: user.id,
      date: values.date,
      description: values.description || null,
      category_id: values.category_id,
      type: values.type,
      amount: parsedAmount,
      payment_mode_id: values.payment_mode_id,
      notes: values.notes || null,
      updated_at: new Date().toISOString(),
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', expense!.id))
    } else {
      ;({ error } = await supabase.from('expenses').insert(payload))
    }

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(isEdit ? 'Expense updated' : 'Expense added')
    onOpenChange(false)
    onSuccess()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border border-[var(--border)] bg-[var(--elevated)] sm:max-w-md"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        {/* Type-colored top bar — stays fixed */}
        <div className="h-1 w-full shrink-0 transition-colors duration-200"
          style={{ backgroundColor: accentColor }} />

        {/* Fixed header */}
        <div className="px-6 pt-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium text-[var(--ink)]">
              {isEdit ? 'Edit expense' : 'Add expense'}
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Scrollable form area */}
        <div className="overflow-y-auto flex-1 px-6 pt-4 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Date */}
            <Field label="Date" error={errors.date?.message}>
              <input
                {...register('date')}
                type="date"
                className={inputCls(!!errors.date)}
              />
            </Field>

            {/* Description */}
            <Field label="Description (optional)" error={errors.description?.message}>
              <input
                {...register('description')}
                type="text"
                placeholder="What did you spend on?"
                className={inputCls(!!errors.description)}
              />
            </Field>

            {/* Category */}
            <Field label="Category" error={errors.category_id?.message}>
              <select
                {...register('category_id')}
                className={inputCls(!!errors.category_id)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            {/* Type — editable, auto-suggested from category */}
            <Field label="Type" error={errors.type?.message}>
              <select
                {...register('type')}
                className={inputCls(!!errors.type)}
                style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
              >
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-[var(--ink-subtle)]">
                Auto-suggested from category — you can change it
              </p>
            </Field>

            {/* Amount */}
            <Field label="Amount" error={errors.amount?.message}>
              <div className="relative flex items-center">
                <span
                  className="absolute left-0 flex items-center justify-center h-full px-3
                    text-[var(--ink-muted)] text-sm font-medium pointer-events-none select-none
                    border-r border-[var(--border)]"
                  style={{ minWidth: '2.5rem' }}
                >
                  {currency}
                </span>
                <input
                  {...register('amount')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={cn(inputCls(!!errors.amount), 'tabular-nums')}
                  style={{ paddingLeft: 'calc(2.5rem + 12px)' }}
                />
              </div>
            </Field>

            {/* Payment Mode */}
            <Field label="Payment Mode" error={errors.payment_mode_id?.message}>
              <select
                {...register('payment_mode_id')}
                className={inputCls(!!errors.payment_mode_id)}
              >
                <option value="">Select payment mode</option>
                {paymentModes.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </Field>

            {/* Notes */}
            <Field label="Notes (optional)" error={errors.notes?.message}>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Any additional notes..."
                className={cn(inputCls(false), 'resize-none')}
              />
            </Field>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 text-sm text-[var(--ink-muted)] border border-[var(--border)]
                  rounded-[var(--radius-xl)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary justify-center transition-colors duration-200"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full" />
                ) : isEdit ? 'Save changes' : 'Add expense'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--c-want)]">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    'apple-input text-sm',
    hasError && 'error',
  )
}
