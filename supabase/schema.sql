-- Run this in Supabase: Dashboard → SQL Editor → New query → paste → Run

create extension if not exists "pgcrypto";

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  division text not null check (division in ('auto_body', 'towing', 'mechanic', 'auto_hub')),
  type text not null check (type in ('cash_in', 'cash_out', 'debit_sale')),
  amount numeric not null check (amount >= 0),
  customer text default '',
  description text default '',
  points_earned integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists transactions_division_idx on transactions (division);
create index if not exists transactions_created_at_idx on transactions (created_at);

-- Row Level Security: open for now so the app works immediately with the anon key.
-- Before giving this a public URL, add real auth and lock these policies down
-- (e.g. restrict to authenticated staff users only).
alter table transactions enable row level security;

create policy "Allow all reads" on transactions
  for select using (true);

create policy "Allow all inserts" on transactions
  for insert with check (true);

create policy "Allow all deletes" on transactions
  for delete using (true);
