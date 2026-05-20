import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { PaymentModeBalance } from '@/lib/types'

interface AccountBalancesProps {
  balances: PaymentModeBalance[]
  currency: string
}

export function AccountBalances({ balances, currency }: AccountBalancesProps) {
  if (balances.length === 0) return null

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="section-bar" style={{ backgroundColor: 'var(--c-save)' }} />
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Account balances</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {balances.map((b) => (
          <div key={b.id} className="apple-card overflow-hidden">
            <div className="h-1" style={{
              backgroundColor: b.balance >= 0 ? 'var(--c-save)' : 'var(--c-want)'
            }} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={14} className="text-[var(--ink-muted)]" />
                <p className="text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide">
                  {b.name}
                </p>
              </div>
              <p className="font-display text-2xl font-medium tabular-nums"
                style={{ color: b.balance >= 0 ? 'var(--c-save)' : 'var(--c-want)' }}>
                {b.balance < 0 ? '-' : ''}{formatCurrency(Math.abs(b.balance), currency)}
              </p>
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
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
