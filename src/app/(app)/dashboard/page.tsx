import { createClient } from '@/lib/supabase/server'
import { currentYearMonth } from '@/lib/utils'
import { getDashboardData } from './actions'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import type { BudgetPeriod } from '@/lib/types'

export default async function DashboardPage() {
  const { year, month } = currentYearMonth()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    initialData,
    { data: categories },
    { data: allPaymentModes },
    { data: budgetPeriods },
    { data: settings },
  ] = await Promise.all([
    getDashboardData(year, month),
    supabase.from('categories').select('*').eq('user_id', user.id).eq('archived', false).order('sort_order'),
    supabase.from('payment_modes').select('*').eq('user_id', user.id),
    supabase.from('budget_periods').select('*').eq('user_id', user.id).order('start_month', { ascending: true }),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
  ])

  if (!initialData) return null

  const paymentModes = (allPaymentModes ?? []).filter((pm) => !pm.archived)
  const currency = settings?.currency ?? '₹'

  return (
    <DashboardClient
      initialData={initialData}
      initialYear={year}
      initialMonth={month}
      categories={categories ?? []}
      paymentModes={paymentModes}
      budgetPeriods={(budgetPeriods ?? []) as BudgetPeriod[]}
      currency={currency}
      userId={user.id}
    />
  )
}
