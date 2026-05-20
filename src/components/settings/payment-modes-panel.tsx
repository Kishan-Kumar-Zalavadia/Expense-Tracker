'use client'

import { useState } from 'react'
import { Plus, Check, X, Archive, CreditCard, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PaymentModesPanelProps {
  userId: string
  paymentModes: PaymentMode[]
  usedPaymentModeIds: string[]
  onSave: () => void
}

export function PaymentModesPanel({ userId, paymentModes, usedPaymentModeIds, onSave }: PaymentModesPanelProps) {
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const usedSet = new Set(usedPaymentModeIds)

  const startEdit = (pm: PaymentMode) => {
    setEditing(pm.id)
    setEditName(pm.name)
  }

  const saveEdit = async () => {
    if (!editName.trim()) { toast.error('Name is required'); return }
    const { error } = await supabase.from('payment_modes').update({ name: editName.trim() }).eq('id', editing!)
    if (error) { toast.error(error.message); return }
    toast.success('Payment mode updated')
    setEditing(null)
    onSave()
  }

  const toggleShowInBalance = async (pm: PaymentMode) => {
    const { error } = await supabase
      .from('payment_modes')
      .update({ show_in_balance: !pm.show_in_balance })
      .eq('id', pm.id)
    if (error) { toast.error(error.message); return }
    onSave()
  }

  const toggleCreditCard = async (pm: PaymentMode) => {
    const { error } = await supabase
      .from('payment_modes')
      .update({ is_credit_card: !pm.is_credit_card })
      .eq('id', pm.id)
    if (error) { toast.error(error.message); return }
    onSave()
  }

  const archive = async (id: string) => {
    if (!confirm('Archive this payment mode?')) return
    const { error } = await supabase.from('payment_modes').update({ archived: true }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Archived')
    onSave()
  }

  const unarchive = async (id: string) => {
    const { error } = await supabase.from('payment_modes').update({ archived: false }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Restored')
    onSave()
  }

  const deleteMode = async (pm: PaymentMode) => {
    if (usedSet.has(pm.id)) return
    if (!confirm(`Permanently delete "${pm.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('payment_modes').delete().eq('id', pm.id)
    if (error) { toast.error(error.message); return }
    toast.success('Payment mode deleted')
    onSave()
  }

  const saveNew = async () => {
    if (!newName.trim()) { toast.error('Name is required'); return }
    const { error } = await supabase.from('payment_modes').insert({ user_id: userId, name: newName.trim() })
    if (error) { toast.error(error.message); return }
    toast.success('Payment mode added')
    setAdding(false)
    setNewName('')
    onSave()
  }

  const inputCls = cn(
    'px-3 py-1.5 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  const active   = paymentModes.filter((pm) => !pm.archived)
  const archived = paymentModes.filter((pm) => pm.archived)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="section-bar" style={{ backgroundColor: 'var(--c-need)' }} />
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Payment Modes</h2>
      </div>
      <p className="text-xs text-[var(--ink-muted)] mb-4">
        Toggle <span className="font-medium">Shown / Hidden</span> to control which accounts appear in the balance cards.
        Mark an account as <span className="font-medium">Credit Card</span> to enable the "Pay credit card" button on the dashboard.
      </p>

      <div className="space-y-2">
        {active.map((pm) => {
          const isUnused = !usedSet.has(pm.id)
          return (
          <div key={pm.id}
            className="flex items-center gap-3 px-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]">
            {editing === pm.id ? (
              <>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className={cn(inputCls, 'flex-1')}
                  autoFocus
                />
                <button onClick={saveEdit}
                  className="p-1.5 rounded-[var(--radius-md)] text-[var(--c-save)] hover:bg-[var(--tint-save)] transition-colors">
                  <Check size={13} />
                </button>
                <button onClick={() => setEditing(null)}
                  className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
                  <X size={13} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-[var(--ink)]">{pm.name}</span>
                {/* Credit card toggle */}
                <button
                  onClick={() => toggleCreditCard(pm)}
                  title={pm.is_credit_card ? 'Credit card — click to change to regular account' : 'Regular account — click to mark as credit card'}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-[var(--radius-md)] border transition-colors',
                    pm.is_credit_card
                      ? 'border-[var(--c-need)] text-[var(--c-need)] bg-[var(--tint-need)]'
                      : 'border-[var(--border)] text-[var(--ink-subtle)] hover:border-[var(--border-strong)]',
                  )}
                >
                  <CreditCard size={10} />
                  {pm.is_credit_card ? 'Credit' : 'Debit'}
                </button>
                {/* Show in balance toggle */}
                <button
                  onClick={() => toggleShowInBalance(pm)}
                  title={pm.show_in_balance ? 'Shown in account balances — click to hide' : 'Hidden from account balances — click to show'}
                  className={cn(
                    'px-2 py-1 text-[10px] font-semibold rounded-[var(--radius-md)] border transition-colors',
                    pm.show_in_balance
                      ? 'border-[var(--c-save)] text-[var(--c-save)] bg-[var(--tint-save)]'
                      : 'border-[var(--border)] text-[var(--ink-subtle)] hover:border-[var(--border-strong)]',
                  )}
                >
                  {pm.show_in_balance ? 'Shown' : 'Hidden'}
                </button>
                <button onClick={() => startEdit(pm)}
                  className="px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                    border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors">
                  Edit
                </button>
                {isUnused ? (
                  <button
                    onClick={() => deleteMode(pm)}
                    className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                      hover:bg-[var(--tint-want)] transition-colors"
                    title="Delete permanently (never used)">
                    <Trash2 size={13} />
                  </button>
                ) : (
                  <button onClick={() => archive(pm.id)}
                    className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-warn)]
                      hover:bg-[var(--tint-warn)] transition-colors"
                    title="Archive (has existing transactions)">
                    <Archive size={13} />
                  </button>
                )}
              </>
            )}
          </div>
          )
        })}
      </div>

      {adding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveNew()}
            placeholder="Payment mode name"
            className={cn(inputCls, 'flex-1')}
            autoFocus
          />
          <button onClick={saveNew} className="btn-primary text-xs px-3 py-1.5">Add</button>
          <button onClick={() => setAdding(false)}
            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-[var(--radius-md)]
            text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--ink-muted)]
            border border-dashed border-[var(--border)] rounded-[var(--radius-md)] hover:text-[var(--ink)]
            hover:border-[var(--border-strong)] transition-colors"
        >
          <Plus size={12} />
          Add payment mode
        </button>
      )}

      {archived.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-2">Archived</p>
          <div className="space-y-1">
            {archived.map((pm) => {
              const isUnused = !usedSet.has(pm.id)
              return (
                <div key={pm.id}
                  className="flex items-center gap-3 px-4 py-2.5 opacity-60 border border-[var(--border)] rounded-[var(--radius-md)]">
                  <span className="flex-1 text-sm line-through text-[var(--ink-muted)]">{pm.name}</span>
                  <button onClick={() => unarchive(pm.id)}
                    className="text-xs text-[var(--c-primary)] hover:underline">
                    Restore
                  </button>
                  {isUnused && (
                    <button
                      onClick={() => deleteMode(pm)}
                      className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                        hover:bg-[var(--tint-want)] transition-colors"
                      title="Delete permanently">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--ink-subtle)]">
        Payment modes with existing transactions can only be <span className="font-medium">archived</span>, not deleted.
        Unused modes can be <span className="font-medium">deleted</span> permanently.
      </p>
    </div>
  )
}
