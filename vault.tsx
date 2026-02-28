import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { getVault, getUnsettledVault, updateResult, getWinLoss } from "@/lib/sqlite";
import { getPlayerStatsForGame } from "@/lib/espn";
import { notifyEODResults } from "@/lib/notifications";
import type { VaultRow } from "@/lib/sqlite";

export default function VaultScreen() {
  const [items, setItems] = useState<VaultRow[]>([]);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [winPct, setWinPct] = useState(0);
  const [roi, setRoi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    const list = await getVault();
    setItems(list);
    const stats = await getWinLoss();
    setWins(stats.wins);
    setLosses(stats.losses);
    setWinPct(stats.winPct);
    setRoi(stats.roi);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCheckResults = async () => {
    setChecking(true);
    try {
      const unsettled = await getUnsettledVault();
      for (const v of unsettled) {
        const gameId = (v.game_id ?? "").trim();
        if (!gameId) {
          await updateResult(v.id, "push");
          continue;
        }
        try {
          const stats = await getPlayerStatsForGame(gameId, "nba");
          const playerStats = stats[v.player];
          const statKey = (v.stat || "PTS").toUpperCase();
          let actual: number | undefined = playerStats?.[statKey] ?? playerStats?.["Points"] ?? playerStats?.["Rebounds"] ?? playerStats?.["Assists"];
          if (statKey === "PRA" && playerStats)
            actual = (playerStats.PTS ?? 0) + (playerStats.REB ?? 0) + (playerStats.AST ?? 0);
          if (actual == null) continue;
          const line = v.line;
          const side = (v.side || "Over").toLowerCase();
          const hit =
            (side === "over" && actual > line) || (side === "under" && actual < line);
          await updateResult(v.id, hit ? "win" : "loss", actual);
        } catch {
          // skip
        }
      }
      const stats = await getWinLoss();
      setWins(stats.wins);
      setLosses(stats.losses);
      setWinPct(stats.winPct);
      setRoi(stats.roi);
      await load();
      await notifyEODResults(stats.wins, stats.losses, stats.winPct);
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  const recent = items.slice(0, 50);
  const unsettledCount = items.filter((i) => !i.result).length;

  return (
    <View className="flex-1 bg-vault-dark">
      <View className="px-4 py-3 border-b border-gray-700">
        <View className="flex-row items-center justify-between flex-wrap gap-2">
          <Text className="text-lg font-bold text-vault-green">Vault</Text>
          <TouchableOpacity
            onPress={onCheckResults}
            disabled={checking}
            className="bg-vault-green px-4 py-2 rounded-lg"
          >
            <Text className="text-vault-dark font-semibold">
              {checking ? "Checking…" : "Check Results"}
            </Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row gap-4 mt-2">
          <Text className="text-gray-400">Win %</Text>
          <Text className="text-white font-bold">{winPct.toFixed(1)}%</Text>
          <Text className="text-gray-400">ROI</Text>
          <Text className={`font-bold ${roi >= 0 ? "text-green-500" : "text-red-500"}`}>
            {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
          </Text>
          <Text className="text-gray-400">W/L</Text>
          <Text className="text-white">{wins}/{losses}</Text>
        </View>
        {unsettledCount > 0 && (
          <Text className="text-amber-400 text-xs mt-1">{unsettledCount} unsettled — tap Check Results for EOD</Text>
        )}
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor="#00d4aa" />
        }
      >
        {loading && items.length === 0 ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#00d4aa" />
          </View>
        ) : recent.length === 0 ? (
          <Text className="text-gray-500 text-center py-12">No starred props. Star from Home.</Text>
        ) : (
          <View className="pb-8">
            {recent.map((item) => (
              <View
                key={item.id}
                className="mx-4 mt-2 rounded-lg bg-vault-panel border border-gray-700 px-3 py-2 flex-row items-center justify-between"
              >
                <View className="flex-1">
                  <Text className="text-gray-200">
                    {item.player} {item.stat} {item.line} {item.side}
                  </Text>
                  {item.matchup && (
                    <Text className="text-gray-500 text-xs">{item.matchup}</Text>
                  )}
                </View>
                <View>
                  {item.result ? (
                    <Text
                      className={
                        item.result === "win"
                          ? "text-green-500 font-medium"
                          : item.result === "loss"
                            ? "text-red-500 font-medium"
                            : "text-gray-500"
                      }
                    >
                      {item.result}
                    </Text>
                  ) : (
                    <Text className="text-amber-400 text-sm">Pending</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
