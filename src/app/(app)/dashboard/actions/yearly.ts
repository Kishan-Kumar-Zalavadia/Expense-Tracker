'use server'

import { createClient } from '@/lib/supabase/server'

export interface YearlyData {
  year: number
  dailyData: { date: string; total: number }[]
  maxDay: number
  currency: string
}

export async function fetchYearly(year: number): Promise<YearlyData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: expenses }, { data: settings }] = await Promise.all([
    supabase.from('expenses').select('date, amount').eq('user_id', user.id)
      .gte('date', `${year}-01-01`).lte('date', `${year}-12-31`).order('date'),
    supabase.from('user_settings').select('currency').eq('user_id', user.id).single(),
  ])

  const dayMap = new Map<string, number>()
  for (const e of expenses ?? []) {
    dayMap.set(e.date, (dayMap.get(e.date) ?? 0) + Number(e.amount))
  }

  const dailyData = Array.from(dayMap.entries()).map(([date, total]) => ({ date, total }))
  const maxDay = Math.max(0, ...dailyData.map((d) => d.total))

  return { year, dailyData, maxDay, currency: settings?.currency ?? '₹' }
}
