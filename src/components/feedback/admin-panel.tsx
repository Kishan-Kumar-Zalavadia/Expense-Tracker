'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Lightbulb, Bug, MessageSquare, Clock, CheckCircle2,
  Circle, Trash2, ChevronDown, Shield, Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  fetchAllFeedback, updateFeedbackStatus, deleteFeedback, fetchUserCount,
  type FeedbackItem, type FeedbackType, type FeedbackStatus,
} from '@/app/(app)/dashboard/actions/feedback'

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: React.ElementType; color: string }> = {
  feature: { label: 'Feature',  icon: Lightbulb,      color: 'var(--c-primary)' },
  bug:     { label: 'Bug',      icon: Bug,             color: 'var(--c-want)'   },
  general: { label: 'Feedback', icon: MessageSquare,   color: 'var(--c-warn)'   },
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  new:         { label: 'New',         icon: Circle,        color: 'var(--ink-muted)', bg: 'var(--surface-2)'      },
  in_progress: { label: 'In Progress', icon: Clock,         color: 'var(--c-warn)',    bg: 'var(--tint-warn, rgba(255,159,10,0.1))' },
  done:        { label: 'Done',        icon: CheckCircle2,  color: 'var(--c-save)',    bg: 'color-mix(in srgb, var(--c-save) 12%, transparent)' },
}

const STATUS_CYCLE: Record<FeedbackStatus, FeedbackStatus> = {
  new:         'in_progress',
  in_progress: 'done',
  done:        'new',
}

const TYPE_FILTERS = [
  { id: 'all',     label: 'All'     },
  { id: 'feature', label: 'Features'},
  { id: 'bug',     label: 'Bugs'    },
  { id: 'general', label: 'General' },
]

const STATUS_FILTERS = [
  { id: 'all',         label: 'All'         },
  { id: 'new',         label: 'New'         },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done',        label: 'Done'        },
]

// ─── Admin Panel ─────────────────────────────────────────────────────────────
export function AdminPanel() {
  const [items, setItems]         = useState<FeedbackItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [typeFilter, setTypeFilter]     = useState('all')
  const [statusFilter, setStatusFilter] = useState('new')
  const [userCount, setUserCount]       = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    const [data, count] = await Promise.all([fetchAllFeedback(), fetchUserCount()])
    setItems(data)
    setUserCount(count)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleStatusCycle = async (item: FeedbackItem) => {
    const next = STATUS_CYCLE[item.status]
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: next } : i))
    const result = await updateFeedbackStatus(item.id, next)
    if (result.error) {
      toast.error(result.error)
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: item.status } : i))
    }
  }

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    const result = await deleteFeedback(id)
    if (result.error) { toast.error(result.error); load() }
  }

  const handleSaveNote = async (id: string, note: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return
    const result = await updateFeedbackStatus(id, item.status, note)
    if (result.error) toast.error(result.error)
    else {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, admin_note: note } : i))
      toast.success('Note saved')
    }
  }

  const filtered = items
    .filter((i) => typeFilter   === 'all' || i.type   === typeFilter)
    .filter((i) => statusFilter === 'all' || i.status === statusFilter)

  // Stats
  const counts = {
    new:         items.filter((i) => i.status === 'new').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
    done:        items.filter((i) => i.status === 'done').length,
  }

  return (
    <div className="page-enter flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded-full
            text-[10px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-warn)' }}>
            <Shield size={9} /> Admin
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
            Feedback inbox
          </h1>
        </div>

        {/* Stats chips */}
        <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
          {userCount !== null && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: 'var(--tint-save)', color: 'var(--c-save)' }}>
              <Users size={10} />
              {userCount} {userCount === 1 ? 'user' : 'users'}
            </div>
          )}
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            const count = counts[key as FeedbackStatus]
            return (
              <div key={key} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                <Icon size={10} />
                {count}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Type tabs */}
        <div className="flex gap-1 border-b border-[var(--border)] sm:border-0">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className="px-3 py-2 text-xs font-medium transition-colors relative whitespace-nowrap"
              style={{ color: typeFilter === f.id ? 'var(--c-primary)' : 'var(--ink-muted)' }}
            >
              {f.label}
              {typeFilter === f.id && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{ backgroundColor: 'var(--c-primary)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                statusFilter === f.id
                  ? 'bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]'
                  : 'border-[var(--border)] text-[var(--ink-muted)] hover:border-[var(--border-strong)]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <span className="animate-spin w-8 h-8 border-2 border-[var(--c-primary)] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="apple-card p-12 flex flex-col items-center gap-3 text-center">
          <MessageSquare size={32} className="text-[var(--ink-subtle)]" />
          <p className="text-sm text-[var(--ink-muted)]">
            {items.length === 0 ? 'No feedback submitted yet.' : 'No items match the current filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onStatusCycle={() => handleStatusCycle(item)}
              onDelete={() => handleDelete(item.id)}
              onSaveNote={(note) => handleSaveNote(item.id, note)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Feedback Card ────────────────────────────────────────────────────────────
function FeedbackCard({
  item,
  onStatusCycle,
  onDelete,
  onSaveNote,
}: {
  item: FeedbackItem
  onStatusCycle: () => void
  onDelete: () => void
  onSaveNote: (note: string) => void
}) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote]         = useState(item.admin_note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const type   = TYPE_CONFIG[item.type]
  const status = STATUS_CONFIG[item.status]
  const TypeIcon   = type.icon
  const StatusIcon = status.icon

  return (
    <div className="apple-card overflow-hidden">
      {/* Top accent line */}
      <div className="h-[3px]" style={{ backgroundColor: type.color }} />

      <div className="p-4 sm:p-5">
        {/* Row 1: type + title + date */}
        <div className="flex items-start gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `color-mix(in srgb, ${type.color} 12%, transparent)` }}
          >
            <TypeIcon size={15} style={{ color: type.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--ink)] leading-snug">{item.title}</p>
            {item.description && (
              <p className="mt-1 text-xs text-[var(--ink-muted)] leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <time className="text-[10px] text-[var(--ink-subtle)] whitespace-nowrap shrink-0 mt-1">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </time>
        </div>

        {/* Row 2: user + controls */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {/* User email */}
          <span className="text-[10px] text-[var(--ink-subtle)] truncate flex-1 min-w-0">
            {item.user_email ?? 'anonymous'}
          </span>

          {/* Note toggle */}
          <button
            onClick={() => setNoteOpen((o) => !o)}
            className="text-[10px] text-[var(--ink-muted)] hover:text-[var(--ink)]
              flex items-center gap-0.5 transition-colors"
          >
            Note
            <ChevronDown size={10} className={cn('transition-transform', noteOpen && 'rotate-180')} />
          </button>

          {/* Status badge — click to cycle */}
          <button
            onClick={onStatusCycle}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold
              transition-colors hover:opacity-80"
            style={{ backgroundColor: status.bg, color: status.color }}
            title="Click to change status"
          >
            <StatusIcon size={10} />
            {status.label}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-[var(--ink-muted)] hover:text-[var(--ink)] px-1.5 py-0.5"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="text-[10px] text-[var(--c-want)] font-medium px-1.5 py-0.5"
              >
                Confirm
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1 text-[var(--ink-subtle)] hover:text-[var(--c-want)] transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* Admin note (expandable) */}
        {noteOpen && (
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add an internal note..."
              rows={2}
              className="apple-input text-xs resize-none"
            />
            <div className="flex justify-end mt-1.5">
              <button
                onClick={() => onSaveNote(note)}
                className="text-xs px-3 py-1.5 rounded-[var(--radius-md)]
                  font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--c-primary)' }}
              >
                Save note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
