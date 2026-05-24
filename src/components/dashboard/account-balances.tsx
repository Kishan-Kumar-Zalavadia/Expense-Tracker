'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Wallet, CreditCard, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PaymentMode, PaymentModeBalance } from '@/lib/types'
import { CreditCardPaymentModal } from './credit-card-payment-modal'

interface AccountBalancesProps {
  balances: PaymentModeBalance[]
  /** Active, non-credit-card modes — used as "paying from" options in the CC modal */
  paymentModes: PaymentMode[]
  currency: string
  userId: string
}

export function AccountBalances({ balances, paymentModes, currency, userId }: AccountBalancesProps) {
  const router = useRouter()
  const [payTarget, setPayTarget] = useState<PaymentModeBalance | null>(null)

  if (balances.length === 0) return null

  const nonCreditModes = paymentModes.filter((pm) => !pm.is_credit_card)

  // Credit card totals
  const creditCards = balances.filter((b) => b.is_credit_card)
  const totalCCOutstanding = creditCards.reduce((sum, b) => sum + (b.balance < 0 ? Math.abs(b.balance) : 0), 0)
  const totalCCSpent = creditCards.reduce((sum, b) => sum + b.expense_total, 0)

  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Account balances</h2>
        </div>

        {/* Credit card summary banner — shown only if there are credit cards */}
        {creditCards.length > 0 && (
          <div
            className="mb-3 flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border"
            style={{
              borderColor: totalCCOutstanding > 0 ? 'var(--c-want)' : 'var(--c-save)',
              backgroundColor: totalCCOutstanding > 0 ? 'var(--tint-want)' : 'var(--tint-save)',
            }}
          >
            <div className="flex items-center gap-2 flex-1">
              <CreditCard
                size={16}
                style={{ color: totalCCOutstanding > 0 ? 'var(--c-want)' : 'var(--c-save)', flexShrink: 0 }}
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: totalCCOutstanding > 0 ? 'var(--c-want)' : 'var(--c-save)' }}>
                  Total credit card
                  {creditCards.length > 1 && <span className="font-normal ml-1">({creditCards.length} cards)</span>}
                </p>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Total charged: {formatCurrency(totalCCSpent, currency)}
                </p>
              </div>
            </div>
            <div className="text-right sm:text-right">
              {totalCCOutstanding > 0 ? (
                <>
                  <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--c-want)' }}>
                    {formatCurrency(totalCCOutstanding, currency)} due
                  </p>
                  <p className="text-[10px] text-[var(--ink-muted)] flex items-center gap-1 justify-end mt-0.5">
                    <AlertCircle size={10} />
                    Outstanding across all cards
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--c-save)' }}>
                  All paid up
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {balances.map((b) => (
            <div key={b.id} className="apple-card overflow-hidden">
              <div className="h-1" style={{
                backgroundColor: b.is_credit_card
                  ? (b.balance < 0 ? 'var(--c-want)' : 'var(--c-save)')
                  : (b.balance >= 0 ? 'var(--c-save)' : 'var(--c-want)')
              }} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  {b.is_credit_card
                    ? <CreditCard size={14} className="text-[var(--ink-muted)]" />
                    : <Wallet size={14} className="text-[var(--ink-muted)]" />
                  }
                  <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide flex-1">
                    {b.name}
                  </p>
                  {b.is_credit_card && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--tint-need)', color: 'var(--c-need)' }}>
                      Credit
                    </span>
                  )}
                </div>

                <p className="font-display text-2xl font-medium tabular-nums"
                  style={{
                    color: b.is_credit_card
                      ? (b.balance < 0 ? 'var(--c-want)' : 'var(--c-save)')
                      : (b.balance >= 0 ? 'var(--c-save)' : 'var(--c-want)')
                  }}>
                  {b.balance < 0 ? '-' : ''}{formatCurrency(Math.abs(b.balance), currency)}
                </p>

                {b.is_credit_card && b.balance < 0 && (
                  <p className="text-[10px] text-[var(--ink-subtle)] mt-0.5">
                    Outstanding: {formatCurrency(Math.abs(b.balance), currency)}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs tabular-nums" style={{ color: 'var(--c-save)' }}>
                    <TrendingUp size={10} />
                    {formatCurrency(b.income_total, currency)}
                  </span>
                  <span className="text-[var(--ink-subtle)] text-xs">·</span>
                  <span className="flex items-center gap-1 text-xs tabular-nums" style={{ color: 'var(--c-want)' }}>
                    <TrendingDown size={10} />
                    {formatCurrency(b.expense_total, currency)}
                  </span>
                </div>

                {b.is_credit_card && (
                  <button
                    onClick={() => setPayTarget(b)}
                    className="mt-3 w-full py-1.5 text-xs font-medium rounded-[var(--radius-md)] border transition-colors"
                    style={{
                      borderColor: 'var(--c-primary)',
                      color: 'var(--c-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--tint-primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = ''
                    }}
                  >
                    Pay credit card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {payTarget && (
        <CreditCardPaymentModal
          open={!!payTarget}
          onOpenChange={(open) => { if (!open) setPayTarget(null) }}
          creditCard={payTarget}
          paymentModes={nonCreditModes}
          currency={currency}
          userId={userId}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
