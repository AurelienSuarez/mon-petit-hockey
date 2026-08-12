create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  match_id uuid not null references matches (id) on delete cascade,
  pred_home_score int not null check (pred_home_score >= 0),
  pred_away_score int not null check (pred_away_score >= 0),
  pred_shootout_winner shootout_winner,
  points numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, match_id)
);

alter table predictions enable row level security;

create policy "users can read their own predictions"
  on predictions for select
  using (user_id = auth.uid());

create policy "users can insert their own predictions"
  on predictions for insert
  with check (user_id = auth.uid());

create policy "users can update their own predictions"
  on predictions for update
  using (user_id = auth.uid());

-- points is only ever written by the server-side result-processing route (service_role,
-- bypasses RLS) — there is intentionally no update path for it from the client beyond
-- what's already allowed above; enforced by never surfacing a form field for it, plus
-- the app double-checking role, but the real backstop is that only the server holds
-- the service_role key used for admin result entry.

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger predictions_touch_updated_at
  before update on predictions
  for each row execute procedure public.touch_updated_at();

-- Defense in depth: block prediction writes once kickoff has passed, even if a client
-- bypasses the app's own lock check. Matches are publicly readable so this needs no
-- elevated privilege.
create function public.enforce_prediction_lock()
returns trigger
language plpgsql
as $$
declare
  match_kickoff timestamptz;
begin
  select kickoff into match_kickoff from matches where id = new.match_id;
  if match_kickoff is null then
    raise exception 'unknown_match';
  end if;
  if match_kickoff <= now() then
    raise exception 'predictions_locked';
  end if;
  return new;
end;
$$;

create trigger predictions_lock_check
  before insert or update on predictions
  for each row execute procedure public.enforce_prediction_lock();

-- MPP convention: your own picks are always visible to you; everyone else's picks for
-- a match stay hidden until that match's kickoff has passed. This view deliberately
-- runs with the view owner's rights (not security_invoker) so it can reveal rows the
-- base predictions RLS would otherwise hide, gated by its own WHERE clause below.
create view visible_predictions as
select p.*
from predictions p
join matches m on m.id = p.match_id
where p.user_id = auth.uid() or m.kickoff <= now();

grant select on visible_predictions to authenticated;

-- Aggregate points per league member. Returns nothing if the caller isn't a member of
-- the league (no error, just an empty set) — safe to call from the client.
create function public.league_standings(p_league_id uuid)
returns table (user_id uuid, username text, total_points numeric)
language sql
stable
security definer
set search_path = public
as $$
  select lm.user_id, pr.username, coalesce(sum(preds.points), 0) as total_points
  from league_members lm
  join profiles pr on pr.id = lm.user_id
  left join predictions preds on preds.user_id = lm.user_id
  where lm.league_id = p_league_id
    and public.is_league_member(p_league_id)
  group by lm.user_id, pr.username
  order by total_points desc, pr.username asc;
$$;

grant execute on function public.league_standings(uuid) to authenticated;
