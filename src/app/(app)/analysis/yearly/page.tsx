import { createClient } from '@/lib/supabase/server'
import { YearlyClient } from '@/components/analysis/yearly-client'

interface PageProps {
  searchParams: Promise<{ year?: string }>
}

export default async function YearlyPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const year = parseInt(sp.year ?? String(new Date().getFullYear()), 10)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: expenses } = await supabase
    .from('expenses')
    .select('date, amount')
    .eq('user_id', user.id)
    .gte('date', `${year}-01-01`)
    .lte('date', `${year}-12-31`)
    .order('date')

  const { data: settings } = await supabase
    .from('user_settings').select('currency').eq('user_id', user.id).single()

  // Aggregate daily totals
  const dayMap = new Map<string, number>()
  for (const e of expenses ?? []) {
    dayMap.set(e.date, (dayMap.get(e.date) ?? 0) + Number(e.amount))
  }

  const dailyData = Array.from(dayMap.entries()).map(([date, total]) => ({ date, total }))
  const maxDay = Math.max(0, ...dailyData.map((d) => d.total))

  return (
    <YearlyClient
      year={year}
      dailyData={dailyData}
      maxDay={maxDay}
      currency={settings?.currency ?? '₹'}
    />
  )
}
