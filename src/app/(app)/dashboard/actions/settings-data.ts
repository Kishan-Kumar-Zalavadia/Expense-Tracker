'use server'

import { createClient } from '@/lib/supabase/server'
import type { BudgetPeriod, Category, PaymentMode, RecurringItem, Subcategory, UserSettings } from '@/lib/types'

export interface SettingsData {
  userId: string
  settings: UserSettings
  categories: Category[]
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  recurringItems: RecurringItem[]
  subcategories: Subcategory[]
  usedCategoryIds: string[]
  usedPaymentModeIds: string[]
  usedSubcategoryIds: string[]
}

export async function fetchSettingsData(): Promise<SettingsData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: settings },
    { data: categories },
    { data: paymentModes },
    { data: budgetPeriods },
    { data: recurringItems },
    { data: subcategories },
    { data: expenseCatUsage },
    { data: expensePayUsage },
    { data: incomePayUsage },
    { data: expenseSubcatUsage },
    { data: incomeSubcatUsage },
  ] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('categories').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('payment_modes').select('*').eq('user_id', user.id),
    supabase.from('budget_periods').select('*').eq('user_id', user.id).order('start_month', { ascending: false }),
    supabase.from('recurring_items')
      .select('*, payment_mode:payment_modes(id,name,initial_balance,archived,show_in_balance,is_credit_card), category:categories(id,name,color,type,sort_order,archived,is_system,show_in_cards,user_id)')
      .eq('user_id', user.id).order('created_at'),
    supabase.from('subcategories').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('expenses').select('category_id').eq('user_id', user.id).not('category_id', 'is', null),
    supabase.from('expenses').select('payment_mode_id').eq('user_id', user.id),
    supabase.from('incomes').select('payment_mode_id').eq('user_id', user.id),
    supabase.from('expenses').select('subcategory_id').eq('user_id', user.id).not('subcategory_id', 'is', null),
    supabase.from('incomes').select('subcategory_id').eq('user_id', user.id).not('subcategory_id', 'is', null),
  ])

  const usedCategoryIds = [...new Set((expenseCatUsage ?? []).map((r) => r.category_id as string))]
  const usedPaymentModeIds = [...new Set([
    ...(expensePayUsage ?? []).map((r) => r.payment_mode_id as string),
    ...(incomePayUsage ?? []).map((r) => r.payment_mode_id as string),
  ])]
  const usedSubcategoryIds = [...new Set([
    ...(expenseSubcatUsage ?? []).map((r) => r.subcategory_id as string),
    ...(incomeSubcatUsage ?? []).map((r) => r.subcategory_id as string),
  ])]

  return {
    userId: user.id,
    settings: settings ?? { user_id: user.id, weekly_limit: 10000, currency: '₹', theme: 'light' as const, enable_subcategories: false },
    categories: (categories ?? []) as Category[],
    paymentModes: (paymentModes ?? []) as PaymentMode[],
    budgetPeriods: (budgetPeriods ?? []) as BudgetPeriod[],
    recurringItems: (recurringItems ?? []) as RecurringItem[],
    subcategories: (subcategories ?? []) as Subcategory[],
    usedCategoryIds,
    usedPaymentModeIds,
    usedSubcategoryIds,
  }
}
