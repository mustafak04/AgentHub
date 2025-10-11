import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Agent verileri (şimdilik sabit, ileride API'den gelecek)
const agents = [
  { id: "1", name: "Hava Durumu Agent", description: "Hava durumu bilgisi sağlar" },
  { id: "2", name: "Hesap Makinesi Agent", description: "Matematiksel hesaplamalar yapar" },
  { id: "3", name: "Çeviri Agent", description: "Diller arası çeviri yapar" },
  { id: "4", name: "Haber Agent", description: "Güncel haberleri getirir" },
];

export default function Individual() {
  const router = useRouter();

  // Her bir agent için kart tasarımı
  const renderAgentCard = ({ item }: { item: typeof agents[0] }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        router.push(`/chat?agentId=${item.id}&agentName=${item.name}`);
      }}
    >
      <Text style={styles.agentName}>{item.name}</Text>
      <Text style={styles.agentDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agent Listesi</Text>
      <FlatList
        data={agents}
        renderItem={renderAgentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#f5f5f5",
      paddingTop: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    card: {
      backgroundColor: "#fff",
      padding: 16,
      marginBottom: 12,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    agentName: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 4,
    },
    agentDescription: {
      fontSize: 14,
      color: "#666",
    },
  });
