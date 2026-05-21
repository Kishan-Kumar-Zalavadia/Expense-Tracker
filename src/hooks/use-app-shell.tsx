'use client'

import { createContext, useContext, useState } from 'react'

export type AppTab =
  | 'dashboard' | 'expenses' | 'income'
  | 'weekly'    | 'yearly'   | 'settings'
  | 'feedback'  | 'admin'

interface AppShellContextValue {
  activeTab:    AppTab
  setActiveTab: (tab: AppTab) => void
  visitedTabs:  Set<AppTab>
  isAdmin:      boolean
}

const AppShellContext = createContext<AppShellContextValue>({
  activeTab:    'dashboard',
  setActiveTab: () => {},
  visitedTabs:  new Set(['dashboard']),
  isAdmin:      false,
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

  const handleSetActiveTab = (tab: AppTab) => {
    setActiveTab(tab)
    setVisitedTabs((prev) => new Set([...prev, tab]))
  }

  return (
    <AppShellContext.Provider
      value={{ activeTab, setActiveTab: handleSetActiveTab, visitedTabs, isAdmin }}
    >
      {children}
    </AppShellContext.Provider>
  )
}

export function useAppShell() {
  return useContext(AppShellContext)
}
