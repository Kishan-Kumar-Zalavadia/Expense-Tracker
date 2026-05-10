import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import type { ExpenseType } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatDate(dateStr: string, fmt = 'dd MMM yyyy'): string {
  return format(parseISO(dateStr), fmt)
}

export function formatMonth(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy')
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

// Returns CSS variable name for each expense type
export function typeColor(type: ExpenseType): string {
  switch (type) {
    case 'Need':   return 'var(--c-need)'
    case 'Want':   return 'var(--c-want)'
    case 'Saving': return 'var(--c-save)'
  }
}

export function typeTint(type: ExpenseType): string {
  switch (type) {
    case 'Need':   return 'var(--tint-need)'
    case 'Want':   return 'var(--tint-want)'
    case 'Saving': return 'var(--tint-save)'
  }
}

export function typeTextClass(type: ExpenseType): string {
  switch (type) {
    case 'Need':   return 'text-need'
    case 'Want':   return 'text-want'
    case 'Saving': return 'text-save'
  }
}

export function typeBorderClass(type: ExpenseType): string {
  switch (type) {
    case 'Need':   return 'border-need'
    case 'Want':   return 'border-want'
    case 'Saving': return 'border-save'
  }
}

// Compute score from budget actuals
export function computeScore(
  needActual: number, needBudget: number,
  wantActual: number, wantBudget: number,
  saveActual: number, saveBudget: number,
): number {
  const overshoot =
    (needBudget > 0 ? Math.max(0, (needActual - needBudget) / needBudget) : 0) +
    (wantBudget > 0 ? Math.max(0, (wantActual - wantBudget) / wantBudget) : 0) +
    (saveBudget > 0 ? Math.max(0, (saveActual - saveBudget) / saveBudget) : 0)
  return Math.max(0, Math.min(10, 10 - overshoot * 5))
}

export function scoreColor(score: number): string {
  if (score >= 8) return 'var(--c-save)'
  if (score >= 6) return 'var(--c-warn)'
  return 'var(--c-want)'
}

// Convert a JS Date to YYYY-MM-DD
export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

// Page accent colors for nav items
export const PAGE_COLORS = {
  dashboard: 'var(--c-primary)',
  expenses:  'var(--c-berry)',
  weekly:    'var(--c-need)',
  yearly:    'var(--c-save)',
  settings:  'var(--c-warn)',
} as const

