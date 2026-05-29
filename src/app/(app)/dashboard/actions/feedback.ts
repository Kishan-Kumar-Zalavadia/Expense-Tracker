'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_EMAIL } from '@/lib/constants'

export type FeedbackType   = 'feature' | 'bug' | 'general'
export type FeedbackStatus = 'new' | 'in_progress' | 'done'

export interface FeedbackItem {
  id: string
  user_id: string | null
  user_email: string | null
  type: FeedbackType
  title: string
  description: string | null
  status: FeedbackStatus
  admin_note: string | null
  created_at: string
  updated_at: string
}

// ─── Submit feedback (any authenticated user) ─────────────────────────────────
export async function submitFeedback(
  type: FeedbackType,
  title: string,
  description: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('feedback').insert({
    user_id:     user.id,
    user_email:  user.email,
    type,
    title:       title.trim(),
    description: description.trim() || null,
  })

  return error ? { error: error.message } : {}
}

// ─── Fetch current user's own feedback ───────────────────────────────────────
export async function fetchMyFeedback(): Promise<FeedbackItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data ?? []) as FeedbackItem[]
}

// ─── Fetch all feedback (admin only) ─────────────────────────────────────────
export async function fetchAllFeedback(): Promise<FeedbackItem[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  return (data ?? []) as FeedbackItem[]
}

// ─── Update status + optional note (admin only) ───────────────────────────────
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  adminNote?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('feedback')
    .update({
      status,
      admin_note: adminNote !== undefined ? adminNote : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  return error ? { error: error.message } : {}
}

// ─── User count (admin only) ──────────────────────────────────────────────────
export async function fetchUserCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return 0

  const admin = createAdminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1 })
  return ('total' in data && typeof data.total === 'number') ? data.total : 0
}

// ─── Delete feedback (admin only) ─────────────────────────────────────────────
export async function deleteFeedback(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin.from('feedback').delete().eq('id', id)
  return error ? { error: error.message } : {}
}
