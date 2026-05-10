'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { CategoriesPanel } from './categories-panel'
import { PaymentModesPanel } from './payment-modes-panel'
import { SalaryPanel } from './salary-panel'
import { GeneralPanel } from './general-panel'
import type { Category, PaymentMode, SalaryConfig, UserSettings } from '@/lib/types'

interface SettingsClientProps {
  userId: string
  settings: UserSettings
  categories: Category[]
  paymentModes: PaymentMode[]
  salaryConfigs: SalaryConfig[]
}

type Tab = 'general' | 'salary' | 'categories' | 'payment'

export function SettingsClient({
  userId,
  settings,
  categories,
  paymentModes,
  salaryConfigs,
}: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const refresh = () => router.refresh()

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'general',    label: 'General',        color: 'var(--c-warn)' },
    { id: 'salary',     label: 'Salary & Budget', color: 'var(--c-primary)' },
    { id: 'categories', label: 'Categories',      color: 'var(--c-berry)' },
    { id: 'payment',    label: 'Payment Modes',   color: 'var(--c-need)' },
  ]

  return (
    <div className="page-enter flex flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="inline-flex items-center px-2 py-0.5 mb-2 rounded-sm text-[10px] font-bold
          uppercase tracking-widest text-white"
          style={{ backgroundColor: 'var(--c-warn)' }}>
          Settings
        </div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-[var(--ink)]">
          Preferences
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{
              color: activeTab === tab.id ? tab.color : 'var(--ink-muted)',
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: tab.color }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-sm p-6">
        {activeTab === 'general'    && <GeneralPanel userId={userId} settings={settings} onSave={refresh} />}
        {activeTab === 'salary'     && <SalaryPanel userId={userId} configs={salaryConfigs} onSave={refresh} />}
        {activeTab === 'categories' && <CategoriesPanel userId={userId} categories={categories} onSave={refresh} />}
        {activeTab === 'payment'    && <PaymentModesPanel userId={userId} paymentModes={paymentModes} onSave={refresh} />}
      </div>
    </div>
  )
}
