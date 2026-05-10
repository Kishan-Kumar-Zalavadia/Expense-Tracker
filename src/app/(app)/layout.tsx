export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-full min-h-screen bg-[var(--bg)]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
