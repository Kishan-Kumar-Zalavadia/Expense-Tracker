'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, Archive, Trash2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { typeColor } from '@/lib/utils'
import type { Category, ExpenseType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoriesPanelProps {
  userId: string
  categories: Category[]
  usedCategoryIds: string[]
  onSave: () => void
}

const TYPE_OPTIONS: ExpenseType[] = ['Need', 'Want', 'Saving']

const DEFAULT_COLORS = [
  '#1F6F7F', '#2D8A6A', '#6B3F7F', '#B84778', '#E8553D',
  '#2952B8', '#D4A636', '#5BA8B8', '#6685D9', '#F47A65',
]

export function CategoriesPanel({ userId, categories, usedCategoryIds, onSave }: CategoriesPanelProps) {
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editState, setEditState] = useState<{ name: string; type: ExpenseType; color: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', type: 'Need' as ExpenseType, color: '#1F6F7F' })

  const usedSet = new Set(usedCategoryIds)

  const [localCats, setLocalCats] = useState(categories)
  useEffect(() => { setLocalCats(categories) }, [categories])

  const startEdit = (cat: Category) => {
    if (cat.is_system) return
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

  const archive = async (cat: Category) => {
    if (cat.is_system) return
    if (!confirm('Archive this category? It will be hidden from dropdowns but kept in historical data.')) return
    setLocalCats(prev => prev.map(c => c.id === cat.id ? { ...c, archived: true } : c))
    const { error } = await supabase.from('categories').update({ archived: true }).eq('id', cat.id)
    if (error) { toast.error(error.message); setLocalCats(prev => prev.map(c => c.id === cat.id ? { ...c, archived: false } : c)); return }
    toast.success('Category archived')
    onSave()
  }

  const unarchive = async (id: string) => {
    setLocalCats(prev => prev.map(c => c.id === id ? { ...c, archived: false } : c))
    const { error } = await supabase.from('categories').update({ archived: false }).eq('id', id)
    if (error) { toast.error(error.message); setLocalCats(prev => prev.map(c => c.id === id ? { ...c, archived: true } : c)); return }
    toast.success('Category restored')
    onSave()
  }

  const deleteCategory = async (cat: Category) => {
    if (cat.is_system) return
    if (usedSet.has(cat.id)) return
    if (!confirm(`Permanently delete "${cat.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (error) { toast.error(error.message); return }
    toast.success('Category deleted')
    onSave()
  }

  const toggleShowInCards = async (cat: Category) => {
    const newVal = !cat.show_in_cards
    setLocalCats(prev => prev.map(c => c.id === cat.id ? { ...c, show_in_cards: newVal } : c))
    const { error } = await supabase.from('categories').update({ show_in_cards: newVal }).eq('id', cat.id)
    if (error) { toast.error(error.message); setLocalCats(prev => prev.map(c => c.id === cat.id ? { ...c, show_in_cards: cat.show_in_cards } : c)); return }
    onSave()
  }

  const saveNew = async () => {
    if (!newCat.name.trim()) { toast.error('Name is required'); return }
    const maxOrder = Math.max(0, ...localCats.map((c) => c.sort_order))
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

  const active = [...localCats].filter((c) => !c.archived).reverse()
  const archived = localCats.filter((c) => c.archived)

  const inputCls = cn(
    'px-3 py-1.5 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]',
    'text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]',
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="section-bar" style={{ backgroundColor: 'var(--c-berry)' }} />
          <h2 className="font-display text-lg font-medium text-[var(--ink)]">Categories</h2>
        </div>
        {!adding && !editing && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white rounded-[var(--radius-xl)] transition-colors"
            style={{ backgroundColor: 'var(--c-berry)' }}
          >
            <Plus size={12} /> Add category
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--ink-muted)]">
        Toggle <span className="font-medium">Shown / Hidden</span> to control which categories appear as spend summary
        cards on the Expenses and Income tabs. Categories marked <span className="font-medium">Hidden from cards</span> will
        still track spending — they just won't show the summary card.
      </p>

      {/* Add new */}
      {adding && (
        <div className="border border-[var(--border)] rounded-[var(--radius-md)] p-4 bg-[var(--elevated)] space-y-3">
          <h3 className="text-sm font-medium text-[var(--ink)]">New category</h3>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={newCat.color}
              onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
              className="w-9 h-9 rounded-[var(--radius-md)] cursor-pointer border border-[var(--border)] p-0.5"
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
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-[var(--radius-md)]
              text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active categories */}
      <div className="space-y-2">
        {active.map((cat) => {
          const isEditingThis = editing === cat.id
          const isUnused = !usedSet.has(cat.id)

          return (
            <div key={cat.id}
              className="flex flex-col gap-2 px-3 sm:px-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]">
              {cat.is_system ? (
                /* System category — show compact locked row */
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm text-[var(--ink)]">{cat.name}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-[var(--radius-md)] shrink-0"
                      style={{ color: typeColor(cat.type), backgroundColor: typeColor(cat.type) + '15' }}>
                      {cat.type}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold
                      rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--ink-subtle)] shrink-0"
                      title="System category — cannot be modified">
                      <Lock size={9} />
                      System
                    </span>
                  </div>
                  {/* Show in cards toggle — system cats can still be toggled */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleShowInCards(cat)}
                      title={cat.show_in_cards ? 'Shown in spend cards — tap to hide' : 'Hidden from spend cards — tap to show'}
                      className={cn(
                        'px-2 py-1 text-[10px] font-semibold rounded-[var(--radius-md)] border transition-colors',
                        cat.show_in_cards
                          ? 'border-[var(--c-save)] text-[var(--c-save)] bg-[var(--tint-save)]'
                          : 'border-[var(--border)] text-[var(--ink-subtle)] hover:border-[var(--border-strong)]',
                      )}
                    >
                      {cat.show_in_cards ? 'Shown in cards' : 'Hidden from cards'}
                    </button>
                  </div>
                </>
              ) : isEditingThis ? (
                /* Edit mode — two rows on mobile */
                <>
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
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={editState!.type}
                      onChange={(e) => setEditState({ ...editState!, type: e.target.value as ExpenseType })}
                      className={cn(inputCls, 'flex-1')}
                    >
                      {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={saveEdit}
                      className="p-2 rounded-[var(--radius-md)] text-[var(--c-save)] hover:bg-[var(--tint-save)] transition-colors shrink-0">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditing(null)}
                      className="p-2 rounded-[var(--radius-md)] text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                </>
              ) : (
                /* Display mode */
                <>
                  {/* Row 1: name + type + edit/archive/delete */}
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-sm text-[var(--ink)] truncate">{cat.name}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-[var(--radius-md)] shrink-0"
                      style={{ color: typeColor(cat.type), backgroundColor: typeColor(cat.type) + '15' }}>
                      {cat.type}
                    </span>
                    <button onClick={() => startEdit(cat)}
                      className="px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                        border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors shrink-0">
                      Edit
                    </button>
                    {isUnused ? (
                      <button
                        onClick={() => deleteCategory(cat)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                          hover:bg-[var(--tint-want)] transition-colors shrink-0"
                        title="Delete permanently (never used)">
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => archive(cat)}
                        className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-warn)]
                          hover:bg-[var(--tint-warn)] transition-colors shrink-0"
                        title="Archive (has existing expenses)">
                        <Archive size={13} />
                      </button>
                    )}
                  </div>
                  {/* Row 2: show in cards toggle */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleShowInCards(cat)}
                      title={cat.show_in_cards ? 'Shown in spend cards — tap to hide' : 'Hidden from spend cards — tap to show'}
                      className={cn(
                        'px-2 py-1 text-[10px] font-semibold rounded-[var(--radius-md)] border transition-colors',
                        cat.show_in_cards
                          ? 'border-[var(--c-save)] text-[var(--c-save)] bg-[var(--tint-save)]'
                          : 'border-[var(--border)] text-[var(--ink-subtle)] hover:border-[var(--border-strong)]',
                      )}
                    >
                      {cat.show_in_cards ? 'Shown in cards' : 'Hidden from cards'}
                    </button>
                  </div>
                </>
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
            {archived.map((cat) => {
              const isUnused = !usedSet.has(cat.id)
              return (
                <div key={cat.id}
                  className="flex items-center gap-3 px-4 py-2.5 opacity-60 border border-[var(--border)] rounded-[var(--radius-md)]">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-sm line-through text-[var(--ink-muted)]">{cat.name}</span>
                  <span className="text-xs text-[var(--ink-subtle)]">{cat.type}</span>
                  <button onClick={() => unarchive(cat.id)}
                    className="text-xs text-[var(--c-primary)] hover:underline">
                    Restore
                  </button>
                  {isUnused && !cat.is_system && (
                    <button
                      onClick={() => deleteCategory(cat)}
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
        Categories with existing expenses can only be <span className="font-medium">archived</span>, not deleted.
        Unused categories can be <span className="font-medium">deleted</span> permanently.
      </p>
    </div>
  )
}
