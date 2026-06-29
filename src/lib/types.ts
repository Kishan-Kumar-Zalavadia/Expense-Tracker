export type ExpenseType = 'Need' | 'Want' | 'Saving'
export type Theme = 'light' | 'dark'

export interface Subcategory {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  archived: boolean
  is_default: boolean
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: ExpenseType
  color: string
  sort_order: number
  archived: boolean
  is_system: boolean
  show_in_cards: boolean
  is_default: boolean
  exclude_from_totals: boolean
}

export interface PaymentMode {
  id: string
  user_id: string
  name: string
  initial_balance: number
  archived: boolean
  show_in_balance: boolean
  is_credit_card: boolean
  sort_order: number
  is_default: boolean
}

export interface Expense {
  id: string
  user_id: string
  date: string            // ISO date: YYYY-MM-DD
  description: string
  category_id: string
  amount: number
  payment_mode_id: string
  type: ExpenseType | null
  notes: string | null
  recurring_item_id: string | null
  subcategory_id: string | null
  created_at: string
  updated_at: string
  // joined
  category?: Category
  payment_mode?: PaymentMode
  subcategory?: Subcategory
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
  category_id: string | null
  budget_period_id: string | null
  auto_generated: boolean
  notes: string | null
  recurring_item_id: string | null
  subcategory_id: string | null
  created_at: string
  updated_at: string
  // joined
  payment_mode?: PaymentMode
  budget_period?: BudgetPeriod
  category?: Category
  subcategory?: Subcategory
}

// ─── Category spend summary ──────────────────────────────────────

export interface CategorySummaryItem {
  category_id: string
  category_name: string
  color: string
  type: ExpenseType
  total: number
  show_in_cards: boolean
}

export interface PaymentModeBalance {
  id: string
  name: string
  initial_balance: number
  income_total: number
  expense_total: number
  balance: number           // initial_balance + income_total - expense_total
  is_credit_card: boolean
}

// ─── Recurring Items ─────────────────────────────────────────────

export type RecurringFrequency = 'monthly' | 'weekly' | 'biweekly'

export interface RecurringItem {
  id: string
  user_id: string
  type: 'income' | 'expense'
  description: string | null
  amount: number
  payment_mode_id: string | null
  category_id: string | null
  expense_type: ExpenseType | null
  frequency: RecurringFrequency
  day_of_month: number | null    // for monthly
  day_of_week: number | null     // for weekly/biweekly (0=Mon…6=Sun)
  active: boolean
  notes: string | null
  start_date: string | null      // YYYY-MM-DD, when recurring begins
  end_date: string | null        // YYYY-MM-DD, null = never ends
  last_generated_date: string | null
  created_at: string
  updated_at: string
  // joined
  payment_mode?: PaymentMode
  category?: Category
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
  enable_subcategories: boolean
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
