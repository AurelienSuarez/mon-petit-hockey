/**
 * Hand-written to match supabase/migrations/*.sql. If you have the Supabase CLI
 * linked to a project, prefer regenerating this with:
 *   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 *
 * `Relationships: []` on every table/view is required by @supabase/postgrest-js's
 * GenericTable/GenericView constraint even though this schema doesn't model FK
 * embedding — omitting it silently makes every Row type resolve to `never`.
 */

export type Gender = "M" | "F";
export type MatchStage = "round1" | "crossgroup" | "ranking" | "semifinal" | "third_place" | "final";
export type MatchStatus = "scheduled" | "finished";
export type Venue = "wavre" | "amstelveen";
export type LeagueRole = "owner" | "member";
export type ShootoutWinner = "home" | "away";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; is_admin: boolean; created_at: string };
        Insert: { id: string; username: string; is_admin?: boolean; created_at?: string };
        Update: Partial<{ username: string; is_admin: boolean }>;
        Relationships: [];
      };
      teams: {
        Row: { id: string; name: string; gender: Gender; round1_group: string; site: Venue };
        Insert: { id?: string; name: string; gender: Gender; round1_group: string; site: Venue };
        Update: Partial<{ name: string; gender: Gender; round1_group: string; site: Venue }>;
        Relationships: [];
      };
      team_ratings: {
        Row: { team_id: string; elo: number; updated_at: string };
        Insert: { team_id: string; elo?: number; updated_at?: string };
        Update: Partial<{ elo: number; updated_at: string }>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          stage: MatchStage;
          gender: Gender;
          group_name: string | null;
          slot_home: string | null;
          slot_away: string | null;
          home_team_id: string | null;
          away_team_id: string | null;
          kickoff: string;
          venue: Venue;
          time_uncertain: boolean;
          placement_label: string | null;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          home_so_score: number | null;
          away_so_score: number | null;
          odds_home: number | null;
          odds_draw: number | null;
          odds_away: number | null;
          odds_updated_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["matches"]["Row"]> & {
          stage: MatchStage;
          gender: Gender;
          kickoff: string;
          venue: Venue;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Row"]>;
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          owner_id: string;
          scoring_rules: Record<string, unknown> | null;
          created_at: string;
        };
        // Written only via the create_league() RPC (SECURITY DEFINER) — these shapes
        // exist to satisfy the schema's type constraints, not for direct client use.
        Insert: { id?: string; name: string; invite_code: string; owner_id: string };
        Update: Partial<{ name: string }>;
        Relationships: [];
      };
      league_members: {
        Row: { league_id: string; user_id: string; role: LeagueRole; joined_at: string };
        // Written only via create_league()/join_league_by_code() RPCs.
        Insert: { league_id: string; user_id: string; role?: LeagueRole };
        Update: Partial<{ role: LeagueRole }>;
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          pred_home_score: number;
          pred_away_score: number;
          pred_shootout_winner: ShootoutWinner | null;
          points: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          pred_home_score: number;
          pred_away_score: number;
          pred_shootout_winner?: ShootoutWinner | null;
          points?: number | null;
        };
        Update: Partial<{
          pred_home_score: number;
          pred_away_score: number;
          pred_shootout_winner: ShootoutWinner | null;
          points: number | null;
        }>;
        Relationships: [];
      };
    };
    Views: {
      visible_predictions: {
        Row: Database["public"]["Tables"]["predictions"]["Row"];
        Relationships: [];
      };
    };
    Functions: {
      create_league: { Args: { p_name: string }; Returns: Database["public"]["Tables"]["leagues"]["Row"] };
      join_league_by_code: { Args: { p_code: string }; Returns: Database["public"]["Tables"]["leagues"]["Row"] };
      is_league_member: { Args: { p_league_id: string; p_user_id?: string }; Returns: boolean };
      league_standings: {
        Args: { p_league_id: string };
        Returns: { user_id: string; username: string; total_points: number }[];
      };
    };
    Enums: {
      gender: Gender;
      match_stage: MatchStage;
      match_status: MatchStatus;
      venue: Venue;
      league_role: LeagueRole;
      shootout_winner: ShootoutWinner;
    };
  };
}
