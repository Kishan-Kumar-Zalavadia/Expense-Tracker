'use client'

import { useEffect, useState } from 'react'
import {
  Lightbulb, Bug, MessageSquare, CheckCircle, Send,
  Clock, CheckCircle2, Circle, Inbox,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  submitFeedback, fetchMyFeedback,
  type FeedbackType, type FeedbackStatus, type FeedbackItem,
} from '@/app/(app)/dashboard/actions/feedback'

// ─── Shared config ────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<FeedbackType, {
  label: string; icon: React.ElementType; color: string; tint: string
  placeholder: string; description: string
}> = {
  feature: {
    label:       'Feature Request',
    icon:        Lightbulb,
    color:       'var(--c-primary)',
    tint:        'var(--tint-primary, rgba(37,99,235,0.08))',
    placeholder: 'e.g. Add recurring expense reminders',
    description: "Got an idea? Tell us what you'd love to see.",
  },
  bug: {
    label:       'Bug Report',
    icon:        Bug,
    color:       'var(--c-want)',
    tint:        'var(--tint-want)',
    placeholder: "e.g. Balance doesn't update after adding income",
    description: "Something broken? We'll fix it fast.",
  },
  general: {
    label:       'General Feedback',
    icon:        MessageSquare,
    color:       'var(--c-warn)',
    tint:        'var(--tint-warn, rgba(255,159,10,0.08))',
    placeholder: 'e.g. The dashboard feels cluttered on mobile',
    description: 'Thoughts, suggestions, or just say hi.',
  },
}

const STATUS_CONFIG: Record<FeedbackStatus, {
  label: string; icon: React.ElementType; color: string; bg: string; description: string
}> = {
  new:         { label: 'Submitted',   icon: Circle,       color: 'var(--ink-muted)', bg: 'var(--surface-2)',                                              description: "We've received your submission."   },
  in_progress: { label: 'In Progress', icon: Clock,        color: 'var(--c-warn)',    bg: 'var(--tint-warn, rgba(255,159,10,0.1))',                        description: "We're actively working on this."   },
  done:        { label: 'Done',        icon: CheckCircle2, color: 'var(--c-save)',    bg: 'color-mix(in srgb, var(--c-save) 12%, transparent)',            description: 'This has been resolved or shipped.' },
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function FeedbackPanel() {
  const [view, setView] = useState<'submit' | 'mine'>('submit')

  return (
    <div className="page-enter flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div>
        <div
          className="inline-flex items-center px-2 py-0.5 mb-2 rounded-full
            text-[10px] font-bold uppercase tracking-widest text-white"
          style={{ backgroundColor: '#8B5CF6' }}
        >
          Feedback
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
          {view === 'submit' ? 'Share your thoughts' : 'My submissions'}
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          {view === 'submit'
            ? 'We read every submission and use it to improve Ledger.'
            : 'Track the status of your feature requests, bug reports, and feedback.'}
        </p>
      </div>

      {/* Internal tab toggle */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {(['submit', 'mine'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
            style={{ color: view === v ? '#8B5CF6' : 'var(--ink-muted)' }}
          >
            {v === 'submit' ? 'Submit feedback' : 'My submissions'}
            {view === v && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                style={{ backgroundColor: '#8B5CF6' }} />
            )}
          </button>
        ))}
      </div>

      {view === 'submit' ? <SubmitView /> : <MySubmissionsView />}
    </div>
  )
}

// ─── Submit view ──────────────────────────────────────────────────────────────
function SubmitView() {
  const [activeType, setActiveType] = useState<FeedbackType>('feature')
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]       = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const current = TYPE_CONFIG[activeType]

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please add a title'); return }
    setLoading(true)
    const result = await submitFeedback(activeType, title, description)
    if (result.error) { toast.error(result.error); setLoading(false); return }
    setSubmitted(true)
    setLoading(false)
  }

  const handleSubmitAnother = () => {
    setTitle('')
    setDescription('')
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 sm:gap-6
        py-10 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--c-save) 15%, transparent)' }}
        >
          <CheckCircle size={40} style={{ color: 'var(--c-save)' }} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-medium text-[var(--ink)] mb-2">
            Thank you!
          </h2>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed max-w-xs mx-auto">
            Your feedback has been submitted. We read every single one and use it to make Ledger better.
          </p>
        </div>
        <button
          onClick={handleSubmitAnother}
          className="px-5 py-2.5 text-sm border border-[var(--border)]
            rounded-[var(--radius-xl)] text-[var(--ink-muted)]
            hover:bg-[var(--surface-2)] transition-colors"
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.entries(TYPE_CONFIG) as [FeedbackType, typeof TYPE_CONFIG[FeedbackType]][]).map(
          ([id, { label, icon: Icon, color, tint }]) => {
            const active = activeType === id
            return (
              <button
                key={id}
                onClick={() => setActiveType(id)}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-[var(--radius-lg)]',
                  'border transition-all text-center',
                  active ? 'border-transparent' : 'border-[var(--border)] hover:border-[var(--border-strong)]',
                )}
                style={active ? { backgroundColor: tint, borderColor: color } : {}}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: active
                      ? `color-mix(in srgb, ${color} 20%, transparent)`
                      : 'var(--surface-2)',
                  }}
                >
                  <Icon size={18} style={{ color: active ? color : 'var(--ink-muted)' }} />
                </div>
                <span
                  className="text-xs font-medium leading-tight"
                  style={{ color: active ? color : 'var(--ink-muted)' }}
                >
                  {label}
                </span>
              </button>
            )
          }
        )}
      </div>

      {/* Form card */}
      <div className="apple-card p-4 sm:p-6 space-y-4">
        <div
          className="h-1 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-0 rounded-t-[var(--radius-lg)]"
          style={{ backgroundColor: current.color }}
        />
        <p className="text-xs text-[var(--ink-muted)] pt-1">{current.description}</p>

        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
            Title <span style={{ color: 'var(--c-want)' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 120))}
            placeholder={current.placeholder}
            maxLength={120}
            className="apple-input text-sm"
          />
          <div className="mt-1 text-right text-[10px] text-[var(--ink-subtle)]">
            {title.length}/120
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
            Description
            <span className="ml-1 text-[var(--ink-subtle)] normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            placeholder={
              activeType === 'bug'
                ? 'Steps to reproduce, what you expected vs what happened...'
                : 'Share as much or as little as you like...'
            }
            rows={4}
            maxLength={1000}
            className="apple-input text-sm resize-none"
          />
          <div className="mt-1 text-right text-[10px] text-[var(--ink-subtle)]">
            {description.length}/1000
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3
            text-sm font-medium text-white rounded-[var(--radius-xl)]
            transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: current.color }}
        >
          {loading
            ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            : <><Send size={14} /> Submit {current.label}</>
          }
        </button>
      </div>
    </>
  )
}

