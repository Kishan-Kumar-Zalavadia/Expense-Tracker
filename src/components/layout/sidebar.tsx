'use client'

import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  List,
  BarChart2,
  CalendarDays,
  Settings,
  LogOut,
  Sun,
  Moon,
  Download,
  TrendingUp,
  MessageSquarePlus,
  Shield,
} from 'lucide-react'
import { cn, PAGE_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/use-theme'
import { ExportDialog } from '@/components/export-dialog'
import { useState } from 'react'
import { useAppShell, type AppTab } from '@/hooks/use-app-shell'

const NAV: { tab: AppTab; label: string; icon: React.ElementType; color: string }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard,    color: PAGE_COLORS.dashboard },
  { tab: 'expenses',  label: 'Expenses',  icon: List,               color: PAGE_COLORS.expenses  },
  { tab: 'income',    label: 'Income',    icon: TrendingUp,         color: PAGE_COLORS.income    },
  { tab: 'weekly',    label: 'Weekly',    icon: BarChart2,          color: PAGE_COLORS.weekly    },
  { tab: 'yearly',    label: 'Yearly',    icon: CalendarDays,       color: PAGE_COLORS.yearly    },
  { tab: 'settings',  label: 'Settings',  icon: Settings,           color: PAGE_COLORS.settings  },
  { tab: 'feedback',  label: 'Feedback',  icon: MessageSquarePlus,  color: PAGE_COLORS.feedback  },
]

export function Sidebar() {
  const router = useRouter()
  const { activeTab, setActiveTab, isAdmin } = useAppShell()
  const { theme, toggle } = useTheme()
  const [exportOpen, setExportOpen] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) { toast.error(error.message); return }
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 shrink-0 h-screen fixed top-0 left-0 z-30
        bg-[var(--surface)] border-r border-[var(--border)]">

        {/* Logo */}
        <div className="px-5 py-6 border-b border-[var(--border)]">
          <span className="font-display text-2xl font-medium tracking-tight text-[var(--ink)]">
            Ledger<span style={{ color: 'var(--c-want)' }}>.</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ tab, label, icon: Icon, color }) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative flex items-center gap-3 px-5 py-2.5 text-sm transition-colors w-full text-left',
                  active
                    ? 'text-[var(--ink)] font-medium bg-[var(--bg)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]',
                )}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
                <Icon
                  size={16}
                  style={{ color: active ? color : undefined }}
                  className={cn(!active && 'text-[var(--ink-subtle)]')}
                />
                {label}
              </button>
            )
          })}

          {isAdmin && (
            <>
              <div className="mx-5 my-3 border-t border-[var(--border)]" />
              <button
                onClick={() => setActiveTab('admin')}
                className={cn(
                  'relative flex items-center gap-3 px-5 py-2.5 text-sm transition-colors w-full text-left',
                  activeTab === 'admin'
                    ? 'text-[var(--ink)] font-medium bg-[var(--bg)]'
                    : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg)]',
                )}
              >
                {activeTab === 'admin' && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r-sm"
                    style={{ backgroundColor: PAGE_COLORS.admin }}
                  />
                )}
                <Shield
                  size={16}
                  style={{ color: activeTab === 'admin' ? PAGE_COLORS.admin : undefined }}
                  className={cn(activeTab !== 'admin' && 'text-[var(--ink-subtle)]')}
                />
                Admin
              </button>
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-4 space-y-1">
          <button
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-[var(--ink-muted)]
              hover:text-[var(--ink)] hover:bg-[var(--bg)] rounded-[var(--radius-md)] transition-colors"
          >
            <Download size={14} />
            Export
          </button>

          <button
            onClick={toggle}
            className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-[var(--ink-muted)]
              hover:text-[var(--ink)] hover:bg-[var(--bg)] rounded-[var(--radius-md)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 w-full px-2 py-2 text-sm text-[var(--ink-muted)]
              hover:text-[var(--c-want)] hover:bg-[var(--tint-want)] rounded-[var(--radius-md)] transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </>
  )
}
