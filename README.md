# Briefd

A personalized morning digest app. Users configure which content blocks they want each day — weather, news, calendar events, stocks, sports, and more — set a delivery time, and Briefd delivers a single clean brief to their inbox (or via SMS) every morning.

## Table of contents

- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Local development](#local-development)
- [Connecting Supabase](#connecting-supabase)
- [Generating digests with the Anthropic API](#generating-digests-with-the-anthropic-api)
- [Sending email with Resend](#sending-email-with-resend)
- [Sending SMS with Twilio](#sending-sms-with-twilio)
- [Scheduling with Vercel Cron](#scheduling-with-vercel-cron)
- [Environment variables](#environment-variables)

---

## How it works

```
User signs up
     │
     ▼
Setup wizard (/setup)
  Step 1 — pick digest sections + configure each (source, instructions)
  Step 2 — set delivery time, timezone, days, channel (email/SMS/both)
  Step 3 — preview and confirm
     │
     ▼ POST /api/digest-profiles
Supabase writes:
  digest_profiles   ← user preferences (name, tone, timezone)
  digest_sections   ← ordered list of content blocks
  delivery_settings ← when/how to send
     │
     ▼
Every minute, Vercel Cron fires GET /api/cron/dispatch
  ├─ Queries delivery_settings for users whose local time matches now
  └─ For each due user:
       ├─ Fetch raw data for each section (weather API, news API, etc.)
       ├─ POST to Anthropic Claude with section data + user's tone preference
       │    Claude returns formatted HTML + plain-text digest
       ├─ Write result to digest_history (status: delivered)
       ├─ Send via Resend (email) and/or Twilio (SMS)
       └─ Update delivery_settings.last_delivered_at
     │
     ▼
User visits /dashboard
  ├─ See current digest setup (sections, delivery config)
  ├─ Toggle sections on/off, edit in place
  └─ Preview today's digest via modal
```

---

## Project structure

```
briefd/
├── app/
│   ├── (auth)/               # /login, /signup, /forgot-password
│   ├── (dashboard)/
│   │   └── dashboard/        # /dashboard — main user view
│   ├── (onboarding)/
│   │   └── setup/            # /setup — 3-step wizard
│   ├── (settings)/           # /settings — profile, billing
│   ├── api/
│   │   ├── digest-profiles/  # POST, GET /:id, PUT /:id
│   │   ├── sections/         # CRUD for digest_sections
│   │   ├── delivery/         # CRUD for delivery_settings
│   │   ├── history/          # GET digest_history
│   │   ├── digest/           # POST — trigger manual regeneration
│   │   └── cron/
│   │       └── dispatch/     # GET — called by Vercel Cron every minute
│   └── page.tsx              # Landing page
├── components/
│   ├── ui/                   # Button, Input, Toggle, Card, Modal…
│   ├── layout/               # Nav, Footer
│   └── digest/               # DigestCard, SectionBlock…
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server + service-role client
│   ├── services/
│   │   ├── digest-profiles.ts
│   │   ├── digest-sections.ts
│   │   ├── delivery-settings.ts
│   │   └── digest-history.ts
│   ├── digest/
│   │   ├── generate.ts       # Orchestrates section fetch → Claude → save
│   │   ├── sections/         # One file per section type (weather.ts, news.ts…)
│   │   └── prompt.ts         # Builds the Claude prompt
│   └── email/
│       └── send.ts           # Resend + Twilio dispatch
├── types/
│   ├── index.ts              # App-level types
│   ├── api.ts                # Request/response shapes
│   └── supabase.ts           # Generated DB types (supabase gen types)
└── supabase/
    └── migrations/
        └── 20260324000000_initial_schema.sql
```

---

## Data model

Full SQL lives in [`supabase/migrations/20260324000000_initial_schema.sql`](supabase/migrations/20260324000000_initial_schema.sql).

### `users`
Mirrors `auth.users` 1-to-1. Created automatically via a trigger on new sign-up.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | FK → `auth.users.id` |
| `email` | `text` | |
| `full_name` | `text` | |
| `avatar_url` | `text` | |

### `digest_profiles`
Top-level preferences for a user's digest. One per user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `user_id` | `uuid` | FK → `users.id` |
| `name` | `text` | e.g. "My Morning Briefing" |
| `timezone` | `text` | IANA, e.g. `America/New_York` |
| `tone` | `enum` | `concise \| detailed \| casual \| formal` |
| `is_active` | `bool` | Pause/resume without deleting |

### `digest_sections`
Ordered list of content blocks for a user's digest. Each row is one module.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | |
| `digest_profile_id` | `uuid` | FK → `digest_profiles.id` |
| `section_type` | `enum` | `weather \| news \| calendar \| tasks \| stocks \| quote \| sports \| custom` |
| `title` | `text` | User-facing label |
| `position` | `smallint` | Display order (0 = first) |
| `is_enabled` | `bool` | Skip this section without removing it |
| `config` | `jsonb` | Flexible per-type config (see below) |

**`config` shape by type:**
```jsonc
// weather
{ "location": "New York, NY", "units": "imperial" }

// news
{ "topics": ["tech", "science"], "sources": ["reuters", "bbc"], "max_items": 5 }

// stocks
{ "tickers": ["AAPL", "MSFT", "SPY"] }

// calendar
{ "calendar_ids": ["primary"], "look_ahead_days": 1 }

// sports
{ "leagues": ["NFL", "NBA"], "teams": ["New York Knicks"] }

// custom
{ "rss_url": "https://example.com/feed.xml" }
```

### `delivery_settings`
When and how the digest is sent. One per user.

| Column | Type | Notes |
|--------|------|-------|
| `channel` | `enum` | `email \| web_only` (SMS: add `sms` to enum) |
| `delivery_email` | `text` | Destination address |
| `delivery_time` | `time` | Local time in user's timezone, HH:MM |
| `delivery_days` | `smallint` | Bitmask: Sun=1 Mon=2 Tue=4 Wed=8 Thu=16 Fri=32 Sat=64 |

**Bitmask examples:**
```
Mon–Fri (weekdays) = 2+4+8+16+32 = 62
Every day          = 127
Weekends           = 1+64 = 65
```

### `digest_history`
Archive of every generated digest.

| Column | Type | Notes |
|--------|------|-------|
| `status` | `enum` | `pending → generating → ready → delivered \| failed` |
| `content_html` | `text` | Rendered email HTML |
| `content_json` | `jsonb` | Structured data snapshot for re-rendering |
| `digest_date` | `date` | The date this digest is for |
| `error` | `text` | Set if status = `failed` |

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values (see Environment variables below)
cp .env.local.example .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs fully with mock data until you wire up Supabase. API routes use an
in-memory store — restart the dev server to reset it.

---

## Connecting Supabase

### 1. Create a project

Go to [supabase.com](https://supabase.com), create a new project, and note your
**project URL**, **anon key**, and **service role key** from
`Settings → API`.

### 2. Run the migration

```bash
# Install the Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Push the migration
supabase db push
```

Or paste the SQL from `supabase/migrations/20260324000000_initial_schema.sql`
directly into the Supabase SQL editor.

### 3. Generate TypeScript types

```bash
npx supabase gen types typescript --project-id <your-project-id> \
  > types/supabase.ts
```

Re-run this any time you change the schema.

### 4. Configure Auth

In the Supabase dashboard under `Authentication → URL Configuration`:
- **Site URL**: `http://localhost:3000` (dev) / your production URL
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

Enable the providers you want (Email, Google, etc.) under
`Authentication → Providers`.

### 5. Set environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### 6. Swap the mock implementations

Each service in `lib/services/` has its Supabase replacement commented out
directly below the mock block. Delete the mock block and uncomment the
Supabase block. The route handlers need zero changes.

```ts
// lib/services/digest-profiles.ts — example
// Delete ↓
const profile = _store.get(id);

// Uncomment ↓
const { data: profile, error } = await supabase
  .from("digest_profiles")
  .select("*")
  .eq("id", id)
  .eq("user_id", userId)
  .single();
if (error) throw new InternalError(error.message);
```

---

## Generating digests with the Anthropic API

Briefd uses Claude to assemble and format the digest from raw section data.

### Install the SDK

```bash
npm install @anthropic-ai/sdk
```

### How generation works

```
For each due user:
  1. Fetch raw data per section (weather API → JSON, news API → JSON, …)
  2. Build a structured prompt with all the data + user preferences
  3. Call claude-opus-4-6 (or claude-sonnet-4-6 for cost savings)
  4. Claude returns formatted HTML + a JSON summary
  5. Store in digest_history, send to user
```

### Prompt structure (`lib/digest/prompt.ts`)

```ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateDigest(params: {
  userName: string;
  tone: "concise" | "detailed" | "casual" | "formal";
  date: string;        // "Wednesday, March 26, 2026"
  sections: Array<{
    type: string;
    title: string;
    rawData: unknown;  // API response for this section
  }>;
}) {
  const systemPrompt = `
You are Briefd, a personal morning digest assistant.
Your job is to turn raw data into a clean, readable daily brief.

Tone: ${params.tone}
- concise: bullet points, under 3 sentences per section
- detailed: 2–3 short paragraphs per section
- casual: conversational, light, like a smart friend texting you
- formal: professional, neutral, no contractions

Output format: Return valid JSON with two keys:
  "html"  — full email-safe HTML for the digest
  "plain" — plain-text version for SMS
`.trim();

  const userPrompt = `
Generate a morning digest for ${params.userName} for ${params.date}.

Sections to include:
${params.sections
  .map(
    (s) => `## ${s.title} (${s.type})\n${JSON.stringify(s.rawData, null, 2)}`
  )
  .join("\n\n")}
`.trim();

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return JSON.parse(text) as { html: string; plain: string };
}
```

### Section data fetchers (`lib/digest/sections/`)

Each section type has its own fetcher. Example for weather:

```ts
// lib/digest/sections/weather.ts
export async function fetchWeatherData(config: WeatherConfig) {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather` +
    `?q=${encodeURIComponent(config.location)}` +
    `&units=${config.units === "imperial" ? "imperial" : "metric"}` +
    `&appid=${process.env.OPENWEATHER_API_KEY}`
  );
  if (!res.ok) throw new Error("Weather API error");
  return res.json();
}
```

### Add `ANTHROPIC_API_KEY` to your environment

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Sending email with Resend

[Resend](https://resend.com) handles transactional email with a clean API and
React Email template support.

### Install

```bash
npm install resend @react-email/components
```

### Add to environment

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Briefd <hello@briefd.app>
```

### Domain setup

In the Resend dashboard, add and verify your sending domain under
`Domains → Add Domain`. Update your DNS with the provided DKIM/SPF records
(takes ~10 minutes to propagate).

### Sending a digest (`lib/email/send.ts`)

```ts
import { Resend } from "resend";
// import DigestEmail from "@/components/emails/DigestEmail"; // React Email template

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDigestEmail(params: {
  to: string;
  userName: string;
  digestHtml: string;
  digestDate: string;
}) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: params.to,
    subject: `Your Briefd digest — ${params.digestDate}`,
    html: params.digestHtml,
    // react: <DigestEmail html={params.digestHtml} />, // if using React Email
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
  return data;
}
```

### React Email template (optional but recommended)

```bash
npm install @react-email/render
```

Create `components/emails/DigestEmail.tsx`, then render it to HTML before
passing to Resend:

```ts
import { render } from "@react-email/render";
import DigestEmail from "@/components/emails/DigestEmail";

const html = await render(<DigestEmail {...props} />);
```

---

## Sending SMS with Twilio

Twilio SMS is used when the user selects "SMS" or "Both" as their delivery
channel. The digest is sent as the `plain` text output from Claude, truncated
to fit SMS limits.

### Install

```bash
npm install twilio
```

### Add to environment

```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
```

### Get a number

In the Twilio console, buy a phone number under `Phone Numbers → Manage →
Buy a number`. Choose one with SMS capability.

### Sending a digest SMS (`lib/email/send.ts`)

```ts
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendDigestSms(params: {
  to: string;         // E.164 format: +1XXXXXXXXXX
  plainText: string;
}) {
  // SMS: 160 chars per segment. Keep under 480 (3 segments) for cost.
  // Claude is instructed to keep plain text concise for SMS users.
  const body = params.plainText.slice(0, 1440); // hard cap at 9 segments

  await twilioClient.messages.create({
    from: process.env.TWILIO_FROM_NUMBER!,
    to: params.to,
    body,
  });
}
```

### Combined dispatch

```ts
export async function dispatchDigest(params: {
  channel: "email" | "sms" | "both";
  email?: string;
  phone?: string;
  userName: string;
  digestHtml: string;
  digestPlain: string;
  digestDate: string;
}) {
  const tasks: Promise<unknown>[] = [];

  if (params.channel === "email" || params.channel === "both") {
    tasks.push(
      sendDigestEmail({
        to: params.email!,
        userName: params.userName,
        digestHtml: params.digestHtml,
        digestDate: params.digestDate,
      })
    );
  }

  if (params.channel === "sms" || params.channel === "both") {
    tasks.push(
      sendDigestSms({
        to: params.phone!,
        plainText: params.digestPlain,
      })
    );
  }

  await Promise.all(tasks);
}
```

---

## Scheduling with Vercel Cron

Vercel Cron triggers a serverless function on a schedule. Briefd uses a
**per-minute cron** that checks which users are due for a digest at the
current UTC minute, accounting for each user's timezone.

### `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/dispatch",
      "schedule": "* * * * *"
    }
  ]
}
```

> Vercel Cron requires a **Pro plan** for per-minute frequency. On the Hobby
> plan the minimum is once per day. For development, call the endpoint manually.

### The cron route (`app/api/cron/dispatch/route.ts`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateDigest } from "@/lib/digest/generate";
import { dispatchDigest } from "@/lib/email/send";
import { toZonedTime, format } from "date-fns-tz";

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron (not public)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();

  // Find all active delivery settings whose local time matches HH:MM right now
  const { data: dueSettings } = await supabase
    .from("delivery_settings")
    .select(`
      *,
      digest_profiles ( * ),
      users ( email, full_name )
    `)
    .eq("is_enabled", true);

  const due = (dueSettings ?? []).filter((s) => {
    // Convert UTC now → user's local time
    const localNow = toZonedTime(now, s.digest_profiles.timezone);
    const localHHMM = format(localNow, "HH:mm", { timeZone: s.digest_profiles.timezone });

    // Check time matches
    if (localHHMM !== s.delivery_time.slice(0, 5)) return false;

    // Check day of week (bitmask: Sun=1, Mon=2, Tue=4...)
    const localDow = localNow.getDay(); // 0=Sun
    const bit = 1 << localDow;
    return (s.delivery_days & bit) !== 0;
  });

  // Process each due user concurrently (with a concurrency limit in production)
  const results = await Promise.allSettled(
    due.map(async (setting) => {
      // 1. Get enabled sections
      const { data: sections } = await supabase
        .from("digest_sections")
        .select("*")
        .eq("digest_profile_id", setting.digest_profile_id)
        .eq("is_enabled", true)
        .order("position");

      // 2. Generate digest via Claude
      const { html, plain } = await generateDigest({
        userName: setting.users.full_name ?? "there",
        tone: setting.digest_profiles.tone,
        date: format(toZonedTime(now, setting.digest_profiles.timezone), "EEEE, MMMM d, yyyy"),
        sections: sections ?? [],
      });

      // 3. Send via Resend / Twilio
      await dispatchDigest({
        channel: setting.channel,
        email: setting.delivery_email ?? setting.users.email,
        phone: setting.delivery_phone,
        userName: setting.users.full_name ?? "there",
        digestHtml: html,
        digestPlain: plain,
        digestDate: format(now, "MMM d, yyyy"),
      });

      // 4. Record in history
      await supabase.from("digest_history").insert({
        user_id: setting.user_id,
        digest_profile_id: setting.digest_profile_id,
        status: "delivered",
        content_html: html,
        digest_date: format(now, "yyyy-MM-dd"),
        delivered_at: now.toISOString(),
      });

      // 5. Update last_delivered_at
      await supabase
        .from("delivery_settings")
        .update({ last_delivered_at: now.toISOString() })
        .eq("id", setting.id);
    })
  );

  const failed = results.filter((r) => r.status === "rejected");
  console.log(`Cron: ${due.length} due, ${failed.length} failed`);

  return NextResponse.json({
    processed: due.length,
    failed: failed.length,
  });
}
```

### Protect the cron endpoint

Set a secret that only Vercel knows:

```bash
CRON_SECRET=your-random-secret
```

Add it to Vercel's environment variables. The route checks the
`Authorization: Bearer <CRON_SECRET>` header that Vercel sends automatically.

### Testing locally

```bash
curl -H "Authorization: Bearer your-random-secret" \
  http://localhost:3000/api/cron/dispatch
```

Or trigger a manual digest for a specific user via `POST /api/digest`.

---

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in all values.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL (`http://localhost:3000` in dev) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key from console.anthropic.com |
| `RESEND_API_KEY` | Email | From resend.com |
| `RESEND_FROM_EMAIL` | Email | Verified sending address, e.g. `Briefd <hello@briefd.app>` |
| `TWILIO_ACCOUNT_SID` | SMS | From console.twilio.com |
| `TWILIO_AUTH_TOKEN` | SMS | Twilio auth token |
| `TWILIO_FROM_NUMBER` | SMS | Your Twilio phone number in E.164 format |
| `OPENWEATHER_API_KEY` | Weather section | From openweathermap.org |
| `CRON_SECRET` | Production | Random secret to authenticate cron requests |

### Getting API keys

- **Anthropic**: [console.anthropic.com](https://console.anthropic.com) → API Keys
- **Resend**: [resend.com](https://resend.com) → API Keys (free tier: 3,000 emails/month)
- **Twilio**: [console.twilio.com](https://console.twilio.com) → Account Info
- **OpenWeather**: [openweathermap.org/api](https://openweathermap.org/api) → free tier available
