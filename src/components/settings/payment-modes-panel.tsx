'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, Archive, CreditCard, Trash2, GripVertical, Star } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { PaymentMode } from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PaymentModesPanelProps {
  userId: string
  paymentModes: PaymentMode[]
  usedPaymentModeIds: string[]
  onSave: () => void
}

function SortableRow({
  pm,
  usedSet,
  editing,
  editName,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditNameChange,
  onToggleCreditCard,
  onToggleShowInBalance,
  onArchive,
  onDelete,
  onSetDefault,
}: {
  pm: PaymentMode
  usedSet: Set<string>
  editing: string | null
  editName: string
  onStartEdit: (pm: PaymentMode) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditNameChange: (v: string) => void
  onToggleCreditCard: (pm: PaymentMode) => void
  onToggleShowInBalance: (pm: PaymentMode) => void
  onArchive: (id: string) => void
  onDelete: (pm: PaymentMode) => void
  onSetDefault: (pm: PaymentMode) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pm.id })
  const isUnused = !usedSet.has(pm.id)
  const isEditingThis = editing === pm.id

  const inputCls = cn(
    'px-3 py-1.5 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex flex-col gap-2 px-3 sm:px-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]"
    >
      {isEditingThis ? (
        <div className="flex items-center gap-2">
          <button
            {...listeners} {...attributes}
            className="p-1 cursor-grab active:cursor-grabbing text-[var(--ink-subtle)] shrink-0 touch-manipulation"
          >
            <GripVertical size={14} />
          </button>
          <input
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSaveEdit()}
            className={cn(inputCls, 'flex-1')}
            autoFocus
          />
          <button onClick={onSaveEdit}
            className="p-2 rounded-[var(--radius-md)] text-[var(--c-save)] hover:bg-[var(--tint-save)] transition-colors">
            <Check size={14} />
          </button>
          <button onClick={onCancelEdit}
            className="p-2 rounded-[var(--radius-md)] text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              {...listeners} {...attributes}
              className="p-1 cursor-grab active:cursor-grabbing text-[var(--ink-subtle)] shrink-0 touch-manipulation"
            >
              <GripVertical size={14} />
            </button>
            <span className="flex-1 text-sm font-medium text-[var(--ink)] truncate">{pm.name}</span>
            <button
              onClick={() => !pm.is_default && onSetDefault(pm)}
              title={pm.is_default ? 'Default selection in forms' : 'Set as default'}
              className="shrink-0 p-1 transition-colors touch-manipulation"
              style={{ color: pm.is_default ? 'var(--c-warn)' : 'var(--ink-subtle)' }}
            >
              <Star size={13} fill={pm.is_default ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => onStartEdit(pm)}
              className="px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors shrink-0">
              Edit
            </button>
            {isUnused ? (
              <button
                onClick={() => onDelete(pm)}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                  hover:bg-[var(--tint-want)] transition-colors shrink-0"
                title="Delete permanently (never used)">
                <Trash2 size={13} />
              </button>
            ) : (
              <button onClick={() => onArchive(pm.id)}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-warn)]
                  hover:bg-[var(--tint-warn)] transition-colors shrink-0"
                title="Archive (has existing transactions)">
                <Archive size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap pl-6">
            <button
              onClick={() => onToggleCreditCard(pm)}
              title={pm.is_credit_card ? 'Credit card — tap to switch to debit' : 'Debit/bank — tap to mark as credit card'}
              className={cn(
                'flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-[var(--radius-md)] border transition-colors',
                pm.is_credit_card
                  ? 'border-[var(--c-need)] text-[var(--c-need)] bg-[var(--tint-need)]'
                  : 'border-[var(--border)] text-[var(--ink-subtle)] hover:border-[var(--border-strong)]',
              )}
            >
              <CreditCard size={10} />
              {pm.is_credit_card ? 'Credit card' : 'Debit / bank'}
            </button>
            <button
              onClick={() => onToggleShowInBalance(pm)}
              title={pm.show_in_balance ? 'Shown in balance cards — tap to hide' : 'Hidden from balance cards — tap to show'}
              className={cn(
                'px-2 py-1 text-[10px] font-semibold rounded-[var(--radius-md)] border transition-colors',
                pm.show_in_balance
                  ? 'border-[var(--c-save)] text-[var(--c-save)] bg-[var(--tint-save)]'
                  : 'border-[var(--border)] text-[var(--ink-subtle)] hover:border-[var(--border-strong)]',
              )}
            >
              {pm.show_in_balance ? 'Shown in balance' : 'Hidden from balance'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function PaymentModesPanel({ userId, paymentModes, usedPaymentModeIds, onSave }: PaymentModesPanelProps) {
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const usedSet = new Set(usedPaymentModeIds)

  const [localModes, setLocalModes] = useState(paymentModes)
  useEffect(() => { setLocalModes(paymentModes) }, [paymentModes])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const active   = localModes.filter((pm) => !pm.archived)
  const archived = localModes.filter((pm) => pm.archived)

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
    const newVal = !pm.show_in_balance
    setLocalModes(prev => prev.map(m => m.id === pm.id ? { ...m, show_in_balance: newVal } : m))
    const { error } = await supabase.from('payment_modes').update({ show_in_balance: newVal }).eq('id', pm.id)
    if (error) { toast.error(error.message); setLocalModes(prev => prev.map(m => m.id === pm.id ? { ...m, show_in_balance: pm.show_in_balance } : m)); return }
    onSave()
  }

  const toggleCreditCard = async (pm: PaymentMode) => {
    const newVal = !pm.is_credit_card
    setLocalModes(prev => prev.map(m => m.id === pm.id ? { ...m, is_credit_card: newVal } : m))
    const { error } = await supabase.from('payment_modes').update({ is_credit_card: newVal }).eq('id', pm.id)
    if (error) { toast.error(error.message); setLocalModes(prev => prev.map(m => m.id === pm.id ? { ...m, is_credit_card: pm.is_credit_card } : m)); return }
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

  const setDefault = async (pm: PaymentMode) => {
    if (pm.is_default) return
    setLocalModes(prev => prev.map(m => ({ ...m, is_default: m.id === pm.id })))
    const [r1, r2] = await Promise.all([
      supabase.from('payment_modes').update({ is_default: false }).eq('user_id', userId).neq('id', pm.id),
      supabase.from('payment_modes').update({ is_default: true }).eq('id', pm.id),
    ])
    if (r1.error || r2.error) {
      toast.error('Failed to set default')
      setLocalModes(paymentModes)
    } else {
      onSave()
    }
  }

  const saveNew = async () => {
    if (!newName.trim()) { toast.error('Name is required'); return }
    const maxOrder = active.length > 0 ? Math.max(...active.map((m) => m.sort_order)) : 0
    const { error } = await supabase.from('payment_modes').insert({
      user_id: userId,
      name: newName.trim(),
      sort_order: maxOrder + 1,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Payment mode added')
    setAdding(false)
    setNewName('')
    onSave()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active: dragActive, over } = event
    if (!over || dragActive.id === over.id) return

    const oldIndex = active.findIndex((m) => m.id === dragActive.id)
    const newIndex = active.findIndex((m) => m.id === over.id)
    const reordered = arrayMove(active, oldIndex, newIndex)

    // Optimistic update
    setLocalModes([...reordered, ...archived])

    // Batch update sort_orders
    const results = await Promise.all(
      reordered.map((m, i) =>
        supabase.from('payment_modes').update({ sort_order: i + 1 }).eq('id', m.id)
      )
    )
    if (results.some((r) => r.error)) {
      toast.error('Failed to save order')
      setLocalModes(paymentModes)
    } else {
      onSave()
    }
  }

  const inputCls = cn(
    'px-3 py-1.5 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-need)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Payment Modes</h2>
        </div>
        {!adding && !editing && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-[var(--radius-xl)] transition-colors"
            style={{ backgroundColor: 'var(--c-need)' }}
          >
            <Plus size={12} /> Add mode
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--ink-muted)]">
        Toggle <span className="font-medium">Shown / Hidden</span> to control which accounts appear in the balance cards.
        Mark an account as <span className="font-medium">Credit Card</span> to enable the "Pay credit card" button on the dashboard.
        Drag <GripVertical size={10} className="inline" /> to reorder — the top item is the default in add forms.
      </p>

      {adding && (
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
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={active.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {active.map((pm) => (
              <SortableRow
                key={pm.id}
                pm={pm}
                usedSet={usedSet}
                editing={editing}
                editName={editName}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditing(null)}
                onEditNameChange={setEditName}
                onToggleCreditCard={toggleCreditCard}
                onToggleShowInBalance={toggleShowInBalance}
                onArchive={archive}
                onDelete={deleteMode}
                onSetDefault={setDefault}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
