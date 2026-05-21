'use server'

import { createClient } from '@/lib/supabase/server'
import type { BudgetPeriod, Income, PaymentMode } from '@/lib/types'

export interface IncomeFilters {
  search: string
  paymentId: string
  sort: string
}

export interface IncomeData {
  incomes: Income[]
  totalCount: number
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  currency: string
}

const PAGE_SIZE = 50

export async function fetchIncome(filters: IncomeFilters, page: number): Promise<IncomeData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { search, paymentId, sort } = filters
  const offset = (page - 1) * PAGE_SIZE

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

  query = query.order(sortCol, { ascending: sortDir === 'asc' }).range(offset, offset + PAGE_SIZE - 1)

  const [{ data: incomes, count }, { data: paymentModes }, { data: budgetPeriods }, { data: settings }] =
    await Promise.all([
      query,
      supabase.from('payment_modes').select('*').eq('user_id', user.id).eq('archived', false),
      supabase.from('budget_periods').select('*').eq('user_id', user.id).order('start_month', { ascending: false }),
      supabase.from('user_settings').select('currency').eq('user_id', user.id).single(),
    ])

  return {
    incomes: (incomes ?? []) as Income[],
    totalCount: count ?? 0,
    paymentModes: (paymentModes ?? []) as PaymentMode[],
    budgetPeriods: (budgetPeriods ?? []) as BudgetPeriod[],
    currency: settings?.currency ?? '₹',
  }
}
