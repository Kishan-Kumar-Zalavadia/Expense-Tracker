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

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null   // null = add mode
  categories: Category[]
  paymentModes: PaymentMode[]
  onSuccess: () => void
}

export function ExpenseModal({
  open,
  onOpenChange,
  expense,
  categories,
  paymentModes,
  onSuccess,
}: ExpenseModalProps) {
  const isEdit = !!expense
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [currentType, setCurrentType] = useState<ExpenseType>('Need')

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

  // Derive type from selected category — always, even in edit mode
  useEffect(() => {
    const cat = categories.find((c) => c.id === watchCategory)
    if (cat) {
      setCurrentType(cat.type)
      setValue('type', cat.type)
    }
  }, [watchCategory, categories, setValue])

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          date: expense.date,
          description: expense.description,
          category_id: expense.category_id,
          type: expense.type,
          amount: String(expense.amount),
          payment_mode_id: expense.payment_mode_id,
          notes: expense.notes ?? '',
        })
        setCurrentType(expense.type)
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
        setCurrentType(categories[0]?.type ?? 'Need')
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
      description: values.description,
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

  const accentColor = typeColor(currentType)
  const tintColor = typeTint(currentType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden border border-[var(--border)] bg-[var(--elevated)] max-w-md"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        {/* Type-colored top bar */}
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

        <div className="px-6 pt-4 pb-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-display text-xl font-medium text-[var(--ink)]">
              {isEdit ? 'Edit expense' : 'Add expense'}
            </DialogTitle>
          </DialogHeader>

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
            <Field label="Description" error={errors.description?.message}>
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

            {/* Type — read-only, derived from category */}
            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
                Type
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] border text-sm min-h-[44px]"
                style={{
                  borderColor: accentColor + '50',
                  borderLeftColor: accentColor,
                  borderLeftWidth: '3px',
                  backgroundColor: typeTint(currentType),
                }}
              >
                <span className="font-medium" style={{ color: accentColor }}>
                  {currentType}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">— set by category</span>
              </div>
              <input type="hidden" {...register('type')} />
            </div>

            {/* Amount */}
            <Field label="Amount" error={errors.amount?.message}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] text-sm font-mono">₹</span>
                <input
                  {...register('amount')}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className={cn(inputCls(!!errors.amount), 'pl-7 tabular-nums')}
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
                className="flex-1 btn-primary justify-center"
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
