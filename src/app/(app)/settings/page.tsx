import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: settings },
    { data: categories },
    { data: paymentModes },
    { data: budgetPeriods },
    { data: recurringItems },
    { data: expenseCatUsage },
    { data: expensePayUsage },
    { data: incomePayUsage },
  ] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('categories').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('payment_modes').select('*').eq('user_id', user.id),
    supabase.from('budget_periods').select('*').eq('user_id', user.id).order('start_month', { ascending: false }),
    supabase.from('recurring_items')
      .select('*, payment_mode:payment_modes(id,name,initial_balance,archived,show_in_balance), category:categories(id,name,color,type,sort_order,archived,user_id)')
      .eq('user_id', user.id)
      .order('created_at'),
    supabase.from('expenses').select('category_id').eq('user_id', user.id).not('category_id', 'is', null),
    supabase.from('expenses').select('payment_mode_id').eq('user_id', user.id),
    supabase.from('incomes').select('payment_mode_id').eq('user_id', user.id),
  ])

  const usedCategoryIds = [...new Set((expenseCatUsage ?? []).map((r) => r.category_id as string))]
  const usedPaymentModeIds = [...new Set([
    ...(expensePayUsage ?? []).map((r) => r.payment_mode_id as string),
    ...(incomePayUsage ?? []).map((r) => r.payment_mode_id as string),
  ])]

  return (
    <SettingsClient
      userId={user.id}
      settings={settings ?? { user_id: user.id, weekly_limit: 10000, currency: '₹', theme: 'light' }}
      categories={categories ?? []}
      paymentModes={paymentModes ?? []}
      budgetPeriods={budgetPeriods ?? []}
      recurringItems={recurringItems ?? []}
      usedCategoryIds={usedCategoryIds}
      usedPaymentModeIds={usedPaymentModeIds}
    />
  )
}
