import { Link, Stack } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-vault-dark p-4">
        <Text className="text-xl text-gray-300 mb-2">This screen doesn't exist.</Text>
        <Link href="/" asChild>
          <TouchableOpacity className="bg-vault-green px-4 py-2 rounded mt-4">
            <Text className="text-vault-dark font-semibold">Go to Home</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}
