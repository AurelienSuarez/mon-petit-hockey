-- Lets a league's owner delete it. Same pattern as create_league/join_league_by_code:
-- no direct DELETE policy on `leagues` (none exists), so this is the only path — it
-- runs as owner (bypassing RLS) but enforces the real check itself: the row is only
-- deleted if owner_id matches the caller, and `not found` (0 rows affected) reads as
-- "you're not the owner" without leaking whether the league exists at all.
create function public.delete_league(p_league_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from leagues where id = p_league_id and owner_id = auth.uid();
  if not found then
    raise exception 'not_league_owner';
  end if;
end;
$$;

grant execute on function public.delete_league(uuid) to authenticated;
