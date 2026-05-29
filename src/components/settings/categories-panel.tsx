'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X, Archive, Trash2, Lock, GripVertical, Star } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { typeColor } from '@/lib/utils'
import type { Category, ExpenseType } from '@/lib/types'
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

function SortableCategory({
  cat,
  usedSet,
  editing,
  editState,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditStateChange,
  onToggleShowInCards,
  onArchive,
  onDelete,
  onSetDefault,
}: {
  cat: Category
  usedSet: Set<string>
  editing: string | null
  editState: { name: string; type: ExpenseType; color: string } | null
  onStartEdit: (cat: Category) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditStateChange: (s: { name: string; type: ExpenseType; color: string }) => void
  onToggleShowInCards: (cat: Category) => void
  onArchive: (cat: Category) => void
  onDelete: (cat: Category) => void
  onSetDefault: (cat: Category) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const isEditingThis = editing === cat.id
  const isUnused = !usedSet.has(cat.id)
  const inputCls = 'apple-input text-sm'

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex flex-col gap-2 px-3 sm:px-4 py-3 bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)]"
    >
      {cat.is_system ? (
        <>
          <div className="flex items-center gap-2">
            <button
              {...listeners} {...attributes}
              className="p-1 cursor-grab active:cursor-grabbing text-[var(--ink-subtle)] shrink-0 touch-manipulation"
            style={{ touchAction: 'none' }}
            >
              <GripVertical size={14} />
            </button>
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm text-[var(--ink)]">{cat.name}</span>
            <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold
              rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--ink-subtle)] shrink-0"
              title="System category — cannot be modified">
              <Lock size={9} />
              System
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap pl-7">
            <button
              onClick={() => onToggleShowInCards(cat)}
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
      ) : isEditingThis && editState ? (
        <>
          <div className="flex items-center gap-3">
            <button
              {...listeners} {...attributes}
              className="p-1 cursor-grab active:cursor-grabbing text-[var(--ink-subtle)] shrink-0 touch-manipulation"
            style={{ touchAction: 'none' }}
            >
              <GripVertical size={14} />
            </button>
            <label
              className="shrink-0 rounded-[var(--radius-md)] border-2 border-[var(--border)] cursor-pointer overflow-hidden touch-manipulation"
              style={{ width: 44, height: 44, backgroundColor: editState.color }}
              title="Pick colour"
            >
              <input
                type="color"
                value={editState.color}
                onChange={(e) => onEditStateChange({ ...editState, color: e.target.value })}
                className="opacity-0 w-full h-full cursor-pointer"
              />
            </label>
            <input
              value={editState.name}
              onChange={(e) => onEditStateChange({ ...editState, name: e.target.value })}
              className={cn(inputCls, 'flex-1')}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={editState.type}
              onChange={(e) => onEditStateChange({ ...editState, type: e.target.value as ExpenseType })}
              className={cn(inputCls, 'flex-1')}
            >
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={onSaveEdit}
              className="p-2.5 rounded-[var(--radius-md)] text-[var(--c-save)] hover:bg-[var(--tint-save)] transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <Check size={16} />
            </button>
            <button onClick={onCancelEdit}
              className="p-2.5 rounded-[var(--radius-md)] text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              {...listeners} {...attributes}
              className="p-1 cursor-grab active:cursor-grabbing text-[var(--ink-subtle)] shrink-0 touch-manipulation"
            style={{ touchAction: 'none' }}
            >
              <GripVertical size={14} />
            </button>
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm text-[var(--ink)] truncate">{cat.name}</span>
            <button
              onClick={() => !cat.is_default && onSetDefault(cat)}
              title={cat.is_default ? 'Default selection in forms' : 'Set as default'}
              className="shrink-0 p-1 transition-colors touch-manipulation"
              style={{ color: cat.is_default ? 'var(--c-warn)' : 'var(--ink-subtle)' }}
            >
              <Star size={13} fill={cat.is_default ? 'currentColor' : 'none'} />
            </button>
            <span className="text-xs font-medium px-2 py-0.5 rounded-[var(--radius-md)] shrink-0"
              style={{ color: typeColor(cat.type), backgroundColor: typeColor(cat.type) + '15' }}>
              {cat.type}
            </span>
            <button onClick={() => onStartEdit(cat)}
              className="px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                border border-[var(--border)] rounded-[var(--radius-md)] hover:bg-[var(--surface)] transition-colors shrink-0">
              Edit
            </button>
            {isUnused ? (
              <button
                onClick={() => onDelete(cat)}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-want)]
                  hover:bg-[var(--tint-want)] transition-colors shrink-0"
                title="Delete permanently (never used)">
                <Trash2 size={13} />
              </button>
            ) : (
              <button
                onClick={() => onArchive(cat)}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--ink-subtle)] hover:text-[var(--c-warn)]
                  hover:bg-[var(--tint-warn)] transition-colors shrink-0"
                title="Archive (has existing expenses)">
                <Archive size={13} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap pl-7">
            <button
              onClick={() => onToggleShowInCards(cat)}
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
}

