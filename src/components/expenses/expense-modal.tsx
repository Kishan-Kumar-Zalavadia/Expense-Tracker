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
import type { Category, Expense, PaymentMode, Subcategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'

const EXPENSE_TYPES: ExpenseType[] = ['Need', 'Want', 'Saving']

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  categories: Category[]
  paymentModes: PaymentMode[]
  subcategories?: Subcategory[]
  enableSubcategories?: boolean
  onSuccess: (expense: Expense, isEdit: boolean) => void
  currency?: string
}

export function ExpenseModal({
  open,
  onOpenChange,
  expense,
  categories,
  paymentModes,
  subcategories = [],
  enableSubcategories = false,
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
      type: undefined,
      amount: '',
      payment_mode_id: '',
      subcategory_id: '',
      notes: '',
    },
  })

  const watchCategory = watch('category_id')
  const watchType = (watch('type') || 'Need') as ExpenseType
  const accentColor = typeColor(watchType)

  useEffect(() => {
    const cat = categories.find((c) => c.id === watchCategory)
    if (cat) setValue('type', cat.type)
  }, [watchCategory, categories, setValue])

  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          date: expense.date,
          description: expense.description ?? '',
          category_id: expense.category_id,
          type: expense.type ?? undefined,
          amount: String(expense.amount),
          payment_mode_id: expense.payment_mode_id,
          subcategory_id: expense.subcategory_id ?? '',
          notes: expense.notes ?? '',
        })
      } else {
        reset({
          date: todayISO(),
          description: '',
          category_id: (categories.find(c => c.is_default) ?? categories[0])?.id ?? '',
          type: (categories.find(c => c.is_default) ?? categories[0])?.type ?? undefined,
          amount: '',
          payment_mode_id: (paymentModes.find(pm => pm.is_default) ?? paymentModes[0])?.id ?? '',
          subcategory_id: '',
          notes: '',
        })
      }
    }
  }, [open, expense, reset, categories, paymentModes])

  const onSubmit = async (values: ExpenseFormValues) => {
    if (!/^\d+(\.\d+)?$/.test(values.amount.trim())) {
      toast.error('Enter a valid amount (e.g. 100 or 99.50)')
      return
    }
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
      type: values.type || null,
      amount: parsedAmount,
      payment_mode_id: values.payment_mode_id,
      subcategory_id: values.subcategory_id || null,
      notes: values.notes || null,
      updated_at: new Date().toISOString(),
    }

    let savedExpense: Expense
    if (isEdit) {
      const { data, error: err } = await supabase
        .from('expenses').update(payload).eq('id', expense!.id)
        .select('*, category:categories(*), payment_mode:payment_modes(*), subcategory:subcategories(*)')
        .single()
      if (err) { toast.error(err.message); setLoading(false); return }
      savedExpense = data as Expense
    } else {
      const { data, error: err } = await supabase
        .from('expenses').insert(payload)
        .select('*, category:categories(*), payment_mode:payment_modes(*), subcategory:subcategories(*)')
        .single()
      if (err) { toast.error(err.message); setLoading(false); return }
      savedExpense = data as Expense
    }
    toast.success(isEdit ? 'Expense updated' : 'Expense added')
    onOpenChange(false)
    onSuccess(savedExpense, isEdit)
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border border-[var(--border)] bg-[var(--elevated)] sm:max-w-md
          overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="h-1.5 w-full shrink-0 transition-colors duration-200"
          style={{
            backgroundColor: accentColor,
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          }} />

        <div className="px-6 pt-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium text-[var(--ink)]">
              {isEdit ? 'Edit expense' : 'Add expense'}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pt-4 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Date" required error={errors.date?.message}>
              <DatePicker
                value={watch('date') ?? ''}
                onChange={(v) => setValue('date', v, { shouldValidate: true })}
                hasError={!!errors.date}
              />
            </Field>

            <Field label="Description" error={errors.description?.message}>
              <input
                {...register('description')}
                type="text"
                placeholder="What did you spend on? (optional)"
                className={inputCls(!!errors.description)}
              />
            </Field>

            <Field label="Category" required error={errors.category_id?.message}>
              <select {...register('category_id')} className={inputCls(!!errors.category_id)}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>

            {enableSubcategories && (
              <Field label="Subcategory" error={undefined}>
                <select {...register('subcategory_id')} className={inputCls(false)}>
                  <option value="">No subcategory (optional)</option>
                  {subcategories.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Type" error={errors.type?.message}>
              <select
                {...register('type')}
                className={inputCls(!!errors.type)}
                style={{ borderLeftColor: accentColor, borderLeftWidth: '3px' }}
              >
                <option value="">None (optional)</option>
                {EXPENSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-[var(--ink-subtle)]">
                Auto-suggested from category — you can change it
              </p>
            </Field>

            <Field label="Amount" required error={errors.amount?.message}>
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
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={cn(inputCls(!!errors.amount), 'tabular-nums')}
                  style={{ paddingLeft: 'calc(2.5rem + 12px)' }}
                />
              </div>
            </Field>

            <Field label="Payment Mode" required error={errors.payment_mode_id?.message}>
              <select {...register('payment_mode_id')} className={inputCls(!!errors.payment_mode_id)}>
                <option value="">Select payment mode</option>
                {paymentModes.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Notes" error={errors.notes?.message}>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Any additional notes... (optional)"
                className={cn(inputCls(false), 'resize-none')}
              />
            </Field>

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
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
        {label}
        {required && <span className="ml-0.5" style={{ color: 'var(--c-want)' }}>*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[var(--c-want)]">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return cn('apple-input text-sm', hasError && 'error')
}
