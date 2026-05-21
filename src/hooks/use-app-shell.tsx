'use client'

import { createContext, useContext, useState } from 'react'

export type AppTab =
  | 'dashboard' | 'expenses' | 'income'
  | 'weekly'    | 'yearly'   | 'settings'
  | 'feedback'  | 'admin'

interface AppShellContextValue {
  activeTab:      AppTab
  setActiveTab:   (tab: AppTab) => void
  visitedTabs:    Set<AppTab>
  isAdmin:        boolean
  refreshKey:     number
  refreshSource:  string | null
  triggerRefresh: (source: string) => void
}

const AppShellContext = createContext<AppShellContextValue>({
  activeTab:      'dashboard',
  setActiveTab:   () => {},
  visitedTabs:    new Set(['dashboard']),
  isAdmin:        false,
  refreshKey:     0,
  refreshSource:  null,
  triggerRefresh: () => {},
})

export function AppShellProvider({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode
  isAdmin?: boolean
}) {
  const [activeTab, setActiveTab]     = useState<AppTab>('dashboard')
  const [visitedTabs, setVisitedTabs] = useState<Set<AppTab>>(new Set(['dashboard']))
  const [refreshState, setRefreshState] = useState<{ key: number; source: string | null }>({ key: 0, source: null })

  const handleSetActiveTab = (tab: AppTab) => {
    setActiveTab(tab)
    setVisitedTabs((prev) => new Set([...prev, tab]))
  }

  const triggerRefresh = (source: string) => {
    setRefreshState((prev) => ({ key: prev.key + 1, source }))
  }

  return (
    <AppShellContext.Provider
      value={{
        activeTab, setActiveTab: handleSetActiveTab, visitedTabs, isAdmin,
        refreshKey: refreshState.key, refreshSource: refreshState.source, triggerRefresh,
      }}
    >
      {children}
    </AppShellContext.Provider>
  )
}

export function useAppShell() {
  return useContext(AppShellContext)
}
