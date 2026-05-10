'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Theme } from '@/lib/types'

const STORAGE_KEY = 'ledger-theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme) || 'light'
    setTheme(stored)
    document.documentElement.setAttribute('data-theme', stored)
  }, [])

  const toggle = useCallback(async () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    document.documentElement.setAttribute('data-theme', next)

    // Persist to Supabase if authenticated
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('user_settings')
          .update({ theme: next })
          .eq('user_id', user.id)
      }
    } catch {
      // Non-critical: localStorage is the source of truth for immediate UX
    }
  }, [theme])

  return { theme, toggle }
}
