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
      weekly_limit: String(settings.weekly_limit),
    },
  })

  const onSubmit = async (values: SettingsFormValues) => {
    const weeklyLimitNum = parseFloat(values.weekly_limit)
    if (isNaN(weeklyLimitNum) || weeklyLimitNum <= 0) {
      toast.error('Weekly limit must be a positive number')
      return
    }
    const { error } = await supabase
      .from('user_settings')
      .update({
        currency: values.currency,
        weekly_limit: weeklyLimitNum,
      })
      .eq('user_id', userId)

    if (error) { toast.error(error.message); return }
    toast.success('Settings saved')
    onSave()
  }

  const inputCls = (hasErr: boolean) => cn(
    'w-full px-3 py-2 text-sm bg-[var(--elevated)] border rounded-sm',
    'text-[var(--ink)] placeholder:text-[var(--ink-subtle)]',
    'focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] focus:border-transparent',
    hasErr ? 'border-[var(--c-want)]' : 'border-[var(--border)]',
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

      <div>
        <label className="block text-xs font-medium text-[var(--ink-muted)] mb-1 uppercase tracking-wide">
          Weekly spend limit
        </label>
        <input
          {...register('weekly_limit')}
          type="number"
          step="100"
          min="0"
          placeholder="10000"
          className={cn(inputCls(!!errors.weekly_limit), 'tabular-nums')}
        />
        {errors.weekly_limit && <p className="mt-1 text-xs text-[var(--c-want)]">{errors.weekly_limit.message as string}</p>}
        <p className="mt-1 text-xs text-[var(--ink-subtle)]">Used as the reference line in daily/weekly charts</p>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}
