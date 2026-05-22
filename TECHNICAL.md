# Ledger — Technical Documentation

A comprehensive reference for the architecture, data model, features, and implementation details of the Ledger personal finance application.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [Authentication](#4-authentication)
5. [Navigation & Shell Architecture](#5-navigation--shell-architecture)
6. [Features — Detailed Reference](#6-features--detailed-reference)
7. [Server Actions](#7-server-actions)
8. [Cross-Section Refresh System](#8-cross-section-refresh-system)
9. [Theme System](#9-theme-system)
10. [Validation](#10-validation)
11. [Admin System](#11-admin-system)
12. [PWA & Icons](#12-pwa--icons)
13. [Data Export](#13-data-export)
14. [File Structure](#14-file-structure)

---

## 1. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| ORM | Supabase JS client (no ORM) |
| Forms | React Hook Form 7 + Zod 4 |
| Charts | Recharts 3 |
| UI Primitives | Radix UI + Base UI |
| Date Utilities | date-fns 4 |
| Notifications | Sonner 2 |
| Export | xlsx 0.18 |
| Deployment | Vercel |

---

## 2. Architecture Overview

### Routing

The app uses Next.js App Router with two route groups:

- `(auth)` — unauthenticated pages: `/login`, `/signup`
- `(app)` — authenticated pages: `/dashboard`, `/expenses`, `/income`, `/settings`, `/analysis/weekly`, `/analysis/yearly`

All routes under `(app)` are protected at two levels:
1. **Middleware** (`src/middleware.ts`) — redirects unauthenticated requests to `/login` before the page renders
2. **Layout** (`src/app/(app)/layout.tsx`) — server-side Supabase auth check with `redirect('/login')` as a fallback

Routes under `(app)` other than `/dashboard` are redirect stubs — they immediately redirect to `/dashboard`. All navigation is handled client-side within a single shell.

### Single-Page Shell Pattern

The entire authenticated experience lives inside `/dashboard`. Navigation between sections (Expenses, Income, Weekly, Yearly, Settings, Feedback) does not change the URL. Instead, a React Context (`AppShellProvider`) tracks the active tab, and `DashboardClient` renders all sections simultaneously using a keep-mounted pattern:

```tsx
// Sections are mounted once and toggled with display:none
{visitedTabs.has('expenses') && (
  <div style={{ display: activeTab === 'expenses' ? 'block' : 'none' }}>
    <ExpensesSection />
  </div>
)}
```

**Benefits of this pattern:**
- No full page re-renders when switching tabs — instant navigation
- Section state is preserved (scroll position, filters, expanded rows) when the user switches away and returns
- Each section loads its data only once, on first visit (`visitedTabs` set)
- No loading spinners on tab switch after first load

### Data Loading

Each section manages its own data loading via `useEffect` on mount. Server Actions (Next.js `'use server'` functions) are called directly from client components — no API routes are needed. This gives type-safe RPC-style data fetching with automatic serialization.

---

## 3. Database Schema

### Tables

#### `user_settings`
Stores per-user application preferences.

| Column | Type | Notes |
|---|---|---|
| user_id | uuid PK | References auth.users |
| weekly_limit | numeric(12,2) | Default 10,000 |
| currency | text | Default '₹' |
| theme | text | 'light' or 'dark' |

#### `categories`
Expense classification categories, user-owned.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| name | text | |
| type | text | 'Need', 'Want', or 'Saving' |
| color | text | Hex color string |
| sort_order | int | Display ordering |
| archived | boolean | Soft delete |
| is_system | boolean | System categories cannot be edited |

Partial unique index: `(user_id, lower(name))` where `archived = false` — enforces unique active category names per user.

#### `payment_modes`
Bank accounts, cards, wallets — any financial account.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| name | text | |
| initial_balance | numeric(12,2) | Starting balance for balance calculation |
| archived | boolean | Soft delete |
| show_in_balance | boolean | Whether to include in balance display |
| is_credit_card | boolean | Credit cards excluded from net balance |

#### `expenses`
Every expense transaction.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| date | date | |
| description | text | Optional |
| category_id | uuid | References categories, nullable (credit card payments) |
| type | text | 'Need', 'Want', or 'Saving' |
| amount | numeric(12,2) | |
| payment_mode_id | uuid | References payment_modes |
| notes | text | Optional |
| recurring_item_id | uuid | Links to recurring_items if auto-generated |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `(user_id, date)`, `recurring_item_id`

#### `incomes`
Every income transaction.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| date | date | |
| description | text | Optional |
| amount | numeric(12,2) | |
| payment_mode_id | uuid | References payment_modes |
| budget_period_id | uuid | Optional link to budget period |
| auto_generated | boolean | True if system-created |
| notes | text | Optional |
| recurring_item_id | uuid | Links to recurring_items if auto-generated |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### `budget_periods`
Time-bound income and budget configurations. Replaces the simpler `salary_config` table.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| start_month | text | YYYY-MM format |
| end_month | text | YYYY-MM format, null = ongoing |
| monthly_amount | numeric(12,2) | Total monthly income |
| needs_pct | numeric(5,2) | Percentage for Needs (e.g. 50) |
| wants_pct | numeric(5,2) | Percentage for Wants (e.g. 30) |
| savings_pct | numeric(5,2) | Percentage for Savings (e.g. 20) |
| track_income | boolean | Whether income tracking is enabled |
| income_payment_mode_id | uuid | Account income is received in |
| income_day_1 | int | First income day of month |
| income_day_2 | int | Second income day of month (optional) |
| created_at | timestamptz | |

Overlap is prevented at the application layer using `budgetPeriodsOverlap()` before inserting a new period.

#### `recurring_items`
Rules for automatically generating recurring income or expense entries.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| type | text | 'income' or 'expense' |
| description | text | Optional |
| amount | numeric(12,2) | |
| payment_mode_id | uuid | References payment_modes |
| category_id | uuid | References categories (expense only) |
| expense_type | text | 'Need', 'Want', or 'Saving' (expense only) |
| frequency | text | 'monthly', 'weekly', or 'biweekly' |
| day_of_month | int | 1–28, used when frequency = 'monthly' |
| day_of_week | int | 0–6 (Mon–Sun), used for weekly/biweekly |
| active | boolean | Pause/resume flag |
| start_date | date | When the recurring begins |
| end_date | date | When the recurring ends, null = never |
| last_generated_date | date | Tracks last generated entry for next-run calculation |
| notes | text | Optional |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `(user_id)`

#### `feedback`
User-submitted feature requests, bug reports, and general feedback.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | References auth.users, nullable (on delete set null) |
| user_email | text | Stored at submission time |
| type | text | 'feature', 'bug', or 'general' |
| title | text | Max 120 chars |
| description | text | Max 1,000 chars, optional |
| status | text | 'new', 'in_progress', or 'done' |
| admin_note | text | Internal admin annotation |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `created_at`, `status`, `type`

### Row Level Security

All tables have RLS enabled. Each table has four policies:

```sql
-- Pattern applied to every table
USING (auth.uid() = user_id)          -- SELECT, UPDATE, DELETE
WITH CHECK (auth.uid() = user_id)     -- INSERT
```

**Exceptions:**
- `feedback` SELECT policy: users can only read their own rows. Admin reads all rows via service role key, bypassing RLS entirely.
- `feedback` INSERT: users can only insert rows where `user_id = auth.uid()`.

### New User Seed Data

A PostgreSQL trigger function `handle_new_user_defaults()` runs automatically on every new user signup (`AFTER INSERT ON auth.users`). It seeds:

**Default categories (5):**
- Life Infrastructure → Need
- Performance and Growth → Need
- Relationships and Generosity → Want
- Lifestyle and Enjoyment → Want
- Future Me → Saving

**Default payment modes (4):** Cash, Bank Account, Credit Card (is_credit_card=true), UPI

**Default settings:** weekly_limit=10,000, currency='₹', theme='light'

---

## 4. Authentication

### Flows

**Email/Password:**
- Sign up with email + password (min 8 chars) → Supabase sends confirmation email
- Confirmation link contains `?token_hash=&type=signup` query params
- Auth callback (`/auth/callback`) handles both flows:
  - Email confirmation: `supabase.auth.verifyOtp({ token_hash, type })`
  - OAuth: `supabase.auth.exchangeCodeForSession(code)`

**Google OAuth:**
- Supabase handles the OAuth redirect and token exchange
- Callback URL: `/auth/callback?code=...`

### Session Management

Supabase SSR package manages cookies automatically. The middleware refreshes the session on every request. Server components call `createClient()` from `src/lib/supabase/server.ts` which reads the session from cookies.

### Supabase Clients

Three client instances serve different contexts:

| Client | File | Usage |
|---|---|---|
| Browser | `src/lib/supabase/client.ts` | Client components, form submissions |
| Server | `src/lib/supabase/server.ts` | Server components, server actions |
| Admin | `src/lib/supabase/admin.ts` | Admin operations only, bypasses RLS |

The admin client uses `SUPABASE_SERVICE_ROLE_KEY` and is never imported in client-side code.

---

## 5. Navigation & Shell Architecture

### AppShellContext

Defined in `src/hooks/use-app-shell.tsx`. Provides global shell state:

```typescript
type AppTab =
  | 'dashboard' | 'expenses' | 'income'
  | 'weekly'    | 'yearly'   | 'settings'
  | 'feedback'  | 'admin'

interface AppShellContextValue {
  activeTab:      AppTab
  setActiveTab:   (tab: AppTab) => void
  visitedTabs:    Set<AppTab>       // lazy-load guard
  isAdmin:        boolean
  refreshKey:     number            // increments on any data mutation
  refreshSource:  string | null     // identifies who triggered refresh
  triggerRefresh: (source: string) => void
}
```

`isAdmin` is computed server-side in `src/app/(app)/layout.tsx` by comparing the authenticated user's email to the hardcoded `ADMIN_EMAIL` constant, then passed down as a prop to `AppShellProvider`.

### Desktop Navigation — Sidebar

Fixed left sidebar (256px wide, `md:` breakpoint and above). Contains:
- Logo wordmark
- Nav items for all tabs, with active indicator bar on left edge
- Admin nav item (conditionally rendered if `isAdmin`)
- Footer section: Export data, Light/Dark mode toggle, Sign out

### Mobile Navigation — Bottom Bar

Fixed bottom bar with 5 items: Dashboard, Expenses, Income, Settings, More.

**More sheet** (slides up from bottom):
- Weekly
- Yearly
- Feedback
- Admin (conditionally rendered if `isAdmin`)
- --- separator ---
- Export data
- Light/Dark mode toggle
- Sign out

The sheet uses a backdrop + outside-click-to-close pattern. It is rendered above the bottom nav bar with `bottom: calc(env(safe-area-inset-bottom) + 56px)`.

---

## 6. Features — Detailed Reference

### 6.1 Dashboard

**File:** `src/components/dashboard/dashboard-client.tsx` → `DashboardSection`

The dashboard is the first thing users see. It shows financial health for a selected month. Users can navigate months with the `MonthPicker` component.

**Data:** Fetched via `getDashboardData(year, month)` server action (`src/app/(app)/dashboard/actions.ts`). Returns:

```typescript
interface DashboardMonthData {
  summary:      MonthSummary       // totals and budgets for the month
  categorySpend: CategorySpend[]   // per-category breakdown
  dailySpend:   DailySpend[]       // per-day spend for the month
  recent6:      Expense[]          // last 6 expenses
  balances:     PaymentModeBalance[] // live account balances
  dailyLimit:   number             // weekly_limit / 7
}
```

**Components on the dashboard:**

| Component | Description |
|---|---|
| `KpiCards` | Total spent, income, net savings — three large metric cards |
| `BudgetCards` | Progress bars for Need/Want/Saving vs their budget targets |
| `CategoryPie` | Recharts PieChart of spend by category |
| `AccountBalances` | Per-account live balance with credit card treatment |
| `DailyBar` | Recharts BarChart of daily Need + Want spend vs daily limit |
| `RecentActivity` | Last 6 expenses with category, amount, type color |

**Financial Health Score** (`computeScore()` in `src/lib/utils.ts`):

```typescript
const overshoot =
  (needBudget > 0 ? Math.max(0, (needActual - needBudget) / needBudget) : 0) +
  (wantBudget > 0 ? Math.max(0, (wantActual - wantBudget) / wantBudget) : 0) +
  (saveBudget > 0 ? Math.max(0, (saveActual - saveBudget) / saveBudget) : 0)
return Math.max(0, Math.min(10, 10 - overshoot * 5))
```

Score ≥ 8 → green, ≥ 6 → amber, < 6 → red.

**Add Expense / Add Income buttons** are available on the dashboard header. On mobile they appear as a full-width grid row below the header. Saving either immediately calls `triggerRefresh('dashboard')` to update all other sections.

### 6.2 Expense Tracking

**Files:** `src/components/expenses/expense-modal.tsx`, `expense-list-client.tsx`

**Expense Modal** (Dialog, mobile bottom-sheet):
- Date picker (custom themed calendar)
- Description (optional)
- Category (select — active categories only)
- Type — auto-suggested from the selected category's type, but user-editable
- Amount (with currency prefix)
- Payment mode (select — active modes only)
- Notes (optional)

Required fields marked with red `*`: Date, Category, Type, Amount, Payment mode.

Form validation via Zod `expenseSchema`. Submit calls Supabase client directly (not a server action) for optimistic-feeling UX.

**Expense List:**
- Paginated (20 per page)
- Filters: search, category, type (Need/Want/Saving), payment mode, sort (date asc/desc, amount asc/desc)
- Edit inline via same modal (pre-populated)
- Delete with confirmation
- Each row shows: date, description, category badge, type color, amount, payment mode

### 6.3 Income Tracking

**Files:** `src/components/income/income-modal.tsx`, `income-list-client.tsx`

**Income Modal:**
- Date picker
- Description (optional)
- Amount
- Payment mode (account receiving income)
- Budget period link (optional — links to a budget period for context)
- Notes (optional)

Required fields: Date, Amount, Payment mode.

**Income List:**
- Paginated (20 per page)
- Filters: search, payment mode, sort
- Edit and delete

### 6.4 Budget Periods

**File:** `src/components/settings/budget-periods-panel.tsx`

Budget periods define the income and split rules for a date range. A budget period has:
- Start month and optional end month (null = ongoing/current)
- Monthly income amount
- Percentage split: Needs % + Wants % + Savings % = 100
- Optional income tracking (which account, which days of month)

**Custom splits:** The percentages are fully user-defined. The 50/30/20 defaults are just starting values. A user might set 60/20/20 for a high-rent city, or 40/20/40 for aggressive saving. Previous budget periods retain their own percentages — editing a period does not retroactively change historical month calculations.

The dashboard resolves which budget period applies to the viewed month using `findActiveBudget()`:

```typescript
return periods.find((p) => {
  const inStart = p.start_month <= yearMonth
  const inEnd = p.end_month === null || p.end_month >= yearMonth
  return inStart && inEnd
}) ?? null
```

Overlap validation prevents two budget periods covering the same month.

### 6.5 Categories

**File:** `src/components/settings/categories-panel.tsx`

- Create, rename, recolour, and archive categories
- Each category is assigned a type (Need, Want, or Saving) — this auto-suggests the expense type when that category is selected in the expense form
- System categories (`is_system = true`) are protected from deletion
- Archived categories are hidden from expense forms but preserved in historical data
- Categories with existing expenses cannot be deleted (only archived)
- Colour picker uses hex input

### 6.6 Payment Modes

**File:** `src/components/settings/payment-modes-panel.tsx`

- Create, rename, and archive accounts/cards/wallets
- Set an initial balance for each account
- Toggle `show_in_balance` — exclude certain accounts (e.g. a joint account) from the balance display
- Mark as `is_credit_card` — credit card accounts are shown separately; their balance is not added to net worth
- Account balance = `initial_balance + sum(incomes where payment_mode_id) - sum(expenses where payment_mode_id)`
- Payment modes with transactions cannot be deleted — only archived

### 6.7 Recurring Payments

**File:** `src/components/settings/recurring-panel.tsx`

The recurring system automatically generates expense or income entries on a schedule without any user action after setup.

**Configuration per recurring item:**
- Type: Income or Expense
- Description, Amount, Payment mode
- Category + expense type (expense only)
- Frequency: Monthly / Weekly / Every 2 weeks
- Day of month (1–28) for monthly; Day of week (Mon–Sun) for weekly/biweekly
- Start date — when the schedule begins
- End date — when it stops (leave blank = never ends)
- Notes

**Auto-backfill on save:** When a recurring item is saved (new or edited), the app immediately computes all occurrences from `start_date` up to today (capped at `end_date` if set) and inserts them in a single batch. The `last_generated_date` is updated to the last generated date.

**Generation algorithm (monthly example):**

```typescript
let cur = new Date(startDate.getFullYear(), startDate.getMonth(), day_of_month)
if (isBefore(cur, startDate)) cur = addMonths(cur, 1)
while (!isAfter(cur, limit)) {
  dates.push(format(cur, 'yyyy-MM-dd'))
  cur = addMonths(cur, 1)
}
```

Weekly and biweekly use the same pattern with `addWeeks(cur, 1/2)`.

**Tracking:** Every generated expense/income row stores `recurring_item_id` pointing back to the rule. This enables "delete all instances" functionality.

**Edit behaviour:** Editing a recurring item (if it has previously generated entries) shows a confirmation dialog. On confirm:
1. All existing entries in both `expenses` and `incomes` with matching `recurring_item_id` are deleted (handles type changes, e.g. expense → income)
2. `last_generated_date` is reset to null
3. The rule is updated
4. All entries are regenerated from scratch with the new settings

**Delete options:**
- Delete all instances — removes the rule and all generated expenses/incomes
- Stop recurring, keep history — removes the rule only; past entries remain

**Pause/Resume:** `active` flag — paused items still exist but don't generate new entries.

**Manual generate:** A refresh button on each item card regenerates up to today on demand (useful if the page hasn't been visited in a while).

### 6.8 Weekly Analysis

**File:** `src/components/analysis/weekly-client.tsx`

Shows all 52/53 weeks of a selected year. Each week displays:
- Week number and date range
- Total spend (Need + Want only — Saving is excluded from spend)
- Progress bar vs weekly limit from settings
- Colour-coded: green = under limit, amber = approaching, red = over

Data fetched via `fetchWeekly(year)` server action which groups expenses by ISO week.

### 6.9 Yearly Heatmap

**File:** `src/components/analysis/yearly-client.tsx`

A 52-column GitHub contribution-style calendar grid. Each cell is one day; darker fill = higher spend. Hover reveals the date and exact spend. Saturdays and Sundays are visually distinguished. Month labels track along the top of the grid.

Data fetched via `fetchYearly(year)` which returns a `YearlyDay[]` array (one entry per day with spend total).

### 6.10 Feedback System

**Files:** `src/components/feedback/feedback-panel.tsx`, `src/components/feedback/admin-panel.tsx`

**User-facing (Feedback tab):**

Two internal sub-tabs:

*Submit feedback:*
- Three types: Feature Request (blue), Bug Report (red), General Feedback (amber)
- Type selector cards with icon + description
- Title (required, 120 char limit with live counter)
- Description (optional, 1,000 char limit with live counter)
- Success state with "Submit another" option

*My submissions:*
- Read-only list of the user's own submissions
- Each card shows type, title, description preview, submission time
- Status badge: Submitted → In Progress → Done

**Admin panel (Admin tab — admin email only):**

- Stats chips showing count of items at each status
- Filter by type (All / Features / Bugs / General)
- Filter by status (All / New / In Progress / Done)
- Per-card actions:
  - Click status badge to cycle: New → In Progress → Done (optimistic update with rollback on error)
  - Expandable admin note textarea with save button
  - Delete with two-step confirmation

Admin reads all feedback via the service role client (bypasses RLS). Regular users can only see their own submissions via the standard client (RLS enforced).

---

## 7. Server Actions

All server actions are in `src/app/(app)/dashboard/actions/`. They are Next.js `'use server'` functions called directly from client components.

| File | Functions | Description |
|---|---|---|
| `actions.ts` | `getDashboardData(year, month)` | Full dashboard data for one month |
| `actions/expenses.ts` | `fetchExpenses(filters, page)` | Paginated, filtered expense list |
| `actions/income.ts` | `fetchIncome(filters, page)` | Paginated, filtered income list |
| `actions/weekly.ts` | `fetchWeekly(year)` | Weekly spend grouped by ISO week |
| `actions/yearly.ts` | `fetchYearly(year)` | Daily spend for heatmap |
| `actions/settings-data.ts` | `fetchSettingsData()` | All settings data in one call |
| `actions/feedback.ts` | `submitFeedback()`, `fetchMyFeedback()`, `fetchAllFeedback()`, `updateFeedbackStatus()`, `deleteFeedback()` | Feedback CRUD |

All actions call `createClient()` (server client) and verify `auth.getUser()` before any database operation. Admin actions additionally verify `user.email === ADMIN_EMAIL`.

---

## 8. Cross-Section Refresh System

When any section mutates data, all other sections need to reflect the change without a full page reload.

**Mechanism:** `triggerRefresh(source: string)` in `AppShellContext` increments `refreshKey`. A `useSectionRefresh` hook in `dashboard-client.tsx` watches `refreshKey` and calls a reload callback — but only if `refreshSource !== mySource` (a section doesn't reload itself).

```typescript
function useSectionRefresh(mySource: string, onRefresh: () => void) {
  const { refreshKey, refreshSource } = useAppShell()
  const cbRef = useRef(onRefresh)
  cbRef.current = onRefresh
  const prevKeyRef = useRef(refreshKey)

  useEffect(() => {
    if (prevKeyRef.current !== refreshKey) {
      prevKeyRef.current = refreshKey
      if (refreshSource !== mySource) cbRef.current()
    }
  }, [refreshKey])
}
```

**Who triggers and who reacts:**

| Trigger source | Sections that reload |
|---|---|
| `'expenses'` (add/edit/delete expense) | Dashboard, Income, Weekly, Yearly |
| `'income'` (add/edit/delete income) | Dashboard, Expenses, Weekly, Yearly |
| `'dashboard'` (add from dashboard header) | Expenses, Income, Weekly, Yearly |
| `'settings'` (recurring/categories/etc. saved) | Dashboard, Expenses, Income, Weekly, Yearly |

Weekly and Yearly sections track their currently displayed year via `useRef` so they reload the same year the user is viewing, not always the current year.

---

## 9. Theme System

**File:** `src/hooks/use-theme.ts`

Theme state is stored in `localStorage` under key `'ledger-theme'`. On mount, the hook reads localStorage and applies `data-theme="dark"` or `data-theme="light"` to `document.documentElement`. The toggle also persists the preference to the `user_settings` table in Supabase (best-effort — errors are silently caught since localStorage is the source of truth).

A `theme-script.tsx` inline script injected into `<head>` reads localStorage before React hydrates, preventing a flash of the wrong theme on page load.

**CSS design tokens** in `src/app/globals.css` define two complete sets of variables under `:root, [data-theme="light"]` and `[data-theme="dark"]`, covering background layers, ink (text) shades, borders, shadows, and semantic accent colours (primary blue, need purple, want red, save green, warn amber, berry pink).

**Custom date picker** (`src/components/ui/date-picker.tsx`) is built with Radix Popover and styled entirely with CSS variables — it automatically follows the active theme with no extra configuration.

---

## 10. Validation

**File:** `src/lib/validations.ts`

All form schemas use Zod 4. Forms use React Hook Form with `zodResolver`. Validation runs on submit; field-level errors display inline below each field in red.

| Schema | Required fields | Notable rules |
|---|---|---|
| `expenseSchema` | date, category_id, type, amount, payment_mode_id | date must match `YYYY-MM-DD` regex |
| `incomeSchema` | date, amount, payment_mode_id | description is optional |
| `loginSchema` | email, password | password min 6 chars |
| `signupSchema` | email, password, confirmPassword | password min 8, confirm must match |
| `categorySchema` | name, type, color | color must be valid hex `#RRGGBB` |
| `paymentModeSchema` | name | — |
| `settingsSchema` | currency | 1–5 chars |

Required fields are marked with a red `*` in form labels via the `required` prop on the `Field` component.

---

## 11. Admin System

**File:** `src/lib/constants.ts`

```typescript
export const ADMIN_EMAIL = 'kishankumar31032001@gmail.com'
```

Admin status is determined at layout level:

```typescript
// src/app/(app)/layout.tsx
const isAdmin = user.email === ADMIN_EMAIL
```

This boolean is passed to `AppShellProvider` and available via `useAppShell()`. The Admin tab in the sidebar and mobile More sheet only renders when `isAdmin === true`. The admin panel itself uses `createAdminClient()` (service role key) so it can read all feedback regardless of which user submitted it.

---

## 12. PWA & Icons

**Files:** `src/app/icon.tsx`, `src/app/apple-icon.tsx`

Icons are generated programmatically using Next.js `ImageResponse` (Satori-based):

- **Favicon** (`icon.tsx`): 32×32px, blue rounded square with three white ascending bars (bar chart motif)
- **Apple touch icon** (`apple-icon.tsx`): 180×180px, full-bleed gradient (`#1E3A8A → #2563EB → #3B82F6`) with same three-bar design at a larger scale

PWA metadata in `src/app/layout.tsx`:
```typescript
themeColor: '#2563EB',
appleWebApp: {
  capable: true,
  statusBarStyle: 'default',
  title: 'Ledger',
}
```

Users can add Ledger to their iPhone/Android home screen from the browser. It launches full-screen with no browser chrome, presenting as a native app.

---

## 13. Data Export

**File:** `src/components/export-dialog.tsx`

Available from the sidebar footer (desktop) and the More sheet (mobile). Users can export their full transaction history as:

- **CSV** — comma-separated, plain text, universally compatible
- **Excel (.xlsx)** — formatted spreadsheet via the `xlsx` library

Export includes expenses and income in one file, with columns for date, type (expense/income), description, category, amount, payment mode, and notes.

---

## 14. File Structure

```
ledger/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    Root layout, metadata, PWA config
│   │   ├── page.tsx                      Root redirect → /dashboard
│   │   ├── icon.tsx                      Favicon (32×32, ImageResponse)
│   │   ├── apple-icon.tsx                Apple touch icon (180×180)
│   │   ├── globals.css                   Design tokens, base styles, utilities
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── auth/
│   │   │   └── callback/route.ts         Auth callback (email confirm + OAuth)
│   │   └── (app)/
│   │       ├── layout.tsx                Auth check, AppShellProvider
│   │       ├── dashboard/
│   │       │   ├── page.tsx              Server component, initial data load
│   │       │   ├── loading.tsx           Skeleton
│   │       │   ├── actions.ts            getDashboardData server action
│   │       │   └── actions/
│   │       │       ├── expenses.ts
│   │       │       ├── income.ts
│   │       │       ├── weekly.ts
│   │       │       ├── yearly.ts
│   │       │       ├── settings-data.ts
│   │       │       └── feedback.ts
│   │       ├── expenses/page.tsx         Redirect → /dashboard
│   │       ├── income/page.tsx           Redirect → /dashboard
│   │       ├── settings/page.tsx         Redirect → /dashboard
│   │       └── analysis/
│   │           ├── weekly/page.tsx       Redirect → /dashboard
│   │           └── yearly/page.tsx       Redirect → /dashboard
│   ├── components/
│   │   ├── add-expense-button.tsx
│   │   ├── export-dialog.tsx
│   │   ├── theme-script.tsx
│   │   ├── dashboard/
│   │   │   ├── dashboard-client.tsx      Shell, section orchestration, refresh system
│   │   │   ├── kpi-cards.tsx
│   │   │   ├── budget-cards.tsx
│   │   │   ├── category-pie.tsx
│   │   │   ├── daily-bar.tsx
│   │   │   ├── account-balances.tsx
│   │   │   ├── recent-activity.tsx
│   │   │   ├── month-picker.tsx
│   │   │   ├── add-income-button.tsx
│   │   │   └── credit-card-payment-modal.tsx
│   │   ├── expenses/
│   │   │   ├── expense-modal.tsx
│   │   │   ├── expense-list-client.tsx
│   │   │   └── expenses-page-client.tsx
│   │   ├── income/
│   │   │   ├── income-modal.tsx
│   │   │   ├── income-list-client.tsx
│   │   │   └── income-page-client.tsx
│   │   ├── analysis/
│   │   │   ├── weekly-client.tsx
│   │   │   └── yearly-client.tsx
│   │   ├── settings/
│   │   │   ├── settings-client.tsx       Settings tab shell
│   │   │   ├── general-panel.tsx         Currency, weekly limit
│   │   │   ├── budget-periods-panel.tsx
│   │   │   ├── categories-panel.tsx
│   │   │   ├── payment-modes-panel.tsx
│   │   │   └── recurring-panel.tsx
│   │   ├── feedback/
│   │   │   ├── feedback-panel.tsx        Submit + My submissions
│   │   │   └── admin-panel.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── dialog.tsx                Portal, mobile bottom-sheet
│   │       ├── date-picker.tsx           Custom themed calendar picker
│   │       ├── badge.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sonner.tsx
│   │       ├── tabs.tsx
│   │       └── textarea.tsx
│   ├── hooks/
│   │   ├── use-app-shell.tsx             Global navigation + refresh context
│   │   └── use-theme.ts                  Light/dark toggle
│   └── lib/
│       ├── constants.ts                  ADMIN_EMAIL
│       ├── types.ts                      All TypeScript interfaces
│       ├── utils.ts                      Formatters, score, color helpers
│       ├── validations.ts                Zod schemas
│       └── supabase/
│           ├── client.ts                 Browser Supabase client
│           ├── server.ts                 Server Supabase client
│           └── admin.ts                  Service role client
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql                Core tables
│       ├── 002_rls.sql                   Row Level Security
│       ├── 003_budget_income.sql         Budget periods, incomes
│       ├── 004_recurring.sql             Recurring items
│       ├── 005_credit_card.sql           Credit card flag
│       ├── 006_system_category.sql       System category flag
│       ├── 007_default_data.sql          New user seed trigger
│       ├── 008_update_default_categories.sql  Updated seed categories
│       ├── 009_feedback.sql              Feedback table
│       └── 010_recurring_dates.sql       Start/end dates, recurring_item_id links
├── middleware.ts                          Auth routing middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── README.md
└── TECHNICAL.md
```
