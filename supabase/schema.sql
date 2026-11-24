-- TaskFlow Supabase Schema Reference
-- Matches the existing public.tasks table columns and "Users manage own tasks" RLS policy

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  due_date date null,
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  category text not null default 'Work',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_user_created_idx on public.tasks (user_id, created_at desc);

alter table public.tasks enable row level security;

-- Existing policy in project:
-- "Users manage own tasks" (for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id))
