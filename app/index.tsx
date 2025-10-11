import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>AgentHub Ana Ekran</Text>
      <Button title="Bireysel Mod" onPress={() => router.push("/individual")} />
      <View style={{ height: 12 }} />
      <Button title="Koordine Mod" onPress={() => router.push("/coordinate")} />
    </View>
  );
}
