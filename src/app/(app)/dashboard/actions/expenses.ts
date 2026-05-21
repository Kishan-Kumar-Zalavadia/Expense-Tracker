'use server'

import { createClient } from '@/lib/supabase/server'
import type { Category, Expense, PaymentMode } from '@/lib/types'

export interface ExpensesFilters {
  search: string
  categoryId: string
  type: string
  paymentModeId: string
  sort: string
}

export interface ExpensesData {
  expenses: Expense[]
  totalCount: number
  categories: Category[]
  paymentModes: PaymentMode[]
  currency: string
}

const PAGE_SIZE = 50

export async function fetchExpenses(filters: ExpensesFilters, page: number): Promise<ExpensesData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { search, categoryId, type, paymentModeId, sort } = filters
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('expenses')
    .select('*, category:categories(*), payment_mode:payment_modes(*)', { count: 'exact' })
    .eq('user_id', user.id)

  if (search) query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (type) query = query.eq('type', type)
  if (paymentModeId) query = query.eq('payment_mode_id', paymentModeId)

  const [sortCol, sortDir] = sort === 'date_asc'   ? ['date', 'asc']
                           : sort === 'amount_desc' ? ['amount', 'desc']
                           : sort === 'amount_asc'  ? ['amount', 'asc']
                           :                          ['date', 'desc']

  query = query.order(sortCol, { ascending: sortDir === 'asc' }).range(offset, offset + PAGE_SIZE - 1)

  const [{ data: expenses, count }, { data: categories }, { data: paymentModes }, { data: settings }] =
    await Promise.all([
      query,
      supabase.from('categories').select('*').eq('user_id', user.id).eq('archived', false).order('sort_order'),
      supabase.from('payment_modes').select('*').eq('user_id', user.id).eq('archived', false),
      supabase.from('user_settings').select('currency').eq('user_id', user.id).single(),
    ])

  return {
    expenses: (expenses ?? []) as Expense[],
    totalCount: count ?? 0,
    categories: (categories ?? []) as Category[],
    paymentModes: (paymentModes ?? []) as PaymentMode[],
    currency: settings?.currency ?? '₹',
  }
}
