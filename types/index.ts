// App-level types (not Supabase-generated)
// Supabase row types live in types/supabase.ts (generated via `supabase gen types typescript`)

export type SectionType =
  | "weather"
  | "news"
  | "calendar"
  | "tasks"
  | "stocks"
  | "crypto"
  | "quote"
  | "sports"
  | "custom";

export type DigestTone = "concise" | "detailed" | "casual" | "formal";

export type DeliveryChannel = "email" | "web_only";

export type DigestStatus =
  | "pending"
  | "generating"
  | "ready"
  | "delivered"
  | "failed";

/** Bitmask helpers for delivery_days */
export const DAYS = {
  SUN: 1,
  MON: 2,
  TUE: 4,
  WED: 8,
  THU: 16,
  FRI: 32,
  SAT: 64,
  WEEKDAYS: 62, // Mon–Fri
  WEEKENDS: 65, // Sat + Sun
  ALL: 127,
} as const;

// Section config shapes (extend as integrations are built)
export interface WeatherConfig {
  location: string;
  units: "imperial" | "metric";
}

export interface NewsConfig {
  topics: string[];
  sources?: string[];
  max_items?: number;
}

export interface StocksConfig {
  tickers: string[];
}

export interface CalendarConfig {
  calendar_ids?: string[];
  look_ahead_days?: number;
}

export type SectionConfig =
  | WeatherConfig
  | NewsConfig
  | StocksConfig
  | CalendarConfig
  | Record<string, unknown>;
