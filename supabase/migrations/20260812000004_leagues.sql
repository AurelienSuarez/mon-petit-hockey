create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references profiles (id),
  -- Reserved for future per-league custom scoring; unused (falls back to the app's
  -- default rules) until a UI exists to edit it.
  scoring_rules jsonb,
  created_at timestamptz not null default now()
);

alter table leagues enable row level security;

create table league_members (
  league_id uuid not null references leagues (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role league_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

alter table league_members enable row level security;

-- A policy on league_members that queries league_members directly (to check "is this
-- user a member of this league") would recurse. Routing through a SECURITY DEFINER
-- function avoids that: it runs as the function owner, which bypasses RLS internally.
create function public.is_league_member(p_league_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from league_members
    where league_id = p_league_id and user_id = p_user_id
  );
$$;

create policy "members can read their leagues"
  on leagues for select
  using (public.is_league_member(id));

create policy "members can read the membership list of their leagues"
  on league_members for select
  using (public.is_league_member(league_id));

-- No insert/update/delete policies on leagues or league_members: the only way to
-- create or join a league is through the RPCs below, which run as their owner and so
-- bypass RLS deliberately, keeping league creation/joining atomic and centrally
-- controlled instead of relying on client-side writes.

create function public.create_league(p_name text)
returns leagues
language plpgsql
security definer
set search_path = public
as $$
declare
  new_league leagues;
  new_code text;
begin
  if p_name is null or trim(p_name) = '' then
    raise exception 'league_name_required';
  end if;

  loop
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from leagues where invite_code = new_code);
  end loop;

  insert into leagues (name, invite_code, owner_id)
  values (trim(p_name), new_code, auth.uid())
  returning * into new_league;

  insert into league_members (league_id, user_id, role)
  values (new_league.id, auth.uid(), 'owner');

  return new_league;
end;
$$;

grant execute on function public.create_league(text) to authenticated;

create function public.join_league_by_code(p_code text)
returns leagues
language plpgsql
security definer
set search_path = public
as $$
declare
  target leagues;
begin
  select * into target from leagues where invite_code = upper(trim(p_code));
  if not found then
    raise exception 'invalid_invite_code';
  end if;

  insert into league_members (league_id, user_id, role)
  values (target.id, auth.uid(), 'member')
  on conflict (league_id, user_id) do nothing;

  return target;
end;
$$;

grant execute on function public.join_league_by_code(text) to authenticated;
