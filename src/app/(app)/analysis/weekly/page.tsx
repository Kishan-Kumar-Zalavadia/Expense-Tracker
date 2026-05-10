import { createClient } from '@/lib/supabase/server'
import { WeeklyClient } from '@/components/analysis/weekly-client'
import { startOfWeek, endOfWeek, format, eachWeekOfInterval, parseISO } from 'date-fns'

interface PageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function WeeklyPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const year = parseInt(sp.year ?? String(new Date().getFullYear()), 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = `${year}-01-01`
  const endDate   = `${year}-12-31`

  // Fetch Need + Want expenses for the year (Saving excluded per spec)
  const { data: expenses } = await supabase
    .from('expenses')
    .select('date, amount, type')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .in('type', ['Need', 'Want'])
    .order('date')

  const { data: settings } = await supabase
    .from('user_settings').select('*').eq('user_id', user.id).single()

  const weeklyLimit = settings?.weekly_limit ?? 10000
  const currency    = settings?.currency    ?? '₹'

  // Aggregate by ISO week
  const dayTotals = new Map<string, number>()
  for (const e of expenses ?? []) {
    dayTotals.set(e.date, (dayTotals.get(e.date) ?? 0) + Number(e.amount))
  }

  // Build 52 week buckets
  const yearStart = new Date(year, 0, 1)
  const yearEnd   = new Date(year, 11, 31)
  const weeks = eachWeekOfInterval({ start: yearStart, end: yearEnd }, { weekStartsOn: 1 })

  const weeklyData = weeks.map((weekStart, i) => {
    const wEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    let total = 0
    for (const [date, amount] of dayTotals.entries()) {
      const d = parseISO(date)
      if (d >= weekStart && d <= wEnd) total += amount
    }
    return {
      week_number: i + 1,
      week_start:  format(weekStart, 'yyyy-MM-dd'),
      week_end:    format(wEnd, 'yyyy-MM-dd'),
      total,
    }
  })

  return (
    <WeeklyClient
      weeklyData={weeklyData}
      weeklyLimit={weeklyLimit}
      currency={currency}
      year={year}
    />
  )
}
