'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CategoriesPanel } from './categories-panel'
import { PaymentModesPanel } from './payment-modes-panel'
import { BudgetPeriodsPanel } from './budget-periods-panel'
import { GeneralPanel } from './general-panel'
import { RecurringPanel } from './recurring-panel'
import type { BudgetPeriod, Category, PaymentMode, RecurringItem, UserSettings } from '@/lib/types'

interface SettingsClientProps {
  userId: string
  settings: UserSettings
  categories: Category[]
  paymentModes: PaymentMode[]
  budgetPeriods: BudgetPeriod[]
  recurringItems: RecurringItem[]
  usedCategoryIds: string[]
  usedPaymentModeIds: string[]
}

type Tab = 'general' | 'budget' | 'categories' | 'payment' | 'recurring'

export function SettingsClient({
  userId,
  settings,
  categories,
  paymentModes,
  budgetPeriods,
  recurringItems,
  usedCategoryIds,
  usedPaymentModeIds,
}: SettingsClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const refresh = () => router.refresh()

  const tabs: { id: Tab; label: string; color: string }[] = [
    { id: 'general',    label: 'General',        color: 'var(--c-warn)' },
    { id: 'budget',     label: 'Budget',          color: 'var(--c-primary)' },
    { id: 'categories', label: 'Categories',      color: 'var(--c-berry)' },
    { id: 'payment',    label: 'Payment Modes',   color: 'var(--c-need)' },
    { id: 'recurring',  label: 'Recurring',       color: 'var(--c-save)' },
  ]

  return (
    <div className="page-enter flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="inline-flex items-center px-2 py-0.5 mb-2 rounded-full text-[10px] font-bold
          uppercase tracking-widest text-white"
          style={{ backgroundColor: 'var(--c-warn)' }}>
          Settings
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
          Preferences
        </h1>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap"
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
      <div className="apple-card p-4 sm:p-6">
        {activeTab === 'general'    && <GeneralPanel userId={userId} settings={settings} onSave={refresh} />}
        {activeTab === 'budget'     && (
          <BudgetPeriodsPanel
            userId={userId}
            periods={budgetPeriods}
            paymentModes={paymentModes.filter((pm) => !pm.archived)}
            currency={settings.currency}
            onSave={refresh}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesPanel
            userId={userId}
            categories={categories}
            usedCategoryIds={usedCategoryIds}
            onSave={refresh}
          />
        )}
        {activeTab === 'payment' && (
          <PaymentModesPanel
            userId={userId}
            paymentModes={paymentModes}
            usedPaymentModeIds={usedPaymentModeIds}
            onSave={refresh}
          />
        )}
        {activeTab === 'recurring'  && (
          <RecurringPanel
            userId={userId}
            items={recurringItems}
            categories={categories.filter((c) => !c.archived)}
            paymentModes={paymentModes.filter((pm) => !pm.archived)}
            currency={settings.currency}
            onSave={refresh}
          />
        )}
      </div>
    </div>
  )
}
