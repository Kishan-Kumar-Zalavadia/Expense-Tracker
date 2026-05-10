'use client'

import { useState } from 'react'
import { Plus, Check, X, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { typeColor } from '@/lib/utils'
import type { Category, ExpenseType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoriesPanelProps {
  userId: string
  categories: Category[]
  onSave: () => void
}

const TYPE_OPTIONS: ExpenseType[] = ['Need', 'Want', 'Saving']

const DEFAULT_COLORS = [
  '#1F6F7F', '#2D8A6A', '#6B3F7F', '#B84778', '#E8553D',
  '#2952B8', '#D4A636', '#5BA8B8', '#6685D9', '#F47A65',
]

export function CategoriesPanel({ userId, categories, onSave }: CategoriesPanelProps) {
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editState, setEditState] = useState<{ name: string; type: ExpenseType; color: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', type: 'Need' as ExpenseType, color: '#1F6F7F' })

  const startEdit = (cat: Category) => {
    setEditing(cat.id)
    setEditState({ name: cat.name, type: cat.type, color: cat.color })
  }

  const saveEdit = async () => {
    if (!editState || !editing) return
    if (!editState.name.trim()) { toast.error('Name is required'); return }
    const { error } = await supabase
      .from('categories')
      .update({ name: editState.name, type: editState.type, color: editState.color })
      .eq('id', editing)
    if (error) { toast.error(error.message); return }
    toast.success('Category updated')
    setEditing(null)
    onSave()
  }

  const archive = async (id: string) => {
    if (!confirm('Archive this category? It will be hidden from dropdowns but kept in historical data.')) return
    const { error } = await supabase.from('categories').update({ archived: true }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Category archived')
    onSave()
  }

  const unarchive = async (id: string) => {
    const { error } = await supabase.from('categories').update({ archived: false }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Category restored')
    onSave()
  }

  const saveNew = async () => {
    if (!newCat.name.trim()) { toast.error('Name is required'); return }
    const maxOrder = Math.max(0, ...categories.map((c) => c.sort_order))
    const { error } = await supabase.from('categories').insert({
      user_id: userId,
      name: newCat.name,
      type: newCat.type,
      color: newCat.color,
      sort_order: maxOrder + 1,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Category added')
    setAdding(false)
    setNewCat({ name: '', type: 'Need', color: '#1F6F7F' })
    onSave()
  }

  const active = categories.filter((c) => !c.archived)
  const archived = categories.filter((c) => c.archived)

  const inputCls = cn(
    'px-3 py-1.5 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-sm',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="section-bar" style={{ backgroundColor: 'var(--c-berry)' }} />
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Categories</h2>
      </div>

      {/* Active categories */}
      <div className="space-y-2">
        {active.map((cat) => {
          const isEditingThis = editing === cat.id
          const s = isEditingThis ? editState! : cat
          return (
            <div key={cat.id}
              className="flex items-center gap-3 px-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-sm">
              {/* Color swatch / picker */}
              {isEditingThis ? (
                <input
                  type="color"
                  value={editState!.color}
                  onChange={(e) => setEditState({ ...editState!, color: e.target.value })}
                  className="w-7 h-7 rounded-sm cursor-pointer border-0 p-0 bg-transparent"
                />
              ) : (
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              )}

              {/* Name */}
              {isEditingThis ? (
                <input
                  value={editState!.name}
                  onChange={(e) => setEditState({ ...editState!, name: e.target.value })}
                  className={cn(inputCls, 'flex-1')}
                />
              ) : (
                <span className="flex-1 text-sm text-[var(--ink)]">{cat.name}</span>
              )}

              {/* Type */}
              {isEditingThis ? (
                <select
                  value={editState!.type}
                  onChange={(e) => setEditState({ ...editState!, type: e.target.value as ExpenseType })}
                  className={inputCls}
                >
                  {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-sm"
                  style={{ color: typeColor(cat.type), backgroundColor: typeColor(cat.type) + '15' }}>
                  {cat.type}
                </span>
              )}

              {/* Actions */}
              <div className="flex gap-1">
                {isEditingThis ? (
                  <>
                    <button onClick={saveEdit}
                      className="p-1.5 rounded-sm text-[var(--c-save)] hover:bg-[var(--tint-save)] transition-colors">
                      <Check size={13} />
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="p-1.5 rounded-sm text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(cat)}
                      className="px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                        border border-[var(--border)] rounded-sm hover:bg-[var(--surface)] transition-colors">
                      Edit
                    </button>
                    <button onClick={() => archive(cat.id)}
                      className="p-1.5 rounded-sm text-[var(--ink-subtle)] hover:text-[var(--c-warn)]
                        hover:bg-[var(--tint-warn)] transition-colors"
                      title="Archive">
                      <Archive size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add new */}
      {adding ? (
        <div className="border border-[var(--border)] rounded-sm p-4 bg-[var(--elevated)] space-y-3">
          <h3 className="text-sm font-medium text-[var(--ink)]">New category</h3>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={newCat.color}
              onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
              className="w-9 h-9 rounded-sm cursor-pointer border border-[var(--border)] p-0.5"
            />
            <input
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              placeholder="Category name"
              className={cn(inputCls, 'flex-1')}
            />
            <select
              value={newCat.type}
              onChange={(e) => setNewCat({ ...newCat, type: e.target.value as ExpenseType })}
              className={inputCls}
            >
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {/* Color presets */}
          <div className="flex gap-1.5 flex-wrap">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCat({ ...newCat, color: c })}
                className="w-5 h-5 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: c,
                  borderColor: newCat.color === c ? 'var(--ink)' : 'transparent',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveNew} className="btn-primary text-xs px-3 py-1.5">Add</button>
            <button onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-sm
              text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--ink-muted)]
            border border-dashed border-[var(--border)] rounded-sm hover:text-[var(--ink)]
            hover:border-[var(--border-strong)] transition-colors"
        >
          <Plus size={12} />
          Add category
        </button>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-[var(--ink-muted)] uppercase tracking-wide mb-2">Archived</p>
          <div className="space-y-1">
            {archived.map((cat) => (
              <div key={cat.id}
                className="flex items-center gap-3 px-4 py-2.5 opacity-50 border border-[var(--border)] rounded-sm">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm line-through text-[var(--ink-muted)]">{cat.name}</span>
                <span className="text-xs text-[var(--ink-subtle)]">{cat.type}</span>
                <button onClick={() => unarchive(cat.id)}
                  className="text-xs text-[var(--c-primary)] hover:underline">
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
