import {
  DigestTemplate,
  GeneratedDigest,
  DigestSection,
  DigestSubscription,
  User,
} from "./types";
import { generateId } from "./utils";

// ─── Starter Templates ───────────────────────────────────────────────────────

export const DIGEST_TEMPLATES: DigestTemplate[] = [
  {
    id: "sports-fan",
    name: "Sports Fan",
    description: "Scores, highlights, and injury updates for your favorite teams",
    emoji: "🏆",
    tags: ["Sports", "NBA", "NFL", "MLB"],
    sections: [
      {
        title: "NBA Scores & Highlights",
        type: "sports",
        prompt: "Last night's NBA scores, top performers, and key injury updates",
        sources: ["ESPN", "The Athletic", "NBA.com"],
        enabled: true,
        mode: "brief",
      },
      {
        title: "NFL News",
        type: "sports",
        prompt: "Latest NFL news, transactions, and weekly game previews",
        sources: ["NFL.com", "ESPN", "PFT"],
        enabled: true,
        mode: "brief",
      },
      {
        title: "Quote of the Day",
        type: "quote",
        prompt: "An inspirational quote from a famous athlete",
        enabled: true,
        mode: "brief",
      },
    ],
  },
  {
    id: "markets-business",
    name: "Markets & Business",
    description: "Pre-market movers, macro headlines, and business news",
    emoji: "📈",
    tags: ["Finance", "Markets", "Business"],
    sections: [
      {
        title: "Pre-Market Movers",
        type: "finance",
        prompt: "Top pre-market stock movers, futures, and overnight action",
        sources: ["Bloomberg", "WSJ", "Reuters"],
        enabled: true,
        mode: "detailed",
      },
      {
        title: "Business Headlines",
        type: "news",
        prompt: "Top 3 business and economic headlines worth knowing",
        sources: ["WSJ", "FT", "Bloomberg"],
        enabled: true,
        mode: "brief",
      },
      {
        title: "Crypto Overnight",
        type: "finance",
        prompt: "Bitcoin, Ethereum prices and any major crypto news",
        sources: ["CoinDesk", "The Block"],
        enabled: true,
        mode: "brief",
      },
    ],
  },
  {
    id: "politics-news",
    name: "Politics & News",
    description: "Top headlines, political updates, and must-reads",
    emoji: "🗞️",
    tags: ["Politics", "News", "World"],
    sections: [
      {
        title: "Top Headlines",
        type: "news",
        prompt: "The 3-5 most important news stories from yesterday",
        sources: ["NYT", "Washington Post", "AP"],
        enabled: true,
        mode: "brief",
      },
      {
        title: "Political Update",
        type: "news",
        prompt: "Latest from Washington and key political developments",
        sources: ["Politico", "The Hill", "Axios"],
        enabled: true,
        mode: "detailed",
      },
      {
        title: "World Briefing",
        type: "news",
        prompt: "One key international story worth knowing",
        sources: ["BBC", "Reuters", "Al Jazeera"],
        enabled: true,
        mode: "brief",
      },
    ],
  },
  {
    id: "tech-enthusiast",
    name: "Tech Enthusiast",
    description: "AI, startups, product launches, and developer news",
    emoji: "⚡",
    tags: ["Tech", "AI", "Startups"],
    sections: [
      {
        title: "AI News",
        type: "technology",
        prompt: "Latest AI model releases, research, and product announcements",
        sources: ["TechCrunch", "The Verge", "Ars Technica"],
        enabled: true,
        mode: "brief",
      },
      {
        title: "Startup Watch",
        type: "technology",
        prompt: "Notable startup funding rounds and product launches",
        sources: ["TechCrunch", "Product Hunt", "YC News"],
        enabled: true,
        mode: "brief",
      },
      {
        title: "Developer Pulse",
        type: "technology",
        prompt: "New tools, frameworks, and developer community highlights",
        sources: ["Hacker News", "GitHub Trending", "Dev.to"],
        enabled: true,
        mode: "brief",
      },
    ],
  },
  {
    id: "inspiration-misc",
    name: "Inspiration & Misc",
    description: "Quotes, fun facts, and a light morning read",
    emoji: "☀️",
    tags: ["Quotes", "Fun", "Inspiration"],
    sections: [
      {
        title: "Quote of the Day",
        type: "quote",
        prompt: "A thought-provoking or funny quote from a historical figure or celebrity",
        enabled: true,
        mode: "brief",
      },
      {
        title: "Fun Fact",
        type: "custom",
        prompt: "One surprising or interesting fact about science, history, or culture",
        enabled: true,
        mode: "brief",
      },
      {
        title: "Light Read",
        type: "entertainment",
        prompt: "A feel-good story or interesting longform recommendation",
        sources: ["The Atlantic", "Longreads", "Hacker News"],
        enabled: true,
        mode: "brief",
      },
    ],
  },
];

