-- Life OS schema — run this once in the Supabase SQL editor for your project.
-- Holds only app-specific data that has no home in Notion (savings targets,
-- long-term goal tracking, and daily habit logs).

create table if not exists savings_goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists long_term_goals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  target_date date,
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  unique (habit_id, log_date)
);

-- Single-row table: your monthly MRR target, shown as a progress bar on
-- Overview. Always read/written at id='default' so there's only ever one row.
create table if not exists revenue_goal (
  id text primary key default 'default',
  monthly_target numeric not null default 0,
  updated_at timestamptz not null default now()
);

-- This app is for single-user local use only, so RLS is left disabled here.
-- If you ever expose this beyond localhost, enable RLS and add policies
-- scoped to an authenticated user before doing so.
