export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          created_at: string;
          country: string | null;
          elo_rating: number;
          games_played_ranked: number;
          is_pro: boolean;
          daily_streak: number;
          daily_last_played: string | null;
        };
        Insert: {
          id: string;
          username: string;
          created_at?: string;
          country?: string | null;
          elo_rating?: number;
          games_played_ranked?: number;
          is_pro?: boolean;
          daily_streak?: number;
          daily_last_played?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          created_at?: string;
          country?: string | null;
          elo_rating?: number;
          games_played_ranked?: number;
          is_pro?: boolean;
          daily_streak?: number;
          daily_last_played?: string | null;
        };
        Relationships: [];
      };
      routes: {
        Row: {
          id: string;
          start_title: string;
          target_title: string;
          difficulty: "easy" | "medium" | "hard";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          start_title: string;
          target_title: string;
          difficulty: "easy" | "medium" | "hard";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          start_title?: string;
          target_title?: string;
          difficulty?: "easy" | "medium" | "hard";
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          route_id: string;
          player1_id: string;
          player2_id: string;
          player1_run_id: string | null;
          player2_run_id: string | null;
          status: "queued" | "pending" | "complete" | "expired";
          created_at: string;
          expires_at: string;
          winner_id: string | null;
          elo_delta_p1: number | null;
          elo_delta_p2: number | null;
          start_time: string | null;
        };
        Insert: {
          id?: string;
          route_id: string;
          player1_id: string;
          player2_id: string;
          player1_run_id?: string | null;
          player2_run_id?: string | null;
          status?: "queued" | "pending" | "complete" | "expired";
          created_at?: string;
          expires_at?: string;
          winner_id?: string | null;
          elo_delta_p1?: number | null;
          elo_delta_p2?: number | null;
          start_time?: string | null;
        };
        Update: {
          id?: string;
          route_id?: string;
          player1_id?: string;
          player2_id?: string;
          player1_run_id?: string | null;
          player2_run_id?: string | null;
          status?: "queued" | "pending" | "complete" | "expired";
          created_at?: string;
          expires_at?: string;
          winner_id?: string | null;
          elo_delta_p1?: number | null;
          elo_delta_p2?: number | null;
          start_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_player1_run_id_fkey";
            columns: ["player1_run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_player2_run_id_fkey";
            columns: ["player2_run_id"];
            isOneToOne: false;
            referencedRelation: "runs";
            referencedColumns: ["id"];
          },
        ];
      };
      runs: {
        Row: {
          id: string;
          user_id: string;
          mode: "ranked" | "training" | "daily";
          route_id: string | null;
          match_id: string | null;
          start_title: string;
          target_title: string;
          active_time_ms: number;
          clicks_count: number;
          misses_count: number;
          route_titles: string[];
          step_data: Json;
          is_flagged: boolean;
          is_completed: boolean;
          gave_up: boolean;
          daily_challenge_id: string | null;
          used_hints: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: "ranked" | "training" | "daily";
          route_id?: string | null;
          match_id?: string | null;
          start_title: string;
          target_title: string;
          active_time_ms?: number;
          clicks_count?: number;
          misses_count?: number;
          route_titles?: string[];
          step_data?: Json;
          is_flagged?: boolean;
          is_completed?: boolean;
          gave_up?: boolean;
          daily_challenge_id?: string | null;
          used_hints?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: "ranked" | "training" | "daily";
          route_id?: string | null;
          match_id?: string | null;
          start_title?: string;
          target_title?: string;
          active_time_ms?: number;
          clicks_count?: number;
          misses_count?: number;
          route_titles?: string[];
          step_data?: Json;
          is_flagged?: boolean;
          is_completed?: boolean;
          gave_up?: boolean;
          daily_challenge_id?: string | null;
          used_hints?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string | null;
          criteria: Json;
        };
        Insert: {
          id: string;
          name: string;
          description: string;
          icon?: string | null;
          criteria: Json;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string | null;
          criteria?: Json;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
        };
        Relationships: [];
      };
      daily_challenges: {
        Row: {
          id: string;
          challenge_date: string;
          start_title: string;
          target_title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          challenge_date: string;
          start_title: string;
          target_title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          challenge_date?: string;
          start_title?: string;
          target_title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      queue_ranked: {
        Row: {
          user_id: string;
          route_id: string;
          queued_at: string;
          elo_rating: number;
          last_seen: string;
        };
        Insert: {
          user_id: string;
          route_id?: string;
          queued_at?: string;
          elo_rating: number;
          last_seen?: string;
        };
        Update: {
          user_id?: string;
          route_id?: string;
          queued_at?: string;
          elo_rating?: number;
          last_seen?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_ranked_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "routes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      claim_queue_opponent: {
        Args: { p_user_id: string; p_elo: number };
        Returns: {
          opponent_id: string;
          opponent_elo: number;
          opponent_queued_at: string;
        }[];
      };
      current_challenge_date: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {};
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
