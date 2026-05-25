'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, Archive, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Subcategory } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SubcategoriesPanelProps {
  userId: string
  subcategories: Subcategory[]
  usedSubcategoryIds: string[]
  onSave: () => void
}

const DEFAULT_COLORS = [
  '#1F6F7F', '#2D8A6A', '#6B3F7F', '#B84778', '#E8553D',
  '#2952B8', '#D4A636', '#5BA8B8', '#6685D9', '#F47A65',
]

export function SubcategoriesPanel({ userId, subcategories, usedSubcategoryIds, onSave }: SubcategoriesPanelProps) {
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editState, setEditState] = useState<{ name: string; color: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [newSub, setNewSub] = useState({ name: '', color: '#6685D9' })

  const usedSet = new Set(usedSubcategoryIds)
  const [localSubs, setLocalSubs] = useState(subcategories)
  useEffect(() => { setLocalSubs(subcategories) }, [subcategories])

  const inputCls = cn(
    'px-3 py-1.5 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  const startEdit = (sub: Subcategory) => {
    setEditing(sub.id)
    setEditState({ name: sub.name, color: sub.color })
  }

  const saveEdit = async () => {
    if (!editState || !editing) return
    if (!editState.name.trim()) { toast.error('Name is required'); return }
    const { error } = await supabase
      .from('subcategories')
      .update({ name: editState.name, color: editState.color })
      .eq('id', editing)
    if (error) { toast.error(error.message); return }
    toast.success('Subcategory updated')
    setEditing(null)
    onSave()
  }

  const archive = async (sub: Subcategory) => {
    if (!confirm('Archive this subcategory? It will be hidden from dropdowns but kept in historical data.')) return
    setLocalSubs(prev => prev.map(s => s.id === sub.id ? { ...s, archived: true } : s))
    const { error } = await supabase.from('subcategories').update({ archived: true }).eq('id', sub.id)
    if (error) { toast.error(error.message); setLocalSubs(prev => prev.map(s => s.id === sub.id ? { ...s, archived: false } : s)); return }
    toast.success('Subcategory archived')
    onSave()
  }

  const unarchive = async (id: string) => {
    setLocalSubs(prev => prev.map(s => s.id === id ? { ...s, archived: false } : s))
    const { error } = await supabase.from('subcategories').update({ archived: false }).eq('id', id)
    if (error) { toast.error(error.message); setLocalSubs(prev => prev.map(s => s.id === id ? { ...s, archived: true } : s)); return }
    toast.success('Subcategory restored')
    onSave()
  }

  const deleteSubcategory = async (sub: Subcategory) => {
    if (usedSet.has(sub.id)) return
    if (!confirm(`Permanently delete "${sub.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('subcategories').delete().eq('id', sub.id)
    if (error) { toast.error(error.message); return }
    toast.success('Subcategory deleted')
    onSave()
  }

  const saveNew = async () => {
    if (!newSub.name.trim()) { toast.error('Name is required'); return }
    const maxOrder = Math.max(0, ...localSubs.map((s) => s.sort_order))
    const { error } = await supabase.from('subcategories').insert({
      user_id: userId,
      name: newSub.name,
      color: newSub.color,
      sort_order: maxOrder + 1,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Subcategory added')
    setAdding(false)
    setNewSub({ name: '', color: '#6685D9' })
    onSave()
  }

  const active = [...localSubs].filter((s) => !s.archived).reverse()
  const archived = localSubs.filter((s) => s.archived)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-primary)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Subcategories</h2>
        </div>
        {!adding && !editing && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-[var(--radius-xl)] transition-colors"
            style={{ backgroundColor: 'var(--c-primary)' }}
          >
            <Plus size={12} /> Add subcategory
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--ink-muted)]">
        Subcategories are optional labels you can attach to any expense or income entry for finer-grained tracking.
      </p>

      {/* Add form */}
      {adding && (
        <div className="border border-[var(--border)] rounded-[var(--radius-md)] p-4 bg-[var(--elevated)] space-y-3">
          <h3 className="text-sm font-medium text-[var(--ink)]">New subcategory</h3>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={newSub.color}
              onChange={(e) => setNewSub({ ...newSub, color: e.target.value })}
              className="w-9 h-9 rounded-[var(--radius-md)] cursor-pointer border border-[var(--border)] p-0.5"
            />
            <input
              type="text"
              value={newSub.name}
              onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
              placeholder="Subcategory name"
              className={cn(inputCls, 'flex-1')}
              autoFocus
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewSub({ ...newSub, color: c })}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: newSub.color === c ? 'var(--ink)' : 'transparent',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveNew} className="btn-primary text-xs px-3 py-1.5">Add</button>
            <button onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-[var(--radius-md)]
              text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active list */}
      <div className="space-y-2">
        {active.length === 0 && !adding && (
          <p className="text-sm text-[var(--ink-muted)] py-4 text-center">No subcategories yet.</p>
        )}
        {active.map((sub) => {
          const isEditingThis = editing === sub.id
          const isUnused = !usedSet.has(sub.id)
          return (
            <div key={sub.id}
              className="flex flex-col gap-2 px-3 sm:px-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]">
              {isEditingThis ? (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editState!.color}
                    onChange={(e) => setEditState({ ...editState!, color: e.target.value })}
                    className="w-8 h-8 rounded-[var(--radius-md)] cursor-pointer border border-[var(--border)] p-0.5 shrink-0"
                  />
                  <input
                    value={editState!.name}
                    onChange={(e) => setEditState({ ...editState!, name: e.target.value })}
                    className={cn(inputCls, 'flex-1')}
                    autoFocus
                  />
                  <button onClick={saveEdit}
                    className="p-2 rounded-[var(--radius-md)] text-[var(--c-save)] hover:bg-[var(--tint-save)] transition-colors shrink-0">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditing(null)}
                    className="p-2 rounded-[var(--radius-md)] text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="flex-1 text-sm text-[var(--ink)] truncate">{sub.name}</span>
                  <button onClick={() => startEdit(sub)}
                    className="px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                      border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors shrink-0">
                    Edit
                  </button>
                  {isUnused ? (
                    <button
                      onClick={() => deleteSubcategory(sub)}
                      className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                        hover:bg-[var(--tint-want)] transition-colors shrink-0"
                      title="Delete permanently (never used)">
                      <Trash2 size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => archive(sub)}
                      className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-warn)]
                        hover:bg-[var(--tint-warn)] transition-colors shrink-0"
                      title="Archive (has existing entries)">
                      <Archive size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-2">Archived</p>
          <div className="space-y-1">
            {archived.map((sub) => {
              const isUnused = !usedSet.has(sub.id)
              return (
                <div key={sub.id}
                  className="flex items-center gap-3 px-4 py-2.5 opacity-60 border border-[var(--border)] rounded-[var(--radius-md)]">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="flex-1 text-sm line-through text-[var(--ink-muted)]">{sub.name}</span>
                  <button onClick={() => unarchive(sub.id)}
                    className="text-xs text-[var(--c-primary)] hover:underline">
                    Restore
                  </button>
                  {isUnused && (
                    <button
                      onClick={() => deleteSubcategory(sub)}
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
        Subcategories with existing entries can only be <span className="font-medium">archived</span>, not deleted.
        Unused subcategories can be <span className="font-medium">deleted</span> permanently.
      </p>
    </div>
  )
}
