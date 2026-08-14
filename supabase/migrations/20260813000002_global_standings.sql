-- Cross-league leaderboard: every registered user's total points for one competition
-- gender, regardless of which league(s) they're in (or none at all). Used by the
-- profile page to show "how do I rank against everyone", not just league-mates.
create function public.global_standings(p_gender gender)
returns table (user_id uuid, username text, total_points numeric)
language sql
stable
security definer
set search_path = public
as $$
  select pr.id as user_id, pr.username, coalesce(sum(p.points), 0) as total_points
  from profiles pr
  left join predictions p
    on p.user_id = pr.id
   and p.match_id in (select id from matches where gender = p_gender)
  group by pr.id, pr.username
  order by total_points desc, pr.username asc
$$;

grant execute on function public.global_standings(gender) to authenticated;
