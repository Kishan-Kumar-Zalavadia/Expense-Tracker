'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronRight, Info } from 'lucide-react'
import { toast } from 'sonner'
import { format, addMonths } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, budgetPeriodsOverlap, currentMonthISO } from '@/lib/utils'
import type { BudgetPeriod, PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BudgetPeriodsProps {
  userId: string
  periods: BudgetPeriod[]
  paymentModes: PaymentMode[]
  currency: string
  onSave: () => void
}

interface PeriodForm {
  start_month: string
  end_month: string
  is_present: boolean
  monthly_amount: string
  needs_pct: string
  wants_pct: string
  savings_pct: string
  track_income: boolean
  income_payment_mode_id: string
  income_day_1: string
  income_day_2: string
}

const DEFAULT_FORM: PeriodForm = {
  start_month: currentMonthISO(),
  end_month: '',
  is_present: true,
  monthly_amount: '',
  needs_pct: '50',
  wants_pct: '30',
  savings_pct: '20',
  track_income: false,
  income_payment_mode_id: '',
  income_day_1: '',
  income_day_2: '',
}

function fmtMonth(m: string) {
  // YYYY-MM → "Jan 2024"
  try {
    const [y, mo] = m.split('-').map(Number)
    return format(new Date(y, mo - 1, 1), 'MMM yyyy')
  } catch { return m }
}

async function generateIncomeEntries(
  periodId: string,
  startMonth: string,
  endMonth: string | null,
  monthlyAmount: number,
  paymentModeId: string,
  day1: number,
  day2: number | null,
  userId: string,
  supabase: ReturnType<typeof createClient>,
) {
  const today = currentMonthISO()
  const effectiveEnd = endMonth ?? today
  if (startMonth > effectiveEnd) return

  // Remove any previously auto-generated entries for this period
  await supabase.from('incomes').delete()
    .eq('budget_period_id', periodId)
    .eq('auto_generated', true)

  const entries: {
    user_id: string; date: string; description: string; amount: number;
    payment_mode_id: string; budget_period_id: string; auto_generated: boolean
  }[] = []

  const numDays = day2 ? 2 : 1
  const amountPerEntry = Math.round((monthlyAmount / numDays) * 100) / 100

  let current = startMonth
  while (current <= effectiveEnd) {
    const [y, m] = current.split('-').map(Number)
    const days = [day1, day2].filter(Boolean) as number[]
    for (const day of days) {
      entries.push({
        user_id: userId,
        date: `${current}-${String(day).padStart(2, '0')}`,
        description: 'Income',
        amount: amountPerEntry,
        payment_mode_id: paymentModeId,
        budget_period_id: periodId,
        auto_generated: true,
      })
    }
    // Advance to next month
    const next = addMonths(new Date(y, m - 1, 1), 1)
    current = format(next, 'yyyy-MM')
  }

  if (entries.length > 0) {
    const { error } = await supabase.from('incomes').insert(entries)
    if (error) toast.error('Income entries: ' + error.message)
    else toast.success(`Created ${entries.length} income ${entries.length === 1 ? 'entry' : 'entries'}`)
  }
}

export function BudgetPeriodsPanel({
  userId,
  periods,
  paymentModes,
  currency,
  onSave,
}: BudgetPeriodsProps) {
  const supabase = createClient()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PeriodForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  const set = (key: keyof PeriodForm, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }))

  const pctSum = Number(form.needs_pct) + Number(form.wants_pct) + Number(form.savings_pct)

  function validateForm(existingId?: string): string | null {
    if (!form.start_month) return 'Start month is required'
    if (!form.is_present && !form.end_month) return 'End month is required (or check "Ongoing")'
    if (!form.is_present && form.end_month < form.start_month)
      return 'End month must be on or after start month'
    if (!form.monthly_amount || Number(form.monthly_amount) <= 0)
      return 'Monthly budget must be greater than 0'
    if (pctSum !== 100) return `Percentages must sum to 100 (currently ${pctSum})`
    if (form.track_income) {
      if (!form.income_payment_mode_id) return 'Select a payment mode for income tracking'
      if (!form.income_day_1 || Number(form.income_day_1) < 1 || Number(form.income_day_1) > 28)
        return 'Income day 1 must be between 1 and 28'
      if (form.income_day_2 && (Number(form.income_day_2) < 1 || Number(form.income_day_2) > 28))
        return 'Income day 2 must be between 1 and 28'
    }
    // Overlap check against all other periods
    const newStart = form.start_month
    const newEnd = form.is_present ? null : form.end_month
    for (const p of periods) {
      if (p.id === existingId) continue
      if (budgetPeriodsOverlap(newStart, newEnd, p.start_month, p.end_month)) {
        return `This range overlaps with an existing period: ${fmtMonth(p.start_month)} → ${p.end_month ? fmtMonth(p.end_month) : 'Present'}`
      }
    }
    return null
  }

  function startAdd() {
    setForm({ ...DEFAULT_FORM, income_payment_mode_id: paymentModes[0]?.id ?? '' })
    setAdding(true)
    setEditingId(null)
  }

  function startEdit(p: BudgetPeriod) {
    setForm({
      start_month: p.start_month,
      end_month: p.end_month ?? '',
      is_present: p.end_month === null,
      monthly_amount: String(p.monthly_amount),
      needs_pct: String(p.needs_pct),
      wants_pct: String(p.wants_pct),
      savings_pct: String(p.savings_pct),
      track_income: p.track_income,
      income_payment_mode_id: p.income_payment_mode_id ?? '',
      income_day_1: p.income_day_1 ? String(p.income_day_1) : '',
      income_day_2: p.income_day_2 ? String(p.income_day_2) : '',
    })
    setEditingId(p.id)
    setAdding(false)
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  async function savePeriod(existingId?: string) {
    const err = validateForm(existingId)
    if (err) { toast.error(err); return }

    setSaving(true)

    const payload = {
      user_id: userId,
      start_month: form.start_month,
      end_month: form.is_present ? null : form.end_month,
      monthly_amount: Number(form.monthly_amount),
      needs_pct: Number(form.needs_pct),
      wants_pct: Number(form.wants_pct),
      savings_pct: Number(form.savings_pct),
      track_income: form.track_income,
      income_payment_mode_id: form.track_income && form.income_payment_mode_id
        ? form.income_payment_mode_id : null,
      income_day_1: form.track_income && form.income_day_1 ? Number(form.income_day_1) : null,
      income_day_2: form.track_income && form.income_day_2 ? Number(form.income_day_2) : null,
    }

    let savedId: string | undefined = existingId

    if (existingId) {
      const { error } = await supabase.from('budget_periods').update(payload).eq('id', existingId)
      if (error) { toast.error(error.message); setSaving(false); return }
    } else {
      const { data, error } = await supabase.from('budget_periods').insert(payload).select('id').single()
      if (error) { toast.error(error.message); setSaving(false); return }
      savedId = data.id
    }

    // Auto-generate income entries if tracking enabled
    if (form.track_income && savedId && form.income_payment_mode_id && form.income_day_1) {
      await generateIncomeEntries(
        savedId,
        form.start_month,
        form.is_present ? null : form.end_month || null,
        Number(form.monthly_amount),
        form.income_payment_mode_id,
        Number(form.income_day_1),
        form.income_day_2 ? Number(form.income_day_2) : null,
        userId,
        supabase,
      )
    } else if (existingId) {
      // If track_income was turned off on edit, remove auto-generated entries
      await supabase.from('incomes').delete()
        .eq('budget_period_id', existingId)
        .eq('auto_generated', true)
    }

    toast.success(existingId ? 'Period updated' : 'Period added')
    cancel()
    setSaving(false)
    onSave()
  }

  async function deletePeriod(id: string) {
    if (!confirm('Delete this budget period? Auto-generated income entries for this period will also be removed.')) return
    // Delete auto-generated incomes first
    await supabase.from('incomes').delete().eq('budget_period_id', id).eq('auto_generated', true)
    const { error } = await supabase.from('budget_periods').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Period deleted')
    onSave()
  }

  const sorted = [...periods].sort((a, b) => a.start_month.localeCompare(b.start_month))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-primary)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Budget Periods</h2>
        </div>
        {!adding && !editingId && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white
              rounded-[var(--radius-xl)] transition-colors"
            style={{ backgroundColor: 'var(--c-primary)' }}
          >
            <Plus size={12} /> Add period
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--ink-muted)]">
        Define monthly budget amounts for different time periods. Ranges must not overlap.
        Set &quot;Ongoing&quot; for a period that continues until you add a new one.
      </p>

      {/* Period list */}
      {sorted.length === 0 && !adding && (
        <div className="py-8 text-center text-sm text-[var(--ink-muted)]">
          No budget periods yet. Add one to get started.
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((p) => {
          const isEditing = editingId === p.id
          return (
            <div key={p.id}>
              {/* Display row */}
              {!isEditing && (
                <div className="flex items-start gap-3 px-4 py-3.5 bg-[var(--elevated)]
                  border border-[var(--border)] rounded-[var(--radius-md)]">
                  {/* Date range */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--ink)] tabular-nums">
                        {fmtMonth(p.start_month)}
                      </span>
                      <ChevronRight size={12} className="text-[var(--ink-subtle)]" />
                      <span className={cn(
                        'text-sm font-semibold tabular-nums',
                        !p.end_month ? 'text-[var(--c-save)]' : 'text-[var(--ink)]'
                      )}>
                        {p.end_month ? fmtMonth(p.end_month) : 'Present'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-sm font-medium tabular-nums text-[var(--ink)]">
                        {formatCurrency(p.monthly_amount, currency)}/mo
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)]"
                          style={{ backgroundColor: 'var(--tint-need)', color: 'var(--c-need)' }}>
                          N {p.needs_pct}%
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)]"
                          style={{ backgroundColor: 'var(--tint-want)', color: 'var(--c-want)' }}>
                          W {p.wants_pct}%
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)]"
                          style={{ backgroundColor: 'var(--tint-save)', color: 'var(--c-save)' }}>
                          S {p.savings_pct}%
                        </span>
                      </div>
                      {p.track_income && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-xs)]
                          bg-[var(--tint-need)] text-[var(--c-primary)]">
                          Income tracked
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(p)}
                      className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)]
                        hover:text-[var(--c-primary)] hover:bg-[var(--elevated)] transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deletePeriod(p.id)}
                      className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)]
                        hover:text-[var(--c-want)] hover:bg-[var(--tint-want)] transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}

              {/* Inline edit form */}
              {isEditing && (
                <PeriodForm
                  form={form}
                  set={set}
                  pctSum={pctSum}
                  paymentModes={paymentModes}
                  currency={currency}
                  saving={saving}
                  onSave={() => savePeriod(p.id)}
                  onCancel={cancel}
                  isEdit
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Add new period form */}
      {adding && (
        <PeriodForm
          form={form}
          set={set}
          pctSum={pctSum}
          paymentModes={paymentModes}
          currency={currency}
          saving={saving}
          onSave={() => savePeriod()}
          onCancel={cancel}
          isEdit={false}
        />
      )}
    </div>
  )
}

