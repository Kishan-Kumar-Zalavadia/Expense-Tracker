# Ledger — Personal Finance Tracker

A multi-user personal finance tracker built on the 50/30/20 budgeting rule.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS · Supabase · shadcn/ui · Recharts

---

## Setup

### 1. Install dependencies

```bash
cd ledger
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (free tier is fine).
2. Click **New Project**, choose a name and a strong database password.
3. Wait ~2 minutes for provisioning to complete.

### 3. Run the database migrations

In your Supabase project, go to **SQL Editor → New query** and run each file in order:

- `supabase/migrations/001_schema.sql` — tables, indexes, constraints
- `supabase/migrations/002_rls.sql` — Row Level Security policies  
- `supabase/seed.sql` — seed trigger that sets up default data for every new user

Paste each file's contents into the SQL editor and click **Run**.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with values from **Supabase Dashboard → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Google OAuth & Supabase connection

See the **Connecting Supabase & Google OAuth** section at the end of this file.

---

## Deploy to Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. In the **Environment Variables** section, add the three variables from `.env.local`.
4. Click **Deploy**.
5. After deploying, note your Vercel URL (e.g. `https://ledger-abc.vercel.app`).
6. In Supabase dashboard → **Authentication → URL Configuration**, set:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: add `https://your-app.vercel.app/auth/callback`

---

## Project structure

```
src/
  app/
    (auth)/          login & signup pages
    (app)/           all authenticated pages (dashboard, expenses, analysis, settings)
    auth/callback/   OAuth callback handler
  components/
    layout/          Sidebar + MobileNav
    dashboard/       KPI cards, charts, budget cards, recent activity
    expenses/        Expense modal + list table
    analysis/        Weekly chart + Yearly heatmap
    settings/        General, Salary, Categories, Payment modes panels
  lib/
    supabase/        Browser + server + admin clients
    types.ts         Shared TypeScript types
    utils.ts         Formatters, score formula, color helpers
    validations.ts   Zod schemas
  hooks/
    use-theme.ts     Theme toggle (light/dark, persisted)
supabase/
  migrations/        SQL migration files (run these in Supabase SQL Editor)
  seed.sql           Trigger + seeding function for new users
```

---

## Connecting Supabase & Google OAuth

### Step 1: Supabase project

1. Create an account at [supabase.com](https://supabase.com).
2. Click **New Project** → fill in name and DB password → **Create new project**.
3. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` / public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 2: Run migrations

In Supabase dashboard → **SQL Editor → New query**:

1. Paste `supabase/migrations/001_schema.sql` → Run
2. Paste `supabase/migrations/002_rls.sql` → Run
3. Paste `supabase/seed.sql` → Run

### Step 3: Enable email auth

In Supabase dashboard → **Authentication → Providers → Email**:
- Enable **Email** provider (on by default).
- Optionally disable **Confirm email** during development for faster testing.

### Step 4: Enable Google OAuth

**In Google Cloud Console:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or use existing).
3. Go to **APIs & Services → OAuth consent screen**:
   - User type: External → Create
   - Fill app name, support email, developer email → Save
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Name: `Ledger`
   - Authorized redirect URIs: add `https://your-project-ref.supabase.co/auth/v1/callback`
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**

**In Supabase dashboard:**

5. Go to **Authentication → Providers → Google**.
6. Toggle **Enable Google provider** ON.
7. Paste the **Client ID** and **Client Secret** from Google.
8. Copy the **Callback URL** shown there — it should match what you entered in Google.
9. Click **Save**.

**Update redirect URLs:**

10. Go to **Authentication → URL Configuration**:
    - Site URL: `http://localhost:3000` (or your Vercel URL in production)
    - Redirect URLs: add `http://localhost:3000/auth/callback` and `https://your-app.vercel.app/auth/callback`

---

## Out of scope (v2 ideas)

- Receipt photo uploads
- Recurring / scheduled transactions
- Shared household budgets
- Mobile native app
- Monthly summary emails / push notifications
- Currency conversion (single currency per user in v1)
- Goals and savings targets beyond the 50/30/20 framework
- AI-powered expense categorization
