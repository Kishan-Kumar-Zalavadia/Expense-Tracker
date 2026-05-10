'use client'

import { useState } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { SalaryConfig } from '@/lib/types'

interface SalaryPanelProps {
  userId: string
  configs: SalaryConfig[]
  onSave: () => void
}

interface EditState {
  year: number
  salary: string
  needs_pct: number
  wants_pct: number
  savings_pct: number
}

const TYPE_COLORS = {
  needs:   'var(--c-need)',
  wants:   'var(--c-want)',
  savings: 'var(--c-save)',
}

export function SalaryPanel({ userId, configs, onSave }: SalaryPanelProps) {
  const supabase = createClient()
  const [editing, setEditing] = useState<number | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [adding, setAdding] = useState(false)
  const [newConfig, setNewConfig] = useState<EditState>({
    year: new Date().getFullYear(),
    salary: '',
    needs_pct: 50,
    wants_pct: 30,
    savings_pct: 20,
  })

  const startEdit = (config: SalaryConfig) => {
    setEditing(config.year)
    setEditState({
      year: config.year,
      salary: String(config.salary),
      needs_pct: config.needs_pct,
      wants_pct: config.wants_pct,
      savings_pct: config.savings_pct,
    })
  }

  const saveEdit = async () => {
    if (!editState) return
    const total = editState.needs_pct + editState.wants_pct + editState.savings_pct
    if (total !== 100) { toast.error('Percentages must sum to 100'); return }

    const { error } = await supabase
      .from('salary_config')
      .upsert({
        user_id: userId,
        year: editState.year,
        salary: parseFloat(editState.salary),
        needs_pct: editState.needs_pct,
        wants_pct: editState.wants_pct,
        savings_pct: editState.savings_pct,
      })
    if (error) { toast.error(error.message); return }
    toast.success('Salary config saved')
    setEditing(null)
    onSave()
  }

  const saveNew = async () => {
    const total = newConfig.needs_pct + newConfig.wants_pct + newConfig.savings_pct
    if (total !== 100) { toast.error('Percentages must sum to 100'); return }
    if (!newConfig.salary) { toast.error('Enter a salary'); return }

    const { error } = await supabase
      .from('salary_config')
      .upsert({
        user_id: userId,
        year: newConfig.year,
        salary: parseFloat(newConfig.salary),
        needs_pct: newConfig.needs_pct,
        wants_pct: newConfig.wants_pct,
        savings_pct: newConfig.savings_pct,
      })
    if (error) { toast.error(error.message); return }
    toast.success('Config added')
    setAdding(false)
    onSave()
  }

  const inputCls = 'px-2 py-1 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-sm text-[var(--ink)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] w-full'
  const pctInputCls = 'px-2 py-1 text-sm bg-[var(--elevated)] border-l-4 border-[var(--border)] rounded-sm text-[var(--ink)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] w-20'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="section-bar" style={{ backgroundColor: 'var(--c-primary)' }} />
        <h2 className="font-display text-lg font-medium text-[var(--ink)]">Salary & Budget</h2>
      </div>

      <p className="text-xs text-[var(--ink-muted)]">
        Monthly salary and split percentages per year. Percentages must sum to 100.
      </p>

      {/* Table */}
      <div className="border border-[var(--border)] rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--surface)] border-b border-[var(--border)]">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide">Year</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide">Monthly salary</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide w-20">
                <span style={{ color: TYPE_COLORS.needs }}>Needs</span>
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide w-20">
                <span style={{ color: TYPE_COLORS.wants }}>Wants</span>
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--ink-muted)] uppercase tracking-wide w-20">
                <span style={{ color: TYPE_COLORS.savings }}>Savings</span>
              </th>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {configs.map((config) => {
              const isEditingThis = editing === config.year
              const s = isEditingThis ? editState! : config
              return (
                <tr key={config.year} className="bg-[var(--elevated)]">
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums text-[var(--ink)]">
                    {config.year}
                  </td>
                  <td className="px-4 py-3">
                    {isEditingThis ? (
                      <input
                        type="number"
                        value={editState!.salary}
                        onChange={(e) => setEditState({ ...editState!, salary: e.target.value })}
                        className={inputCls}
                      />
                    ) : (
                      <span className="tabular-nums text-sm text-[var(--ink)]">
                        ₹{Number(config.salary).toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>
                  {(['needs_pct', 'wants_pct', 'savings_pct'] as const).map((field, idx) => {
                    const colors = [TYPE_COLORS.needs, TYPE_COLORS.wants, TYPE_COLORS.savings]
                    return (
                      <td key={field} className="px-4 py-3">
                        {isEditingThis ? (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editState![field]}
                            onChange={(e) => setEditState({ ...editState!, [field]: parseInt(e.target.value) || 0 })}
                            className={pctInputCls}
                            style={{ borderLeftColor: colors[idx] }}
                          />
                        ) : (
                          <span
                            className="tabular-nums text-sm font-medium px-2 py-0.5 rounded-sm"
                            style={{ color: colors[idx], backgroundColor: colors[idx] + '15' }}
                          >
                            {config[field]}%
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {isEditingThis ? (
                        <>
                          <button onClick={saveEdit}
                            className="p-1.5 rounded-sm text-[var(--c-save)] hover:bg-[var(--tint-save)] transition-colors">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="p-1.5 rounded-sm text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
                            <X size={13} />
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(config)}
                          className="px-2 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)]
                            border border-[var(--border)] rounded-sm hover:bg-[var(--surface)] transition-colors">
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add new year */}
      {adding ? (
        <div className="border border-[var(--border)] rounded-sm p-4 bg-[var(--elevated)] space-y-3">
          <h3 className="text-sm font-medium text-[var(--ink)]">New year config</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Year</label>
              <input type="number" value={newConfig.year}
                onChange={(e) => setNewConfig({ ...newConfig, year: parseInt(e.target.value) || 0 })}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--ink-muted)] mb-1">Monthly salary</label>
              <input type="number" value={newConfig.salary}
                onChange={(e) => setNewConfig({ ...newConfig, salary: e.target.value })}
                className={inputCls} placeholder="50000" />
            </div>
            {(['needs_pct', 'wants_pct', 'savings_pct'] as const).map((field, idx) => {
              const labels = ['Needs %', 'Wants %', 'Savings %']
              const colors = [TYPE_COLORS.needs, TYPE_COLORS.wants, TYPE_COLORS.savings]
              return (
                <div key={field}>
                  <label className="block text-xs mb-1 font-medium" style={{ color: colors[idx] }}>
                    {labels[idx]}
                  </label>
                  <input type="number" min={0} max={100} value={newConfig[field]}
                    onChange={(e) => setNewConfig({ ...newConfig, [field]: parseInt(e.target.value) || 0 })}
                    className={pctInputCls}
                    style={{ borderLeftColor: colors[idx], width: '100%' }} />
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button onClick={saveNew} className="btn-primary text-xs px-3 py-1.5">Add</button>
            <button onClick={() => setAdding(false)}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-sm
              text-[var(--ink-muted)] hover:bg-[var(--surface)] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--ink-muted)]
            border border-dashed border-[var(--border)] rounded-sm hover:text-[var(--ink)]
            hover:border-[var(--border-strong)] transition-colors"
        >
          <Plus size={12} />
          Add year
        </button>
      )}
    </div>
  )
}
