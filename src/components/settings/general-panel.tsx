'use client'

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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currency: settings.currency,
    },
  })

  const onSubmit = async (values: SettingsFormValues) => {
    const { error } = await supabase
      .from('user_settings')
      .update({ currency: values.currency })
      .eq('user_id', userId)

    if (error) { toast.error(error.message); return }
    toast.success('Settings saved')
    onSave()
  }

  const inputCls = (hasErr: boolean) => cn(
    'apple-input text-sm',
    hasErr && 'error',
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="section-bar" style={{ backgroundColor: 'var(--c-warn)' }} />
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">General</h2>
      </div>

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
  )
}
