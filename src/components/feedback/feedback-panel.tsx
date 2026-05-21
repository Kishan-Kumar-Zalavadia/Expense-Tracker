'use client'

import { useState } from 'react'
import { Lightbulb, Bug, MessageSquare, CheckCircle, ArrowLeft, Send } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { submitFeedback, type FeedbackType } from '@/app/(app)/dashboard/actions/feedback'
import { useAppShell } from '@/hooks/use-app-shell'

const TYPES: {
  id: FeedbackType
  label: string
  icon: React.ElementType
  color: string
  tint: string
  placeholder: string
  description: string
}[] = [
  {
    id:          'feature',
    label:       'Feature Request',
    icon:        Lightbulb,
    color:       'var(--c-primary)',
    tint:        'var(--tint-primary, rgba(37,99,235,0.08))',
    placeholder: 'e.g. Add recurring expense reminders',
    description: 'Got an idea? Tell us what you\'d love to see.',
  },
  {
    id:          'bug',
    label:       'Bug Report',
    icon:        Bug,
    color:       'var(--c-want)',
    tint:        'var(--tint-want)',
    placeholder: 'e.g. Balance doesn\'t update after adding income',
    description: 'Something broken? We\'ll fix it fast.',
  },
  {
    id:          'general',
    label:       'General Feedback',
    icon:        MessageSquare,
    color:       'var(--c-warn)',
    tint:        'var(--tint-warn, rgba(255,159,10,0.08))',
    placeholder: 'e.g. The dashboard feels cluttered on mobile',
    description: 'Thoughts, suggestions, or just say hi.',
  },
]

export function FeedbackPanel() {
  const { setActiveTab } = useAppShell()
  const [activeType, setActiveType] = useState<FeedbackType>('feature')
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]       = useState(false)
  const [submitted, setSubmitted]   = useState(false)

  const current = TYPES.find((t) => t.id === activeType)!

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Please add a title'); return }
    setLoading(true)
    const result = await submitFeedback(activeType, title, description)
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }
    setSubmitted(true)
    setLoading(false)
  }

  const handleSubmitAnother = () => {
    setTitle('')
    setDescription('')
    setSubmitted(false)
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="page-enter flex flex-col items-center justify-center
        gap-4 sm:gap-6 p-6 max-w-md mx-auto w-full min-h-[60vh] text-center">
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
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <button
            onClick={handleSubmitAnother}
            className="flex-1 px-4 py-2.5 text-sm border border-[var(--border)]
              rounded-[var(--radius-xl)] text-[var(--ink-muted)]
              hover:bg-[var(--surface-2)] transition-colors"
          >
            Submit another
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex-1 px-4 py-2.5 text-sm font-medium rounded-[var(--radius-xl)]
              text-white transition-colors"
            style={{ backgroundColor: 'var(--c-save)' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-enter flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-2xl mx-auto w-full">

      {/* Header */}
      <div>
        <div
          className="inline-flex items-center px-2 py-0.5 mb-2 rounded-full
            text-[10px] font-bold uppercase tracking-widest text-white"
          style={{ backgroundColor: current.color }}
        >
          Feedback
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
          Share your thoughts
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          We read every submission and use it to improve Ledger.
        </p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-2">
        {TYPES.map(({ id, label, icon: Icon, color, tint, description: desc }) => {
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
        })}
      </div>

      {/* Form card */}
      <div className="apple-card p-4 sm:p-6 space-y-4">
        {/* Accent bar */}
        <div
          className="h-1 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-0 rounded-t-[var(--radius-lg)]"
          style={{ backgroundColor: current.color }}
        />

        <p className="text-xs text-[var(--ink-muted)] pt-1">{current.description}</p>

        {/* Title */}
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

        {/* Description */}
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

        {/* Submit */}
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
    </div>
  )
}
