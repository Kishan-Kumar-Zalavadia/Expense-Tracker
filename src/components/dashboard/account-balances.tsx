'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Wallet, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PaymentMode, PaymentModeBalance } from '@/lib/types'
import type { CreditCardTotal } from '@/app/(app)/dashboard/actions'
import { CreditCardPaymentModal } from './credit-card-payment-modal'

interface AccountBalancesProps {
  balances: PaymentModeBalance[]
  creditCardTotal: CreditCardTotal
  /** Active, non-credit-card modes — used as "paying from" options in the CC modal */
  paymentModes: PaymentMode[]
  currency: string
  userId: string
}

export function AccountBalances({ balances, creditCardTotal, paymentModes, currency, userId }: AccountBalancesProps) {
  const router = useRouter()
  const [payTarget, setPayTarget] = useState<PaymentModeBalance | null>(null)

  if (balances.length === 0 && creditCardTotal.cardCount === 0) return null

  const nonCreditModes = paymentModes.filter((pm) => !pm.is_credit_card)
  const { totalOutstanding, totalCharged, cardCount } = creditCardTotal

  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Account balances</h2>
        </div>

        {/* Credit card total summary — shown whenever there are CC accounts */}
        {cardCount > 0 && (
          <div
            className="mb-3 flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5
              rounded-[var(--radius-md)] border"
            style={{
              borderColor: totalOutstanding > 0 ? 'var(--c-want)' : 'var(--c-save)',
              backgroundColor: totalOutstanding > 0 ? 'var(--tint-want)' : 'var(--tint-save)',
            }}
          >
            {/* Left: icon + label */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div
                className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: totalOutstanding > 0
                    ? 'color-mix(in srgb, var(--c-want) 18%, transparent)'
                    : 'color-mix(in srgb, var(--c-save) 18%, transparent)',
                }}
              >
                <CreditCard
                  size={15}
                  style={{ color: totalOutstanding > 0 ? 'var(--c-want)' : 'var(--c-save)' }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: totalOutstanding > 0 ? 'var(--c-want)' : 'var(--c-save)' }}>
                  Total credit card
                  {cardCount > 1 && (
                    <span className="ml-1 font-normal normal-case text-[var(--ink-muted)]">
                      ({cardCount} cards)
                    </span>
                  )}
                </p>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Total charged: <span className="tabular-nums font-medium text-[var(--ink)]">
                    {formatCurrency(totalCharged, currency)}
                  </span>
                </p>
              </div>
            </div>

            {/* Right: outstanding amount */}
            <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
              {totalOutstanding > 0 ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <AlertCircle size={13} style={{ color: 'var(--c-want)' }} />
                    <p className="text-base font-semibold tabular-nums" style={{ color: 'var(--c-want)' }}>
                      {formatCurrency(totalOutstanding, currency)}
                    </p>
                  </div>
                  <p className="text-[10px] text-[var(--ink-muted)]">outstanding — pay this amount</p>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} style={{ color: 'var(--c-save)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--c-save)' }}>
                    All paid up
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {balances.length > 0 && (
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
                      style={{ borderColor: 'var(--c-primary)', color: 'var(--c-primary)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--tint-primary)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
                    >
                      Pay credit card
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
