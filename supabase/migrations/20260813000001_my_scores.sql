-- Total points for the current user, split by competition gender. Used by the
-- profile page: unlike league_standings, this isn't scoped to one league, so a
-- user's men's/women's score is stable across however many leagues they're in.
create function public.my_scores()
returns table (gender gender, total_points numeric)
language sql
stable
security definer
set search_path = public
as $$
  select mt.gender, coalesce(sum(p.points), 0) as total_points
  from predictions p
  join matches mt on mt.id = p.match_id
  where p.user_id = auth.uid()
  group by mt.gender
$$;

grant execute on function public.my_scores() to authenticated;
