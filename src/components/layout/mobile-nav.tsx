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
    <nav
      className="md:hidden border-t border-[var(--border)] mobile-nav-bar"
    >
      {NAV.map(({ href, label, icon: Icon, color }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors',
              active ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]',
            )}
          >
            <Icon size={22} style={{ color: active ? color : 'var(--ink-subtle)' }} />
            <span className="text-[10px] font-medium" style={{ color: active ? color : 'var(--ink-subtle)' }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
