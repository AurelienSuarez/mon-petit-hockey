-- Switches prediction scoring from a flat 5/3/1 tier system to MPP-style odds-driven
-- points: a correct outcome pays out the match's decimal odds (x10) at the time the
-- prediction was locked in, and an exact score adds a rarity bonus on top. That needs
-- the team Elo ratings *as of prediction time* preserved on the row, so a later Elo
-- drift (from other results coming in before this match kicks off) can't retroactively
-- change what a user's pick is worth.
alter table predictions add column locked_home_elo numeric;
alter table predictions add column locked_away_elo numeric;

-- These two columns must never be client-writable (same class of self-assignment risk
-- that 20260812000007 closed for `points`): a user who could set their own
-- locked_home_elo/away_elo could manufacture inflated odds for themselves. So the
-- insert/update grants for `authenticated` are deliberately NOT widened to include
-- them — instead, all prediction writes now go through this SECURITY DEFINER function,
-- which reads the real team_ratings server-side and is the only thing allowed to set
-- them. The existing enforce_prediction_lock trigger still fires underneath this (it's
-- a BEFORE trigger on the table, not bypassed by SECURITY DEFINER), so the kickoff
-- cutoff is still enforced exactly as before.
create function public.submit_prediction(
  p_match_id uuid,
  p_home_score int,
  p_away_score int,
  p_shootout_winner shootout_winner default null
)
returns predictions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match matches;
  v_home_elo numeric;
  v_away_elo numeric;
  v_result predictions;
begin
  select * into v_match from matches where id = p_match_id;
  if v_match is null then
    raise exception 'unknown_match';
  end if;
  if v_match.home_team_id is null or v_match.away_team_id is null then
    raise exception 'teams_not_resolved';
  end if;

  select elo into v_home_elo from team_ratings where team_id = v_match.home_team_id;
  select elo into v_away_elo from team_ratings where team_id = v_match.away_team_id;

  insert into predictions (
    user_id, match_id, pred_home_score, pred_away_score, pred_shootout_winner,
    locked_home_elo, locked_away_elo
  )
  values (
    auth.uid(), p_match_id, p_home_score, p_away_score,
    case when p_home_score = p_away_score then p_shootout_winner else null end,
    coalesce(v_home_elo, 1500), coalesce(v_away_elo, 1500)
  )
  on conflict (user_id, match_id) do update set
    pred_home_score = excluded.pred_home_score,
    pred_away_score = excluded.pred_away_score,
    pred_shootout_winner = excluded.pred_shootout_winner,
    locked_home_elo = excluded.locked_home_elo,
    locked_away_elo = excluded.locked_away_elo
  returning * into v_result;

  return v_result;
end;
$$;

grant execute on function public.submit_prediction(uuid, int, int, shootout_winner) to authenticated;

-- The client no longer needs direct insert/update on predictions at all now that
-- submit_prediction() is the only write path — closing this off is defense in depth,
-- not strictly required (locked_home_elo/away_elo were already excluded from the grant).
revoke insert on public.predictions from authenticated;
revoke update on public.predictions from authenticated;
