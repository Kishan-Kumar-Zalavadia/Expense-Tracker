'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { incomeSchema, type IncomeFormValues } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { todayISO } from '@/lib/utils'
import type { BudgetPeriod, Category, Income, PaymentMode, Subcategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'

interface IncomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income?: Income | null
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  categories: Category[]
  subcategories?: Subcategory[]
  enableSubcategories?: boolean
  onSuccess: (income: Income, isEdit: boolean) => void
  currency?: string
}

export function IncomeModal({
  open,
  onOpenChange,
  income,
  paymentModes,
  budgetPeriods,
  categories,
  subcategories = [],
  enableSubcategories = false,
  onSuccess,
  currency = '₹',
}: IncomeModalProps) {
  const isEdit = !!income
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      date: todayISO(),
      description: '',
      category_id: '',
      amount: '',
      payment_mode_id: '',
      budget_period_id: '',
      subcategory_id: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (income) {
        reset({
          date: income.date,
          description: income.description ?? '',
          category_id: income.category_id ?? '',
          amount: String(income.amount),
          payment_mode_id: income.payment_mode_id,
          budget_period_id: income.budget_period_id ?? '',
          subcategory_id: income.subcategory_id ?? '',
          notes: income.notes ?? '',
        })
      } else {
        reset({
          date: todayISO(),
          description: '',
          category_id: '',
          amount: '',
          payment_mode_id: (paymentModes.find(pm => pm.is_default) ?? paymentModes[0])?.id ?? '',
          budget_period_id: '',
          subcategory_id: '',
          notes: '',
        })
      }
    }
  }, [open, income, reset, paymentModes])

  const onSubmit = async (values: IncomeFormValues) => {
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
      category_id: values.category_id || null,
      amount: parsedAmount,
      payment_mode_id: values.payment_mode_id,
      budget_period_id: values.budget_period_id || null,
      subcategory_id: values.subcategory_id || null,
      auto_generated: false,
      notes: values.notes || null,
      updated_at: new Date().toISOString(),
    }

    let savedIncome: Income
    if (isEdit) {
      const { data, error: err } = await supabase
        .from('incomes').update(payload).eq('id', income!.id)
        .select('*, payment_mode:payment_modes(*), category:categories(*), subcategory:subcategories(*)')
        .single()
      if (err) { toast.error(err.message); setLoading(false); return }
      savedIncome = data as Income
    } else {
      const { data, error: err } = await supabase
        .from('incomes').insert(payload)
        .select('*, payment_mode:payment_modes(*), category:categories(*), subcategory:subcategories(*)')
        .single()
      if (err) { toast.error(err.message); setLoading(false); return }
      savedIncome = data as Income
    }
    toast.success(isEdit ? 'Income updated' : 'Income added')
    onOpenChange(false)
    onSuccess(savedIncome, isEdit)
    setLoading(false)
  }

  const inputCls = (hasError: boolean) => cn('apple-input text-sm', hasError && 'error')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border border-[var(--border)] bg-[var(--elevated)] sm:max-w-md
          overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="h-1.5 w-full shrink-0"
          style={{
            backgroundColor: 'var(--c-save)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          }} />

        <div className="px-6 pt-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium text-[var(--ink)]">
              {isEdit ? 'Edit income' : 'Add income'}
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
                placeholder="e.g. Salary, Freelance, Bonus (optional)"
                className={inputCls(!!errors.description)}
              />
            </Field>

            <Field label="Category" error={undefined}>
              <select {...register('category_id')} className={inputCls(false)}>
                <option value="">No category (optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.type}</option>
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

            <Field label="Amount" required error={errors.amount?.message}>
              <div className="relative flex items-center">
                <span className="absolute left-0 flex items-center justify-center h-full px-3
                  text-[var(--ink-muted)] text-sm font-medium pointer-events-none border-r border-[var(--border)]"
                  style={{ minWidth: '2.5rem' }}>
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

            <Field label="Payment mode" required error={errors.payment_mode_id?.message}>
              <select {...register('payment_mode_id')} className={inputCls(!!errors.payment_mode_id)}>
                <option value="">Select payment mode</option>
                {paymentModes.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Budget period" error={undefined}>
              <select {...register('budget_period_id')} className={inputCls(false)}>
                <option value="">None (optional)</option>
                {budgetPeriods.map((p) => (
                  <option key={p.id} value={p.id}>{fmtPeriod(p)}</option>
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
                className="flex-1 btn-primary justify-center"
                style={{ backgroundColor: 'var(--c-save)' }}
              >
                {loading
                  ? <span className="animate-spin w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full" />
                  : isEdit ? 'Save changes' : 'Add income'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function fmtPeriod(p: BudgetPeriod): string {
  try {
    const [sy, sm] = p.start_month.split('-').map(Number)
    const startLabel = new Date(sy, sm - 1, 1).toLocaleDateString('en', { month: 'short', year: 'numeric' })
    const endLabel = p.end_month
      ? (() => { const [ey, em] = p.end_month.split('-').map(Number); return new Date(ey, em - 1, 1).toLocaleDateString('en', { month: 'short', year: 'numeric' }) })()
      : 'Present'
    return `${startLabel} → ${endLabel}`
  } catch { return p.start_month }
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
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
