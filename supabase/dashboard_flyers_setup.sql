-- Run this entire script in Supabase → SQL Editor (once).
-- Creates dashboard_flyers table, RLS, and Storage bucket + policies for event flyer images.

-- ---------------------------------------------------------------------------
-- Table: one row per flyer image (path inside Storage bucket)
-- ---------------------------------------------------------------------------
create table if not exists public.dashboard_flyers (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  sort_order bigint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_flyers_sort_created_idx
  on public.dashboard_flyers (sort_order asc, created_at asc);

alter table public.dashboard_flyers enable row level security;

-- Any signed-in user can see flyers (dashboard home)
drop policy if exists "dashboard_flyers_select_authenticated" on public.dashboard_flyers;
create policy "dashboard_flyers_select_authenticated"
  on public.dashboard_flyers
  for select
  to authenticated
  using (true);

-- Only owner/admin can add rows (after uploading to Storage)
drop policy if exists "dashboard_flyers_insert_admin" on public.dashboard_flyers;
create policy "dashboard_flyers_insert_admin"
  on public.dashboard_flyers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin')
    )
  );

drop policy if exists "dashboard_flyers_delete_admin" on public.dashboard_flyers;
create policy "dashboard_flyers_delete_admin"
  on public.dashboard_flyers
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: public bucket so <img src> works without a signed URL
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-flyers', 'event-flyers', true)
on conflict (id) do update set public = excluded.public;

-- Read flyer images (bucket is public; policy allows object reads)
drop policy if exists "event_flyers_select_public" on storage.objects;
create policy "event_flyers_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'event-flyers');

drop policy if exists "event_flyers_insert_admin" on storage.objects;
create policy "event_flyers_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-flyers'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin')
    )
  );

drop policy if exists "event_flyers_delete_admin" on storage.objects;
create policy "event_flyers_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'event-flyers'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('owner', 'admin')
    )
  );
