-- ================================================================
-- Sheetshift — Complete Supabase schema
-- Run this entire file in: Dashboard → SQL Editor → New query → Run
-- Safe to re-run: uses "if not exists" and "drop policy if exists"
-- ================================================================

-- ── Invite-code generator ─────────────────────────────────────
create or replace function generate_invite_code() returns text
language plpgsql as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i      int;
begin
  for i in 1..8 loop
    result := result || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function set_org_invite_code() returns trigger
language plpgsql as $$
begin
  if new.invite_code is null or new.invite_code = '' then
    loop
      new.invite_code := generate_invite_code();
      exit when not exists (
        select 1 from public.organizations where invite_code = new.invite_code
      );
    end loop;
  end if;
  return new;
end;
$$;

-- ── Tables ────────────────────────────────────────────────────

create table if not exists public.organizations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  invite_code      text unique,
  -- Optional: org-level shared Google Drive folder URL (pasted manually by owner)
  drive_folder_url text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz default now()
);

drop trigger if exists trg_set_invite_code on public.organizations;
create trigger trg_set_invite_code
  before insert on public.organizations
  for each row execute function set_org_invite_code();

create table if not exists public.org_members (
  id        uuid primary key default gen_random_uuid(),
  org_id    uuid references public.organizations(id) on delete cascade not null,
  user_id   uuid references auth.users(id) on delete cascade not null,
  role      text check (role in ('owner','admin','member')) default 'member' not null,
  joined_at timestamptz default now(),
  unique(org_id, user_id)
);

create table if not exists public.projects (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid references public.organizations(id) on delete cascade, -- nullable: projects without an org are personal
  name              text not null,
  original_filename text not null,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz default now()
);

create table if not exists public.sections (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid references public.projects(id) on delete cascade not null,
  section_idx     int not null,
  sheet_name      text not null,
  schema_json     jsonb not null default '{}',
  bindings_json   jsonb not null default '{}',
  color_maps_json jsonb not null default '{}',
  domain          text not null default 'generic_table',
  unique(project_id, section_idx)
);

create table if not exists public.records (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid references public.sections(id) on delete cascade not null,
  row_data   jsonb not null default '{}',
  created_at timestamptz default now()
);

-- ── Storage bucket ────────────────────────────────────────────
insert into storage.buckets (id, name, public)
  values ('excel-files', 'excel-files', false)
  on conflict (id) do nothing;

-- ── Enable row-level security ─────────────────────────────────
alter table public.organizations enable row level security;
alter table public.org_members   enable row level security;
alter table public.projects      enable row level security;
alter table public.sections      enable row level security;
alter table public.records       enable row level security;

-- ── Drop all policies before recreating (idempotent) ─────────
drop policy if exists "orgs_select"     on public.organizations;
drop policy if exists "orgs_insert"     on public.organizations;
drop policy if exists "orgs_update"     on public.organizations;
drop policy if exists "orgs_delete"     on public.organizations;
drop policy if exists "members_select"  on public.org_members;
drop policy if exists "members_insert"  on public.org_members;
drop policy if exists "members_delete"  on public.org_members;
drop policy if exists "projects_select" on public.projects;
drop policy if exists "projects_insert" on public.projects;
drop policy if exists "projects_delete" on public.projects;
drop policy if exists "projects_update" on public.projects;
drop policy if exists "sections_all"    on public.sections;
drop policy if exists "records_all"     on public.records;
drop policy if exists "excel_insert"    on storage.objects;
drop policy if exists "excel_select"    on storage.objects;
drop policy if exists "excel_delete"    on storage.objects;

-- ── org_members policies ──────────────────────────────────────
-- IMPORTANT: never query org_members from within an org_members policy
-- (causes infinite recursion). Users can only see their own membership row.
create policy "members_select" on public.org_members for select
  using (user_id = (select auth.uid()));

create policy "members_insert" on public.org_members for insert
  with check (auth.uid() is not null);

create policy "members_delete" on public.org_members for delete
  using (user_id = (select auth.uid()));

-- ── organizations policies ────────────────────────────────────
-- Use explicit table aliases (organizations.id, om.org_id) to avoid
-- PostgreSQL resolving "id" as org_members.id inside the subquery.
create policy "orgs_select" on public.organizations for select using (
  exists (
    select 1 from public.org_members om
    where om.org_id = organizations.id
      and om.user_id = (select auth.uid())
  )
);

create policy "orgs_insert" on public.organizations for insert
  with check (created_by = (select auth.uid()));

create policy "orgs_update" on public.organizations for update using (
  exists (
    select 1 from public.org_members om
    where om.org_id = organizations.id
      and om.user_id = (select auth.uid())
      and om.role in ('owner','admin')
  )
);

create policy "orgs_delete" on public.organizations for delete using (
  exists (
    select 1 from public.org_members om
    where om.org_id = organizations.id
      and om.user_id = (select auth.uid())
      and om.role = 'owner'
  )
);

-- ── projects policies ─────────────────────────────────────────
-- Projects with an org_id: accessible to org members
-- Projects without an org_id: accessible to the creator only
create policy "projects_select" on public.projects for select using (
  projects.created_by = (select auth.uid()) or
  (projects.org_id is not null and exists (
    select 1 from public.org_members om
    where om.org_id = projects.org_id
      and om.user_id = (select auth.uid())
  ))
);

create policy "projects_insert" on public.projects for insert with check (
  projects.created_by = (select auth.uid())
);

create policy "projects_delete" on public.projects for delete using (
  projects.created_by = (select auth.uid()) or
  (projects.org_id is not null and exists (
    select 1 from public.org_members om
    where om.org_id = projects.org_id
      and om.user_id = (select auth.uid())
      and om.role in ('owner','admin')
  ))
);

create policy "projects_update" on public.projects for update using (
  projects.created_by = (select auth.uid()) or
  (projects.org_id is not null and exists (
    select 1 from public.org_members om
    where om.org_id = projects.org_id
      and om.user_id = (select auth.uid())
  ))
);

-- ── sections policies ─────────────────────────────────────────
-- Covers both org projects (via org_members) and personal projects (via created_by)
create policy "sections_all" on public.sections for all using (
  exists (
    select 1 from public.projects p
    where p.id = sections.project_id
      and (
        p.created_by = (select auth.uid())
        or (p.org_id is not null and exists (
          select 1 from public.org_members om
          where om.org_id = p.org_id and om.user_id = (select auth.uid())
        ))
      )
  )
);

-- ── records policies ──────────────────────────────────────────
create policy "records_all" on public.records for all using (
  exists (
    select 1 from public.sections s
    join public.projects p on p.id = s.project_id
    where s.id = records.section_id
      and (
        p.created_by = (select auth.uid())
        or (p.org_id is not null and exists (
          select 1 from public.org_members om
          where om.org_id = p.org_id and om.user_id = (select auth.uid())
        ))
      )
  )
);

-- ── storage policies ──────────────────────────────────────────
create policy "excel_insert" on storage.objects for insert
  with check (bucket_id = 'excel-files' and auth.uid() is not null);

create policy "excel_select" on storage.objects for select
  using (bucket_id = 'excel-files' and auth.uid() is not null);

create policy "excel_delete" on storage.objects for delete
  using (bucket_id = 'excel-files' and auth.uid() is not null);
