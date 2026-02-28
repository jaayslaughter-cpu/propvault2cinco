/**
 * ESPN public APIs (no key): scoreboard, game summary/boxscores.
 * Ported from vault-app/backend/espn.py
 */

const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary";
const NCAAB_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard";
const NCAAB_SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary";

function dateParam(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export type Game = { gameId: string; name: string; shortName?: string; date?: string };

export async function fetchScoreboard(sport: "nba" | "ncaab" = "nba", date?: Date): Promise<{ events?: unknown[] }> {
  const d = date ?? new Date();
  const url = sport === "ncaab" ? NCAAB_SCOREBOARD : SCOREBOARD_URL;
  const res = await fetch(`${url}?dates=${dateParam(d)}`);
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return res.json();
}

export async function fetchGameSummary(eventId: string, sport: "nba" | "ncaab" = "nba"): Promise<Record<string, unknown>> {
  const base = sport === "ncaab" ? NCAAB_SUMMARY : SUMMARY_URL;
  const res = await fetch(`${base}?event=${eventId}`);
  if (!res.ok) throw new Error(`ESPN summary ${res.status}`);
  return res.json();
}

export async function getTodaysGames(sport: "nba" | "ncaab" = "nba", date?: Date): Promise<Game[]> {
  const data = await fetchScoreboard(sport, date);
  const events = (data.events ?? []) as { id?: string; name?: string; shortName?: string; date?: string }[];
  return events.map((e) => ({
    gameId: e.id ?? "",
    name: e.name ?? "",
    shortName: e.shortName,
    date: e.date,
  }));
}

const LABEL_MAP: Record<string, string> = { Points: "PTS", Rebounds: "REB", Assists: "AST" };

export function getPlayerStatsFromSummary(summary: Record<string, unknown>): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  const boxscore = (summary.boxscore as Record<string, unknown>) ?? {};
  const players = (boxscore.players as Record<string, unknown>[]) ?? [];
  for (const teamBlock of players) {
    const stats = (teamBlock.statistics as { name?: string; athletes?: { athlete?: { displayName?: string }; stats?: string[] }[]) ?? []);
    for (const statGroup of stats) {
      for (const statRow of statGroup.athletes ?? []) {
        const name = (statRow.athlete?.displayName ?? "").trim();
        if (!name) continue;
        if (!out[name]) out[name] = {};
        const vals = statRow.stats ?? [];
        const labels = (statGroup as { name?: string }).name ? [statGroup.name] : [];
        labels.forEach((l, i) => {
          const v = Number(vals[i]);
          if (!Number.isNaN(v)) out[name][l] = v;
        });
      }
    }
  }
  for (const player of Object.keys(out)) {
    for (const [old, n] of Object.entries(LABEL_MAP)) {
      if (out[player][old] != null) out[player][n] = out[player][old];
    }
  }
  return out;
}

export async function getPlayerStatsForGame(eventId: string, sport: "nba" | "ncaab" = "nba"): Promise<Record<string, Record<string, number>>> {
  const summary = await fetchGameSummary(eventId, sport);
  return getPlayerStatsFromSummary(summary);
}