// ─── Shared form component ─────────────────────────────────────────

function PeriodForm({
  form, set, pctSum, paymentModes, currency, saving, onSave, onCancel, isEdit,
}: {
  form: PeriodForm
  set: (k: keyof PeriodForm, v: string | boolean) => void
  pctSum: number
  paymentModes: PaymentMode[]
  currency: string
  saving: boolean
  onSave: () => void
  onCancel: () => void
  isEdit: boolean
}) {
  const inputCls = 'apple-input text-sm'

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-lg)] p-5 bg-[var(--elevated)] space-y-5">
      <h3 className="text-sm font-semibold text-[var(--ink)]">
        {isEdit ? 'Edit period' : 'New budget period'}
      </h3>

      {/* Date range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Start month</label>
          <input
            type="month"
            value={form.start_month}
            onChange={(e) => set('start_month', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">End month</label>
          <input
            type="month"
            value={form.end_month}
            onChange={(e) => set('end_month', e.target.value)}
            disabled={form.is_present}
            className={cn(inputCls, form.is_present && 'opacity-40')}
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_present}
              onChange={(e) => set('is_present', e.target.checked)}
              className="w-4 h-4 accent-[var(--c-primary)]"
            />
            <span className="text-xs text-[var(--ink-muted)]">Ongoing (no end date)</span>
          </label>
        </div>
      </div>

      {/* Monthly amount */}
      <div>
        <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Monthly budget</label>
        <div className="relative flex items-center">
          <span className="absolute left-0 flex items-center justify-center h-full px-3
            text-[var(--ink-muted)] text-sm font-medium pointer-events-none border-r border-[var(--border)]"
            style={{ minWidth: '2.5rem' }}>
            {currency}
          </span>
          <input
            type="number"
            min="0"
            step="100"
            placeholder="3000"
            value={form.monthly_amount}
            onChange={(e) => set('monthly_amount', e.target.value)}
            className={cn(inputCls, 'tabular-nums')}
            style={{ paddingLeft: 'calc(2.5rem + 12px)' }}
          />
        </div>
      </div>

      {/* Budget split */}
      <div>
        <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Budget split (must sum to 100%)</label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'needs_pct' as const, label: 'Needs', color: 'var(--c-need)' },
            { key: 'wants_pct' as const, label: 'Wants', color: 'var(--c-want)' },
            { key: 'savings_pct' as const, label: 'Savings', color: 'var(--c-save)' },
          ]).map(({ key, label, color }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color }}>{label}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form[key]}
                  onChange={(e) => set(key, e.target.value)}
                  className={cn(inputCls, 'pr-6 tabular-nums text-center')}
                  style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--ink-muted)]">%</span>
              </div>
            </div>
          ))}
        </div>
        <p className={cn(
          'text-xs mt-1.5 font-medium tabular-nums',
          pctSum === 100 ? 'text-[var(--c-save)]' : 'text-[var(--c-want)]'
        )}>
          Total: {pctSum}% {pctSum === 100 ? '✓' : `(need ${100 - pctSum > 0 ? '+' : ''}${100 - pctSum} more)`}
        </p>
      </div>

      {/* Track income */}
      <div className="border-t border-[var(--border)] pt-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={form.track_income}
            onChange={(e) => set('track_income', e.target.checked)}
            className="w-4 h-4 mt-0.5 accent-[var(--c-primary)]"
          />
          <div>
            <span className="text-sm font-medium text-[var(--ink)]">
              Track this budget as income
            </span>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Automatically creates income entries in your income tracker for the selected dates.
            </p>
          </div>
        </label>

        {form.track_income && (
          <div className="mt-4 space-y-4 pl-7">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Payment mode (where income arrives)</label>
              <select
                value={form.income_payment_mode_id}
                onChange={(e) => set('income_payment_mode_id', e.target.value)}
                className={inputCls}
              >
                <option value="">Select payment mode</option>
                {paymentModes.map((pm) => (
                  <option key={pm.id} value={pm.id}>{pm.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Income date(s) each month</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--ink-muted)] mb-1 block">Day 1 (required)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    placeholder="1"
                    value={form.income_day_1}
                    onChange={(e) => set('income_day_1', e.target.value)}
                    className={cn(inputCls, 'tabular-nums text-center')}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--ink-muted)] mb-1 block">Day 2 (optional)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    placeholder="15"
                    value={form.income_day_2}
                    onChange={(e) => set('income_day_2', e.target.value)}
                    className={cn(inputCls, 'tabular-nums text-center')}
                  />
                </div>
              </div>
              <p className="text-[10px] text-[var(--ink-muted)] mt-1.5 flex items-start gap-1">
                <Info size={10} className="mt-0.5 shrink-0" />
                For biweekly pay, enter both days (e.g. 1 and 15).
                Each entry receives {currency}monthly ÷ number of days.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm text-[var(--ink-muted)] border border-[var(--border)]
            rounded-[var(--radius-xl)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex-1 btn-primary justify-center"
        >
          {saving
            ? <span className="animate-spin w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full" />
            : isEdit ? 'Save changes' : 'Add period'}
        </button>
      </div>
    </div>
  )
}

