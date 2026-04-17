import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SectionType } from "./types";

export const SECTION_TYPES: SectionType[] = [
  "news", "sports", "finance", "weather", "quote", "custom",
];

export const DEFAULT_CONFIG: Partial<Record<SectionType, Record<string, unknown>>> = {
  weather: { city: "New York" },
  sports:  { leagues: [] },
  news:    { category: "general" },
  finance: { tickers: ["SPY", "AAPL", "NVDA"] },
  quote:   { tone: "any" },
  custom:  {},
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

// Maps a SectionType to a display emoji
export const SECTION_EMOJIS: Record<SectionType, string> = {
  news: "📰",
  sports: "🏀",
  social: "📱",
  finance: "📈",
  weather: "🌤",
  quote: "💬",
  entertainment: "🎬",
  technology: "💻",
  custom: "✨",
};

// Maps a SectionType to a friendly label
export const SECTION_LABELS: Record<SectionType, string> = {
  news: "News",
  sports: "Sports",
  social: "Social Media",
  finance: "Finance & Markets",
  weather: "Weather",
  quote: "Quote / Inspiration",
  entertainment: "Entertainment",
  technology: "Technology",
  custom: "Custom Topic",
};

// Common timezones for the picker
export const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "GMT / London" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

// Format a 24h time string for display: "07:30" → "7:30 AM"
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

// Validate email format
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate E.164 phone number
export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s\-()]/g, ""));
}

// Normalize phone to E.164
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  return `+${digits}`;
}
