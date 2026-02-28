/**
 * Fetch today's props: ESPN scoreboard → if no games, show message + mock props (>75% only).
 */

import { getTodaysGames } from "./espn";
import { generateMockPropsForGame, type PropRow } from "./propsModel";

const NO_LIVE_MSG = "No live props for this date/sport. Fresh lines drop at midnight ET.";

export type TodayResult = {
  live: boolean;
  message?: string;
  games: { gameId: string; name: string; shortName?: string }[];
  props: PropRow[];
};

export async function fetchTodaysProps(sport: "nba" | "ncaab" = "nba", date?: Date): Promise<TodayResult> {
  const games = await getTodaysGames(sport, date);
  if (games.length === 0) {
    const mockGames = [
      { gameId: "401584893", name: "Celtics @ Lakers", shortName: "BOS @ LAL" },
      { gameId: "401584894", name: "Bucks @ Suns", shortName: "MIL @ PHX" },
    ];
    const props: PropRow[] = [];
    for (const g of mockGames) {
      const parts = (g.shortName ?? g.name).split(" @ ");
      props.push(
        ...generateMockPropsForGame(g.gameId, g.name, parts[0] ?? "Away", parts[1] ?? "Home")
      );
    }
    return {
      live: false,
      message: NO_LIVE_MSG,
      games: mockGames,
      props: props.filter((p) => p.confidence > 75),
    };
  }
  const allProps: PropRow[] = [];
  for (const g of games) {
    const name = g.name ?? g.shortName ?? "TBD";
    const short = g.shortName ?? name;
    const parts = short.replace(" @ ", " ").split(" ");
    const away = parts[0] ?? "Away";
    const home = parts[1] ?? "Home";
    const list = generateMockPropsForGame(g.gameId, name, away, home);
    allProps.push(...list);
  }
  return {
    live: true,
    games,
    props: allProps.filter((p) => p.confidence > 75),
  };
}
