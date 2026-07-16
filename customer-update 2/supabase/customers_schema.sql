-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run
-- Adds a customers directory used by the "add customer before sale" flow.

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  created_at timestamptz not null default now()
);

create index if not exists customers_name_idx on customers (name);

alter table customers enable row level security;

create policy "Allow all reads" on customers
  for select using (true);

create policy "Allow all inserts" on customers
  for insert with check (true);
