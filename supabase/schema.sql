-- FinancePRO v2 — Supabase schema
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent where possible).

-- ---------------------------------------------------------------- tables
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  display_name     text not null default '',
  lang             text not null default 'el' check (lang in ('el','en')),
  currency         text not null default 'EUR',
  theme            text not null default 'auto' check (theme in ('auto','light','dark')),
  savings_goal     numeric(12,2) not null default 0,
  starting_balance numeric(12,2) not null default 0,
  settings         jsonb not null default '{}'::jsonb,   -- quick buttons, bills, custom categories
  created_at       timestamptz not null default now()
);

create table if not exists public.vaults (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid not null references auth.users(id) on delete cascade,
  invite_code    text unique,
  invite_expires timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists public.vault_members (
  vault_id     uuid not null references public.vaults(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  share        int  not null default 50 check (share between 0 and 100),  -- this member's % of shared expenses
  joined_at    timestamptz not null default now(),
  primary key (vault_id, user_id),
  unique (user_id)                    -- one shared vault per user
);

create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  vault_id   uuid references public.vaults(id) on delete set null,   -- null = personal
  date       date not null default current_date,
  type       text not null check (type in ('expense','income','settlement')),
  category   text not null,
  amount     numeric(12,2) not null check (amount > 0),
  note       text not null default '' check (char_length(note) <= 120),
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date on public.transactions (user_id, date desc);
create index if not exists transactions_vault_date on public.transactions (vault_id, date desc) where vault_id is not null;

-- ---------------------------------------------------------------- helpers
create or replace function public.my_vault() returns uuid
language sql stable security definer set search_path = public as $$
  select vault_id from public.vault_members where user_id = auth.uid()
$$;

-- new user → profile row
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep member display name in sync with profile
create or replace function public.sync_member_name() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.vault_members set display_name = new.display_name where user_id = new.id;
  return new;
end $$;
drop trigger if exists on_profile_name on public.profiles;
create trigger on_profile_name after update of display_name on public.profiles
  for each row execute function public.sync_member_name();

-- ---------------------------------------------------------------- row level security
alter table public.profiles      enable row level security;
alter table public.vaults        enable row level security;
alter table public.vault_members enable row level security;
alter table public.transactions  enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select using (id = auth.uid());
create policy "own profile update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "members read vault" on public.vaults;
create policy "members read vault" on public.vaults for select using (id = public.my_vault());

drop policy if exists "members read members" on public.vault_members;
create policy "members read members" on public.vault_members for select using (vault_id = public.my_vault());

drop policy if exists "tx read"   on public.transactions;
drop policy if exists "tx insert" on public.transactions;
drop policy if exists "tx update" on public.transactions;
drop policy if exists "tx delete" on public.transactions;
create policy "tx read" on public.transactions for select
  using (user_id = auth.uid() or (vault_id is not null and vault_id = public.my_vault()));
create policy "tx insert" on public.transactions for insert
  with check (user_id = auth.uid() and (vault_id is null or vault_id = public.my_vault()));
create policy "tx update" on public.transactions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (vault_id is null or vault_id = public.my_vault()));
create policy "tx delete" on public.transactions for delete using (user_id = auth.uid());
-- vaults / vault_members are only written through the RPCs below.

-- ---------------------------------------------------------------- shared-vault RPCs
create or replace function public.create_vault_invite() returns text
language plpgsql security definer set search_path = public as $$
declare v uuid; code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  v := public.my_vault();
  if v is null then
    insert into public.vaults (created_by) values (auth.uid()) returning id into v;
    insert into public.vault_members (vault_id, user_id, display_name)
      select v, auth.uid(), display_name from public.profiles where id = auth.uid();
  elsif (select count(*) from public.vault_members where vault_id = v) >= 2 then
    raise exception 'vault already has two members';
  end if;
  loop
    code := '';
    for i in 1..6 loop code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    code := substr(code, 1, 3) || '-' || substr(code, 4, 3);
    exit when not exists (select 1 from public.vaults where invite_code = code);
  end loop;
  update public.vaults set invite_code = code, invite_expires = now() + interval '48 hours' where id = v;
  return code;
end $$;

create or replace function public.join_vault(invite text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if public.my_vault() is not null then raise exception 'already in a shared vault'; end if;
  select id into v from public.vaults where invite_code = upper(trim(invite)) and invite_expires > now();
  if v is null then raise exception 'invalid or expired code'; end if;
  if (select count(*) from public.vault_members where vault_id = v) >= 2 then raise exception 'vault is full'; end if;
  insert into public.vault_members (vault_id, user_id, display_name)
    select v, auth.uid(), display_name from public.profiles where id = auth.uid();
  update public.vault_members set share = 50 where vault_id = v;
  update public.vaults set invite_code = null, invite_expires = null where id = v;
  return v;
end $$;

create or replace function public.set_vault_split(my_share int) returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := public.my_vault();
begin
  if v is null then raise exception 'no shared vault'; end if;
  if my_share < 0 or my_share > 100 then raise exception 'share must be 0-100'; end if;
  update public.vault_members set share = case when user_id = auth.uid() then my_share else 100 - my_share end where vault_id = v;
end $$;

create or replace function public.leave_vault() returns void
language plpgsql security definer set search_path = public as $$
declare v uuid := public.my_vault();
begin
  if v is null then return; end if;
  delete from public.vault_members where vault_id = v and user_id = auth.uid();
  -- last member out: delete the vault; its shared transactions become nobody's shared rows (vault_id → null keeps them with their authors)
  if not exists (select 1 from public.vault_members where vault_id = v) then delete from public.vaults where id = v; end if;
end $$;

revoke all on function public.create_vault_invite(), public.join_vault(text), public.set_vault_split(int), public.leave_vault() from public, anon;
grant execute on function public.create_vault_invite(), public.join_vault(text), public.set_vault_split(int), public.leave_vault() to authenticated;

-- ---------------------------------------------------------------- Data API grants
-- (needed when "Grant API access to new tables automatically" is off)
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.vaults, public.vault_members to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant execute on function public.my_vault() to authenticated;
