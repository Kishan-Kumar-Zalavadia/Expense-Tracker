'use client'

import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, List, TrendingUp, Settings, MoreHorizontal,
  BarChart2, CalendarRange, Download, Sun, Moon, LogOut, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn, PAGE_COLORS } from '@/lib/utils'
import { useAppShell, type AppTab } from '@/hooks/use-app-shell'
import { useTheme } from '@/hooks/use-theme'
import { createClient } from '@/lib/supabase/client'
import { ExportDialog } from '@/components/export-dialog'

const PRIMARY_NAV: { tab: AppTab; label: string; icon: React.ElementType; color: string }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: PAGE_COLORS.dashboard },
  { tab: 'expenses',  label: 'Expenses',  icon: List,            color: PAGE_COLORS.expenses  },
  { tab: 'income',    label: 'Income',    icon: TrendingUp,      color: PAGE_COLORS.income    },
  { tab: 'settings',  label: 'Settings',  icon: Settings,        color: PAGE_COLORS.settings  },
]

const MORE_TABS: { tab: AppTab; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { tab: 'weekly', label: 'Weekly', icon: BarChart2,    color: PAGE_COLORS.weekly, description: 'Weekly spend overview' },
  { tab: 'yearly', label: 'Yearly', icon: CalendarRange, color: PAGE_COLORS.yearly, description: 'Yearly heatmap'        },
]

export function MobileNav() {
  const { activeTab, setActiveTab } = useAppShell()
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  const [moreOpen, setMoreOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const moreActive = activeTab === 'weekly' || activeTab === 'yearly'

  // Close sheet on outside tap
  useEffect(() => {
    if (!moreOpen) return
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  const handleMoreTab = (tab: AppTab) => {
    setActiveTab(tab)
    setMoreOpen(false)
  }

  const handleExport = () => {
    setMoreOpen(false)
    setExportOpen(true)
  }

  const handleTheme = () => {
    toggle()
    setMoreOpen(false)
  }

  const handleSignOut = async () => {
    setMoreOpen(false)
    const { error } = await supabase.auth.signOut()
    if (error) { toast.error(error.message); return }
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More sheet */}
      {moreOpen && (
        <div
          ref={sheetRef}
          className="md:hidden fixed bottom-[calc(env(safe-area-inset-bottom)+56px)] left-3 right-3 z-50
            rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden"
          style={{ backgroundColor: 'var(--elevated)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <span className="text-sm font-semibold text-[var(--ink)]">More</span>
            <button onClick={() => setMoreOpen(false)} className="text-[var(--ink-muted)] p-0.5">
              <X size={16} />
            </button>
          </div>

          {/* Tab navigation items */}
          {MORE_TABS.map(({ tab, label, icon: Icon, color, description }) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => handleMoreTab(tab)}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors',
                  'border-b border-[var(--border)]',
                  active ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]',
                )}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: active ? color : 'var(--ink)' }}>
                    {label}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">{description}</div>
                </div>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                )}
              </button>
            )
          })}

          {/* Divider */}
          <div className="border-b border-[var(--border)]" />

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors
              border-b border-[var(--border)] hover:bg-[var(--surface-2)]"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--c-primary) 15%, transparent)' }}>
              <Download size={18} style={{ color: 'var(--c-primary)' }} />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--ink)]">Export data</div>
              <div className="text-xs text-[var(--ink-muted)]">Download as CSV or Excel</div>
            </div>
          </button>

          {/* Theme toggle */}
          <button
            onClick={handleTheme}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors
              border-b border-[var(--border)] hover:bg-[var(--surface-2)]"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--c-warn) 15%, transparent)' }}>
              {theme === 'dark'
                ? <Sun size={18} style={{ color: 'var(--c-warn)' }} />
                : <Moon size={18} style={{ color: 'var(--c-warn)' }} />}
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--ink)]">
                {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              </div>
              <div className="text-xs text-[var(--ink-muted)]">
                Currently {theme} mode
              </div>
            </div>
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors
              hover:bg-[var(--tint-want)]"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--c-want) 15%, transparent)' }}>
              <LogOut size={18} style={{ color: 'var(--c-want)' }} />
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--c-want)' }}>Sign out</div>
              <div className="text-xs text-[var(--ink-muted)]">Log out of your account</div>
            </div>
          </button>
        </div>
      )}

      {/* Export dialog */}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />

      {/* Bottom nav bar */}
      <nav className="md:hidden border-t border-[var(--border)] mobile-nav-bar">
        {PRIMARY_NAV.map(({ tab, label, icon: Icon, color }) => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => { setMoreOpen(false); setActiveTab(tab) }}
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

        {/* More button */}
        <button
          onClick={() => setMoreOpen((o) => !o)}
          className={cn(
            'flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors',
            (moreActive || moreOpen) ? 'text-[var(--ink)]' : 'text-[var(--ink-subtle)]',
          )}
        >
          <MoreHorizontal size={22} style={{ color: (moreActive || moreOpen) ? 'var(--c-need)' : 'var(--ink-subtle)' }} />
          <span className="text-[10px] font-medium" style={{ color: (moreActive || moreOpen) ? 'var(--c-need)' : 'var(--ink-subtle)' }}>
            More
          </span>
        </button>
      </nav>
    </>
  )
}
