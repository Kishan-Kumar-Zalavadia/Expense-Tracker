'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, BarChart2, TrendingUp, Settings } from 'lucide-react'
import { cn, PAGE_COLORS } from '@/lib/utils'

const NAV = [
  { href: '/',                label: 'Dashboard', icon: LayoutDashboard, color: PAGE_COLORS.dashboard },
  { href: '/expenses',        label: 'Expenses',  icon: List,            color: PAGE_COLORS.expenses  },
  { href: '/analysis/weekly', label: 'Weekly',    icon: BarChart2,       color: PAGE_COLORS.weekly    },
  { href: '/income',          label: 'Income',    icon: TrendingUp,      color: PAGE_COLORS.income    },
  { href: '/settings',        label: 'Settings',  icon: Settings,        color: PAGE_COLORS.settings  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40
      bg-[var(--surface)]/90 backdrop-blur-xl border-t border-[var(--border)]
      flex items-center justify-around px-1 pt-2 pb-safe">
      {NAV.map(({ href, label, icon: Icon, color }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-[var(--radius-md)] transition-colors min-w-0',
              active ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]',
            )}
          >
            <Icon size={22} style={{ color: active ? color : undefined }} />
            <span className="text-[10px] font-medium truncate" style={{ color: active ? color : undefined }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