export function CategoriesPanel({ userId, categories, usedCategoryIds, onSave }: CategoriesPanelProps) {
  const supabase = createClient()
  const [editing, setEditing] = useState<string | null>(null)
  const [editState, setEditState] = useState<{ name: string; type: ExpenseType; color: string } | null>(null)
  const [adding, setAdding] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', type: 'Need' as ExpenseType, color: '#1F6F7F' })

  const usedSet = new Set(usedCategoryIds)

  const [localCats, setLocalCats] = useState(categories)
  useEffect(() => { setLocalCats(categories) }, [categories])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const active = localCats.filter((c) => !c.archived)
  const archived = localCats.filter((c) => c.archived)

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

  const setDefault = async (cat: Category) => {
    if (cat.is_default || cat.is_system) return
    setLocalCats(prev => prev.map(c => ({ ...c, is_default: c.id === cat.id })))
    const [r1, r2] = await Promise.all([
      supabase.from('categories').update({ is_default: false }).eq('user_id', userId).neq('id', cat.id),
      supabase.from('categories').update({ is_default: true }).eq('id', cat.id),
    ])
    if (r1.error || r2.error) {
      toast.error('Failed to set default')
      setLocalCats(categories)
    } else {
      onSave()
    }
  }

  const saveNew = async () => {
    if (!newCat.name.trim()) { toast.error('Name is required'); return }
    const maxOrder = active.length > 0 ? Math.max(...active.map((c) => c.sort_order)) : 0
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active: dragActive, over } = event
    if (!over || dragActive.id === over.id) return

    const oldIndex = active.findIndex((c) => c.id === dragActive.id)
    const newIndex = active.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(active, oldIndex, newIndex)

    setLocalCats([...reordered, ...archived])

    const results = await Promise.all(
      reordered.map((c, i) =>
        supabase.from('categories').update({ sort_order: i + 1 }).eq('id', c.id)
      )
    )
    if (results.some((r) => r.error)) {
      toast.error('Failed to save order')
      setLocalCats(categories)
    } else {
      onSave()
    }
  }

  const inputCls = 'apple-input text-sm'

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
        cards on the Expenses and Income tabs.
        Drag <GripVertical size={10} className="inline" /> to reorder — the top item is the default in add forms.
      </p>

      {adding && (
        <div className="border border-[var(--border)] rounded-[var(--radius-md)] p-4 bg-[var(--elevated)] space-y-3">
          <h3 className="text-sm font-medium text-[var(--ink)]">New category</h3>
          <div className="flex gap-3 items-center">
            <label
              className="shrink-0 rounded-[var(--radius-md)] border-2 border-[var(--border)] cursor-pointer overflow-hidden touch-manipulation"
              style={{ width: 44, height: 44, backgroundColor: newCat.color }}
              title="Pick colour"
            >
              <input
                type="color"
                value={newCat.color}
                onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                className="opacity-0 w-full h-full cursor-pointer"
              />
            </label>
            <input
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              placeholder="Category name"
              className={cn(inputCls, 'flex-1')}
            />
          </div>
          <select
            value={newCat.type}
            onChange={(e) => setNewCat({ ...newCat, type: e.target.value as ExpenseType })}
            className={inputCls}
          >
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewCat({ ...newCat, color: c })}
                className="w-7 h-7 rounded-full border-2 transition-all touch-manipulation"
                style={{
                  backgroundColor: c,
                  borderColor: newCat.color === c ? 'var(--ink)' : 'transparent',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveNew} className="btn-primary text-xs px-4 py-2 min-h-[44px]">Add</button>
            <button onClick={() => setAdding(false)}
              className="px-4 py-2 text-xs border border-[var(--border)] rounded-[var(--radius-xl)] min-h-[44px]
                text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={active.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {active.map((cat) => (
              <SortableCategory
                key={cat.id}
                cat={cat}
                usedSet={usedSet}
                editing={editing}
                editState={editState}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={() => setEditing(null)}
                onEditStateChange={setEditState}
                onToggleShowInCards={toggleShowInCards}
                onArchive={archive}
                onDelete={deleteCategory}
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
