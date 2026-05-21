'use client'

import { LayoutDashboard, List, BarChart2, TrendingUp, Settings } from 'lucide-react'
import { cn, PAGE_COLORS } from '@/lib/utils'
import { useAppShell, type AppTab } from '@/hooks/use-app-shell'

const NAV: { tab: AppTab; label: string; icon: React.ElementType; color: string }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: PAGE_COLORS.dashboard },
  { tab: 'expenses',  label: 'Expenses',  icon: List,            color: PAGE_COLORS.expenses  },
  { tab: 'weekly',    label: 'Weekly',    icon: BarChart2,       color: PAGE_COLORS.weekly    },
  { tab: 'income',    label: 'Income',    icon: TrendingUp,      color: PAGE_COLORS.income    },
  { tab: 'settings',  label: 'Settings',  icon: Settings,        color: PAGE_COLORS.settings  },
]

export function MobileNav() {
  const { activeTab, setActiveTab } = useAppShell()

  return (
    <nav className="md:hidden border-t border-[var(--border)] mobile-nav-bar">
      {NAV.map(({ tab, label, icon: Icon, color }) => {
        const active = activeTab === tab
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors',
              active ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]',
            )}
          >
            <Icon size={22} style={{ color: active ? color : 'var(--ink-subtle)' }} />
            <span className="text-[10px] font-medium" style={{ color: active ? color : 'var(--ink-subtle)' }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
