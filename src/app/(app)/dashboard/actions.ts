'use server'

import { createClient } from '@/lib/supabase/server'
import { findActiveBudget } from '@/lib/utils'
import type { MonthSummary, CategorySpend, DailySpend, PaymentModeBalance, Expense } from '@/lib/types'

export interface CreditCardTotal {
  totalBalance: number       // sum of all CC balances (negative = you owe money)
  totalCharged: number       // sum of all CC expense_total (all-time charges)
  cardCount: number          // number of credit card accounts
  debitTotal: number         // sum of all non-CC account balances
  debitCount: number         // number of non-CC accounts
}

export interface DashboardMonthData {
  summary: MonthSummary
  categorySpend: CategorySpend[]
  dailySpend: DailySpend[]
  balances: PaymentModeBalance[]
  creditCardTotal: CreditCardTotal
  recent6: Expense[]
  dailyLimit: number
}

export async function getDashboardData(year: number, month: number): Promise<DashboardMonthData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`
  const startDate = `${currentMonthStr}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDateStr = `${currentMonthStr}-${String(lastDay).padStart(2, '0')}`

  const [
    { data: budgetPeriods },
    { data: settings },
    { data: expenses },
    { data: monthIncomes },
    { data: allPaymentModes },
    { data: allExpenses },
    { data: allIncomes },
  ] = await Promise.all([
    supabase.from('budget_periods').select('*').eq('user_id', user.id).order('start_month', { ascending: true }),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
    supabase.from('expenses').select('*, category:categories(*), payment_mode:payment_modes(*)').eq('user_id', user.id).gte('date', startDate).lte('date', endDateStr).order('date', { ascending: false }),
    supabase.from('incomes').select('amount, category:categories(is_system, exclude_from_totals)').eq('user_id', user.id).gte('date', startDate).lte('date', endDateStr),
    supabase.from('payment_modes').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('expenses').select('amount, payment_mode_id').eq('user_id', user.id),
    supabase.from('incomes').select('amount, payment_mode_id').eq('user_id', user.id),
  ])

  const activePeriod = findActiveBudget(budgetPeriods ?? [], currentMonthStr)
  const monthBudget = activePeriod?.monthly_amount ?? 0
  const needBudget = (monthBudget * (activePeriod?.needs_pct ?? 50)) / 100
  const wantBudget = (monthBudget * (activePeriod?.wants_pct ?? 30)) / 100
  const saveBudget = (monthBudget * (activePeriod?.savings_pct ?? 20)) / 100

  const weeklyLimit = settings?.weekly_limit ?? 10000
  const expenseList = expenses ?? []

  let needSpent = 0, wantSpent = 0, saveSpent = 0
  for (const e of expenseList) {
    if (e.category?.is_system) continue             // exclude system categories (e.g. CC Payment)
    if (e.category?.exclude_from_totals) continue   // exclude user-flagged categories
    if (e.type === 'Need')   needSpent  += Number(e.amount)
    if (e.type === 'Want')   wantSpent  += Number(e.amount)
    if (e.type === 'Saving') saveSpent  += Number(e.amount)
  }
  const totalSpent = needSpent + wantSpent + saveSpent
  const incomeTotal = (monthIncomes ?? []).reduce((s, r) => {
    const cat = r.category as { is_system?: boolean; exclude_from_totals?: boolean } | null
    if (cat?.is_system || cat?.exclude_from_totals) return s
    return s + Number(r.amount)
  }, 0)

  const summary: MonthSummary = {
    total_spent: totalSpent,
    monthly_budget: monthBudget,
    need_spent: needSpent,
    want_spent: wantSpent,
    save_spent: saveSpent,
    need_budget: needBudget,
    want_budget: wantBudget,
    save_budget: saveBudget,
    income_total: incomeTotal,
  }

  const catMap = new Map<string, CategorySpend>()
  for (const e of expenseList) {
    if (!e.category || e.category.is_system || e.category.exclude_from_totals) continue
    const existing = catMap.get(e.category_id)
    if (existing) {
      existing.total += Number(e.amount)
    } else {
      catMap.set(e.category_id, {
        category_id: e.category_id,
        category_name: e.category.name,
        color: e.category.color,
        total: Number(e.amount),
      })
    }
  }
  const categorySpend: CategorySpend[] = Array.from(catMap.values()).sort((a, b) => b.total - a.total)

  const dayMap = new Map<string, { need: number; want: number }>()
  for (const e of expenseList) {
    if (e.category?.is_system || e.category?.exclude_from_totals) continue
    if (e.type === 'Saving') continue
    const entry = dayMap.get(e.date) ?? { need: 0, want: 0 }
    if (e.type === 'Need') entry.need += Number(e.amount)
    if (e.type === 'Want') entry.want += Number(e.amount)
    dayMap.set(e.date, entry)
  }
  const dailySpend: DailySpend[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { need, want }]) => ({ date, need, want, total: need + want }))

  const balances: PaymentModeBalance[] = (allPaymentModes ?? [])
    .filter((pm) => pm.show_in_balance && !pm.archived)
    .map((pm) => {
      const inc = (allIncomes ?? []).filter((i) => i.payment_mode_id === pm.id).reduce((s, i) => s + Number(i.amount), 0)
      const exp = (allExpenses ?? []).filter((e) => e.payment_mode_id === pm.id).reduce((s, e) => s + Number(e.amount), 0)
      return {
        id: pm.id,
        name: pm.name,
        initial_balance: pm.initial_balance ?? 0,
        income_total: inc,
        expense_total: exp,
        balance: (pm.initial_balance ?? 0) + inc - exp,
        is_credit_card: pm.is_credit_card ?? false,
      }
    })

  // Credit card totals — computed from ALL non-archived CC accounts (regardless of show_in_balance)
  const allCCModes = (allPaymentModes ?? []).filter((pm) => pm.is_credit_card && !pm.archived)
  let ccTotalBalance = 0
  let ccCharged = 0
  for (const pm of allCCModes) {
    const inc = (allIncomes ?? []).filter((i) => i.payment_mode_id === pm.id).reduce((s, i) => s + Number(i.amount), 0)
    const exp = (allExpenses ?? []).filter((e) => e.payment_mode_id === pm.id).reduce((s, e) => s + Number(e.amount), 0)
    ccTotalBalance += (pm.initial_balance ?? 0) + inc - exp
    ccCharged += exp
  }

  // Debit/wallet totals — computed from ALL non-archived non-CC accounts
  const allDebitModes = (allPaymentModes ?? []).filter((pm) => !pm.is_credit_card && !pm.archived)
  let debitTotalBalance = 0
  for (const pm of allDebitModes) {
    const inc = (allIncomes ?? []).filter((i) => i.payment_mode_id === pm.id).reduce((s, i) => s + Number(i.amount), 0)
    const exp = (allExpenses ?? []).filter((e) => e.payment_mode_id === pm.id).reduce((s, e) => s + Number(e.amount), 0)
    debitTotalBalance += (pm.initial_balance ?? 0) + inc - exp
  }

  const creditCardTotal: CreditCardTotal = {
    totalBalance: ccTotalBalance,
    totalCharged: ccCharged,
    cardCount: allCCModes.length,
    debitTotal: debitTotalBalance,
    debitCount: allDebitModes.length,
  }

  return {
    summary,
    categorySpend,
    dailySpend,
    balances,
    creditCardTotal,
    recent6: expenseList.slice(0, 6),
    dailyLimit: weeklyLimit / 7,
  }
}
