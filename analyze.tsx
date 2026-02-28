import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { parseAnalyzeInput, analyzeLines } from "@/lib/propsModel";

export default function AnalyzeScreen() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<{ player: string; stat: string; line: number; side: string; confidence: number }[]>([]);

  const onAnalyze = () => {
    const parsed = parseAnalyzeInput(text);
    const list = analyzeLines(parsed);
    setResults(list);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-vault-dark"
    >
      <View className="px-4 pt-4">
        <Text className="text-lg font-semibold text-white mb-2">Analyze</Text>
        <Text className="text-gray-400 text-sm mb-2">
          Paste props (format: Player | PTS | 26.5 | Over)
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="LeBron James | PTS | 26.5 | Over"
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={4}
          className="w-full rounded-lg bg-vault-panel border border-gray-600 px-3 py-3 text-gray-200 min-h-[120]"
          style={{ textAlignVertical: "top" }}
        />
        <TouchableOpacity
          onPress={onAnalyze}
          className="mt-3 bg-vault-green py-2.5 rounded-lg"
        >
          <Text className="text-vault-dark font-semibold text-center">Analyze</Text>
        </TouchableOpacity>
      </View>

      {results.length > 0 && (
        <View className="mx-4 mt-4 rounded-lg bg-vault-panel border border-gray-700 overflow-hidden">
          <Text className="px-3 py-2 text-gray-400 text-sm">Confidence &gt;75%</Text>
          <ScrollView className="max-h-64">
            {results.map((r, i) => (
              <View
                key={i}
                className="flex-row justify-between items-center px-3 py-2 border-t border-gray-700"
              >
                <Text className="text-gray-200 text-sm flex-1">
                  {r.player} {r.stat} {r.line} {r.side}
                </Text>
                <Text className="text-vault-green font-medium">{r.confidence}%</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {results.length === 0 && text.trim().length > 0 && (
        <Text className="text-gray-500 text-sm px-4 mt-2">No lines with confidence &gt;75%. Check format.</Text>
      )}
    </KeyboardAvoidingView>
  );
}
