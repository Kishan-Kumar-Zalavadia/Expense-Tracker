'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_EMAIL } from '@/lib/constants'

// ─── Admin Data Types ─────────────────────────────────────────────────────────
export interface UserStats {
  id: string
  email: string
  joined_at: string
  expense_count: number
  income_count: number
  category_count: number
  subcategory_count: number
  payment_mode_count: number
  budget_count: number
  recurring_count: number
  total_spend: number
  last_activity: string | null
}

export interface AdminData {
  users: UserStats[]
  totals: {
    user_count: number
    expense_count: number
    income_count: number
    total_entries: number
    total_spend: number
    active_this_month: number
    new_this_month: number
    never_active: number
    with_budgets: number
    with_recurring: number
  }
}

export type FeedbackType   = 'feature' | 'bug' | 'general'
export type FeedbackStatus = 'new' | 'in_progress' | 'done'

export interface FeedbackItem {
  id: string
  user_id: string | null
  user_email: string | null
  type: FeedbackType
  title: string
  description: string | null
  status: FeedbackStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

// ─── Submit feedback (any authenticated user) ─────────────────────────────────
export async function submitFeedback(
  type: FeedbackType,
  title: string,
  description: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('feedback').insert({
    user_id:     user.id,
    user_email:  user.email,
    type,
    title:       title.trim(),
    description: description.trim() || null,
  })

  return error ? { error: error.message } : {}
}

// ─── Fetch current user's own feedback ───────────────────────────────────────
export async function fetchMyFeedback(): Promise<FeedbackItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as FeedbackItem[]
}

// ─── Fetch all feedback (admin only) ─────────────────────────────────────────
export async function fetchAllFeedback(): Promise<FeedbackItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as FeedbackItem[]
}

// ─── Update status + optional note (admin only) ───────────────────────────────
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  adminNote?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('feedback')
    .update({
      status,
      admin_note: adminNote !== undefined ? adminNote : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  return error ? { error: error.message } : {}
}

// ─── User count (admin only) ──────────────────────────────────────────────────
export async function fetchUserCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return 0

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1 })
  return ('total' in data && typeof data.total === 'number') ? data.total : 0
}

