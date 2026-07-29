create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  person text not null default 'Casal',
  due_date date not null,
  status text not null check (status in ('paid', 'pending')),
  recurrence text not null default 'none' check (recurrence in ('none', 'monthly', 'weekly')),
  recurrence_group_id uuid,
  installment_current integer default 1,
  installment_total integer default 1,
  created_at timestamptz not null default now()
);

-- Permissões RLS
alter table public.transactions enable row level security;

drop policy if exists "Users can read own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can delete own transactions"
  on public.transactions
  for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------
-- CASO JÁ TENHA CRIADO A TABELA ANTERIORMENTE NO SUPABASE:
-- Execute os comandos abaixo no SQL Editor do Supabase para atualizar a tabela:
-- ----------------------------------------------------
-- alter table public.transactions add column if not exists installment_current integer default 1;
-- alter table public.transactions add column if not exists installment_total integer default 1;