// ─── My Submissions view ──────────────────────────────────────────────────────
function MySubmissionsView() {
  const [items, setItems]     = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyFeedback().then((data) => { setItems(data); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="animate-spin w-8 h-8 border-2 border-[var(--c-primary)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="apple-card p-12 flex flex-col items-center gap-3 text-center">
        <Inbox size={36} className="text-[var(--ink-subtle)]" />
        <p className="text-sm font-medium text-[var(--ink-muted)]">No submissions yet</p>
        <p className="text-xs text-[var(--ink-subtle)] max-w-xs">
          Submit a feature idea, bug report, or general feedback using the Submit tab above.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <MyFeedbackCard key={item.id} item={item} />
      ))}
    </div>
  )
}

// ─── Submission card ──────────────────────────────────────────────────────────
function MyFeedbackCard({ item }: { item: FeedbackItem }) {
  const type   = TYPE_CONFIG[item.type]
  const status = STATUS_CONFIG[item.status]
  const TypeIcon   = type.icon
  const StatusIcon = status.icon

  return (
    <div className="apple-card overflow-hidden">
      <div className="h-[3px]" style={{ backgroundColor: type.color }} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `color-mix(in srgb, ${type.color} 12%, transparent)` }}
          >
            <TypeIcon size={15} style={{ color: type.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--ink)] leading-snug">{item.title}</p>
            <p className="text-[10px] text-[var(--ink-subtle)] mt-0.5">{type.label}</p>
            {item.description && (
              <p className="mt-1.5 text-xs text-[var(--ink-muted)] leading-relaxed line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <time className="text-[10px] text-[var(--ink-subtle)] whitespace-nowrap shrink-0 mt-1">
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
          </time>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: status.bg, color: status.color }}
          >
            <StatusIcon size={11} />
            {status.label}
          </div>
          <span className="text-xs text-[var(--ink-muted)]">{status.description}</span>
        </div>
      </div>
    </div>
  )
}