// ─── Fetch admin data (admin only) ───────────────────────────────────────────
export async function fetchAdminData(): Promise<AdminData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null

  const admin = createAdminClient()

  // List all auth users
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = usersData?.users ?? []

  // Fetch all relevant table data in parallel
  const [
    expensesRes,
    incomesRes,
    categoriesRes,
    subcategoriesRes,
    paymentModesRes,
    budgetPeriodsRes,
    recurringRes,
  ] = await Promise.all([
    admin.from('expenses').select('user_id, amount, date'),
    admin.from('incomes').select('user_id, date'),
    admin.from('categories').select('user_id').eq('is_system', false),
    admin.from('subcategories').select('user_id'),
    admin.from('payment_modes').select('user_id').eq('archived', false),
    admin.from('budget_periods').select('user_id'),
    admin.from('recurring_items').select('user_id'),
  ])

  const expenses       = (expensesRes.data ?? []) as { user_id: string; amount: number; date: string }[]
  const incomes        = (incomesRes.data ?? []) as { user_id: string; date: string }[]
  const categories     = (categoriesRes.data ?? []) as { user_id: string }[]
  const subcategories  = (subcategoriesRes.data ?? []) as { user_id: string }[]
  const paymentModes   = (paymentModesRes.data ?? []) as { user_id: string }[]
  const budgetPeriods  = (budgetPeriodsRes.data ?? []) as { user_id: string }[]
  const recurringItems = (recurringRes.data ?? []) as { user_id: string }[]

  // Build per-user lookup maps
  const expenseCountMap  = new Map<string, number>()
  const totalSpendMap    = new Map<string, number>()
  const lastExpenseDateMap = new Map<string, string>()

  for (const e of expenses) {
    expenseCountMap.set(e.user_id, (expenseCountMap.get(e.user_id) ?? 0) + 1)
    totalSpendMap.set(e.user_id, (totalSpendMap.get(e.user_id) ?? 0) + (e.amount ?? 0))
    const prev = lastExpenseDateMap.get(e.user_id)
    if (!prev || e.date > prev) lastExpenseDateMap.set(e.user_id, e.date)
  }

  const incomeCountMap = new Map<string, number>()
  const lastIncomeDateMap = new Map<string, string>()

  for (const i of incomes) {
    incomeCountMap.set(i.user_id, (incomeCountMap.get(i.user_id) ?? 0) + 1)
    const prev = lastIncomeDateMap.get(i.user_id)
    if (!prev || i.date > prev) lastIncomeDateMap.set(i.user_id, i.date)
  }

  const categoryCountMap    = new Map<string, number>()
  for (const c of categories) categoryCountMap.set(c.user_id, (categoryCountMap.get(c.user_id) ?? 0) + 1)

  const subcategoryCountMap = new Map<string, number>()
  for (const s of subcategories) subcategoryCountMap.set(s.user_id, (subcategoryCountMap.get(s.user_id) ?? 0) + 1)

  const paymentModeCountMap = new Map<string, number>()
  for (const p of paymentModes) paymentModeCountMap.set(p.user_id, (paymentModeCountMap.get(p.user_id) ?? 0) + 1)

  const budgetCountMap = new Map<string, number>()
  for (const b of budgetPeriods) budgetCountMap.set(b.user_id, (budgetCountMap.get(b.user_id) ?? 0) + 1)

  const recurringCountMap = new Map<string, number>()
  for (const r of recurringItems) recurringCountMap.set(r.user_id, (recurringCountMap.get(r.user_id) ?? 0) + 1)

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  // Build per-user stats
  const users: UserStats[] = authUsers.map((u) => {
    const uid = u.id
    const lastExpDate = lastExpenseDateMap.get(uid) ?? null
    const lastIncDate = lastIncomeDateMap.get(uid) ?? null
    let last_activity: string | null = null
    if (lastExpDate && lastIncDate) last_activity = lastExpDate > lastIncDate ? lastExpDate : lastIncDate
    else last_activity = lastExpDate ?? lastIncDate

    return {
      id: uid,
      email: u.email ?? '',
      joined_at: u.created_at,
      expense_count:      expenseCountMap.get(uid)    ?? 0,
      income_count:       incomeCountMap.get(uid)     ?? 0,
      category_count:     categoryCountMap.get(uid)   ?? 0,
      subcategory_count:  subcategoryCountMap.get(uid) ?? 0,
      payment_mode_count: paymentModeCountMap.get(uid) ?? 0,
      budget_count:       budgetCountMap.get(uid)     ?? 0,
      recurring_count:    recurringCountMap.get(uid)  ?? 0,
      total_spend:        totalSpendMap.get(uid)      ?? 0,
      last_activity,
    }
  })

  // Compute totals
  const totalExpenseCount = expenses.length
  const totalIncomeCount  = incomes.length
  const totalSpend        = expenses.reduce((s, e) => s + (e.amount ?? 0), 0)

  const activeThisMonth = users.filter((u) =>
    (u.last_activity !== null && u.last_activity >= thisMonthStart)
  ).length

  const newThisMonth = users.filter((u) =>
    u.joined_at.slice(0, 10) >= thisMonthStart
  ).length

  const neverActive   = users.filter((u) => u.expense_count === 0 && u.income_count === 0).length
  const withBudgets   = users.filter((u) => u.budget_count > 0).length
  const withRecurring = users.filter((u) => u.recurring_count > 0).length

  return {
    users,
    totals: {
      user_count:       authUsers.length,
      expense_count:    totalExpenseCount,
      income_count:     totalIncomeCount,
      total_entries:    totalExpenseCount + totalIncomeCount,
      total_spend:      totalSpend,
      active_this_month: activeThisMonth,
      new_this_month:   newThisMonth,
      never_active:     neverActive,
      with_budgets:     withBudgets,
      with_recurring:   withRecurring,
    },
  }
}

// ─── Delete feedback (admin only) ─────────────────────────────────────────────
export async function deleteFeedback(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('feedback').delete().eq('id', id)
  return error ? { error: error.message } : {}
}
