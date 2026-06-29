'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, format, eachWeekOfInterval, parseISO } from 'date-fns'

export interface WeekData {
  week_number: number
  week_start: string
  week_end: string
  total: number
}

export interface WeeklyData {
  weeklyData: WeekData[]
  weeklyLimit: number
  currency: string
  year: number
}

export async function fetchWeekly(year: number): Promise<WeeklyData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: expenses }, { data: settings }] = await Promise.all([
    supabase.from('expenses').select('date, amount, type, category:categories(exclude_from_totals)').eq('user_id', user.id)
      .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`).in('type', ['Need', 'Want']).order('date'),
    supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
  ])

  const dayTotals = new Map<string, number>()
  for (const e of expenses ?? []) {
    const cat = (Array.isArray(e.category) ? e.category[0] : e.category) as { exclude_from_totals?: boolean } | null
    if (cat?.exclude_from_totals) continue
    dayTotals.set(e.date, (dayTotals.get(e.date) ?? 0) + Number(e.amount))
  }

  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)
  const weeks = eachWeekOfInterval({ start: yearStart, end: yearEnd }, { weekStartsOn: 1 })

  const weeklyData: WeekData[] = weeks.map((weekStart, i) => {
    const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    let total = 0
    for (const [date, amount] of dayTotals.entries()) {
      const d = parseISO(date)
      if (d >= weekStart && d <= wEnd) total += amount
    }
    return { week_number: i + 1, week_start: format(weekStart, 'yyyy-MM-dd'), week_end: format(wEnd, 'yyyy-MM-dd'), total }
  })

  return { weeklyData, weeklyLimit: settings?.weekly_limit ?? 10000, currency: settings?.currency ?? '₹', year }
}
