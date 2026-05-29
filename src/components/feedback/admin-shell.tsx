'use client'

import { useState, useEffect, useRef } from 'react'
import { Shield } from 'lucide-react'
import { AdminPanel } from './admin-panel'
import { AdminOverview } from './admin-overview'
import { fetchAdminData, type AdminData } from '@/app/(app)/dashboard/actions/feedback'

type AdminTab = 'overview' | 'feedback'

const TABS: { id: AdminTab; label: string; color: string }[] = [
  { id: 'overview', label: 'Overview', color: 'var(--c-primary)' },
  { id: 'feedback', label: 'Feedback', color: 'var(--c-warn)'   },
]

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <span className="animate-spin w-8 h-8 border-2 border-[var(--c-primary)] border-t-transparent rounded-full" />
    </div>
  )
}

export function AdminShell() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  // Load overview data on mount (and only once)
  useEffect(() => {
    if (activeTab === 'overview' && !loadedRef.current) {
      loadedRef.current = true
      setLoading(true)
      fetchAdminData().then((data) => {
        setAdminData(data)
        setLoading(false)
      })
    }
  }, [activeTab])

  return (
    <div className="page-enter flex flex-col gap-0 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
            style={{ backgroundColor: 'var(--c-warn)' }}
          >
            <Shield size={9} /> Admin
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-[var(--ink)]">
            Command Center
          </h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--border)] overflow-x-auto px-4 sm:px-6 mt-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap touch-manipulation min-h-[44px]"
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
      {activeTab === 'overview' && (
        loading ? (
          <Spinner />
        ) : adminData ? (
          <AdminOverview data={adminData} />
        ) : (
          <div className="flex items-center justify-center h-64 text-sm text-[var(--ink-muted)]">
            Failed to load admin data.
          </div>
        )
      )}

      {activeTab === 'feedback' && <AdminPanel />}
    </div>
  )
}