// ─── Mock Generated Digest ───────────────────────────────────────────────────

export function generateMockDigest(
  sections: DigestSection[],
  date: string = "2026-03-24"
): GeneratedDigest {
  const mockContent: Record<string, { emoji: string; items: { text: string; source?: string }[] }> = {
    "Lakers News": {
      emoji: "🏀",
      items: [
        { text: "LeBron James recorded his 50th career triple-double in a 114-108 win over the Warriors last night", source: "ESPN" },
        { text: "Anthony Davis (ankle) is listed as questionable for Thursday's game vs. Denver", source: "The Athletic" },
        { text: "Lakers move to 8th seed in the West at 38-29 with 15 games remaining", source: "NBA.com" },
      ],
    },
    "NBA Scores & Highlights": {
      emoji: "🏀",
      items: [
        { text: "Celtics 128, Heat 104 — Jayson Tatum drops 38 pts on 14-24 shooting", source: "ESPN" },
        { text: "Nuggets 115, Warriors 109 — Jokić triple-double powers Denver comeback", source: "The Athletic" },
        { text: "OKC Thunder clinch Northwest Division title with win over Blazers", source: "NBA.com" },
        { text: "Injury report: Steph Curry (knee) day-to-day; Chet Holmgren (back) out 2 weeks", source: "ESPN" },
      ],
    },
    "Top Headlines": {
      emoji: "📰",
      items: [
        { text: "Federal Reserve holds rates steady; Chair signals two cuts possible by year-end", source: "WSJ" },
        { text: "Israel-Hamas ceasefire talks resume in Cairo with new US proposal on the table", source: "NYT" },
        { text: "SCOTUS hears landmark case on social media platform liability for user content", source: "AP" },
        { text: "Severe storms forecast for Gulf Coast through Thursday; evacuation orders in 3 counties", source: "AP" },
      ],
    },
    "Political Update": {
      emoji: "🏛️",
      items: [
        { text: "Senate passes $1.2T spending bill 58-42, averting government shutdown through September", source: "Politico" },
        { text: "Trump social posts yesterday: Truth Social attacks on special counsel; tariff policy threat toward EU", source: "Reuters" },
        { text: "Biden approval rating holds at 43% per new Gallup poll; economy remains top voter concern", source: "Axios" },
        { text: "House Republicans introduce bill to block Federal EV mandate; vote expected next week", source: "The Hill" },
      ],
    },
    "Pre-Market Movers": {
      emoji: "📈",
      items: [
        { text: "S&P 500 futures +0.4% ahead of open after strong housing data", source: "Bloomberg" },
        { text: "NVDA up 2.1% pre-market after analyst price target increase to $1,200 at Goldman Sachs", source: "Bloomberg" },
        { text: "TSLA drops 3.8% following disappointing Q1 delivery numbers released last night", source: "Reuters" },
        { text: "10-year Treasury yield at 4.31%; oil (WTI) at $82.40/barrel", source: "FT" },
      ],
    },
    "Quote of the Day": {
      emoji: "💬",
      items: [
        { text: '"The secret of getting ahead is getting started." — Mark Twain' },
      ],
    },
    "Fun Fact": {
      emoji: "🤔",
      items: [
        { text: "A group of flamingos is called a \"flamboyance.\" There are approximately 3.2 million flamingos in the world, most living in East Africa." },
      ],
    },
    "AI News": {
      emoji: "🤖",
      items: [
        { text: "Anthropic releases Claude 4 with 200K context window and improved reasoning capabilities", source: "TechCrunch" },
        { text: "OpenAI announces GPT-5 availability for ChatGPT Plus users starting next month", source: "The Verge" },
        { text: "EU AI Act enforcement begins; major US tech firms scramble to meet compliance deadlines", source: "Ars Technica" },
      ],
    },
    "Business Headlines": {
      emoji: "💼",
      items: [
        { text: "Apple reports best quarter in 3 years on iPhone 16 Pro demand; shares +4%", source: "WSJ" },
        { text: "Amazon lays off 2,000 in AWS division as cloud growth slows vs. Microsoft Azure", source: "Bloomberg" },
        { text: "Startup funding rebounds: $47B deployed in Q1, up 28% YoY — AI accounts for 40% of deals", source: "Crunchbase" },
      ],
    },
    "World Briefing": {
      emoji: "🌍",
      items: [
        { text: "Ukraine war update: Kyiv repels Russian offensive in Sumy region; new EU arms package approved", source: "BBC" },
        { text: "China's economic growth hits 5.2% in Q1, beating forecasts; manufacturing PMI expands", source: "Reuters" },
      ],
    },
  };

  const generatedSections = sections
    .filter((s) => s.enabled)
    .map((section, index) => {
      const content =
        mockContent[section.title] ??
        mockContent[Object.keys(mockContent).find((k) =>
          k.toLowerCase().includes(section.type) ||
          section.title.toLowerCase().includes(k.toLowerCase().split(" ")[0])
        ) ?? "Top Headlines"];

      const allItems = content?.items ?? [
        { text: `Latest updates on ${section.title} — powered by AI curation` },
      ];

      const items =
        section.mode === "brief" ? allItems.slice(0, 3) : allItems;

      return {
        sectionId: section.id,
        title: section.title,
        emoji: content?.emoji ?? "📌",
        items,
      };
    });

  return {
    id: generateId(),
    subscriptionId: "preview",
    userId: "preview",
    date,
    sections: generatedSections,
    generatedAt: new Date().toISOString(),
    status: "pending",
    channels: [],
  };
}

