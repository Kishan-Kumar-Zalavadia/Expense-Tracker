'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { settingsSchema, type SettingsFormValues } from '@/lib/validations'
import type { UserSettings } from '@/lib/types'
import { cn } from '@/lib/utils'

interface GeneralPanelProps {
  userId: string
  settings: UserSettings
  onSave: () => void
}

export function GeneralPanel({ userId, settings, onSave }: GeneralPanelProps) {
  const supabase = createClient()
  const [subcatEnabled, setSubcatEnabled] = useState(settings.enable_subcategories ?? false)
  const [subcatSaving, setSubcatSaving] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: settings.currency,
    },
  })

  const onSubmit = async (values: SettingsFormValues) => {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, currency: values.currency }, { onConflict: 'user_id' })

    if (error) { toast.error(error.message); return }
    toast.success('Settings saved')
    onSave()
  }

  const toggleSubcategories = async (enabled: boolean) => {
    setSubcatEnabled(enabled)
    setSubcatSaving(true)
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, enable_subcategories: enabled }, { onConflict: 'user_id' })
    setSubcatSaving(false)
    if (error) { toast.error(error.message); setSubcatEnabled(!enabled); return }
    onSave()
  }

  const inputCls = (hasErr: boolean) => cn(
    'apple-input text-sm',
    hasErr && 'error',
  )

  return (
    <div className="space-y-8 max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="section-bar" style={{ backgroundColor: 'var(--c-warn)' }} />
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">General</h2>
      </div>

      {/* Currency form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
            Currency symbol
          </label>
          <input
            {...register('currency')}
            type="text"
            maxLength={5}
            placeholder="₹"
            className={inputCls(!!errors.currency)}
          />
          {errors.currency && <p className="mt-1 text-xs text-[var(--c-want)]">{errors.currency.message}</p>}
          <p className="mt-1 text-xs text-[var(--ink-subtle)]">Single character or symbol, e.g. ₹, $, €</p>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      {/* Subcategories toggle */}
      <div className="border-t border-[var(--border)] pt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">Subcategories</p>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Add an optional subcategory field to expenses and income entries.
            </p>
          </div>
          <button
            type="button"
            disabled={subcatSaving}
            onClick={() => toggleSubcategories(!subcatEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
              'transition-colors duration-200 focus:outline-none disabled:opacity-50',
              subcatEnabled ? 'bg-[var(--c-primary)]' : 'bg-[var(--border-strong)]',
            )}
            role="switch"
            aria-checked={subcatEnabled}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm',
                'transform transition duration-200',
                subcatEnabled ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
