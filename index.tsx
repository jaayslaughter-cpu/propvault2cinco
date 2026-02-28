import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { fetchTodaysProps } from "@/lib/propsFetch";
import { getWinLoss, addToVault, openDb } from "@/lib/sqlite";
import { getLastChecked, setLastChecked } from "@/lib/backgroundTasks";
import type { PropRow } from "@/lib/propsModel";

export default function HomeScreen() {
  const [games, setGames] = useState<{ gameId: string; name: string; shortName?: string }[]>([]);
  const [props, setProps] = useState<PropRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [winPct, setWinPct] = useState(0);
  const [roi, setRoi] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchTodaysProps("nba");
      setGames(result.games);
      setProps(result.props);
      setMessage(result.live ? null : result.message ?? null);
      await setLastChecked();
      const stats = await getWinLoss();
      setWinPct(stats.winPct);
      setRoi(stats.roi);
      const last = await getLastChecked();
      setLastCheckedTime(last);
    } catch (e) {
      setMessage("Failed to load. Check connection.");
      setProps([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getLastChecked().then(setLastCheckedTime);
    openDb().then(() => load());
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const byGame = props.reduce<Record<string, PropRow[]>>((acc, p) => {
    const g = p.gameId || "other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(p);
    return acc;
  }, {});

  const onStar = (prop: PropRow) => {
    Alert.alert(
      "Add to Vault?",
      `${prop.player} | ${prop.stat} | ${prop.line} | ${prop.side} | ${prop.confidence}%`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: async () => {
            await addToVault({
              player: prop.player,
              stat: prop.stat,
              line: prop.line,
              side: prop.side,
              confidence: prop.confidence,
              gameId: prop.gameId,
              matchup: prop.matchup,
            });
            load();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-vault-dark">
      <View className="px-4 py-3 border-b border-gray-700 flex-row items-center justify-between flex-wrap">
        <Text className="text-lg font-bold text-vault-green">Prop Vault</Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-gray-400 text-sm">Win %</Text>
          <Text className="text-white font-bold">{winPct.toFixed(1)}%</Text>
          <Text className="text-gray-400 text-sm">ROI</Text>
          <Text className={`font-bold ${roi >= 0 ? "text-green-500" : "text-red-500"}`}>
            {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={refreshing}
            className="bg-vault-panel px-3 py-1.5 rounded border border-gray-600"
          >
            <Text className="text-gray-300 text-sm">Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {message && (
        <View className="mx-4 mt-3 p-3 rounded bg-amber-900/30 border border-amber-600">
          <Text className="text-amber-200 text-sm">{message}</Text>
        </View>
      )}

      {lastCheckedTime && (
        <Text className="text-gray-500 text-xs px-4 py-1">
          Last checked: {new Date(lastCheckedTime).toLocaleString()}
        </Text>
      )}

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4aa" />
        }
      >
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#00d4aa" />
            <Text className="text-gray-500 mt-2">Loading props…</Text>
          </View>
        ) : (
          <View className="pb-8">
            {Object.entries(byGame).map(([gameId, list]) => (
              <View key={gameId} className="mx-4 mt-4 rounded-lg bg-vault-panel border border-gray-700 overflow-hidden">
                <Text className="px-3 py-2 bg-gray-800/50 text-vault-green font-medium">
                  {list[0]?.matchup ?? gameId}
                </Text>
                {list.map((p, i) => (
                  <View
                    key={`${p.player}-${p.stat}-${i}`}
                    className="flex-row items-center border-t border-gray-700 px-3 py-2"
                  >
                    <Text className="flex-1 text-gray-200 text-sm" numberOfLines={1}>
                      {p.player}
                    </Text>
                    <Text className="text-gray-400 text-sm w-10">{p.stat}</Text>
                    <Text className="text-gray-400 text-sm w-8">{p.line}</Text>
                    <Text className="text-gray-400 text-sm w-12">{p.side}</Text>
                    <Text className="text-vault-green text-sm w-12">{p.confidence}%</Text>
                    <TouchableOpacity onPress={() => onStar(p)} hitSlop={8}>
                      <Text className="text-yellow-500 text-lg">★</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
            {props.length === 0 && !loading && (
              <Text className="text-gray-500 text-center py-8">No props above 75% confidence.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