// ─── Mock User + Subscription ─────────────────────────────────────────────────

export const MOCK_USER: User = {
  id: "usr_demo",
  name: "Alex Morgan",
  email: "guitarjam98@gmail.com",
  phone: "+15551234567",
  timezone: "America/New_York",
  createdAt: "2026-03-01T00:00:00Z",
  updatedAt: "2026-03-24T00:00:00Z",
};

export const MOCK_SUBSCRIPTION: DigestSubscription = {
  id: "sub_demo",
  userId: "usr_demo",
  name: "My Morning Digest",
  sections: [
    {
      id: "s1",
      title: "Top Headlines",
      type: "news",
      prompt: "The 3-5 most important news stories I need to know",
      sources: ["NYT", "WSJ", "AP"],
      order: 0,
      enabled: true,
      mode: "brief",
    },
    {
      id: "s2",
      title: "Lakers News",
      type: "sports",
      prompt: "Last night's score, player updates, and injury report",
      sources: ["ESPN", "The Athletic"],
      order: 1,
      enabled: true,
      mode: "brief",
    },
    {
      id: "s3",
      title: "Pre-Market Movers",
      type: "finance",
      prompt: "Top 3 stocks moving before the bell and why",
      sources: ["Bloomberg", "WSJ"],
      order: 2,
      enabled: true,
      mode: "brief",
    },
    {
      id: "s4",
      title: "Quote of the Day",
      type: "quote",
      prompt: "A funny or thought-provoking quote",
      order: 3,
      enabled: true,
      mode: "brief",
    },
  ],
  delivery: {
    time: "07:00",
    timezone: "America/New_York",
    channels: ["email"],
    email: "guitarjam98@gmail.com",
  },
  status: "active",
  createdAt: "2026-03-01T00:00:00Z",
  updatedAt: "2026-03-24T00:00:00Z",
};
