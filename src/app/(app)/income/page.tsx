import { createClient } from '@/lib/supabase/server'
import { IncomePageClient } from '@/components/income/income-page-client'

interface PageProps {
  searchParams: Promise<{
    search?: string
    payment?: string
    sort?: string
    page?: string
  }>
}

export default async function IncomePage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search    = sp.search ?? ''
  const paymentId = sp.payment ?? ''
  const sort      = sp.sort ?? 'date_desc'
  const page      = Math.max(1, parseInt(sp.page ?? '1', 10))
  const PAGE_SIZE = 50
  const offset    = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Build filtered query
  let query = supabase
    .from('incomes')
    .select('*, payment_mode:payment_modes(id,name,initial_balance,archived,show_in_balance)', { count: 'exact' })
    .eq('user_id', user.id)

  if (search) query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`)
  if (paymentId) query = query.eq('payment_mode_id', paymentId)

  const [sortCol, sortDir] = sort === 'date_asc'   ? ['date', 'asc']
                           : sort === 'amount_desc' ? ['amount', 'desc']
                           : sort === 'amount_asc'  ? ['amount', 'asc']
                           :                          ['date', 'desc']

  query = query
    .order(sortCol, { ascending: sortDir === 'asc' })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data: incomes, count } = await query

  const [{ data: paymentModes }, { data: budgetPeriods }, { data: settings }] = await Promise.all([
    supabase.from('payment_modes').select('*').eq('user_id', user.id).eq('archived', false),
    supabase.from('budget_periods').select('*').eq('user_id', user.id).order('start_month', { ascending: false }),
    supabase.from('user_settings').select('currency').eq('user_id', user.id).single(),
  ])

  return (
    <IncomePageClient
      initialIncomes={incomes ?? []}
      totalCount={count ?? 0}
      paymentModes={paymentModes ?? []}
      budgetPeriods={budgetPeriods ?? []}
      currency={settings?.currency ?? '₹'}
      initialPage={page}
      initialFilters={{ search, paymentId, sort }}
    />
  )
}
