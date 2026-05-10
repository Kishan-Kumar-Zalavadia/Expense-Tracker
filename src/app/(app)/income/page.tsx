import { createClient } from '@/lib/supabase/server'
import { IncomePageClient } from '@/components/income/income-page-client'
import type { PaymentModeBalance } from '@/lib/types'

export default async function IncomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: incomes },
    { data: paymentModes },
    { data: expenses },
    { data: budgetPeriods },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from('incomes')
      .select('*, payment_mode:payment_modes(id, name), budget_period:budget_periods(id, start_month, end_month)')
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('payment_modes')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false),
    supabase
      .from('expenses')
      .select('amount, payment_mode_id')
      .eq('user_id', user.id),
    supabase
      .from('budget_periods')
      .select('*')
      .eq('user_id', user.id)
      .order('start_month', { ascending: false }),
    supabase
      .from('user_settings')
      .select('currency')
      .eq('user_id', user.id)
      .single(),
  ])

  const currency = settings?.currency ?? '₹'
  const incomeList = incomes ?? []
  const modeList = paymentModes ?? []
  const expenseList = expenses ?? []

  // Compute balance per payment mode
  const balances: PaymentModeBalance[] = modeList.map((pm) => {
    const incomeTotal = incomeList
      .filter((i) => i.payment_mode_id === pm.id)
      .reduce((s, i) => s + Number(i.amount), 0)
    const expenseTotal = expenseList
      .filter((e) => e.payment_mode_id === pm.id)
      .reduce((s, e) => s + Number(e.amount), 0)
    const balance = (pm.initial_balance ?? 0) + incomeTotal - expenseTotal
    return {
      id: pm.id,
      name: pm.name,
      initial_balance: pm.initial_balance ?? 0,
      income_total: incomeTotal,
      expense_total: expenseTotal,
      balance,
    }
  })

  return (
    <IncomePageClient
      incomes={incomeList}
      balances={balances}
      paymentModes={modeList}
      budgetPeriods={budgetPeriods ?? []}
      currency={currency}
    />
  )
}
