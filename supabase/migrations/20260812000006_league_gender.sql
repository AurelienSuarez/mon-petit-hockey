-- A league is scoped to exactly one competition (men's or women's), chosen at
-- creation and fixed thereafter. Standings only count points from predictions on
-- matches of that gender — a user can be in both a men's and a women's league at
-- once, and each league only sees the relevant half of their predictions.

alter table leagues add column gender gender;
update leagues set gender = 'M' where gender is null;
alter table leagues alter column gender set not null;

-- Signature is changing (new required p_gender param); drop the old one explicitly
-- so `create or replace` doesn't leave a stale single-arg overload behind.
drop function if exists public.create_league(text);

create function public.create_league(p_name text, p_gender gender)
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

  insert into leagues (name, invite_code, owner_id, gender)
  values (trim(p_name), new_code, auth.uid(), p_gender)
  returning * into new_league;

  insert into league_members (league_id, user_id, role)
  values (new_league.id, auth.uid(), 'owner');

  return new_league;
end;
$$;

grant execute on function public.create_league(text, gender) to authenticated;

create or replace function public.league_standings(p_league_id uuid)
returns table (user_id uuid, username text, total_points numeric)
language sql
stable
security definer
set search_path = public
as $$
  select lm.user_id, pr.username, coalesce(sum(preds.points), 0) as total_points
  from league_members lm
  join profiles pr on pr.id = lm.user_id
  join leagues l on l.id = lm.league_id
  left join predictions preds
    on preds.user_id = lm.user_id
   and preds.match_id in (select id from matches where gender = l.gender)
  where lm.league_id = p_league_id
    and public.is_league_member(p_league_id)
  group by lm.user_id, pr.username
  order by total_points desc, pr.username asc;
$$;
