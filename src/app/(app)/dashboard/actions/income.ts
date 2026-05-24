'use server'

import { createClient } from '@/lib/supabase/server'
import type { BudgetPeriod, Category, CategorySummaryItem, Income, PaymentMode } from '@/lib/types'

export interface IncomeFilters {
  search: string
  paymentIds: string[]
  categoryIds: string[]
  types: string[]
  sort: string
  dateFrom: string
  dateTo: string
}

export interface IncomeData {
  incomes: Income[]
  totalCount: number
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  categories: Category[]
  categorySummary: CategorySummaryItem[]
  currency: string
}

const PAGE_SIZE = 50

export async function fetchIncome(filters: IncomeFilters, page: number): Promise<IncomeData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { search, paymentIds, categoryIds, types, sort, dateFrom, dateTo } = filters
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('incomes')
    .select(
      '*, payment_mode:payment_modes(id,name,initial_balance,archived,show_in_balance,is_credit_card), category:categories(*)',
      { count: 'exact' },
    )
    .eq('user_id', user.id)

  if (search) query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`)
  if (paymentIds.length > 0) query = query.in('payment_mode_id', paymentIds)
  if (categoryIds.length > 0) query = query.in('category_id', categoryIds)
  if (types.length > 0) query = query.in('type', types)
  if (dateFrom) query = query.gte('date', dateFrom)
  if (dateTo) query = query.lte('date', dateTo)

  const [sortCol, sortDir] = sort === 'date_asc'   ? ['date', 'asc']
                           : sort === 'amount_desc' ? ['amount', 'desc']
                           : sort === 'amount_asc'  ? ['amount', 'asc']
                           :                          ['date', 'desc']

  query = query.order(sortCol, { ascending: sortDir === 'asc' }).range(offset, offset + PAGE_SIZE - 1)

  // Build category summary query (respects same date/payment filters but not pagination)
  let summaryQuery = supabase
    .from('incomes')
    .select('amount, category:categories(id, name, color, type, show_in_cards)')
    .eq('user_id', user.id)
    .not('category_id', 'is', null)

  if (dateFrom) summaryQuery = summaryQuery.gte('date', dateFrom)
  if (dateTo) summaryQuery = summaryQuery.lte('date', dateTo)
  if (paymentIds.length > 0) summaryQuery = summaryQuery.in('payment_mode_id', paymentIds)

  const [
    { data: incomes, count },
    { data: paymentModes },
    { data: budgetPeriods },
    { data: settings },
    { data: categories },
    { data: summaryRaw },
  ] = await Promise.all([
    query,
    supabase.from('payment_modes').select('*').eq('user_id', user.id).eq('archived', false),
    supabase.from('budget_periods').select('*').eq('user_id', user.id).order('start_month', { ascending: false }),
    supabase.from('user_settings').select('currency').eq('user_id', user.id).single(),
    supabase.from('categories').select('*').eq('user_id', user.id).eq('archived', false).order('sort_order'),
    summaryQuery,
  ])

  // Aggregate category summary
  const summaryMap = new Map<string, CategorySummaryItem>()
  for (const row of (summaryRaw ?? [])) {
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
    incomes: (incomes ?? []) as Income[],
    totalCount: count ?? 0,
    paymentModes: (paymentModes ?? []) as PaymentMode[],
    budgetPeriods: (budgetPeriods ?? []) as BudgetPeriod[],
    categories: (categories ?? []) as Category[],
    categorySummary,
    currency: settings?.currency ?? '₹',
  }
}
