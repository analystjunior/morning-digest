// This file will be replaced by the Supabase CLI generated types.
// Run: npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
// Or:  npx supabase gen types typescript --local > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      digest_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          timezone: string;
          tone: "concise" | "detailed" | "casual" | "formal";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          timezone?: string;
          tone?: "concise" | "detailed" | "casual" | "formal";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          timezone?: string;
          tone?: "concise" | "detailed" | "casual" | "formal";
          is_active?: boolean;
          updated_at?: string;
        };
      };
      digest_sections: {
        Row: {
          id: string;
          digest_profile_id: string;
          user_id: string;
          section_type: "weather" | "news" | "calendar" | "tasks" | "stocks" | "quote" | "sports" | "custom" | "crypto";
          title: string | null;
          position: number;
          is_enabled: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          digest_profile_id: string;
          user_id: string;
          section_type: "weather" | "news" | "calendar" | "tasks" | "stocks" | "quote" | "sports" | "custom" | "crypto";
          title?: string | null;
          position?: number;
          is_enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          position?: number;
          is_enabled?: boolean;
          config?: Json;
          updated_at?: string;
        };
      };
      delivery_settings: {
        Row: {
          id: string;
          user_id: string;
          digest_profile_id: string;
          channel: "email" | "web_only";
          delivery_email: string | null;
          delivery_time: string;
          delivery_days: number;
          is_enabled: boolean;
          last_delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          digest_profile_id: string;
          channel?: "email" | "web_only";
          delivery_email?: string | null;
          delivery_time?: string;
          delivery_days?: number;
          is_enabled?: boolean;
          last_delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          channel?: "email" | "web_only";
          delivery_email?: string | null;
          delivery_time?: string;
          delivery_days?: number;
          is_enabled?: boolean;
          last_delivered_at?: string | null;
          updated_at?: string;
        };
      };
      digest_history: {
        Row: {
          id: string;
          user_id: string;
          digest_profile_id: string;
          status: "pending" | "generating" | "ready" | "delivered" | "failed";
          content_html: string | null;
          content_json: Json | null;
          digest_date: string;
          scheduled_for: string | null;
          generated_at: string | null;
          delivered_at: string | null;
          error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          digest_profile_id: string;
          status?: "pending" | "generating" | "ready" | "delivered" | "failed";
          content_html?: string | null;
          content_json?: Json | null;
          digest_date?: string;
          scheduled_for?: string | null;
          generated_at?: string | null;
          delivered_at?: string | null;
          error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "generating" | "ready" | "delivered" | "failed";
          content_html?: string | null;
          content_json?: Json | null;
          scheduled_for?: string | null;
          generated_at?: string | null;
          delivered_at?: string | null;
          error?: string | null;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      section_type: "weather" | "news" | "calendar" | "tasks" | "stocks" | "quote" | "sports" | "custom" | "crypto";
      delivery_channel: "email" | "web_only";
      digest_status: "pending" | "generating" | "ready" | "delivered" | "failed";
      digest_tone: "concise" | "detailed" | "casual" | "formal";
    };
  };
}
