-- ============================================================
-- EPSILON — Workspaces table + Row Level Security
-- ------------------------------------------------------------
-- HOW TO RUN:
--   1. Go to your Supabase project dashboard
--   2. Open "SQL Editor"
--   3. Paste the entire contents of this file into a new query
--   4. Click "Run"
--
-- This file creates the `workspaces` table and enables Row Level
-- Security (RLS). Every workspace is owned by the authenticated
-- Supabase user that created it. Users can only see/modify their
-- own workspaces. The frontend only ever uses the anon key plus
-- the authenticated user's access token — never the service role.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enable UUID extension (idempotent)
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 2. Workspaces table
-- ------------------------------------------------------------
-- The `workspace_members` table can be introduced later for
-- collaborative access WITHOUT restructuring workspaces.
-- `owner_id` remains the single creator/owner of a workspace.
-- ------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text,
  owner_id uuid not null references auth.users (id) on delete cascade,
  language text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

-- ------------------------------------------------------------
-- 3. Indexes for owner-scoped queries
-- ------------------------------------------------------------
create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);
create index if not exists workspaces_updated_at_idx on public.workspaces (updated_at desc);

-- ------------------------------------------------------------
-- 4. RLS policies
-- ------------------------------------------------------------
-- Insert: a user can create a workspace ONLY if they are the owner.
create policy "Users can create their own workspaces"
  on public.workspaces
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

-- Select: a user can read ONLY their own workspaces.
create policy "Users can view their own workspaces"
  on public.workspaces
  for select
  to authenticated
  using (auth.uid() = owner_id);

-- Update: a user can modify ONLY their own workspaces.
-- updated_at is refreshed automatically on every row change.
create policy "Users can update their own workspaces"
  on public.workspaces
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Delete: a user can delete ONLY their own workspaces.
create policy "Users can delete their own workspaces"
  on public.workspaces
  for delete
  to authenticated
  using (auth.uid() = owner_id);

-- ------------------------------------------------------------
-- 5. Auto-refresh updated_at on UPDATE
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_workspaces_set_updated_at on public.workspaces;

create trigger trg_workspaces_set_updated_at
  before update on public.workspaces
  for each row
  execute function public.set_updated_at();

