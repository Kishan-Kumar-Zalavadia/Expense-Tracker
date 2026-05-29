'use client'

import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, todayISO } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PaymentMode, PaymentModeBalance } from '@/lib/types'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreditCardPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditCard: PaymentModeBalance
  paymentModes: PaymentMode[]
  currency: string
  userId: string
  onSuccess: () => void
}

export function CreditCardPaymentModal({
  open,
  onOpenChange,
  creditCard,
  paymentModes,
  currency,
  userId,
  onSuccess,
}: CreditCardPaymentModalProps) {
  const supabase = createClient()
  const [amount, setAmount] = useState('')
  const [date, setDate]     = useState(todayISO())
  const [fromId, setFromId] = useState(paymentModes[0]?.id ?? '')
  const [saving, setSaving] = useState(false)

  const amountOwed = Math.max(0, -creditCard.balance)

  const getOrCreateCCCategory = async (): Promise<string> => {
    const { data: existing } = await supabase
      .from('categories').select('id')
      .eq('user_id', userId).eq('is_system', true).maybeSingle()
    if (existing) return existing.id

    const { data: maxRow } = await supabase
      .from('categories').select('sort_order')
      .eq('user_id', userId).order('sort_order', { ascending: false })
      .limit(1).maybeSingle()

    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: 'CC Payment',
        type: 'Saving',
        color: '#5856D6',
        is_system: true,
        sort_order: (maxRow?.sort_order ?? 0) + 1,
      })
      .select('id').single()
    if (error) throw error
    return created.id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (!fromId)          { toast.error('Select the account you are paying from'); return }
    if (!date)            { toast.error('Select a date'); return }

    setSaving(true)
    try {
      const categoryId = await getOrCreateCCCategory()

      const { error: incErr } = await supabase.from('incomes').insert({
        user_id: userId, date,
        description: `Credit card payment – ${creditCard.name}`,
        amount: amt,
        payment_mode_id: creditCard.id,
        budget_period_id: null,
        auto_generated: false,
        notes: null,
      })
      if (incErr) throw incErr

      const fromName = paymentModes.find((pm) => pm.id === fromId)?.name ?? ''
      const { error: expErr } = await supabase.from('expenses').insert({
        user_id: userId, date,
        description: `CC Payment – ${creditCard.name}`,
        category_id: categoryId,
        amount: amt,
        payment_mode_id: fromId,
        type: null,
        notes: `Paid from ${fromName}`,
      })
      if (expErr) throw expErr

      toast.success(`Logged ${formatCurrency(amt, currency)} payment to ${creditCard.name}`)
      setAmount('')
      setDate(todayISO())
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border border-[var(--border)] bg-[var(--elevated)] sm:max-w-md
          overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        {/* Accent bar */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{
            backgroundColor: 'var(--c-primary)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          }}
        />

        <div className="px-6 pt-4 shrink-0">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium text-[var(--ink)] flex items-center gap-2">
              <CreditCard size={18} className="text-[var(--c-primary)]" />
              Pay credit card
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pt-4 pb-6">
          {/* Card summary */}
          <div className="mb-5 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
            <p className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-widest mb-1">
              {creditCard.name}
            </p>
            <p className="text-sm text-[var(--ink)]">
              Outstanding:{' '}
              <span className="font-semibold" style={{ color: amountOwed > 0 ? 'var(--c-want)' : 'var(--c-save)' }}>
                {formatCurrency(amountOwed, currency)}
              </span>
            </p>
            <p className="text-xs text-[var(--ink-subtle)] mt-0.5">
              Paying reduces your debt and deducts from your source account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date */}
            <Field label="Date" required>
              <DatePicker
                value={date}
                onChange={setDate}
              />
            </Field>

            {/* Amount */}
            <Field label="Payment amount" required>
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
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={amountOwed > 0 ? amountOwed.toFixed(2) : '0.00'}
                  className={cn('apple-input text-sm tabular-nums')}
                  style={{ paddingLeft: 'calc(2.5rem + 12px)' }}
                  required
                />
              </div>
              {amountOwed > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(amountOwed.toFixed(2))}
                  className="mt-1.5 text-[11px] touch-manipulation hover:underline"
                  style={{ color: 'var(--c-primary)' }}
                >
                  Pay full amount ({formatCurrency(amountOwed, currency)})
                </button>
              )}
            </Field>

            {/* Paying from */}
            <Field label="Paying from" required>
              {paymentModes.length === 0 ? (
                <p className="text-xs text-[var(--ink-subtle)] italic py-2">
                  No bank / cash accounts available. Add a non-credit-card payment mode first.
                </p>
              ) : (
                <select
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="apple-input text-sm"
                  required
                >
                  {paymentModes.map((pm) => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              )}
            </Field>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 px-4 py-2 text-sm text-[var(--ink-muted)] border border-[var(--border)]
                  rounded-[var(--radius-xl)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px]
                  touch-manipulation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || paymentModes.length === 0}
                className="flex-1 btn-primary justify-center transition-colors duration-200 disabled:opacity-50
                  touch-manipulation"
              >
                {saving ? (
                  <span className="animate-spin w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full" />
                ) : 'Log payment'}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
        {label}
        {required && <span className="ml-0.5" style={{ color: 'var(--c-want)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
