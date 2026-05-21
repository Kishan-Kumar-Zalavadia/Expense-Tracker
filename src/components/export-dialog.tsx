'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { format, subMonths, startOfYear, startOfMonth, endOfMonth } from 'date-fns'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Preset = 'this_month' | 'last_3' | 'this_year' | 'all'

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_3',     label: 'Last 3 months' },
  { id: 'this_year',  label: 'This year' },
  { id: 'all',        label: 'All time' },
]

function getDateRange(preset: Preset): { from: string | null; to: string | null } {
  const now = new Date()
  switch (preset) {
    case 'this_month':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to:   format(endOfMonth(now),   'yyyy-MM-dd'),
      }
    case 'last_3':
      return {
        from: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
        to:   format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'this_year':
      return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` }
    case 'all':
      return { from: null, to: null }
  }
}

type Row = {
  Date: string
  Type: string
  Description: string
  Category: string
  Amount: number
  'Payment Mode': string
  'Expense Type': string
  Notes: string
  _sortDate: string
  _sortCreatedAt: string
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [preset, setPreset] = useState<Preset>('all')
  const [loading, setLoading] = useState<'csv' | 'xlsx' | null>(null)
  const supabase = createClient()

  const fetchData = async (): Promise<Omit<Row, '_sortDate' | '_sortCreatedAt'>[]> => {
    const { from, to } = getDateRange(preset)

    // Fetch expenses
    let expQ = supabase
      .from('expenses')
      .select('date, description, category:categories(name), amount, payment_mode:payment_modes(name), type, notes, created_at')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (from) expQ = expQ.gte('date', from)
    if (to)   expQ = expQ.lte('date', to)
    const { data: expData, error: expError } = await expQ
    if (expError) throw expError

    // Fetch incomes
    let incQ = supabase
      .from('incomes')
      .select('date, description, payment_mode:payment_modes(name), amount, notes, created_at')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (from) incQ = incQ.gte('date', from)
    if (to)   incQ = incQ.lte('date', to)
    const { data: incData, error: incError } = await incQ
    if (incError) throw incError

    // Map expenses — negative amounts
    const expenseRows: Row[] = (expData ?? []).map((e) => ({
      Date:           e.date,
      Type:           'Expense',
      Description:    e.description ?? '',
      Category:       (e.category as unknown as { name: string } | null)?.name ?? '',
      Amount:         -Math.abs(Number(e.amount)),
      'Payment Mode': (e.payment_mode as unknown as { name: string } | null)?.name ?? '',
      'Expense Type': e.type ?? '',
      Notes:          e.notes ?? '',
      _sortDate:      e.date,
      _sortCreatedAt: e.created_at,
    }))

    // Map incomes — positive amounts
    const incomeRows: Row[] = (incData ?? []).map((i) => ({
      Date:           i.date,
      Type:           'Income',
      Description:    i.description ?? '',
      Category:       '',
      Amount:         Math.abs(Number(i.amount)),
      'Payment Mode': (i.payment_mode as unknown as { name: string } | null)?.name ?? '',
      'Expense Type': '',
      Notes:          i.notes ?? '',
      _sortDate:      i.date,
      _sortCreatedAt: i.created_at,
    }))

    // Merge and sort: date descending, then created_at descending within same date
    const merged = [...expenseRows, ...incomeRows].sort((a, b) => {
      if (b._sortDate !== a._sortDate) return b._sortDate.localeCompare(a._sortDate)
      return b._sortCreatedAt.localeCompare(a._sortCreatedAt)
    })

    // Strip internal sort fields
    return merged.map(({ _sortDate: _d, _sortCreatedAt: _c, ...row }) => row)
  }

  const exportCSV = async () => {
    setLoading('csv')
    try {
      const rows = await fetchData()
      if (!rows.length) { toast.error('No data to export'); return }
      const headers = Object.keys(rows[0])
      const csv = [
        headers.join(','),
        ...rows.map((r) =>
          headers.map((h) => {
            const v = String(r[h as keyof typeof r])
            return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
          }).join(',')
        ),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `ledger_${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
      onOpenChange(false)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  const exportXLSX = async () => {
    setLoading('xlsx')
    try {
      const rows = await fetchData()
      if (!rows.length) { toast.error('No data to export'); return }

      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

      ws['!cols'] = [
        { wch: 12 }, // Date
        { wch: 10 }, // Type
        { wch: 30 }, // Description
        { wch: 20 }, // Category
        { wch: 14 }, // Amount
        { wch: 16 }, // Payment Mode
        { wch: 12 }, // Expense Type
        { wch: 30 }, // Notes
      ]

      XLSX.writeFile(wb, `ledger_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      toast.success('Excel exported')
      onOpenChange(false)
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm p-0 border border-[var(--border)] bg-[var(--elevated)]
          overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)]"
        style={{ borderRadius: 'var(--radius-xl)' }}
      >
        <div className="h-1.5 w-full shrink-0"
          style={{
            backgroundColor: 'var(--c-primary)',
            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          }} />
        <div className="px-6 pt-4 pb-6 overflow-y-auto flex-1">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-display text-xl font-medium text-[var(--ink)]">
              Export data
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-[var(--ink-muted)] mb-4 -mt-2">
            Expenses and income combined, sorted by date. Expenses are negative, income is positive.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-muted)] mb-2 uppercase tracking-wide">
                Date range
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className="px-3 py-2 text-sm rounded-[var(--radius-md)] border transition-colors text-left"
                    style={{
                      backgroundColor: preset === p.id ? 'var(--ink)' : 'var(--surface)',
                      color:           preset === p.id ? 'var(--bg)' : 'var(--ink-muted)',
                      borderColor:     preset === p.id ? 'var(--ink)' : 'var(--border)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={exportCSV}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
                  bg-[var(--ink)] text-[var(--bg)] rounded-[var(--radius-md)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading === 'csv'
                  ? <span className="animate-spin w-4 h-4 border-2 border-[var(--bg)] border-t-transparent rounded-full" />
                  : <><Download size={14} /> CSV</>
                }
              </button>
              <button
                onClick={exportXLSX}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
                  border border-[var(--border)] text-[var(--ink)] rounded-[var(--radius-md)] hover:bg-[var(--surface)]
                  transition-colors disabled:opacity-50"
              >
                {loading === 'xlsx'
                  ? <span className="animate-spin w-4 h-4 border-2 border-[var(--ink)] border-t-transparent rounded-full" />
                  : <><FileSpreadsheet size={14} /> Excel</>
                }
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
