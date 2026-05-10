import { createClient } from '@/lib/supabase/server'
import { ExpensesPageClient } from '@/components/expenses/expenses-page-client'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    type?: string
    payment?: string
    sort?: string
    page?: string
  }>
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const search      = sp.search ?? ''
  const categoryId  = sp.category ?? ''
  const type        = sp.type ?? ''
  const paymentId   = sp.payment ?? ''
  const sort        = sp.sort ?? 'date_desc'
  const page        = Math.max(1, parseInt(sp.page ?? '1', 10))
  const PAGE_SIZE   = 50
  const offset      = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Build query
  let query = supabase
    .from('expenses')
    .select('*, category:categories(*), payment_mode:payment_modes(*)', { count: 'exact' })
    .eq('user_id', user.id)

  if (search) {
    query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`)
  }
  if (categoryId) query = query.eq('category_id', categoryId)
  if (type)       query = query.eq('type', type)
  if (paymentId)  query = query.eq('payment_mode_id', paymentId)

  const [sortCol, sortDir] = sort === 'date_asc'    ? ['date', 'asc']
                           : sort === 'amount_desc'  ? ['amount', 'desc']
                           : sort === 'amount_asc'   ? ['amount', 'asc']
                           : /* date_desc */           ['date', 'desc']

  query = query
    .order(sortCol, { ascending: sortDir === 'asc' })
    .range(offset, offset + PAGE_SIZE - 1)

  const { data: expenses, count } = await query

  // Fetch categories + payment modes for filters / modal
  const [{ data: categories }, { data: paymentModes }, { data: settings }] = await Promise.all([
    supabase.from('categories').select('*').eq('user_id', user.id).eq('archived', false).order('sort_order'),
    supabase.from('payment_modes').select('*').eq('user_id', user.id).eq('archived', false),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <ExpensesPageClient
      initialExpenses={expenses ?? []}
      totalCount={count ?? 0}
      categories={categories ?? []}
      paymentModes={paymentModes ?? []}
      currency={settings?.currency ?? '₹'}
      initialPage={page}
      initialFilters={{ search, categoryId, type, paymentModeId: paymentId, sort }}
    />
  )
}
