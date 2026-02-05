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
        };
        Insert: {
          id: string;
          username: string;
          created_at?: string;
          country?: string | null;
          elo_rating?: number;
          games_played_ranked?: number;
          is_pro?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          created_at?: string;
          country?: string | null;
          elo_rating?: number;
          games_played_ranked?: number;
          is_pro?: boolean;
        };
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
      };
      runs: {
        Row: {
          id: string;
          user_id: string;
          mode: "ranked" | "training";
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
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: "ranked" | "training";
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
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: "ranked" | "training";
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
          created_at?: string;
        };
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
      };
      queue_ranked: {
        Row: {
          user_id: string;
          route_id: string;
          queued_at: string;
          elo_rating: number;
        };
        Insert: {
          user_id: string;
          route_id?: string;
          queued_at?: string;
          elo_rating: number;
        };
        Update: {
          user_id?: string;
          route_id?: string;
          queued_at?: string;
          elo_rating?: number;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
