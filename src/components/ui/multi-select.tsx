'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectProps {
  options: { value: string; label: string; color?: string }[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder: string
  accentColor?: string
}

export function MultiSelect({ options, value, onChange, placeholder, accentColor = 'var(--c-primary)' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }

  const label = value.length === 0
    ? placeholder
    : value.length === 1
      ? options.find(o => o.value === value[0])?.label ?? placeholder
      : `${value.length} selected`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-[var(--radius-sm)] transition-colors whitespace-nowrap',
          'bg-[var(--elevated)] focus:outline-none focus:ring-2',
          value.length > 0
            ? 'border-[var(--c-primary)] text-[var(--ink)]'
            : 'border-[var(--border)] text-[var(--ink)]',
        )}
        style={value.length > 0 ? { borderColor: accentColor } : {}}
      >
        <span className="flex-1">{label}</span>
        {value.length > 0 ? (
          <X
            size={10}
            className="shrink-0 text-[var(--ink-muted)] hover:text-[var(--ink)]"
            onClick={(e) => { e.stopPropagation(); onChange([]) }}
          />
        ) : (
          <ChevronDown size={10} className="shrink-0 text-[var(--ink-muted)]" />
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-[160px] max-h-60 overflow-y-auto
          bg-[var(--elevated)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-lg py-1">
          {options.map(opt => {
            const selected = value.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                  selected ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]',
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-3.5 h-3.5 rounded-[3px] border shrink-0 transition-colors',
                  selected ? 'border-transparent' : 'border-[var(--border)]',
                )}
                  style={selected ? { backgroundColor: accentColor } : {}}
                >
                  {selected && <Check size={9} className="text-white" strokeWidth={3} />}
                </span>
                {opt.color && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                )}
                <span className="truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
