-- supabase-schema.sql
-- Run once in Supabase SQL Editor. Creates every table the app syncs to,
-- plus role-based access control and a profiles table for display names.
-- Safe to re-run: every statement is IF NOT EXISTS / CREATE OR REPLACE.

-- ========== data tables ==========
create table if not exists members (
  id text primary key,
  name text, section text, phone text, "joinDate" text, status text,
  "robeEligible" boolean, notes text,
  "followedUpAt" text, "followUpReason" text, "followedUpBy" text,
  "followUpHistory" jsonb default '[]'::jsonb,
  "updatedAt" text, synced boolean default true, owner uuid references auth.users
);

create table if not exists attendance (
  id text primary key,
  "memberId" text, date text, present boolean,
  "updatedAt" text, synced boolean default true, owner uuid references auth.users
);

create table if not exists inventory (
  id text primary key,
  name text, category text, quantity numeric, status text, "lastWashed" text, notes text,
  "updatedAt" text, synced boolean default true, owner uuid references auth.users
);

create table if not exists programs (
  id text primary key,
  type text, date text, description text, budget numeric, "attendanceCount" numeric, notes text,
  "updatedAt" text, synced boolean default true, owner uuid references auth.users
);

create table if not exists contributions (
  id text primary key,
  period text, "fromWhom" text, expected numeric, paid numeric,
  "datePaid" text, "collectedBy" text, "handedOver" boolean,
  "updatedAt" text, synced boolean default true, owner uuid references auth.users
);

create table if not exists plan_items (
  id text primary key,
  no integer, "subUnit" text, title text, details text, outcome text,
  indicator text, target text, timing text, executor text, budget text,
  category text, history jsonb default '[]'::jsonb,
  "nextDateEC" jsonb, "nextDateGC" text,
  "updatedAt" text, synced boolean default true, owner uuid references auth.users
);

-- ========== roles ==========
create table if not exists user_roles (
  user_id uuid primary key references auth.users on delete cascade,
  role text not null default 'member' check (role in ('member', 'admin'))
);

-- ========== profiles (display name only — deliberately separate from
-- user_roles so editing your own display name can never touch your role) ==========
create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'member')
    on conflict (user_id) do nothing;
  insert into public.profiles (user_id, display_name)
    values (new.id, split_part(new.email, '@', 1))
    on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ========== RLS ==========
alter table members enable row level security;
alter table attendance enable row level security;
alter table inventory enable row level security;
alter table programs enable row level security;
alter table contributions enable row level security;
alter table plan_items enable row level security;
alter table user_roles enable row level security;
alter table profiles enable row level security;

do $$
declare t text;
begin
  foreach t in array array['members','attendance','inventory','programs','contributions','plan_items']
  loop
    execute format('drop policy if exists "read_%1$s" on %1$s', t);
    execute format('create policy "read_%1$s" on %1$s for select using (auth.role() = ''authenticated'')', t);
    execute format('drop policy if exists "write_%1$s" on %1$s', t);
    execute format('create policy "write_%1$s" on %1$s for insert with check (auth.role() = ''authenticated'')', t);
    execute format('drop policy if exists "update_%1$s" on %1$s', t);
    execute format('create policy "update_%1$s" on %1$s for update using (auth.role() = ''authenticated'')', t);
    execute format('drop policy if exists "delete_%1$s" on %1$s', t);
    execute format(
      'create policy "delete_%1$s" on %1$s for delete using (exists (select 1 from user_roles where user_id = auth.uid() and role = ''admin''))',
      t
    );
  end loop;
end $$;

drop policy if exists "read_roles" on user_roles;
create policy "read_roles" on user_roles for select using (auth.role() = 'authenticated');

drop policy if exists "read_profiles" on profiles;
create policy "read_profiles" on profiles for select using (auth.role() = 'authenticated');
drop policy if exists "upsert_own_profile" on profiles;
create policy "upsert_own_profile" on profiles for insert with check (auth.uid() = user_id);
drop policy if exists "update_own_profile" on profiles;
create policy "update_own_profile" on profiles for update using (auth.uid() = user_id);

-- Promote someone to admin from the SQL editor:
--   update user_roles set role = 'admin' where user_id = '...';
