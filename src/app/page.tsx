import Link from 'next/link'
import {
  LayoutDashboard, PieChart, CreditCard, TrendingUp,
  RefreshCw, Settings, BarChart2, Shield, ArrowRight,
  CheckCircle2, Wallet, Calendar,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">

      {/* ── Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]"
        style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="font-display text-xl font-medium tracking-tight text-[var(--ink)]">
            Ledger<span style={{ color: 'var(--c-want)' }}>.</span>
            <span className="ml-1.5 text-xs font-sans font-normal text-[var(--ink-muted)]">Finance Hub</span>
          </span>
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="px-3 py-1.5 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="btn-primary text-sm px-4 py-1.5">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full text-xs font-semibold
          border border-[var(--border)] text-[var(--ink-muted)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-save)]" />
          Personal finance, beautifully simple
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight
          text-[var(--ink)] leading-tight mb-6">
          Track every rupee.<br />
          <span style={{ color: 'var(--c-primary)' }}>Master your money.</span>
        </h1>

        <p className="text-base sm:text-lg text-[var(--ink-muted)] max-w-xl mx-auto mb-8 leading-relaxed">
          Ledger Finance Hub helps you log expenses, monitor budgets, track account balances,
          and understand your spending — all in one clean, private dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup"
            className="btn-primary justify-center text-sm px-6 py-3">
            Start for free
            <ArrowRight size={15} />
          </Link>
          <Link href="/login"
            className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium
              border border-[var(--border)] rounded-[var(--radius-xl)] text-[var(--ink-muted)]
              hover:text-[var(--ink)] hover:border-[var(--border-strong)] transition-colors">
            Sign in to your account
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div className="mt-14 mx-auto max-w-4xl">
          <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--border)] shadow-2xl"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.12)' }}>
            {/* Browser chrome */}
            <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-[var(--elevated)] rounded-md px-4 py-1 text-xs text-[var(--ink-subtle)] w-48 text-center">
                  ledgerfinancehub.app
                </div>
              </div>
            </div>
            {/* App mockup */}
            <div className="bg-[var(--bg)] flex" style={{ minHeight: 340 }}>
              {/* Sidebar mock */}
              <div className="hidden sm:flex flex-col w-44 bg-[var(--surface)] border-r border-[var(--border)] shrink-0 py-4">
                <div className="px-4 pb-4 border-b border-[var(--border)] mb-3">
                  <div className="font-display text-base font-medium text-[var(--ink)]">
                    Ledger<span style={{ color: 'var(--c-want)' }}>.</span>
                  </div>
                </div>
                {[
                  { label: 'Dashboard', color: 'var(--c-primary)', active: true },
                  { label: 'Expenses', color: 'var(--c-want)', active: false },
                  { label: 'Income', color: 'var(--c-save)', active: false },
                  { label: 'Weekly', color: 'var(--c-berry)', active: false },
                  { label: 'Settings', color: 'var(--ink-subtle)', active: false },
                ].map((item) => (
                  <div key={item.label}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs"
                    style={{
                      color: item.active ? 'var(--ink)' : 'var(--ink-muted)',
                      backgroundColor: item.active ? 'var(--bg)' : 'transparent',
                      fontWeight: item.active ? 500 : 400,
                    }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content mock */}
              <div className="flex-1 p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white px-2 py-0.5 rounded-full mb-1 inline-block"
                      style={{ backgroundColor: 'var(--c-primary)' }}>Dashboard</div>
                    <div className="font-display text-base font-medium text-[var(--ink)]">Overview</div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="h-6 w-20 rounded-md bg-[var(--elevated)]" />
                    <div className="h-6 w-20 rounded-md" style={{ backgroundColor: 'var(--c-save)', opacity: 0.7 }} />
                    <div className="h-6 w-20 rounded-md" style={{ backgroundColor: 'var(--c-primary)', opacity: 0.7 }} />
                  </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  {[
                    { label: 'Spent', value: '₹24,500', color: 'var(--c-want)' },
                    { label: 'Budget', value: '₹50,000', color: 'var(--c-primary)' },
                    { label: 'Income', value: '₹60,000', color: 'var(--c-save)' },
                    { label: 'Saved', value: '₹35,500', color: 'var(--c-berry)' },
                  ].map((card) => (
                    <div key={card.label}
                      className="rounded-[var(--radius-md)] p-2.5 border border-[var(--border)] bg-[var(--surface)]">
                      <div className="text-[10px] text-[var(--ink-muted)] mb-1">{card.label}</div>
                      <div className="text-sm font-semibold tabular-nums" style={{ color: card.color }}>{card.value}</div>
                    </div>
                  ))}
                </div>

                {/* Budget split */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Needs 50%', spent: '₹12,000', pct: 60, color: 'var(--c-need)' },
                    { label: 'Wants 30%', spent: '₹8,500', pct: 45, color: 'var(--c-want)' },
                    { label: 'Savings 20%', spent: '₹4,000', pct: 25, color: 'var(--c-save)' },
                  ].map((b) => (
                    <div key={b.label}
                      className="rounded-[var(--radius-md)] p-2.5 border border-[var(--border)] bg-[var(--surface)]">
                      <div className="text-[10px] text-[var(--ink-muted)] mb-1">{b.label}</div>
                      <div className="text-xs font-semibold tabular-nums mb-1.5" style={{ color: b.color }}>{b.spent}</div>
                      <div className="h-1 rounded-full bg-[var(--elevated)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[var(--radius-md)] p-2.5 border border-[var(--border)] bg-[var(--surface)]">
                    <div className="text-[10px] text-[var(--ink-muted)] mb-2">By category</div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-12 h-12 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--elevated)" strokeWidth="5" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--c-need)" strokeWidth="5"
                            strokeDasharray="35 65" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--c-want)" strokeWidth="5"
                            strokeDasharray="28 72" strokeDashoffset="-35" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--c-save)" strokeWidth="5"
                            strokeDasharray="20 80" strokeDashoffset="-63" />
                        </svg>
                      </div>
                      <div className="space-y-1 text-[10px]">
                        {[
                          { label: 'Food', color: 'var(--c-need)' },
                          { label: 'Transport', color: 'var(--c-want)' },
                          { label: 'Savings', color: 'var(--c-save)' },
                        ].map((c) => (
                          <div key={c.label} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                            <span className="text-[var(--ink-muted)]">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-md)] p-2.5 border border-[var(--border)] bg-[var(--surface)]">
                    <div className="text-[10px] text-[var(--ink-muted)] mb-2">Daily spend</div>
                    <div className="flex items-end gap-1 h-10">
                      {[30, 55, 20, 70, 45, 80, 35, 60, 25, 50, 40, 65].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm"
                          style={{ height: `${h}%`, backgroundColor: i % 3 === 0 ? 'var(--c-need)' : 'var(--c-want)', opacity: 0.7 }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--ink)] mb-3">
            Everything you need to manage money
          </h2>
          <p className="text-[var(--ink-muted)] max-w-md mx-auto text-sm">
            Built around the 50/30/20 budgeting rule — the simple framework that actually works.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: LayoutDashboard,
              color: 'var(--c-primary)',
              tint: 'var(--tint-primary)',
              title: 'Dashboard Overview',
              desc: 'See your monthly spending, income, and savings at a glance with clear KPI cards and visual budget split.',
            },
            {
              icon: PieChart,
              color: 'var(--c-berry)',
              tint: '#6B3F7F20',
              title: 'Category Breakdown',
              desc: 'Group expenses by custom categories. Pie charts and bar graphs show exactly where your money goes.',
            },
            {
              icon: Wallet,
              color: 'var(--c-save)',
              tint: 'var(--tint-save)',
              title: 'Account Balances',
              desc: 'Track multiple accounts — bank, cash, credit cards. Know your real balance across all accounts instantly.',
            },
            {
              icon: CreditCard,
              color: 'var(--c-need)',
              tint: 'var(--tint-need)',
              title: 'Credit Card Tracking',
              desc: 'Mark accounts as credit cards. Log repayments directly from the dashboard — outstanding balances update automatically.',
            },
            {
              icon: RefreshCw,
              color: 'var(--c-want)',
              tint: 'var(--tint-want)',
              title: 'Recurring Payments',
              desc: 'Set up rent, subscriptions, and salaries once. Generate entries automatically with one tap.',
            },
            {
              icon: BarChart2,
              color: 'var(--c-primary)',
              tint: 'var(--tint-primary)',
              title: 'Weekly & Yearly Analysis',
              desc: 'Spot trends with weekly spending charts and yearly summaries. See your financial patterns over time.',
            },
            {
              icon: TrendingUp,
              color: 'var(--c-save)',
              tint: 'var(--tint-save)',
              title: 'Income Tracking',
              desc: 'Log salary, freelance, and other income. Understand your true cash flow each month.',
            },
            {
              icon: Calendar,
              color: 'var(--c-berry)',
              tint: '#6B3F7F20',
              title: 'Budget Periods',
              desc: 'Define budget periods for different life phases — each with its own monthly amount and 50/30/20 split.',
            },
            {
              icon: Settings,
              color: 'var(--ink-muted)',
              tint: 'var(--elevated)',
              title: 'Fully Customisable',
              desc: 'Create your own categories, payment modes, and currency. The app adapts to how you actually spend.',
            },
          ].map(({ icon: Icon, color, tint, title, desc }) => (
            <div key={title}
              className="apple-card p-5 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center mb-3"
                style={{ backgroundColor: tint }}>
                <Icon size={16} style={{ color }} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--ink)] mb-1.5">{title}</h3>
              <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--ink)] mb-3">
              Up and running in minutes
            </h2>
            <p className="text-[var(--ink-muted)] text-sm">No credit card. No subscriptions. Just sign up and go.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                step: '01',
                color: 'var(--c-primary)',
                title: 'Create your account',
                desc: 'Sign up in seconds with email or Google. Your data is private and secured with row-level security.',
              },
              {
                step: '02',
                color: 'var(--c-want)',
                title: 'Set up your budget',
                desc: 'Add your monthly budget, payment accounts, and categories. Takes about 2 minutes.',
              },
              {
                step: '03',
                color: 'var(--c-save)',
                title: 'Start tracking',
                desc: 'Log expenses as you go. The dashboard updates instantly — always know where you stand.',
              },
            ].map(({ step, color, title, desc }) => (
              <div key={step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full
                  border-2 font-display text-xl font-medium mb-4"
                  style={{ borderColor: color, color }}>
                  {step}
                </div>
                <h3 className="text-sm font-semibold text-[var(--ink)] mb-2">{title}</h3>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Expense list mockup ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full text-xs font-semibold
              border border-[var(--border)] text-[var(--ink-muted)]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--c-want)' }} />
              Expense tracking
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--ink)] mb-4">
              Log and search every transaction
            </h2>
            <p className="text-[var(--ink-muted)] text-sm leading-relaxed mb-6">
              Add expenses in seconds. Filter by date, category, or account.
              Sort and search across your full history with pagination for clean performance.
            </p>
            <ul className="space-y-2.5">
              {[
                'Filter by account, category, or date range',
                'Search by description across all transactions',
                'Edit or delete any entry at any time',
                'Notes field for extra context on any expense',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[var(--ink-muted)]">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--c-save)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Expense list mockup */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] overflow-hidden shadow-lg">
            <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3">
              <div className="h-5 w-32 rounded bg-[var(--elevated)] mb-1" />
              <div className="h-3 w-20 rounded bg-[var(--elevated)]" />
            </div>
            <div className="bg-[var(--bg)] p-3 space-y-2">
              {/* Filter bar */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1 h-7 rounded-md bg-[var(--elevated)]" />
                <div className="w-24 h-7 rounded-md bg-[var(--elevated)]" />
                <div className="w-20 h-7 rounded-md bg-[var(--elevated)]" />
              </div>
              {[
                { desc: 'Grocery shopping', cat: 'Food', amt: '₹1,240', type: 'Need', color: 'var(--c-need)' },
                { desc: 'Netflix subscription', cat: 'Entertainment', amt: '₹649', type: 'Want', color: 'var(--c-want)' },
                { desc: 'Mutual fund SIP', cat: 'Savings', amt: '₹5,000', type: 'Saving', color: 'var(--c-save)' },
                { desc: 'Electricity bill', cat: 'Utilities', amt: '₹890', type: 'Need', color: 'var(--c-need)' },
                { desc: 'Restaurant dinner', cat: 'Dining', amt: '₹1,800', type: 'Want', color: 'var(--c-want)' },
              ].map((row, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)]">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--ink)] truncate">{row.desc}</div>
                    <div className="text-[10px] text-[var(--ink-muted)]">{row.cat}</div>
                  </div>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                    style={{ color: row.color, backgroundColor: row.color + '15' }}>
                    {row.type}
                  </span>
                  <span className="text-xs font-semibold tabular-nums shrink-0" style={{ color: row.color }}>
                    {row.amt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy highlight ──────────────────────────────────── */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--tint-save)' }}>
              <Shield size={20} style={{ color: 'var(--c-save)' }} />
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--ink)] mb-3">
              Your data is yours alone
            </h2>
            <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
              Built with Supabase row-level security — your data is completely isolated from other users.
              No bank credentials or card numbers are ever stored. This is a personal tracking tool, not a
              financial institution. You control everything.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="font-display text-2xl sm:text-3xl font-medium text-[var(--ink)] mb-4">
          Ready to take control of your finances?
        </h2>
        <p className="text-[var(--ink-muted)] text-sm mb-8 max-w-sm mx-auto">
          Free to use. No hidden costs. Just a clean, honest expense tracker.
        </p>
        <Link href="/signup"
          className="btn-primary justify-center text-sm px-8 py-3 inline-flex">
          Create your free account
          <ArrowRight size={15} />
        </Link>
      </section>

      {/* ── Footer & Disclaimer ────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <span className="font-display text-base font-medium text-[var(--ink)]">
              Ledger<span style={{ color: 'var(--c-want)' }}>.</span>
              <span className="ml-1 text-xs font-sans font-normal text-[var(--ink-muted)]">Finance Hub</span>
            </span>
            <div className="flex gap-4 text-sm text-[var(--ink-muted)]">
              <Link href="/login" className="hover:text-[var(--ink)] transition-colors">Sign in</Link>
              <Link href="/signup" className="hover:text-[var(--ink)] transition-colors">Sign up</Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-[var(--border)] pt-6">
            <p className="text-[11px] text-[var(--ink-subtle)] leading-relaxed max-w-3xl">
              <span className="font-semibold text-[var(--ink-muted)]">Disclaimer:</span> Ledger Finance Hub is a
              personal, non-commercial expense tracking application created for individual use only. It does not
              constitute financial advice, investment guidance, or any form of regulated financial service. This
              application does not store bank credentials, card numbers, PINs, or any sensitive authentication
              information. All monetary figures entered by users represent personal tracking data and do not reflect
              verified account balances from any financial institution. The developer of this application is not a
              licensed financial advisor, broker, or financial institution. Data entered into this application is
              stored securely via Supabase and is never sold, shared, or used for any commercial purpose. Use of
              this application is entirely at the user&apos;s own discretion and risk. By using Ledger Finance Hub,
              you acknowledge that it is a personal productivity tool and not a financial services product.
            </p>
            <p className="text-[11px] text-[var(--ink-subtle)] mt-3">
              © {new Date().getFullYear()} Ledger Finance Hub. Personal project. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
