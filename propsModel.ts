/**
 * Mock high-confidence props generator and analyze scoring.
 * Ported from vault-app/backend/props_model.py — only show >75% confidence.
 */

export type PropRow = {
  player: string;
  stat: string;
  line: number;
  side: string;
  confidence: number;
  gameId: string;
  matchup?: string;
};

const MIN_CONFIDENCE = 75;

function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateMockPropsForGame(
  gameId: string,
  matchup: string,
  _teamAway: string,
  _teamHome: string,
  numPerTeam = 5
): PropRow[] {
  const awayPlayers = [
    "Jayson Tatum", "Jaylen Brown", "Kristaps Porzingis", "Derrick White", "Jrue Holiday",
    "Al Horford", "Payton Pritchard", "Sam Hauser",
  ].slice(0, numPerTeam);
  const homePlayers = [
    "LeBron James", "Anthony Davis", "Austin Reaves", "D'Angelo Russell", "Rui Hachimura",
    "Jarred Vanderbilt", "Gabe Vincent", "Max Christie",
  ].slice(0, numPerTeam);
  const statsWithLines: [string, number[]][] = [
    ["PTS", [22.5, 25.5, 28.5, 19.5, 17.5]],
    ["REB", [8.5, 10.5, 6.5, 4.5, 7.5]],
    ["AST", [5.5, 7.5, 4.5, 3.5, 6.5]],
    ["PRA", [32.5, 38.5, 28.5, 22.5, 35.5]],
  ];
  const props: PropRow[] = [];
  const names = [...awayPlayers, ...homePlayers];
  for (const name of names) {
    for (const [stat, lines] of statsWithLines) {
      for (const line of lines.slice(0, 2)) {
        for (const side of ["Over", "Under"]) {
          const key = `${gameId}|${name}|${stat}|${line}|${side}`;
          const r = seededRandom(seedFrom(key));
          const confidence = Math.floor(76 + r * 20); // 76-95
          if (confidence <= MIN_CONFIDENCE) continue;
          props.push({
            player: name,
            stat,
            line,
            side,
            confidence,
            gameId,
            matchup,
          });
        }
      }
    }
  }
  return props;
}

export function analyzePropLine(player: string, stat: string, line: number, side: string): number {
  const seed = seedFrom(`${player}|${stat}|${line}|${side}`);
  const r = seededRandom(seed);
  return Math.floor(75 + r * 21); // 75-95
}

export type ParsedLine = { player: string; stat: string; line: number; side: string };

export function parseAnalyzeInput(text: string): ParsedLine[] {
  const out: ParsedLine[] = [];
  const lines = (text ?? "").trim().split("\n");
  const validStats = ["PTS", "REB", "AST", "PRA"];
  const validSides = ["over", "under"];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 4) continue;
    const [player, stat, lineStr, side] = parts;
    const lineVal = parseFloat(lineStr.replace(",", "."));
    if (Number.isNaN(lineVal)) continue;
    if (!validStats.includes(stat.toUpperCase()) || !validSides.includes(side.toLowerCase())) continue;
    out.push({
      player,
      stat: stat.toUpperCase(),
      line: lineVal,
      side: side.charAt(0).toUpperCase() + side.slice(1).toLowerCase(),
    });
  }
  return out;
}

export function analyzeLines(parsed: ParsedLine[]): { player: string; stat: string; line: number; side: string; confidence: number }[] {
  const results: { player: string; stat: string; line: number; side: string; confidence: number }[] = [];
  for (const p of parsed) {
    const confidence = analyzePropLine(p.player, p.stat, p.line, p.side);
    if (confidence > MIN_CONFIDENCE) {
      results.push({ ...p, confidence });
    }
  }
  return results;
}
