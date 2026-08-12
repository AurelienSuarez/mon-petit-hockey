-- SECURITY FIX. The existing UPDATE policies on profiles and predictions gate which
-- ROWS a user can touch ("auth.uid() = id" / "user_id = auth.uid()"), but RLS USING
-- clauses say nothing about which COLUMNS a client may include in that update. With
-- only row-level policies in place, any authenticated user could call the PostgREST
-- API directly (the anon key is necessarily public, and their own session JWT is
-- legitimately theirs) and:
--   PATCH /profiles?id=eq.<their own id>      { "is_admin": true }   -> grants themselves admin
--   PATCH /predictions?id=eq.<their own row>  { "points": 999 }      -> gives themselves points
-- Both are real, exploitable escalation paths, not theoretical. The fix is Postgres
-- column-level privileges: authenticated may only ever include the listed columns in
-- an insert/update statement on these tables, full stop — enforced before RLS even
-- runs, regardless of which row is targeted.

revoke update on public.profiles from authenticated;
grant update (username) on public.profiles to authenticated;

revoke insert on public.predictions from authenticated;
grant insert (user_id, match_id, pred_home_score, pred_away_score, pred_shootout_winner)
  on public.predictions to authenticated;

revoke update on public.predictions from authenticated;
grant update (pred_home_score, pred_away_score, pred_shootout_winner)
  on public.predictions to authenticated;
