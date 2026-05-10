export type ExpenseType = 'Need' | 'Want' | 'Saving'
export type Theme = 'light' | 'dark'

export interface Category {
  id: string
  user_id: string
  name: string
  type: ExpenseType
  color: string
  sort_order: number
  archived: boolean
}

export interface PaymentMode {
  id: string
  user_id: string
  name: string
  initial_balance: number
  archived: boolean
}

export interface Expense {
  id: string
  user_id: string
  date: string            // ISO date: YYYY-MM-DD
  description: string
  category_id: string
  amount: number
  payment_mode_id: string
  type: ExpenseType
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  category?: Category
  payment_mode?: PaymentMode
}

// ─── Budget Periods (replaces SalaryConfig) ──────────────────────

export interface BudgetPeriod {
  id: string
  user_id: string
  start_month: string          // YYYY-MM
  end_month: string | null     // YYYY-MM, or null = "present"/ongoing
  monthly_amount: number
  needs_pct: number
  wants_pct: number
  savings_pct: number
  track_income: boolean
  income_payment_mode_id: string | null
  income_day_1: number | null
  income_day_2: number | null
  created_at: string
  // joined
  income_payment_mode?: PaymentMode
}

// ─── Income ───────────────────────────────────────────────────────

export interface Income {
  id: string
  user_id: string
  date: string              // ISO date: YYYY-MM-DD
  description: string
  amount: number
  payment_mode_id: string
  budget_period_id: string | null
  auto_generated: boolean
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  payment_mode?: PaymentMode
  budget_period?: BudgetPeriod
}

export interface PaymentModeBalance {
  id: string
  name: string
  initial_balance: number
  income_total: number
  expense_total: number
  balance: number           // initial_balance + income_total - expense_total
}

// ─── Legacy (kept for reference, no longer written to) ────────────

export interface SalaryConfig {
  user_id: string
  year: number
  salary: number
  needs_pct: number
  wants_pct: number
  savings_pct: number
}

export interface UserSettings {
  user_id: string
  weekly_limit: number
  currency: string
  theme: Theme
}

// ─── Aggregate / derived types ───────────────────────────────────

export interface MonthSummary {
  total_spent: number
  need_spent: number
  want_spent: number
  save_spent: number
  need_budget: number
  want_budget: number
  save_budget: number
  monthly_budget: number
  income_total: number
}

export interface CategorySpend {
  category_id: string
  category_name: string
  color: string
  total: number
}

export interface DailySpend {
  date: string
  need: number
  want: number
  total: number
}

export interface WeeklySpend {
  week_start: string  // YYYY-MM-DD of Monday
  week_end: string
  week_number: number
  total: number
}

export interface YearlyDay {
  date: string
  total: number
}
