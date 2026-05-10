'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, BarChart2, CalendarDays, Settings } from 'lucide-react'
import { cn, PAGE_COLORS } from '@/lib/utils'

const NAV = [
  { href: '/',                label: 'Dashboard', icon: LayoutDashboard, color: PAGE_COLORS.dashboard },
  { href: '/expenses',        label: 'Expenses',  icon: List,            color: PAGE_COLORS.expenses  },
  { href: '/analysis/weekly', label: 'Weekly',    icon: BarChart2,       color: PAGE_COLORS.weekly    },
  { href: '/analysis/yearly', label: 'Yearly',    icon: CalendarDays,    color: PAGE_COLORS.yearly    },
  { href: '/settings',        label: 'Settings',  icon: Settings,        color: PAGE_COLORS.settings  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40
      bg-[var(--surface)] border-t border-[var(--border)]
      flex items-center justify-around px-2 py-1 safe-area-inset-bottom">
      {NAV.map(({ href, label, icon: Icon, color }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-2 rounded-sm transition-colors min-w-0',
              active ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]',
            )}
          >
            <Icon size={18} style={{ color: active ? color : undefined }} />
            <span className="text-[10px] font-medium truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
