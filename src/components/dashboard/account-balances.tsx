'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Wallet, CreditCard, LayoutList, Banknote } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PaymentMode, PaymentModeBalance } from '@/lib/types'
import type { CreditCardTotal } from '@/app/(app)/dashboard/actions'
import { CreditCardPaymentModal } from './credit-card-payment-modal'

interface AccountBalancesProps {
  balances: PaymentModeBalance[]
  creditCardTotal: CreditCardTotal
  paymentModes: PaymentMode[]
  currency: string
  userId: string
}

export function AccountBalances({ balances, creditCardTotal, paymentModes, currency, userId }: AccountBalancesProps) {
  const router = useRouter()
  const [payTarget, setPayTarget] = useState<PaymentModeBalance | null>(null)

  if (balances.length === 0 && creditCardTotal.cardCount === 0) return null

  const nonCreditModes = paymentModes.filter((pm) => !pm.is_credit_card)
  const { totalBalance, totalCharged, cardCount, debitTotal, debitCount } = creditCardTotal
  const showCCTotal = cardCount >= 1
  const showDebitTotal = debitCount >= 1

  return (
    <>
      <section>
        <div className="flex items-center gap-2 mb-3">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Account balances</h2>
        </div>

        {/* Summary total cards — shown first, full-width row */}
        {(showDebitTotal || showCCTotal) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Total debit / cash card */}
            {showDebitTotal && (
              <div className="overflow-hidden rounded-[var(--radius-lg)] border-2"
                style={{
                  borderColor: debitTotal >= 0 ? 'var(--c-save)' : 'var(--c-want)',
                  backgroundColor: debitTotal >= 0 ? 'var(--tint-save)' : 'var(--tint-want)',
                }}>
                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote size={14} style={{ color: debitTotal >= 0 ? 'var(--c-save)' : 'var(--c-want)' }} />
                    <p className="text-xs font-semibold uppercase tracking-wide flex-1 truncate"
                      style={{ color: debitTotal >= 0 ? 'var(--c-save)' : 'var(--c-want)' }}>
                      Total cash &amp; debit
                    </p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0"
                      style={{
                        borderColor: debitTotal >= 0 ? 'var(--c-save)' : 'var(--c-want)',
                        color: debitTotal >= 0 ? 'var(--c-save)' : 'var(--c-want)',
                      }}>
                      {debitCount} {debitCount === 1 ? 'account' : 'accounts'}
                    </span>
                  </div>

                  <p className="font-display text-3xl font-semibold tabular-nums"
                    style={{ color: debitTotal >= 0 ? 'var(--c-save)' : 'var(--c-want)' }}>
                    {debitTotal < 0 ? '-' : ''}{formatCurrency(Math.abs(debitTotal), currency)}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: debitTotal >= 0 ? 'var(--c-save)' : 'var(--c-want)', opacity: 0.75 }}>
                    {debitTotal >= 0 ? 'Total available balance' : 'Total deficit'}
                  </p>
                </div>
              </div>
            )}

            {/* Total credit card card */}
            {showCCTotal && (
              <div className="overflow-hidden rounded-[var(--radius-lg)] border-2"
                style={{
                  borderColor: totalBalance < 0 ? 'var(--c-want)' : 'var(--c-save)',
                  backgroundColor: totalBalance < 0 ? 'var(--tint-want)' : 'var(--tint-save)',
                }}>
                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutList size={14} style={{ color: totalBalance < 0 ? 'var(--c-want)' : 'var(--c-save)' }} />
                    <p className="text-xs font-semibold uppercase tracking-wide flex-1 truncate"
                      style={{ color: totalBalance < 0 ? 'var(--c-want)' : 'var(--c-save)' }}>
                      Total credit cards
                    </p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0"
                      style={{
                        borderColor: totalBalance < 0 ? 'var(--c-want)' : 'var(--c-save)',
                        color: totalBalance < 0 ? 'var(--c-want)' : 'var(--c-save)',
                      }}>
                      {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                    </span>
                  </div>

                  <p className="font-display text-3xl font-semibold tabular-nums"
                    style={{ color: totalBalance < 0 ? 'var(--c-want)' : 'var(--c-save)' }}>
                    {totalBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(totalBalance), currency)}
                  </p>
                  {totalBalance < 0 ? (
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-want)', opacity: 0.75 }}>Total amount to pay back</p>
                  ) : (
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--c-save)', opacity: 0.75 }}>All cards paid up</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingDown size={10} style={{ color: 'var(--c-want)' }} />
                    <span className="text-xs tabular-nums" style={{ color: 'var(--c-want)' }}>
                      {formatCurrency(totalCharged, currency)}
                    </span>
                    <span className="text-[11px]" style={{ color: totalBalance < 0 ? 'var(--c-want)' : 'var(--c-save)', opacity: 0.6 }}>
                      total charged
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Individual account cards */}
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
                  <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide flex-1 truncate">
                    {b.name}
                  </p>
                  {b.is_credit_card && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
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
                  <p className="text-[10px] text-[var(--ink-subtle)] mt-0.5">Outstanding balance</p>
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
