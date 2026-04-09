export interface SportsConfig {
  leagues: string[];
  teams?: string[];
}

interface Competitor {
  team: { displayName: string };
  score?: string;
  homeAway?: "home" | "away";
}

interface Competition {
  competitors: Competitor[];
}

interface ESPNEvent {
  id: string;
  name: string;
  shortName?: string;
  date?: string;
  status?: { type?: { description?: string } };
  competitions?: Competition[];
}

interface ESPNScoreboardResponse {
  events?: ESPNEvent[];
}

export interface LeagueResult {
  league: string;
  events: ESPNEvent[];
  error?: string;
}

const LEAGUE_MAP: Record<string, string> = {
  NFL:    "football/nfl",
  NBA:    "basketball/nba",
  MLB:    "baseball/mlb",
  NHL:    "hockey/nhl",
  MLS:    "soccer/usa.1",
  NCAAFB: "football/college-football",
};

export async function fetchSportsData(config: SportsConfig): Promise<LeagueResult[]> {
  const results = await Promise.all(
    config.leagues.map(async (league): Promise<LeagueResult> => {
      const path = LEAGUE_MAP[league.toUpperCase()];
      if (!path) return { league, events: [], error: "Unknown league" };

      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard`
        );
        if (!res.ok) return { league, events: [], error: `ESPN fetch failed: HTTP ${res.status}` };

        const data = await res.json() as ESPNScoreboardResponse;
        let events: ESPNEvent[] = data.events ?? [];

        if (config.teams?.length) {
          events = events.filter((event) =>
            event.competitions?.[0]?.competitors?.some((c) =>
              config.teams!.some((t) =>
                c.team.displayName.toLowerCase().includes(t.toLowerCase())
              )
            )
          );
        }

        return { league, events: events.slice(0, 5) };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { league, events: [], error: message };
      }
    })
  );

  return results;
}
