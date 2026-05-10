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

// ─── Aggregate / derived types ───────────────────────────────────────

export interface MonthSummary {
  total_spent: number
  need_spent: number
  want_spent: number
  save_spent: number
  need_budget: number
  want_budget: number
  save_budget: number
  monthly_budget: number
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
