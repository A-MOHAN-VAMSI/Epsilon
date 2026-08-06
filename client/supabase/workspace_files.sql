-- ============================================================
-- EPSILON — Workspace Files table + Row Level Security
-- ------------------------------------------------------------
-- HOW TO RUN:
--   1. Go to your Supabase project dashboard
--   2. Open "SQL Editor"
--   3. Paste the entire contents of this file into a new query
--   4. Click "Run"
--
-- Run this AFTER workspaces.sql has been executed.
--
-- This file creates the `workspace_files` table and enables
-- RLS. File access is gated through the owning workspace:
-- a user can only read/modify files belonging to workspaces
-- they own (delegated via a subquery on `workspaces`).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Workspace files table
-- ------------------------------------------------------------
-- type = 'file' | 'folder'
-- parent_id supports nested folder structures (nullable = root).
-- content stores file text; NULL for folders.
-- ------------------------------------------------------------
create table if not exists public.workspace_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  parent_id uuid references public.workspace_files (id) on delete cascade,
  name text not null,
  type text not null check (type in ('file', 'folder')),
  language text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_files enable row level security;

-- ------------------------------------------------------------
-- 2. Indexes
-- ------------------------------------------------------------
create index if not exists workspace_files_workspace_id_idx on public.workspace_files (workspace_id);
create index if not exists workspace_files_parent_id_idx on public.workspace_files (parent_id);

-- ------------------------------------------------------------
-- 3. RLS policies
-- ------------------------------------------------------------
-- All file operations delegate authorization to the workspace:
-- the user must own the workspace that the file belongs to.
-- ------------------------------------------------------------

-- Select: user can read files in workspaces they own.
create policy "Users can read workspace files"
  on public.workspace_files
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_files.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- Insert: user can create files in workspaces they own.
create policy "Users can create workspace files"
  on public.workspace_files
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_files.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- Update: user can modify files in workspaces they own.
create policy "Users can update workspace files"
  on public.workspace_files
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_files.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_files.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- Delete: user can delete files in workspaces they own.
create policy "Users can delete workspace files"
  on public.workspace_files
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_files.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 4. Auto-refresh updated_at on UPDATE
-- ------------------------------------------------------------
drop trigger if exists trg_workspace_files_set_updated_at on public.workspace_files;

create trigger trg_workspace_files_set_updated_at
  before update on public.workspace_files
  for each row
  execute function public.set_updated_at();

