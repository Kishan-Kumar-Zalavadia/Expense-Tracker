-- ════════════════════════════════════════════════════════════════
-- Ledger — Schema Migration 001
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New query)
-- ════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── categories ───────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  type        text not null check (type in ('Need','Want','Saving')),
  color       text not null,
  sort_order  int  not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Partial unique index: user cannot have two non-archived categories with the same name
create unique index if not exists categories_user_name_active_uidx
  on categories (user_id, name)
  where archived = false;

create index if not exists categories_user_id_idx on categories (user_id);

-- ─── payment_modes ────────────────────────────────────────────────
create table if not exists payment_modes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);

create unique index if not exists payment_modes_user_name_active_uidx
  on payment_modes (user_id, name)
  where archived = false;

create index if not exists payment_modes_user_id_idx on payment_modes (user_id);

-- ─── expenses ─────────────────────────────────────────────────────
create table if not exists expenses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  date             date not null,
  description      text not null,
  category_id      uuid not null references categories  (id) on delete restrict,
  amount           numeric(12,2) not null check (amount >= 0),
  payment_mode_id  uuid not null references payment_modes (id) on delete restrict,
  type             text not null check (type in ('Need','Want','Saving')),
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists expenses_user_date_idx on expenses (user_id, date);
create index if not exists expenses_user_id_idx   on expenses (user_id);

-- ─── salary_config ────────────────────────────────────────────────
create table if not exists salary_config (
  user_id      uuid not null references auth.users on delete cascade,
  year         int  not null,
  salary       numeric(12,2) not null check (salary > 0),
  needs_pct    int  not null default 50 check (needs_pct   >= 0 and needs_pct   <= 100),
  wants_pct    int  not null default 30 check (wants_pct   >= 0 and wants_pct   <= 100),
  savings_pct  int  not null default 20 check (savings_pct >= 0 and savings_pct <= 100),
  constraint salary_config_pct_sum check (needs_pct + wants_pct + savings_pct = 100),
  primary key (user_id, year)
);

create index if not exists salary_config_user_id_idx on salary_config (user_id);

-- ─── user_settings ────────────────────────────────────────────────
create table if not exists user_settings (
  user_id       uuid primary key references auth.users on delete cascade,
  weekly_limit  numeric(12,2) not null default 10000,
  currency      text not null default '₹',
  theme         text not null default 'light' check (theme in ('light','dark')),
  updated_at    timestamptz not null default now()
);
