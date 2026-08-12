-- Profiles: one row per auth.users row, holding public-facing fields.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are publicly readable"
  on profiles for select
  using (true);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile whenever someone signs up via Supabase Auth. Runs as the
-- function owner (bypasses profiles' RLS), so this is the only path that creates rows
-- here — there is deliberately no client-facing insert policy on profiles.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1));
  final_username := base_username;

  if exists (select 1 from public.profiles where username = final_username) then
    final_username := base_username || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username) values (new.id, final_username);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
