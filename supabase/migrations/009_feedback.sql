-- ════════════════════════════════════════════════════════════════
-- Ledger — Feedback table (Migration 009)
-- Single table for feature requests, bug reports, and general feedback.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.feedback (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete set null,
  user_email  text,
  type        text        not null check (type in ('feature', 'bug', 'general')),
  title       text        not null,
  description text,
  status      text        not null default 'new'
                          check (status in ('new', 'in_progress', 'done')),
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Authenticated users can submit their own feedback
create policy "feedback_insert_own"
  on public.feedback for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can view their own submissions (to track status)
create policy "feedback_select_own"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);

-- Index for admin queries
create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
create index if not exists feedback_status_idx     on public.feedback (status);
create index if not exists feedback_type_idx       on public.feedback (type);
