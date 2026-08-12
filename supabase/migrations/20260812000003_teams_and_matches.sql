create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender gender not null,
  round1_group text not null check (round1_group in ('A', 'B', 'C', 'D')),
  site venue not null,
  unique (name, gender)
);

alter table teams enable row level security;

create policy "teams are publicly readable"
  on teams for select
  using (true);

-- Elo rating per team, updated server-side (service_role) as results come in.
create table team_ratings (
  team_id uuid primary key references teams (id) on delete cascade,
  elo numeric not null default 1500,
  updated_at timestamptz not null default now()
);

alter table team_ratings enable row level security;

create policy "team ratings are publicly readable"
  on team_ratings for select
  using (true);

-- Matches beyond round1 don't have known participants yet: slot_home/slot_away hold a
-- placeholder like 'A1' (rank 1 of pool A) or 'G3' (rank 3 of crossgroup G), resolved
-- into home_team_id/away_team_id once the source standings settle (see
-- src/lib/tournament/slots.ts). placement_label carries the doc's own labels
-- ('9e/10e', 'Demi-finale', ...) for stages that aren't a round-robin pool.
create table matches (
  id uuid primary key default gen_random_uuid(),
  stage match_stage not null,
  gender gender not null,
  group_name text,
  slot_home text,
  slot_away text,
  home_team_id uuid references teams (id),
  away_team_id uuid references teams (id),
  kickoff timestamptz not null,
  venue venue not null,
  -- Flags kickoff times sourced from the doc's secondary source (marked '*'), pending
  -- verification against the official schedule.
  time_uncertain boolean not null default false,
  placement_label text,
  status match_status not null default 'scheduled',
  home_score int,
  away_score int,
  home_so_score int,
  away_so_score int,
  odds_home numeric,
  odds_draw numeric,
  odds_away numeric,
  odds_updated_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    status = 'scheduled'
    or (
      home_score is not null
      and away_score is not null
      and home_team_id is not null
      and away_team_id is not null
    )
  )
);

alter table matches enable row level security;

create policy "matches are publicly readable"
  on matches for select
  using (true);

create index matches_kickoff_idx on matches (kickoff);
create index matches_stage_group_idx on matches (stage, group_name);
