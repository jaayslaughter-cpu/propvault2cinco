/**
 * Local SQLite via expo-sqlite: vault props + results.
 * Tables: props (vault), results (aggregate by date).
 */

import * as SQLite from "expo-sqlite";

const DB_NAME = "propvault.db";

let db: SQLite.SQLiteDatabase | null = null;

export async function openDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS props (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player TEXT NOT NULL,
      stat TEXT NOT NULL,
      line REAL NOT NULL,
      side TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      game_id TEXT,
      matchup TEXT,
      status TEXT,
      result TEXT,
      actual_value REAL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      wins INTEGER NOT NULL,
      losses INTEGER NOT NULL,
      roi REAL NOT NULL,
      win_pct REAL NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_props_game ON props(game_id);
    CREATE INDEX IF NOT EXISTS idx_props_created ON props(created_at);
  `);
  return db;
}

export type VaultRow = {
  id: number;
  player: string;
  stat: string;
  line: number;
  side: string;
  confidence: number;
  game_id: string | null;
  matchup: string | null;
  status: string | null;
  result: string | null;
  actual_value: number | null;
  created_at: string;
};

export async function addToVault(item: {
  player: string;
  stat: string;
  line: number;
  side: string;
  confidence: number;
  gameId?: string;
  matchup?: string;
}): Promise<number> {
  const database = await openDb();
  const result = await database.runAsync(
    `INSERT INTO props (player, stat, line, side, confidence, game_id, matchup, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`,
    item.player,
    item.stat,
    item.line,
    item.side,
    item.confidence,
    item.gameId ?? null,
    item.matchup ?? null
  );
  return result.lastInsertRowId;
}

export async function getVault(): Promise<VaultRow[]> {
  const database = await openDb();
  const rows = await database.getAllAsync<VaultRow>(
    "SELECT * FROM props ORDER BY created_at DESC"
  );
  return rows;
}

export async function getUnsettledVault(): Promise<VaultRow[]> {
  const database = await openDb();
  const rows = await database.getAllAsync<VaultRow>(
    "SELECT * FROM props WHERE result IS NULL"
  );
  return rows;
}

export async function updateResult(id: number, result: "win" | "loss" | "push", actualValue?: number): Promise<void> {
  const database = await openDb();
  await database.runAsync(
    "UPDATE props SET result = ?, actual_value = ? WHERE id = ?",
    result,
    actualValue ?? null,
    id
  );
}

const DEFAULT_ODDS = -110; // -110 = risk 1.1 to win 1

export async function getWinLoss(): Promise<{ wins: number; losses: number; winPct: number; roi: number }> {
  const database = await openDb();
  const rows = await database.getAllAsync<{ result: string }>(
    "SELECT result FROM props WHERE result IS NOT NULL"
  );
  let wins = 0;
  let losses = 0;
  for (const r of rows) {
    if (r.result === "win") wins++;
    else if (r.result === "loss") losses++;
  }
  const total = wins + losses;
  const winPct = total ? (wins / total) * 100 : 0;
  // Simplified ROI: assume 1 unit per bet, -110 odds -> win returns 1.909, loss -1
  const totalStaked = total;
  const totalReturn = wins * (1 + 100 / Math.abs(DEFAULT_ODDS)) + losses * 0;
  const roi = totalStaked ? ((totalReturn - totalStaked) / totalStaked) * 100 : 0;
  return { wins, losses, winPct, roi };
}
