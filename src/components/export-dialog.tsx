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

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [preset, setPreset] = useState<Preset>('all')
  const [loading, setLoading] = useState<'csv' | 'xlsx' | null>(null)
  const supabase = createClient()

  const fetchData = async () => {
    const { from, to } = getDateRange(preset)
    let query = supabase
      .from('expenses')
      .select('date, description, category:categories(name), amount, payment_mode:payment_modes(name), type, notes')
      .order('date', { ascending: true })

    if (from) query = query.gte('date', from)
    if (to)   query = query.lte('date', to)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map((e) => ({
      Date:         e.date,
      Description:  e.description,
      Category:     (e.category as unknown as { name: string } | null)?.name ?? '',
      Amount:       Number(e.amount),
      'Payment Mode': (e.payment_mode as unknown as { name: string } | null)?.name ?? '',
      Type:         e.type,
      Notes:        e.notes ?? '',
    }))
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
      a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
      onOpenChange(false)
    } catch (e) {
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
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses')

      // Column widths
      ws['!cols'] = [
        { wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 30 },
      ]

      XLSX.writeFile(wb, `expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      toast.success('Excel exported')
      onOpenChange(false)
    } catch (e) {
      toast.error('Export failed')
    } finally {
      setLoading(null)
    }
  }

  const selectCls = 'px-3 py-2 text-sm bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 border border-[var(--border)] bg-[var(--elevated)]" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="h-[3px]" style={{ backgroundColor: 'var(--c-primary)' }} />
        <div className="px-6 pt-4 pb-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="font-display text-xl font-medium text-[var(--ink)]">
              Export data
            </DialogTitle>
          </DialogHeader>

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
