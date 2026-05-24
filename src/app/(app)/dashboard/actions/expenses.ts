'use server'

import { createClient } from '@/lib/supabase/server'
import type { Category, CategorySummaryItem, Expense, PaymentMode } from '@/lib/types'

export interface ExpensesFilters {
  search: string
  categoryIds: string[]
  types: string[]
  paymentModeIds: string[]
  sort: string
  dateFrom: string
  dateTo: string
}

export interface ExpensesData {
  expenses: Expense[]
  totalCount: number
  categories: Category[]
  paymentModes: PaymentMode[]
  categorySummary: CategorySummaryItem[]
  currency: string
}

const PAGE_SIZE = 50

export async function fetchExpenses(filters: ExpensesFilters, page: number): Promise<ExpensesData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { search, categoryIds, types, paymentModeIds, sort, dateFrom, dateTo } = filters
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('expenses')
    .select('*, category:categories(*), payment_mode:payment_modes(*)', { count: 'exact' })
    .eq('user_id', user.id)

  if (search) query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`)
  if (categoryIds.length > 0) query = query.in('category_id', categoryIds)
  if (types.length > 0) query = query.in('type', types)
  if (paymentModeIds.length > 0) query = query.in('payment_mode_id', paymentModeIds)
  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)

  const [sortCol, sortDir] = sort === 'date_asc'   ? ['date', 'asc']
                           : sort === 'amount_desc' ? ['amount', 'desc']
                           : sort === 'amount_asc'  ? ['amount', 'asc']
                           :                          ['date', 'desc']

  query = query.order(sortCol, { ascending: sortDir === 'asc' }).range(offset, offset + PAGE_SIZE - 1)

  // Category summary query (all items in date range, ignores pagination)
  let summaryQuery = supabase
    .from('expenses')
    .select('amount, category:categories(id, name, color, type, show_in_cards)')
    .eq('user_id', user.id)
    .not('category_id', 'is', null)

  if (dateFrom) summaryQuery = summaryQuery.gte('date', dateFrom)
  if (dateTo) summaryQuery = summaryQuery.lte('date', dateTo)
  if (paymentModeIds.length > 0) summaryQuery = summaryQuery.in('payment_mode_id', paymentModeIds)
  if (types.length > 0) summaryQuery = summaryQuery.in('type', types)

  const [
    { data: expenses, count },
    { data: categories },
    { data: paymentModes },
    { data: settings },
    { data: summaryRaw },
  ] = await Promise.all([
    query,
    supabase.from('categories').select('*').eq('user_id', user.id).eq('archived', false).order('sort_order'),
    supabase.from('payment_modes').select('*').eq('user_id', user.id).eq('archived', false),
    supabase.from('user_settings').select('currency').eq('user_id', user.id).single(),
    summaryQuery,
  ])

  // Aggregate category summary
  const summaryMap = new Map<string, CategorySummaryItem>()
  for (const row of (summaryRaw ?? [])) {
    // Supabase returns joined rows as array or object depending on relation type
    const rawCat = row.category
    const cat = (Array.isArray(rawCat) ? rawCat[0] : rawCat) as { id: string; name: string; color: string; type: string; show_in_cards: boolean } | null
    if (!cat) continue
    const existing = summaryMap.get(cat.id)
    if (existing) {
      existing.total += Number(row.amount)
    } else {
      summaryMap.set(cat.id, {
        category_id: cat.id,
        category_name: cat.name,
        color: cat.color,
        type: cat.type as 'Need' | 'Want' | 'Saving',
        total: Number(row.amount),
        show_in_cards: cat.show_in_cards,
      })
    }
  }
  const categorySummary = Array.from(summaryMap.values()).sort((a, b) => b.total - a.total)

  return {
    expenses: (expenses ?? []) as Expense[],
    totalCount: count ?? 0,
    categories: (categories ?? []) as Category[],
    paymentModes: (paymentModes ?? []) as PaymentMode[],
    categorySummary,
    currency: settings?.currency ?? '₹',
  }
}
