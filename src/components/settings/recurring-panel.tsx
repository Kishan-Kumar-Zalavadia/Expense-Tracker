'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { format, addMonths, addWeeks, parseISO, isAfter, isBefore, startOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, todayISO } from '@/lib/utils'
import type { Category, PaymentMode, RecurringItem, RecurringFrequency } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RecurringPanelProps {
  userId: string
  items: RecurringItem[]
  categories: Category[]
  paymentModes: PaymentMode[]
  currency: string
  onSave: () => void
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface ItemForm {
  type: 'income' | 'expense'
  description: string
  amount: string
  payment_mode_id: string
  category_id: string
  expense_type: 'Need' | 'Want' | 'Saving'
  frequency: RecurringFrequency
  day_of_month: string
  day_of_week: string
  notes: string
}

const DEFAULT_FORM: ItemForm = {
  type: 'expense',
  description: '',
  amount: '',
  payment_mode_id: '',
  category_id: '',
  expense_type: 'Need',
  frequency: 'monthly',
  day_of_month: '1',
  day_of_week: '0',
  notes: '',
}

function nextDueLabel(item: RecurringItem): string {
  const today = startOfDay(new Date())
  const last = item.last_generated_date ? parseISO(item.last_generated_date) : null

  if (item.frequency === 'monthly' && item.day_of_month) {
    const d = new Date(today.getFullYear(), today.getMonth(), item.day_of_month)
    const next = isBefore(d, today) ? new Date(d.getFullYear(), d.getMonth() + 1, item.day_of_month) : d
    return format(next, 'dd MMM yyyy')
  }
  if ((item.frequency === 'weekly' || item.frequency === 'biweekly') && item.day_of_week !== null) {
    // day_of_week: 0=Mon
    const todayDow = (today.getDay() + 6) % 7
    let daysUntil = (item.day_of_week - todayDow + 7) % 7
    if (daysUntil === 0) daysUntil = item.frequency === 'biweekly' ? 14 : 7
    const next = new Date(today)
    next.setDate(today.getDate() + daysUntil)
    return format(next, 'dd MMM yyyy')
  }
  return '—'
}

// Generate entries from last_generated_date up to today
async function generateEntries(
  item: RecurringItem,
  userId: string,
  supabase: ReturnType<typeof createClient>,
): Promise<number> {
  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')
  const lastStr = item.last_generated_date ?? format(
    // default: start 1 period before today so we generate today if due
    item.frequency === 'monthly'
      ? new Date(today.getFullYear(), today.getMonth() - 1, item.day_of_month ?? 1)
      : addWeeks(today, item.frequency === 'biweekly' ? -2 : -1),
    'yyyy-MM-dd',
  )

  // Build list of dates to generate
  const dates: string[] = []

  if (item.frequency === 'monthly' && item.day_of_month) {
    const last = parseISO(lastStr)
    let cur = new Date(last.getFullYear(), last.getMonth() + 1, item.day_of_month)
    while (!isAfter(cur, today)) {
      dates.push(format(cur, 'yyyy-MM-dd'))
      cur = addMonths(cur, 1)
    }
  } else if (item.frequency === 'weekly' && item.day_of_week !== null) {
    const last = parseISO(lastStr)
    let cur = addWeeks(last, 1)
    // align to day_of_week
    const dow = (cur.getDay() + 6) % 7
    const diff = (item.day_of_week - dow + 7) % 7
    cur.setDate(cur.getDate() + diff)
    while (!isAfter(cur, today)) {
      dates.push(format(cur, 'yyyy-MM-dd'))
      cur = addWeeks(cur, 1)
    }
  } else if (item.frequency === 'biweekly' && item.day_of_week !== null) {
    const last = parseISO(lastStr)
    let cur = addWeeks(last, 2)
    const dow = (cur.getDay() + 6) % 7
    const diff = (item.day_of_week - dow + 7) % 7
    cur.setDate(cur.getDate() + diff)
    while (!isAfter(cur, today)) {
      dates.push(format(cur, 'yyyy-MM-dd'))
      cur = addWeeks(cur, 2)
    }
  }

  if (dates.length === 0) {
    toast.info('No new entries to generate — already up to date.')
    return 0
  }

  if (item.type === 'income') {
    const rows = dates.map((date) => ({
      user_id: userId,
      date,
      description: item.description || 'Recurring income',
      amount: item.amount,
      payment_mode_id: item.payment_mode_id,
      auto_generated: true,
      notes: item.notes || null,
    }))
    const { error } = await supabase.from('incomes').insert(rows)
    if (error) { toast.error(error.message); return 0 }
  } else {
    const rows = dates.map((date) => ({
      user_id: userId,
      date,
      description: item.description || 'Recurring expense',
      amount: item.amount,
      payment_mode_id: item.payment_mode_id,
      category_id: item.category_id,
      type: item.expense_type ?? 'Need',
      notes: item.notes || null,
    }))
    const { error } = await supabase.from('expenses').insert(rows)
    if (error) { toast.error(error.message); return 0 }
  }

  // Update last_generated_date
  const last = dates[dates.length - 1]
  await supabase.from('recurring_items').update({ last_generated_date: last, updated_at: new Date().toISOString() }).eq('id', item.id)

  return dates.length
}

export function RecurringPanel({ userId, items, categories, paymentModes, currency, onSave }: RecurringPanelProps) {
  const supabase = createClient()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ItemForm>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  const set = (k: keyof ItemForm, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const activeModes = paymentModes.filter((pm) => !pm.archived)
  const activeCategories = categories.filter((c) => !c.archived)

  const inputCls = 'apple-input text-sm'

  function startAdd() {
    setForm({ ...DEFAULT_FORM, payment_mode_id: activeModes[0]?.id ?? '', category_id: activeCategories[0]?.id ?? '' })
    setAdding(true)
    setEditingId(null)
  }

  function startEdit(item: RecurringItem) {
    setForm({
      type: item.type,
      description: item.description ?? '',
      amount: String(item.amount),
      payment_mode_id: item.payment_mode_id ?? '',
      category_id: item.category_id ?? '',
      expense_type: item.expense_type ?? 'Need',
      frequency: item.frequency,
      day_of_month: item.day_of_month ? String(item.day_of_month) : '1',
      day_of_week: item.day_of_week !== null ? String(item.day_of_week) : '0',
      notes: item.notes ?? '',
    })
    setEditingId(item.id)
    setAdding(false)
  }

  function cancel() { setAdding(false); setEditingId(null) }

  async function saveItem(existingId?: string) {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Amount must be greater than 0'); return }
    if (!form.payment_mode_id) { toast.error('Select a payment mode'); return }
    if (form.type === 'expense' && !form.category_id) { toast.error('Select a category'); return }
    if (form.frequency === 'monthly' && (!form.day_of_month || Number(form.day_of_month) < 1 || Number(form.day_of_month) > 28)) {
      toast.error('Day of month must be 1–28'); return
    }

    setSaving(true)
    const payload = {
      user_id: userId,
      type: form.type,
      description: form.description || null,
      amount: Number(form.amount),
      payment_mode_id: form.payment_mode_id || null,
      category_id: form.type === 'expense' ? (form.category_id || null) : null,
      expense_type: form.type === 'expense' ? form.expense_type : null,
      frequency: form.frequency,
      day_of_month: form.frequency === 'monthly' ? Number(form.day_of_month) : null,
      day_of_week: form.frequency !== 'monthly' ? Number(form.day_of_week) : null,
      notes: form.notes || null,
      updated_at: new Date().toISOString(),
    }

    if (existingId) {
      const { error } = await supabase.from('recurring_items').update(payload).eq('id', existingId)
      if (error) { toast.error(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('recurring_items').insert(payload)
      if (error) { toast.error(error.message); setSaving(false); return }
    }

    toast.success(existingId ? 'Updated' : 'Recurring item added')
    cancel()
    setSaving(false)
    onSave()
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this recurring item?')) return
    const { error } = await supabase.from('recurring_items').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Deleted')
    onSave()
  }

  async function toggleActive(item: RecurringItem) {
    const { error } = await supabase.from('recurring_items').update({ active: !item.active }).eq('id', item.id)
    if (error) { toast.error(error.message); return }
    onSave()
  }

  async function handleGenerate(item: RecurringItem) {
    setGenerating(item.id)
    const count = await generateEntries(item, userId, supabase)
    if (count > 0) toast.success(`Generated ${count} ${item.type} ${count === 1 ? 'entry' : 'entries'}`)
    setGenerating(null)
    onSave()
  }

  function freqLabel(item: RecurringItem): string {
    if (item.frequency === 'monthly') return `Monthly on day ${item.day_of_month}`
    if (item.frequency === 'weekly') return `Every week on ${DOW_LABELS[item.day_of_week ?? 0]}`
    return `Every 2 weeks on ${DOW_LABELS[item.day_of_week ?? 0]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-berry)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Recurring Payments</h2>
        </div>
        {!adding && !editingId && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white
              rounded-[var(--radius-xl)] transition-colors"
            style={{ backgroundColor: 'var(--c-berry)' }}
          >
            <Plus size={12} /> Add recurring
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--ink-muted)]">
        Set up recurring income or expenses. Use <strong>Generate</strong> to create entries up to today.
      </p>

      {/* Item list */}
      {items.length === 0 && !adding && (
        <div className="py-8 text-center text-sm text-[var(--ink-muted)]">
          No recurring items yet.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const isEditing = editingId === item.id
          const isIncome = item.type === 'income'
          const accentColor = isIncome ? 'var(--c-save)' : 'var(--c-want)'

          return (
            <div key={item.id}>
              {!isEditing && (
                <div className={cn(
                  'flex flex-col gap-2 px-3 sm:px-4 py-3.5 border border-[var(--border)] rounded-[var(--radius-md)]',
                  !item.active && 'opacity-50',
                )}
                  style={{ backgroundColor: 'var(--elevated)' }}>
                  {/* Row 1: type badge + description + action buttons */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-xs)] text-white shrink-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      {item.type}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-[var(--ink)] truncate">
                      {item.description || (isIncome ? 'Income' : 'Expense')}
                    </span>
                    {!item.active && (
                      <span className="text-[10px] text-[var(--ink-muted)] border border-[var(--border)] px-1.5 py-0.5 rounded-[var(--radius-xs)] shrink-0">
                        paused
                      </span>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleGenerate(item)}
                        disabled={generating === item.id || !item.active}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)]
                          hover:text-[var(--c-primary)] hover:bg-[var(--surface)] transition-colors disabled:opacity-40"
                        title="Generate entries up to today"
                      >
                        <RefreshCw size={13} className={generating === item.id ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={() => toggleActive(item)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)]
                          hover:text-[var(--c-warn)] hover:bg-[var(--tint-warn)] transition-colors"
                        title={item.active ? 'Pause' : 'Resume'}
                      >
                        {item.active ? <Pause size={13} /> : <Play size={13} />}
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)]
                          hover:text-[var(--c-primary)] hover:bg-[var(--surface)] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)]
                          hover:text-[var(--c-want)] hover:bg-[var(--tint-want)] transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {/* Row 2: metadata */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--ink-muted)]">
                    <span className="font-medium tabular-nums" style={{ color: accentColor }}>
                      {formatCurrency(item.amount, currency)}
                    </span>
                    <span className="text-[var(--ink-subtle)]">·</span>
                    <span>{freqLabel(item)}</span>
                    <span className="text-[var(--ink-subtle)]">·</span>
                    <span>Next: {nextDueLabel(item)}</span>
                    {item.payment_mode && (
                      <>
                        <span className="text-[var(--ink-subtle)]">·</span>
                        <span>{item.payment_mode.name}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {isEditing && (
                <RecurringForm
                  form={form}
                  set={set}
                  activeModes={activeModes}
                  activeCategories={activeCategories}
                  currency={currency}
                  saving={saving}
                  onSave={() => saveItem(item.id)}
                  onCancel={cancel}
                  isEdit
                  inputCls={inputCls}
                />
              )}
            </div>
          )
        })}
      </div>

      {adding && (
        <RecurringForm
          form={form}
          set={set}
          activeModes={activeModes}
          activeCategories={activeCategories}
          currency={currency}
          saving={saving}
          onSave={() => saveItem()}
          onCancel={cancel}
          isEdit={false}
          inputCls={inputCls}
        />
      )}
    </div>
  )
}

function RecurringForm({
  form, set, activeModes, activeCategories, currency, saving, onSave, onCancel, isEdit, inputCls,
}: {
  form: ItemForm
  set: (k: keyof ItemForm, v: string) => void
  activeModes: PaymentMode[]
  activeCategories: Category[]
  currency: string
  saving: boolean
  onSave: () => void
  onCancel: () => void
  isEdit: boolean
  inputCls: string
}) {
  return (
    <div className="border border-[var(--border)] rounded-[var(--radius-lg)] p-5 space-y-4"
      style={{ backgroundColor: 'var(--elevated)' }}>
      <h3 className="text-sm font-semibold text-[var(--ink)]">
        {isEdit ? 'Edit recurring item' : 'New recurring item'}
      </h3>

      {/* Type toggle */}
      <div>
        <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Type</label>
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('type', t)}
              className={cn(
                'flex-1 py-2 text-xs font-semibold rounded-[var(--radius-md)] border transition-colors capitalize',
                form.type === t
                  ? t === 'income'
                    ? 'border-[var(--c-save)] text-[var(--c-save)] bg-[var(--tint-save)]'
                    : 'border-[var(--c-want)] text-[var(--c-want)] bg-[var(--tint-want)]'
                  : 'border-[var(--border)] text-[var(--ink-muted)] hover:bg-[var(--surface-2)]',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Description + Amount */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Description</label>
          <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="e.g. Rent, Salary, Netflix" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Amount</label>
          <div className="relative flex items-center">
            <span className="absolute left-0 flex items-center justify-center h-full px-3
              text-[var(--ink-muted)] text-sm pointer-events-none border-r border-[var(--border)]"
              style={{ minWidth: '2.5rem' }}>
              {currency}
            </span>
            <input type="number" min="0" step="0.01" placeholder="0.00"
              value={form.amount} onChange={(e) => set('amount', e.target.value)}
              className={cn(inputCls, 'tabular-nums')}
              style={{ paddingLeft: 'calc(2.5rem + 12px)' }} />
          </div>
        </div>
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Frequency</label>
        <div className="flex gap-2 flex-wrap">
          {([
            { value: 'monthly', label: 'Monthly' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'biweekly', label: 'Every 2 weeks' },
          ] as { value: RecurringFrequency; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('frequency', value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-md)] border transition-colors',
                form.frequency === value
                  ? 'border-[var(--c-primary)] text-[var(--c-primary)] bg-[var(--surface-2)]'
                  : 'border-[var(--border)] text-[var(--ink-muted)] hover:bg-[var(--surface-2)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Day selector */}
      {form.frequency === 'monthly' ? (
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Day of month</label>
          <input type="number" min="1" max="28" placeholder="1"
            value={form.day_of_month} onChange={(e) => set('day_of_month', e.target.value)}
            className={cn(inputCls, 'tabular-nums w-32 text-center')} />
          <p className="text-[10px] text-[var(--ink-muted)] mt-1">1–28 (capped to avoid month-end issues)</p>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Day of week</label>
          <div className="flex gap-1.5 flex-wrap">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => set('day_of_week', String(i))}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-[var(--radius-md)] border transition-colors',
                  Number(form.day_of_week) === i
                    ? 'border-[var(--c-primary)] text-[var(--c-primary)] bg-[var(--surface-2)]'
                    : 'border-[var(--border)] text-[var(--ink-muted)] hover:bg-[var(--surface-2)]',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expense-only fields */}
      {form.type === 'expense' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Category</label>
            <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className={inputCls}>
              <option value="">Select category</option>
              {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Expense type</label>
            <select value={form.expense_type} onChange={(e) => set('expense_type', e.target.value)} className={inputCls}>
              <option value="Need">Need</option>
              <option value="Want">Want</option>
              <option value="Saving">Saving</option>
            </select>
          </div>
        </div>
      )}

      {/* Payment mode */}
      <div>
        <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Payment mode</label>
        <select value={form.payment_mode_id} onChange={(e) => set('payment_mode_id', e.target.value)} className={inputCls}>
          <option value="">Select payment mode</option>
          {activeModes.map((pm) => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">Notes (optional)</label>
        <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)}
          placeholder="Any notes..." className={inputCls} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm text-[var(--ink-muted)] border border-[var(--border)]
            rounded-[var(--radius-xl)] hover:bg-[var(--surface-2)] transition-colors min-h-[44px]">
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          className="flex-1 btn-primary justify-center"
          style={{ backgroundColor: 'var(--c-berry)' }}>
          {saving
            ? <span className="animate-spin w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full" />
            : isEdit ? 'Save changes' : 'Add recurring'}
        </button>
      </div>
    </div>
  )
}
