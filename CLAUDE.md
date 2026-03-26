# Briefd — Claude Code Guide

## What We're Building
Briefd is a **personalized morning digest app**. Each user configures what they want in their daily briefing (weather, news, calendar, tasks, stocks, etc.), and Briefd delivers a clean, readable digest every morning via email or web.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS — no component library, hand-crafted components only
- **Database / Auth / Storage**: Supabase
- **Email delivery**: TBD (Resend or Postmark)

## Design Principles
- Clean, minimal design — lots of whitespace, clear hierarchy
- No component libraries (no shadcn, no MUI, no Radix primitives)
- Mobile-first responsive layouts
- Accessible by default (semantic HTML, ARIA where needed)

## Project Structure
```
briefd/
├── app/
│   ├── (auth)/           # Login, signup, forgot password
│   ├── (dashboard)/      # Main app — today's digest view
│   ├── (onboarding)/     # First-run setup flow
│   ├── (settings)/       # Profile, digest config, delivery settings
│   ├── api/              # Route handlers
│   │   ├── digest/       # Generate / fetch digest
│   │   ├── profile/      # User profile CRUD
│   │   ├── sections/     # Digest section config
│   │   ├── delivery/     # Delivery settings
│   │   └── history/      # Past digests
│   ├── layout.tsx
│   └── page.tsx          # Marketing / landing page
├── components/
│   ├── ui/               # Reusable primitives (Button, Input, Card…)
│   ├── layout/           # Header, Footer, Sidebar, Nav
│   └── digest/           # Digest-specific components
├── hooks/                # Custom React hooks
├── lib/
│   ├── supabase/         # Supabase client (server + browser)
│   └── utils/            # Helpers, formatters
├── types/                # Shared TypeScript types & Supabase generated types
└── supabase/
    └── migrations/       # SQL migration files
```

## Database
Schema lives in `supabase/migrations/`. Tables:
- `users` — extends Supabase auth.users
- `digest_profiles` — per-user digest preferences (name, timezone, tone)
- `digest_sections` — ordered list of content blocks for each user's digest
- `delivery_settings` — when/how to deliver (time, channel, email)
- `digest_history` — archive of generated digests

## Conventions
- Server Components by default; add `"use client"` only when needed
- Route handlers in `app/api/` return typed JSON responses
- All Supabase calls go through `lib/supabase/` — never import the client directly in components
- Types go in `types/` — keep Supabase-generated types separate from app-level types
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
