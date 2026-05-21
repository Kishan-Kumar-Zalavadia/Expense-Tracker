# Ledger — Personal Finance Tracker

Ledger is a personal finance app built around the **50/30/20 budgeting rule** — helping you understand where your money goes, stay within budget, and build better financial habits over time. It works beautifully on both desktop and mobile, with a clean Apple-inspired design that feels native on every device.

---

## What is the 50/30/20 rule?

The 50/30/20 rule splits your income into three buckets:

- **50% Needs** — essentials like rent, groceries, utilities, and bills
- **30% Wants** — dining out, entertainment, subscriptions, and lifestyle spending
- **20% Savings** — investments, emergency funds, and future goals

Ledger tracks every rupee against this framework automatically, so you always know how you're doing — without doing any math yourself.

### Your rule, your numbers

The 50/30/20 split is a starting point, not a constraint. Ledger lets you set **any percentage split** that fits your actual life.

Paying off a loan aggressively? Set it to 50/20/30 and push more into Savings. Living in an expensive city where rent alone takes 60% of your income? Set Needs to 60 and split the rest between Wants and Savings however makes sense. Just starting out and want to keep it simple? Stick with the default 50/30/20.

You can also change your split **at any point in time** by creating a new budget period. Ledger keeps your full history intact — older months continue to be evaluated against the split that was active then, while newer months use your updated targets. This means your financial picture is always accurate, never distorted by a rule change you made six months later.

The three categories — Needs, Wants, and Savings — stay fixed because they represent the three fundamental uses of money. What changes is how much of your income you're allocating to each. Every expense you log gets tagged to one of these three, and Ledger does the rest.

---

## Features

### Dashboard
Get a complete picture of your finances at a glance. The dashboard shows your monthly spending broken down by Needs, Wants, and Savings with visual budget progress bars, so you can see in seconds whether you're on track. A daily spend bar chart shows your spending rhythm across the month, a category breakdown pie chart reveals where your biggest outlays are, and a "Recent Activity" section shows your last six transactions without leaving the dashboard.

### Budget Management
Define your income and budget split for any time period. Ledger supports multiple budget periods — so if your income changes, you can record a new period without losing your history. Each period stores your monthly income amount and the exact percentage split for Needs, Wants, and Savings.

### Expense Tracking
Log every expense in seconds — just pick a date, category, type, amount, and payment account. Every expense is tagged as a Need, Want, or Saving, which feeds directly into the budget tracking. Filter and search your full expense history by category, type, payment mode, or date. Edit or delete any entry at any time.

### Income Tracking
Record multiple income sources across any payment account. Link income entries to a budget period for accurate tracking. Your income total feeds into the budget calculations automatically.

### Categories
Organise expenses into meaningful categories like Life Infrastructure, Performance and Growth, Relationships and Generosity, Lifestyle and Enjoyment, and Future Me — each mapped to a budget type. Create, rename, colour-code, and archive your own categories. Default categories are set up automatically when you create an account.

### Payment Modes (Accounts)
Track which account or card you spent from — bank accounts, credit cards, UPI wallets, or cash. Ledger shows the live balance of each account by calculating your income deposits and expense withdrawals. Credit card accounts are handled separately so they don't distort your net balance.

### Recurring Payments
Set up any income or expense to repeat automatically — monthly, weekly, or every two weeks. Choose a start date and an optional end date, and Ledger automatically backfills all past occurrences the moment you save. Going forward, it generates each new entry on schedule. When you edit a recurring rule, all previously generated entries are replaced with fresh ones that reflect your changes. When you delete a rule, you choose whether to also delete the history or keep the past entries in your records.

### Weekly Analysis
A full-year weekly spending breakdown shows every week's total against your weekly limit. Instantly spot which weeks were expensive and whether you're consistently staying within budget over time.

### Yearly Heatmap
A GitHub-style contribution heatmap of your daily spending across the entire year. Darker squares mean heavier spending days. A great way to spot seasonal patterns and high-spend periods at a glance.

### Financial Health Score
Ledger calculates a score from 0 to 10 based on how closely your actual spending aligns with your budget targets. The score updates in real time as you add or edit transactions — green means you're on track, amber means some overshoot, red means attention needed.

### Account Balance Tracking
See the real-time balance of every payment account on the dashboard. Ledger computes each balance from your initial amount plus all income deposits minus all expenses, so your account view is always accurate.

### Light and Dark Mode
A fully themed light and dark mode, built with Apple's iOS design language. Switches instantly and persists across sessions.

### Data Export
Export your full transaction history as a CSV or Excel file at any time. Useful for tax season, sharing with an accountant, or doing your own analysis in a spreadsheet.

### Feedback System
Submit feature requests, bug reports, or general feedback directly from within the app. Track the status of your submissions — Submitted, In Progress, or Done — so you always know whether your feedback has been picked up.

### PWA Support
Ledger can be added to your iPhone or Android home screen directly from the browser. It behaves like a native app — full-screen, with a custom icon, no browser chrome.

---

## Who is Ledger for?

Ledger is for anyone who wants a clear, honest view of their finances without the complexity of spreadsheets or the clutter of traditional budgeting apps.

**If you have a monthly income and want to know whether you're spending it wisely**, Ledger tells you exactly that — not just in numbers, but visually, in real time.

**If you have recurring expenses** like rent, subscriptions, or EMIs, Ledger automates the logging so you never have to remember to enter them.

**If you want to build better habits**, the weekly and yearly views give you the long-term picture — not just this month, but how you've been doing across the year.

**If you switch between multiple bank accounts or cards**, Ledger tracks all of them and shows you each account's live balance in one place.

---

## Why Ledger instead of a spreadsheet?

| Spreadsheet | Ledger |
|---|---|
| Manual data entry every time | Quick-entry forms with smart defaults |
| No real-time budget feedback | Live budget progress bars and health score |
| Formulas break when data changes | Always consistent, always accurate |
| No mobile experience | Full mobile app experience |
| You build the charts yourself | Weekly bar chart, yearly heatmap, pie chart built in |
| Recurring entries you have to copy | Automatic recurring payment generation |
| Flat list of transactions | Organised by category, type, account, and period |

---

## Built with

Next.js · TypeScript · Tailwind CSS · Supabase · Recharts · Radix UI
