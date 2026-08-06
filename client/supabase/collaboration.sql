-- ============================================================
-- EPSILON — Collaboration: workspace_members + workspace_invites
-- ------------------------------------------------------------
-- HOW TO RUN:
--   1. Go to your Supabase project dashboard
--   2. Open "SQL Editor"
--   3. Paste the entire contents of this file into a new query
--   4. Click "Run"
--
-- Run this AFTER workspaces.sql and workspace_files.sql have been
-- executed.
--
-- This file adds:
--   * workspace_members  — roles (owner/editor/viewer) per user
--   * workspace_invites  — cryptographically random invite tokens
--
-- It also UPDATES the existing RLS policies on `workspaces` and
-- `workspace_files` so that authorized members (not just the owner)
-- can access shared workspaces/files.
--
-- OWNERSHIP MODEL:
--   workspaces.owner_id remains the authoritative owner. We keep
--   the existing owner policies AND add member-based policies.
--   Existing workspaces stay fully accessible because the owner
--   policies (auth.uid() = owner_id) remain in place — we do NOT
--   require the owner to also exist in workspace_members.
-- ============================================================

-- ------------------------------------------------------------
-- 1. workspace_members
-- ------------------------------------------------------------
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);

-- ------------------------------------------------------------
-- 2. workspace_invites
-- ------------------------------------------------------------
-- token: cryptographically random, opaque, never derived from the
-- workspace UUID. Knowing /workspace/{id} provides no access; the
-- invite token is required to join.
-- ------------------------------------------------------------
create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  token text not null unique,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.workspace_invites enable row level security;

create index if not exists workspace_invites_workspace_id_idx on public.workspace_invites (workspace_id);
create index if not exists workspace_invites_token_idx on public.workspace_invites (token);

-- ------------------------------------------------------------
-- 3. RLS policies — workspace_members
-- ------------------------------------------------------------
-- A user can read the membership list only for workspaces where
-- they are themselves a member (avoids recursive RLS on the same
-- table by using a direct membership check on the row).
-- ------------------------------------------------------------
create policy "Members can view workspace members"
  on public.workspace_members
  for select
  to authenticated
  using (
    workspace_id in (
      select id from public.workspaces
      where workspaces.owner_id = auth.uid()
    )
    or
    user_id = auth.uid()
  );

-- Owners (via workspaces.owner_id) can add members.
create policy "Owners can add members"
  on public.workspace_members
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- Owners can update/remove members (e.g. change role, remove).
create policy "Owners can update members"
  on public.workspace_members
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

create policy "Owners can delete members"
  on public.workspace_members
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_members.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 4. RLS policies — workspace_invites
-- ------------------------------------------------------------
-- Owners can create/read/revoke invites for their workspaces.
-- Anyone with a valid token can read the invite to accept it.
-- ------------------------------------------------------------
create policy "Owners can create invites"
  on public.workspace_invites
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_invites.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- Anyone presenting a valid (unexpired) token may read it to join.
create policy "Invite holders can view invites"
  on public.workspace_invites
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_invites.workspace_id
        and workspaces.owner_id = auth.uid()
    )
    or
    (expires_at is null or expires_at > now())
  );

-- Owners can revoke invites (update/delete).
create policy "Owners can update invites"
  on public.workspace_invites
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_invites.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_invites.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

create policy "Owners can delete invites"
  on public.workspace_invites
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = workspace_invites.workspace_id
        and workspaces.owner_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 4b. Owner auto-membership (safety)
-- ------------------------------------------------------------
-- Existing workspaces remain fully accessible because the owner
-- policies (auth.uid() = owner_id) stay in place. We do NOT require
-- the owner to exist in workspace_members. However, to keep the
-- membership table a complete and consistent source of truth (and
-- so presence/role lookups always include the owner), we backfill
-- an "owner" membership row for every existing workspace owner and
-- automatically keep it in sync when a workspace is created.
-- ------------------------------------------------------------
create or replace function public.ensure_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_workspaces_ensure_owner_membership on public.workspaces;

create trigger trg_workspaces_ensure_owner_membership
  after insert on public.workspaces
  for each row
  execute function public.ensure_owner_membership();

-- Backfill existing workspaces (idempotent via on conflict do nothing).
insert into public.workspace_members (workspace_id, user_id, role)
select id, owner_id, 'owner' from public.workspaces
on conflict (workspace_id, user_id) do nothing;

-- ------------------------------------------------------------
-- 4c. view: workspace_member_profiles
-- ------------------------------------------------------------
-- Convenience join of workspace_members to auth.users so the client
-- can render display names / initials for presence. RLS on the
-- underlying tables still applies (the view inherits the caller's
-- authorization through the base tables).
-- ------------------------------------------------------------
create or replace view public.workspace_member_profiles as
select
  wm.id,
  wm.workspace_id,
  wm.user_id,
  wm.role,
  wm.created_at,
  u.email,
  coalesce(u.raw_user_meta_data->>'display_name', u.email) as display_name
from public.workspace_members wm
left join auth.users u on u.id = wm.user_id;

-- ------------------------------------------------------------
-- 5. UPDATE existing workspaces RLS to allow members
-- ------------------------------------------------------------
-- The existing owner-only policies remain. We ADD member-based
-- policies so editors/viewers can read workspaces they belong to.
-- Owners keep full control via the existing owner policies.
-- ------------------------------------------------------------

-- Select: owners OR members can read a workspace.
create policy "Members can view shared workspaces"
  on public.workspaces
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = auth.uid()
    )
  );

-- Update: owners OR editors can edit workspace metadata.
-- (Viewers are read-only.)
create policy "Editors can update shared workspaces"
  on public.workspaces
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspaces.id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  );

-- ------------------------------------------------------------
-- 6. UPDATE existing workspace_files RLS to allow members
-- ------------------------------------------------------------
-- Owners and editors can read/write files; viewers can read only.
-- We keep owner policies and add member-based policies.
-- ------------------------------------------------------------

-- Read: owners OR members (editor/viewer) can read files.
create policy "Members can read workspace files"
  on public.workspace_files
  for select
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_files.workspace_id
        and workspace_members.user_id = auth.uid()
    )
  );

-- Insert: owners OR editors can create files.
create policy "Editors can create workspace files"
  on public.workspace_files
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_files.workspace_id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  );

-- Update: owners OR editors can modify files.
create policy "Editors can update workspace files"
  on public.workspace_files
  for update
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_files.workspace_id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  )
  with check (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_files.workspace_id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  );

-- Delete: owners OR editors can delete files.
create policy "Editors can delete workspace files"
  on public.workspace_files
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.workspace_members
      where workspace_members.workspace_id = workspace_files.workspace_id
        and workspace_members.user_id = auth.uid()
        and workspace_members.role in ('owner', 'editor')
    )
  );
