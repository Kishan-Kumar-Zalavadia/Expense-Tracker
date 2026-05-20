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
    <div className="flex min-h-screen bg-[var(--bg)]">
      <Sidebar />
      {/* md:ml-56 offsets the fixed sidebar width */}
      <main className="flex-1 flex flex-col min-w-0 pb-nav-safe md:pb-0 md:ml-56">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
