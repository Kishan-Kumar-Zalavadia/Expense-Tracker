'use client'

import { useState } from 'react'
import { CreditCard, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, todayISO } from '@/lib/utils'
import type { PaymentMode, PaymentModeBalance } from '@/lib/types'
import { cn } from '@/lib/utils'
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
  /** Non-credit-card, active payment modes for "paying from" */
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
  const [amount, setAmount]   = useState('')
  const [date, setDate]       = useState(todayISO())
  const [fromId, setFromId]   = useState(paymentModes[0]?.id ?? '')
  const [saving, setSaving]   = useState(false)

  const amountOwed = Math.max(0, -creditCard.balance)

  const inputCls = cn(
    'w-full px-3 py-2.5 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  /** Find or lazily create the system "CC Payment" category for this user. */
  const getOrCreateCCCategory = async (): Promise<string> => {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('is_system', true)
      .maybeSingle()
    if (existing) return existing.id

    // First time: create the system category
    const { data: maxRow } = await supabase
      .from('categories')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()

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
      .select('id')
      .single()
    if (error) throw error
    return created.id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (!fromId) { toast.error('Select the account you are paying from'); return }
    if (!date) { toast.error('Select a date'); return }

    setSaving(true)
    try {
      // Get or create the system CC category
      const categoryId = await getOrCreateCCCategory()

      // 1. Income on the credit card → reduces debt, restores balance
      const { error: incErr } = await supabase.from('incomes').insert({
        user_id: userId,
        date,
        description: `Credit card payment – ${creditCard.name}`,
        amount: amt,
        payment_mode_id: creditCard.id,
        budget_period_id: null,
        auto_generated: false,
        notes: null,
      })
      if (incErr) throw incErr

      // 2. Expense from source account → cash left the bank
      const fromName = paymentModes.find((pm) => pm.id === fromId)?.name ?? ''
      const { error: expErr } = await supabase.from('expenses').insert({
        user_id: userId,
        date,
        description: `CC Payment – ${creditCard.name}`,
        category_id: categoryId,
        amount: amt,
        payment_mode_id: fromId,
        type: 'Saving',
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <CreditCard size={16} className="text-[var(--c-primary)]" />
            Pay credit card
          </DialogTitle>
        </DialogHeader>

        {/* Card info */}
        <div className="px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--elevated)]">
          <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide mb-1">
            {creditCard.name}
          </p>
          <p className="text-sm text-[var(--ink)]">
            Outstanding balance:{' '}
            <span className="font-semibold" style={{ color: amountOwed > 0 ? 'var(--c-want)' : 'var(--c-save)' }}>
              {formatCurrency(amountOwed, currency)}
            </span>
          </p>
          <p className="text-xs text-[var(--ink-subtle)] mt-1">
            Paying will reduce your outstanding debt and deduct from your source account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
              Payment amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-muted)]">
                {currency}
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={amountOwed > 0 ? String(amountOwed.toFixed(2)) : '0.00'}
                className={cn(inputCls, 'pl-8')}
                autoFocus
                required
              />
            </div>
            {amountOwed > 0 && (
              <button
                type="button"
                onClick={() => setAmount(amountOwed.toFixed(2))}
                className="mt-1 text-[10px] text-[var(--c-primary)] hover:underline"
              >
                Pay full amount ({formatCurrency(amountOwed, currency)})
              </button>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {/* From account */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1">
              Paying from
            </label>
            {paymentModes.length === 0 ? (
              <p className="text-xs text-[var(--ink-subtle)] italic">
                No bank / cash accounts available. Add a non-credit-card payment mode first.
              </p>
            ) : (
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className={inputCls}
                required
              >
                {paymentModes.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 px-4 py-2.5 text-sm border border-[var(--border)] rounded-[var(--radius-md)]
                text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || paymentModes.length === 0}
              className="flex-1 btn-primary text-sm disabled:opacity-50"
            >
              {saving ? 'Logging…' : 'Log payment'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
