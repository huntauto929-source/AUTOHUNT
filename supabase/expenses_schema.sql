-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- Shop-wide expenses (rent, utilities, payroll, supplies, etc.) — separate from
-- per-division Cash Out records, and only shown to the owner account in the app.

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  amount numeric not null check (amount >= 0),
  description text default '',
  created_at timestamptz not null default now()
);

create index if not exists expenses_created_at_idx on expenses (created_at);

alter table expenses enable row level security;

create policy "Allow all reads" on expenses
  for select using (true);

create policy "Allow all inserts" on expenses
  for insert with check (true);

create policy "Allow all deletes" on expenses
  for delete using (true);
