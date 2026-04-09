// ─── Core Data Models ────────────────────────────────────────────────────────

export type SectionType =
  | "news"
  | "sports"
  | "social"
  | "finance"
  | "weather"
  | "quote"
  | "entertainment"
  | "technology"
  | "custom";

export type DeliveryChannel = "email" | "sms";

export type DigestMode = "brief" | "detailed";

export type DigestStatus = "active" | "paused";

// A single topic/section in a user's digest
export interface DigestSection {
  id: string;
  title: string;           // e.g. "Lakers News"
  type: SectionType;
  prompt?: string;         // e.g. "Latest scores and injury updates"
  sources?: string[];      // e.g. ["ESPN", "The Athletic"]
  order: number;           // for drag-to-reorder
  enabled: boolean;
  mode: DigestMode;        // brief (2-3 bullets) vs detailed (5+ bullets)
  // Structured config for data-fetcher sections:
  // sports:  { leagues: ["NBA", "NFL"], teams?: ["Los Angeles Lakers"] }
  // finance: { tickers: ["AAPL", "MSFT"] }  OR  { coins: ["bitcoin", "ethereum"] }
  config?: Record<string, unknown>;
}

// Delivery preferences
export interface DeliverySettings {
  time: string;            // "07:30" (HH:MM 24h)
  timezone: string;        // e.g. "America/New_York"
  channels: DeliveryChannel[];
  email?: string;
  phone?: string;          // E.164 format e.g. "+15551234567"
}

// Top-level user record
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  timezone: string;
  createdAt: string;       // ISO date string
  updatedAt: string;
}

// A user's full digest subscription / preference profile
export interface DigestSubscription {
  id: string;
  userId: string;
  name: string;            // e.g. "My Morning Digest"
  sections: DigestSection[];
  delivery: DeliverySettings;
  status: DigestStatus;
  templateId?: string;     // if started from a template
  createdAt: string;
  updatedAt: string;
}

// A single item within a generated digest section
export interface GeneratedItem {
  text: string;
  source?: string;
  url?: string;
  timestamp?: string;
}

// One rendered section in a generated digest
export interface GeneratedSection {
  sectionId: string;
  title: string;
  emoji: string;
  items: GeneratedItem[];
}

// A fully generated digest (what gets emailed/texted)
export interface GeneratedDigest {
  id: string;
  subscriptionId: string;
  userId: string;
  date: string;            // "2026-03-24"
  sections: GeneratedSection[];
  generatedAt: string;
  sentAt?: string;
  status: "pending" | "sent" | "failed";
  channels: DeliveryChannel[];
}

// ─── Templates ───────────────────────────────────────────────────────────────

export interface DigestTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tags: string[];
  sections: Omit<DigestSection, "id" | "order">[];
}

// ─── API Shapes ──────────────────────────────────────────────────────────────

export interface SavePreferencesRequest {
  user: Omit<User, "id" | "createdAt" | "updatedAt">;
  subscription: Omit<DigestSubscription, "id" | "userId" | "createdAt" | "updatedAt">;
}

export interface SavePreferencesResponse {
  success: boolean;
  userId: string;
  subscriptionId: string;
}

export interface PreviewDigestRequest {
  sections: DigestSection[];
}

export interface PreviewDigestResponse {
  digest: GeneratedDigest;
}

// ─── Onboarding State ────────────────────────────────────────────────────────

export type OnboardingStep = "welcome" | "topics" | "delivery" | "review";

export interface OnboardingState {
  step: OnboardingStep;
  name: string;
  sections: DigestSection[];
  delivery: DeliverySettings;
  templateId?: string;
}
