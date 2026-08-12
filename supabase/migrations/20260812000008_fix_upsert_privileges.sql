-- Fixes a regression from 20260812000007: Supabase's upsert() issues
-- INSERT ... ON CONFLICT (user_id, match_id) DO UPDATE SET user_id = excluded.user_id,
-- match_id = excluded.match_id, pred_home_score = ..., ... — i.e. PostgREST's generated
-- DO UPDATE SET clause reassigns every column from the INSERT payload, including the
-- conflict-target columns themselves, not just the ones that actually changed. The
-- previous migration only granted UPDATE on the score/shootout columns, so upserting
-- an existing prediction hit "permission denied" on user_id/match_id.
--
-- Widening the UPDATE grant to match the INSERT grant is safe: `points` stays excluded
-- either way (that's the actual protection), and the existing RLS policy already
-- prevents a real user_id takeover — for UPDATE, Postgres defaults an unspecified
-- WITH CHECK to the same expression as USING, so the *resulting* row must still satisfy
-- user_id = auth.uid(), not just the row being replaced.
revoke update on public.predictions from authenticated;
grant update (user_id, match_id, pred_home_score, pred_away_score, pred_shootout_winner)
  on public.predictions to authenticated;
